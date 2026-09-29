import React, { useState, useEffect, useRef } from 'react';
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
  ScreenshotRecord
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

const isTerminalSessionStatus = (status?: string) =>
  status === 'COMPLETED' ||
  status === 'FAILED' ||
  status === 'BLOCKED' ||
  status === 'AUTHENTICATION_REQUIRED' ||
  status === 'TIMEOUT' ||
  status === 'STOPPED';

export const TestingSession: React.FC<TestingSessionProps> = ({
  sessionId,
  onSyncToGraph,
  onNewTest
}) => {
  const [sessionData, setSessionData] = useState<BrowserSessionData | null>(null);
  const [inspectedScreenshot, setInspectedScreenshot] = useState<ScreenshotRecord | null>(null);
  const [pollingError, setPollingError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    let consecutiveErrors = 0;
    const startedAt = Date.now();
    const MAX_POLL_DURATION_MS = 75000;
    const MAX_CONSECUTIVE_ERRORS = 4;
    const BASE_INTERVAL_MS = 1200;

    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const pollSnapshot = async () => {
      if (cancelled) return;

      if (Date.now() - startedAt > MAX_POLL_DURATION_MS) {
        setPollingError('Playwright testing session timed out after 75 seconds.');
        setSessionData((prev) =>
          prev && !isTerminalSessionStatus(prev.status)
            ? { ...prev, status: 'TIMEOUT', errors: [...prev.errors, 'Session polling timed out after 75s.'] }
            : prev
        );
        return;
      }

      const controller = new AbortController();
      const reqTimeout = setTimeout(() => controller.abort(), 10000);

      try {
        const res = await fetch(`/api/testing/session/${encodeURIComponent(sessionId)}`, {
          signal: controller.signal
        });
        clearTimeout(reqTimeout);

        if (cancelled) return;

        if (res.ok) {
          consecutiveErrors = 0;
          setPollingError(null);
          const data: BrowserSessionData = await res.json();
          setSessionData(data);

          if (!isTerminalSessionStatus(data.status) && !cancelled) {
            timerRef.current = setTimeout(pollSnapshot, BASE_INTERVAL_MS);
          }
          return;
        }

        const errJson = await res.json().catch(() => ({}));
        consecutiveErrors += 1;

        if (res.status === 404 && consecutiveErrors >= 2) {
          const msg =
            errJson?.message ||
            'Testing session not found (HTTP 404). The server container may have restarted.';
          setPollingError(msg);
          setSessionData((prev) =>
            prev
              ? { ...prev, status: 'FAILED', errors: [...prev.errors, msg] }
              : null
          );
          return;
        }

        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          const msg =
            errJson?.message ||
            errJson?.error ||
            `Testing session failed after ${MAX_CONSECUTIVE_ERRORS} retries (HTTP ${res.status}).`;
          setPollingError(msg);
          setSessionData((prev) =>
            prev
              ? { ...prev, status: 'FAILED', errors: [...prev.errors, msg] }
              : null
          );
          return;
        }

        const backoffMs = Math.min(1500 * Math.pow(2, consecutiveErrors - 1), 10000);
        if (!cancelled) {
          timerRef.current = setTimeout(pollSnapshot, backoffMs);
        }
      } catch (err: any) {
        clearTimeout(reqTimeout);
        if (cancelled) return;

        consecutiveErrors += 1;
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          const msg =
            err?.name === 'AbortError'
              ? 'Request timed out while polling Playwright session.'
              : err?.message || 'Lost connection to Playwright testing server.';
          setPollingError(msg);
          setSessionData((prev) =>
            prev
              ? { ...prev, status: 'FAILED', errors: [...prev.errors, msg] }
              : null
          );
          return;
        }

        const backoffMs = Math.min(1500 * Math.pow(2, consecutiveErrors - 1), 10000);
        timerRef.current = setTimeout(pollSnapshot, backoffMs);
      }
    };

    pollSnapshot();

    return () => {
      cancelled = true;
      clearTimer();
    };
  }, [sessionId]);

  const handleStop = async () => {
    try {
      await fetch(`/api/testing/session/${encodeURIComponent(sessionId)}/stop`, { method: 'POST' });
    } catch {
      // Ignore
    }
  };

  if (!sessionData) {
    return (
      <div className="p-12 text-center text-xs font-mono text-[#868C98] space-y-3 bg-white border border-[#E5E7EB] rounded-3xl">
        {pollingError ? (
          <>
            <AlertTriangle size={24} className="mx-auto text-[#E11D48]" />
            <p className="text-sm font-semibold text-[#E11D48]">Playwright Session Error</p>
            <p className="text-xs text-[#64748B] max-w-md mx-auto">{pollingError}</p>
            {onNewTest && (
              <button
                type="button"
                onClick={onNewTest}
                className="mt-2 px-4 py-2 rounded-xl bg-[#0A0D14] text-white text-xs font-bold cursor-pointer"
              >
                Start New Test
              </button>
            )}
          </>
        ) : (
          <>
            <RotateCcw size={24} className="animate-spin mx-auto text-[#0F52BA]" />
            <p className="text-sm font-semibold text-[#0A0D14]">Launching Playwright browser session...</p>
            <p className="text-[11px] text-[#64748B]">Session ID: {sessionId}</p>
          </>
        )}
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
              sessionData.status === 'RUNNING' || sessionData.status === 'STARTING' || sessionData.status === 'QUEUED'
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
          {!isTerminalSessionStatus(sessionData.status) && (
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
      {(pollingError || sessionData.errors.length > 0 || sessionData.authDetection?.authRequired) && (
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
          {pollingError && (
            <div className="flex items-start gap-2 text-[#B91C1C]">
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
              <span>{pollingError}</span>
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
            isLoading={!isTerminalSessionStatus(sessionData.status)}
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
