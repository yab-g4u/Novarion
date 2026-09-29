import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  StopCircle,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Compass,
  ArrowRight
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
  const [streamConnected, setStreamConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    const connectSSE = () => {
      eventSource = new EventSource(`/api/testing/session/${sessionId}/stream`);

      eventSource.onopen = () => {
        setStreamConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const streamEvt: StreamEvent = JSON.parse(event.data);

          if (streamEvt.type === ('session.snapshot' as any)) {
            setSessionData(streamEvt.data as any);
            return;
          }

          if (streamEvt.type === 'screenshot.created') {
            const scr = streamEvt.data.screenshot as ScreenshotRecord;
            setSessionData((prev: BrowserSessionData | null) => {
              if (!prev) return prev;
              const exists = prev.screenshots.some((s: ScreenshotRecord) => s.id === scr.id);
              return exists ? prev : { ...prev, screenshots: [...prev.screenshots, scr] };
            });
            return;
          }

          if (streamEvt.type === 'action.completed') {
            const act = streamEvt.data.action as ActionRecord;
            setSessionData((prev: BrowserSessionData | null) => {
              if (!prev) return prev;
              const exists = prev.events.some((e: ActionRecord) => e.id === act.id);
              return exists ? prev : { ...prev, events: [...prev.events, act], stepCount: prev.stepCount + 1 };
            });
            return;
          }

          if (streamEvt.type === 'friction.detected') {
            const fric = streamEvt.data.friction as any;
            setSessionData((prev: BrowserSessionData | null) => {
              if (!prev) return prev;
              return { ...prev, friction: [...prev.friction, fric] };
            });
            return;
          }

          if (streamEvt.type === 'task.progress') {
            setSessionData((prev: BrowserSessionData | null) => {
              if (!prev) return prev;
              return { ...prev, stepCount: (streamEvt.data.stepCount as number) || prev.stepCount };
            });
            return;
          }

          if (streamEvt.type === 'session.finished') {
            setSessionData((prev: BrowserSessionData | null) => {
              if (!prev) return prev;
              return { ...prev, status: streamEvt.data.status as any };
            });
            // Fetch final data snapshot with full findings & metrics
            fetchFinalSnapshot();
          }
        } catch {
          // Ignore
        }
      };

      eventSource.onerror = () => {
        setStreamConnected(false);
        // Fallback to polling
        fetchFinalSnapshot();
      };
    };

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

    connectSSE();
    fetchFinalSnapshot();

    // Poll periodically while active
    const interval = setInterval(() => {
      if (sessionData?.status === 'RUNNING' || sessionData?.status === 'STARTING') {
        fetchFinalSnapshot();
      }
    }, 2500);

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
      ? sessionData.events[sessionData.events.length - 1].target || sessionData.events[sessionData.events.length - 1].type
      : 'Initializing browser';

  return (
    <div className="space-y-6">
      {/* Session Top Status Bar */}
      <div className="bg-[#0A0D14] text-white border border-[#222732] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping" />
          <span className="font-bold text-white uppercase tracking-wider text-[11px]">
            ACTIVE LIVE BROWSER SESSION
          </span>
          <span className="text-[#64748B]">·</span>
          <span className="text-[#94A3B8]">{sessionData.targetDomain}</span>
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

      {/* Main Split: Browser Viewport & Task Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Live Browser Viewport (7 cols) */}
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
              <span>Viewing historical screenshot triggered by: {inspectedScreenshot.trigger}</span>
              <button
                type="button"
                onClick={() => setInspectedScreenshot(null)}
                className="font-bold underline cursor-pointer"
              >
                Return to Live Viewport
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Task Progress & Live Friction (5 cols) */}
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

          <FrictionPanel frictionEvents={sessionData.friction} />
        </div>
      </div>

      {/* Action Timeline */}
      <ActionTimeline
        events={sessionData.events}
        screenshots={sessionData.screenshots}
        onSelectEventScreenshot={(scr) => setInspectedScreenshot(scr)}
      />

      {/* Grounded UX Findings (When available) */}
      {sessionData.findings.length > 0 && (
        <UXFindings findings={sessionData.findings} />
      )}

      {/* Session Evidence Output for Research System */}
      {sessionData.evidence && (
        <SessionEvidence evidence={sessionData.evidence} onSyncToGraph={onSyncToGraph} />
      )}
    </div>
  );
};

export default TestingSession;
