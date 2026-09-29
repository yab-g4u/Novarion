import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  StopCircle,
  AlertTriangle,
  Lock,
  Activity,
  WifiOff
} from 'lucide-react';
import {
  BrowserSessionData,
  ActionRecord,
  ScreenshotRecord,
  StreamEvent
} from '../../../lib/testing/testing.types';
import { BrowserViewport } from './BrowserViewport';
import { TaskProgress } from './TaskProgress';
import { ActionTimeline } from './ActionTimeline';
import { FrictionPanel } from './FrictionPanel';
import { UXFindings } from './UXFindings';
import { SessionEvidence } from './SessionEvidence';

interface TestingSessionProps {
  sessionId: string;
  onSyncToGraph?: (evidence: any) => void;
  onNewTest?: () => void;
}

export const TestingSession: React.FC<TestingSessionProps> = ({
  sessionId,
  onSyncToGraph,
  onNewTest
}) => {
  const [sessionData, setSessionData] = useState<BrowserSessionData | null>(null);
  const [inspectedScreenshot, setInspectedScreenshot] = useState<ScreenshotRecord | null>(null);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    const fetchFinalSnapshot = async () => {
      try {
        const res = await fetch(`/api/testing/session/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setSessionData(data);
        }
      } catch {
        // Ignore
      }
    };

    const connectSSE = () => {
      eventSource = new EventSource(`/api/testing/session/${sessionId}/stream`);

      eventSource.onmessage = (event) => {
        try {
          const streamEvt: StreamEvent = JSON.parse(event.data);

          if (streamEvt.type === 'session.snapshot') {
            setSessionData(streamEvt.data as unknown as BrowserSessionData);
            return;
          }

          if (streamEvt.type === 'screenshot.created') {
            const scr = streamEvt.data.screenshot as ScreenshotRecord;
            setSessionData((prev) => {
              if (!prev) return prev;
              const exists = prev.screenshots.some((s) => s.id === scr.id);
              return exists ? prev : { ...prev, screenshots: [...prev.screenshots, scr] };
            });
            return;
          }

          if (streamEvt.type === 'action.completed') {
            const act = streamEvt.data.action as ActionRecord;
            setSessionData((prev) => {
              if (!prev) return prev;
              const exists = prev.events.some((e) => e.id === act.id);
              return exists
                ? prev
                : { ...prev, events: [...prev.events, act], stepCount: prev.stepCount + 1 };
            });
            return;
          }

          if (streamEvt.type === 'friction.detected') {
            const fric = streamEvt.data.friction as any;
            setSessionData((prev) => {
              if (!prev) return prev;
              return { ...prev, friction: [...prev.friction, fric] };
            });
            return;
          }

          if (streamEvt.type === 'session.finished') {
            fetchFinalSnapshot();
          }
        } catch {
          // Ignore
        }
      };

      eventSource.onerror = () => {
        fetchFinalSnapshot();
      };
    };

    connectSSE();
    fetchFinalSnapshot();

    const interval = setInterval(() => {
      fetchFinalSnapshot();
    }, 1500);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(interval);
    };
  }, [sessionId]);

  const handleStop = async () => {
    try {
      await fetch(`/api/testing/session/${sessionId}/stop`, { method: 'POST' });
    } catch {
      // Ignore
    }
  };

  if (!sessionData) {
    return (
      <div className="p-12 text-center text-xs font-mono text-[#868C98] space-y-3 bg-white border border-[#E5E7EB] rounded-3xl">
        <RotateCcw size={24} className="animate-spin mx-auto text-[#0F52BA]" />
        <p className="text-sm font-semibold text-[#0A0D14]">Launching Playwright browser session...</p>
        <p className="text-[11px] text-[#64748B]">Session ID: {sessionId}</p>
      </div>
    );
  }

  const latestScr =
    inspectedScreenshot ||
    (sessionData.screenshots.length > 0
      ? sessionData.screenshots[sessionData.screenshots.length - 1]
      : undefined);

  const lastAction =
    sessionData.events.length > 0
      ? sessionData.events[sessionData.events.length - 1].target ||
        sessionData.events[sessionData.events.length - 1].type
      : 'Initializing browser';

  const consoleErrors = sessionData.consoleErrors || [];
  const networkFailures = sessionData.networkFailures || [];

  return (
    <div className="space-y-6">
      {/* Session Top Status Bar */}
      <div className="bg-[#0A0D14] text-white border border-[#222732] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              sessionData.status === 'RUNNING'
                ? 'bg-[#3B82F6] animate-ping'
                : sessionData.status === 'COMPLETED'
                ? 'bg-[#10B981]'
                : sessionData.status === 'AUTHENTICATION_REQUIRED' || sessionData.status === 'BLOCKED'
                ? 'bg-[#F59E0B]'
                : 'bg-[#EF4444]'
            }`}
          />
          <span className="font-bold text-white uppercase tracking-wider text-[11px]">
            PLAYWRIGHT SESSION: {sessionData.status}
          </span>
          <span className="text-[#64748B]">·</span>
          <span className="text-[#94A3B8]">{sessionData.currentUrl}</span>
          {sessionData.navigationTiming?.loadTimeMs && (
            <>
              <span className="text-[#64748B]">·</span>
              <span className="text-[#38BDF8]">
                Load: {sessionData.navigationTiming.loadTimeMs}ms
                {sessionData.navigationTiming.ttfbMs !== undefined
                  ? ` (TTFB ${sessionData.navigationTiming.ttfbMs}ms)`
                  : ''}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {sessionData.status === 'RUNNING' && (
            <button
              type="button"
              onClick={handleStop}
              className="px-3 py-1.5 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <StopCircle size={12} />
              <span>Abort Test</span>
            </button>
          )}

          {onNewTest && (
            <button
              type="button"
              onClick={onNewTest}
              className="px-3 py-1.5 rounded-xl bg-[#1E293B] hover:bg-[#334155] text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RotateCcw size={12} />
              <span>New Test</span>
            </button>
          )}
        </div>
      </div>

      {/* Real Errors or Auth Status Banner */}
      {(sessionData.errors.length > 0 || sessionData.authDetection?.authRequired) && (
        <div className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] text-xs font-mono space-y-1.5">
          {sessionData.authDetection?.authRequired && (
            <div className="flex items-center gap-2 font-bold">
              <Lock size={14} className="text-[#D97706]" />
              <span>
                Authentication Detected:{' '}
                {sessionData.authDetection.reason ||
                  (sessionData.authDetection.supportsGoogleAuth
                    ? 'Google Sign-In supported on page'
                    : 'Login credentials required')}
              </span>
            </div>
          )}
          {sessionData.errors.map((err, idx) => (
            <div key={idx} className="flex items-start gap-2 text-[#B91C1C]">
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
              <span>{err}</span>
            </div>
          ))}
        </div>
      )}

      {/* Main Split: Browser Viewport & Task Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-4">
          <BrowserViewport
            currentUrl={sessionData.currentUrl}
            pageTitle={sessionData.currentTitle}
            status={sessionData.status}
            stepCount={sessionData.stepCount}
            maxSteps={sessionData.maxSteps}
            latestScreenshot={latestScr}
            lastActionDescription={lastAction}
            isLoading={sessionData.status === 'RUNNING'}
          />

          {inspectedScreenshot && (
            <div className="flex items-center justify-between text-xs font-mono bg-[#EFF6FF] border border-[#BFDBFE] px-3 py-1.5 rounded-xl text-[#1D4ED8]">
              <span>Viewing screenshot triggered by: {inspectedScreenshot.trigger}</span>
              <button
                type="button"
                onClick={() => setInspectedScreenshot(null)}
                className="font-bold underline cursor-pointer"
              >
                Return to Latest Frame
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 space-y-4">
          <TaskProgress
            task={sessionData.task}
            status={sessionData.status}
            stepCount={sessionData.stepCount}
            maxSteps={sessionData.maxSteps}
            startedAt={sessionData.startedAt}
            finishedAt={sessionData.finishedAt}
            metrics={sessionData.metrics}
          />

          {/* Navigation Timing & Console/Network Diagnostics Card */}
          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-4 sm:p-5 text-xs font-mono space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#F1F3F5] font-bold text-[#0A0D14]">
              <span className="flex items-center gap-1.5">
                <Activity size={14} className="text-[#0F52BA]" />
                <span>NAVIGATION & NETWORK TELEMETRY</span>
              </span>
              {sessionData.navigationTiming?.httpStatus && (
                <span className="text-[#059669]">HTTP {sessionData.navigationTiming.httpStatus}</span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[10px] text-[#64748B] block">Load Time</span>
                <strong className="text-[#0A0D14]">
                  {sessionData.navigationTiming?.loadTimeMs ?? '—'}ms
                </strong>
              </div>
              <div className="p-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[10px] text-[#64748B] block">TTFB</span>
                <strong className="text-[#0A0D14]">
                  {sessionData.navigationTiming?.ttfbMs ?? '—'}ms
                </strong>
              </div>
              <div className="p-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[10px] text-[#64748B] block">DOM Ready</span>
                <strong className="text-[#0A0D14]">
                  {sessionData.navigationTiming?.domContentLoadedMs ?? '—'}ms
                </strong>
              </div>
            </div>

            {(consoleErrors.length > 0 || networkFailures.length > 0) && (
              <div className="pt-2 border-t border-[#F1F3F5] space-y-1 text-[10px]">
                <div className="flex items-center gap-1 font-bold text-[#E11D48]">
                  <WifiOff size={11} />
                  <span>
                    {consoleErrors.length} Console Error(s) · {networkFailures.length} Failed Request(s)
                  </span>
                </div>
                <div className="max-h-24 overflow-y-auto space-y-1 text-[#881337]">
                  {consoleErrors.slice(0, 4).map((ce) => (
                    <div key={ce.id} className="truncate">
                      [{ce.type}] {ce.text}
                    </div>
                  ))}
                  {networkFailures.slice(0, 4).map((nf) => (
                    <div key={nf.id} className="truncate">
                      [{nf.method} {nf.failureText}] {nf.url}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <FrictionPanel frictionEvents={sessionData.friction} />
        </div>
      </div>

      {/* Action Timeline */}
      <ActionTimeline
        events={sessionData.events}
        screenshots={sessionData.screenshots}
        onSelectEventScreenshot={(scr) => setInspectedScreenshot(scr)}
      />

      {/* Grounded UX Findings */}
      {sessionData.findings.length > 0 && <UXFindings findings={sessionData.findings} />}

      {/* Session Evidence Output */}
      {sessionData.evidence && (
        <SessionEvidence evidence={sessionData.evidence} onSyncToGraph={onSyncToGraph} />
      )}
    </div>
  );
};

export default TestingSession;
