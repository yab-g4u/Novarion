import React from 'react';
import {
  Globe,
  Lock,
  RotateCw,
  ExternalLink,
  ShieldCheck,
  Maximize2,
  AlertCircle
} from 'lucide-react';
import { ScreenshotRecord, SessionStatus } from '../../../../apps/api/src/modules/testing/testing.types';

interface BrowserViewportProps {
  currentUrl: string;
  pageTitle: string;
  status: SessionStatus;
  stepCount: number;
  maxSteps: number;
  latestScreenshot?: ScreenshotRecord;
  lastActionDescription?: string;
  isLoading?: boolean;
}

export const BrowserViewport: React.FC<BrowserViewportProps> = ({
  currentUrl,
  pageTitle,
  status,
  stepCount,
  maxSteps,
  latestScreenshot,
  lastActionDescription,
  isLoading = false
}) => {
  const isRunning = status === 'RUNNING' || status === 'STARTING';
  const isCompleted = status === 'COMPLETED';
  const isFailed = status === 'FAILED' || status === 'TIMEOUT';
  const isBlocked = status === 'BLOCKED' || status === 'AUTHENTICATION_REQUIRED';

  let displayHost = 'about:blank';
  try {
    displayHost = new URL(currentUrl).hostname;
  } catch {
    displayHost = currentUrl || 'about:blank';
  }

  return (
    <div className="w-full bg-[#0A0D14] border border-[#222732] rounded-3xl overflow-hidden shadow-md flex flex-col text-left font-['Geist',sans-serif]">
      {/* Top Browser Window Header */}
      <div className="bg-[#141820] border-b border-[#222732] px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Window Controls */}
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#EF4444]/80 inline-block" />
          <span className="w-3 h-3 rounded-full bg-[#F59E0B]/80 inline-block" />
          <span className="w-3 h-3 rounded-full bg-[#10B981]/80 inline-block" />
          <span className="text-[11px] font-mono text-[#868C98] ml-2 hidden sm:inline-block">
            Probe Isolated Browser
          </span>
        </div>

        {/* URL Address Bar */}
        <div className="flex-1 max-w-xl mx-auto flex items-center bg-[#05070A] border border-[#222732] rounded-xl px-3 py-1.5 text-xs text-[#94A3B8] font-mono">
          <Lock size={12} className="text-[#10B981] mr-2 flex-shrink-0" />
          <span className="text-[#CBD5E1] font-semibold">{displayHost}</span>
          <span className="truncate text-[#64748B]">
            {currentUrl.replace(`https://${displayHost}`, '').replace(`http://${displayHost}`, '') || '/'}
          </span>
          {isLoading && <RotateCw size={12} className="animate-spin ml-auto text-[#60A5FA]" />}
        </div>

        {/* Session Status Badge */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 ${
              isRunning
                ? 'bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]'
                : isCompleted
                ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                : isBlocked
                ? 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]'
                : 'bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3]'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isRunning
                  ? 'bg-[#3B82F6] animate-pulse'
                  : isCompleted
                  ? 'bg-[#10B981]'
                  : isBlocked
                  ? 'bg-[#F59E0B]'
                  : 'bg-[#EF4444]'
              }`}
            />
            <span>{status}</span>
          </span>

          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in external browser"
            className="text-[#64748B] hover:text-white transition-colors p-1"
          >
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* Action Banner / Page Title */}
      <div className="bg-[#0C0F17] px-4 py-2 border-b border-[#1E232B] flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#868C98]">
        <div className="flex items-center gap-2 truncate">
          <Globe size={13} className="text-[#60A5FA] flex-shrink-0" />
          <span className="text-[#CBD5E1] truncate font-medium">{pageTitle || displayHost}</span>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          {lastActionDescription && (
            <span className="text-[#93C5FD] truncate max-w-xs">
              Action: <strong>{lastActionDescription}</strong>
            </span>
          )}
          <span className="bg-[#1A202C] px-2 py-0.5 rounded text-[#CBD5E1]">
            Step {stepCount} / {maxSteps}
          </span>
        </div>
      </div>

      {/* Live Viewport Screen */}
      <div className="relative aspect-[16/10] sm:aspect-[16/9.5] bg-[#05070A] flex items-center justify-center overflow-hidden group">
        {latestScreenshot ? (
          <img
            src={latestScreenshot.dataUrl}
            alt={`Browser Viewport at ${pageTitle}`}
            className="w-full h-full object-contain select-none"
          />
        ) : (
          <div className="text-center p-8 text-[#64748B] font-mono space-y-3">
            {isRunning ? (
              <>
                <RotateCw size={28} className="animate-spin mx-auto text-[#60A5FA]" />
                <p className="text-xs text-[#CBD5E1]">Initializing Playwright browser session...</p>
                <p className="text-[11px] text-[#64748B]">Navigating to {displayHost}</p>
              </>
            ) : isBlocked ? (
              <>
                <AlertCircle size={28} className="mx-auto text-[#F59E0B]" />
                <p className="text-xs text-[#CBD5E1]">Authentication or Security Challenge Encountered</p>
                <p className="text-[11px] text-[#64748B]">This target requires user login or bot challenge resolution</p>
              </>
            ) : (
              <>
                <Globe size={28} className="mx-auto text-[#475569]" />
                <p className="text-xs text-[#CBD5E1]">Awaiting browser session start</p>
              </>
            )}
          </div>
        )}

        {/* Live Active Interaction Indicator Overlay */}
        {isRunning && (
          <div className="absolute bottom-3 right-3 bg-[#0A0D14]/90 backdrop-blur-md border border-[#222732] px-3 py-1.5 rounded-xl flex items-center gap-2 text-[10px] font-mono text-white shadow-lg pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
            <span>Controlling Real Browser via Playwright</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowserViewport;
