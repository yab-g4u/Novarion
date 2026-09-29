import React, { useState } from 'react';
import {
  Compass,
  ArrowRight,
  RotateCcw,
  AlertTriangle,
  Play,
  Box,
  Lock
} from 'lucide-react';
import { TestingSession } from './TestingSession';
import { ALLOWED_GOOGLE_TEST_EMAIL } from '../../../lib/testing/testing.types';

interface TestingWorkspaceProps {
  onSyncToGraph?: (evidence: any) => void;
}

const PRESET_TEST_CASES = [
  {
    name: 'links.et (Payment Receipt Verification)',
    url: 'https://links.et/',
    task: 'Verify transaction reference DHV0BHI2GG in the payment receipt input and inspect the response.',
    useGoogleAuth: false
  },
  {
    name: 'links.et/signup (Google Auth Detection)',
    url: 'https://links.et/signup',
    task: 'Detect authentication requirements and test Continue with Google sign-in with g4uforlife@gmail.com.',
    useGoogleAuth: true
  },
  {
    name: 'Standard Web Application (example.com)',
    url: 'https://example.com',
    task: 'Navigate to the domain information link and verify the more information section.',
    useGoogleAuth: false
  },
  {
    name: 'Live News Portal (news.ycombinator.com)',
    url: 'https://news.ycombinator.com',
    task: 'Find the newest submissions link and open the newest page.',
    useGoogleAuth: false
  }
];

export const TestingWorkspace: React.FC<TestingWorkspaceProps> = ({ onSyncToGraph }) => {
  const [productUrl, setProductUrl] = useState('https://links.et/');
  const [task, setTask] = useState(
    'Verify transaction reference DHV0BHI2GG in the payment receipt input and inspect the response.'
  );
  const [useGoogleAuth, setUseGoogleAuth] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStartTest = async (
    overrideUrl?: string,
    overrideTask?: string,
    overrideGoogleAuth?: boolean
  ) => {
    const targetUrl = (overrideUrl || productUrl).trim();
    const targetTask = (overrideTask || task).trim();
    const shouldUseGoogle =
      overrideGoogleAuth !== undefined ? overrideGoogleAuth : useGoogleAuth;

    if (!targetUrl || !targetTask) return;

    setIsLaunching(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/testing/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productUrl: targetUrl,
          task: targetTask,
          authEmail: shouldUseGoogle ? ALLOWED_GOOGLE_TEST_EMAIL : undefined,
          maxSteps: 15,
          timeoutMs: 90000
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.message || `Failed to start session (${res.status})`);
      }

      const data = await res.json();
      setActiveSessionId(data.sessionId);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to initialize Playwright browser session');
    } finally {
      setIsLaunching(false);
    }
  };

  const handlePresetSelect = (preset: (typeof PRESET_TEST_CASES)[0]) => {
    setProductUrl(preset.url);
    setTask(preset.task);
    setUseGoogleAuth(preset.useGoogleAuth);
  };

  return (
    <section id="section-product-testing" className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-left font-['Geist',sans-serif]">
      {/* Section Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-[#525866] mb-1.5">
          <Compass size={14} className="text-[#0F52BA]" />
          <span>PROBE PRODUCT TESTING SUBSYSTEM</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0A0D14]">
          Probe can actually use a product, not just talk about it.
        </h2>
        <p className="text-xs sm:text-sm text-[#525866] mt-1.5 max-w-3xl leading-relaxed">
          Launch an isolated Playwright browser session, execute concrete user tasks against the live URL, capture real screenshots and navigation timing, detect authentication walls, and record console/network errors.
        </p>
      </div>

      {/* Input Configuration Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 shadow-sm mb-8 space-y-5">
        <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-[#868C98]">
          <div className="flex items-center gap-2 text-[#0A0D14]">
            <Box size={14} className="text-[#0F52BA]" />
            <span>CONFIGURE LIVE PLAYWRIGHT PARAMETERS</span>
          </div>
          <span className="text-[11px] font-normal normal-case text-[#059669]">
            Headless Chromium · Real Network & DOM
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Product URL Input (5 cols) */}
          <div className="md:col-span-5 space-y-1.5">
            <label htmlFor="test-product-url" className="block text-xs font-mono font-semibold text-[#0A0D14]">
              PRODUCT TARGET URL
            </label>
            <input
              id="test-product-url"
              type="url"
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              placeholder="https://links.et/"
              className="w-full text-sm font-medium text-[#0A0D14] placeholder:text-[#94A3B8] border border-[#CBD5E1] rounded-2xl px-4 py-3 bg-[#FAFAFA] focus:outline-none focus:border-[#0F52BA] focus:ring-2 focus:ring-[#0F52BA]/15 transition-all font-mono"
            />
          </div>

          {/* User Task Input (7 cols) */}
          <div className="md:col-span-7 space-y-1.5">
            <label htmlFor="test-user-task" className="block text-xs font-mono font-semibold text-[#0A0D14]">
              CONCRETE USER TASK TO ATTEMPT
            </label>
            <div className="flex gap-2">
              <input
                id="test-user-task"
                type="text"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="Verify transaction reference DHV0BHI2GG in the payment receipt input..."
                className="flex-1 text-sm font-medium text-[#0A0D14] placeholder:text-[#94A3B8] border border-[#CBD5E1] rounded-2xl px-4 py-3 bg-[#FAFAFA] focus:outline-none focus:border-[#0F52BA] focus:ring-2 focus:ring-[#0F52BA]/15 transition-all"
              />
              <button
                type="button"
                onClick={() => handleStartTest()}
                disabled={isLaunching || !productUrl.trim() || !task.trim()}
                className="px-6 py-3 rounded-2xl bg-[#0A0D14] hover:bg-[#1E293B] text-white text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-xs transition-all disabled:opacity-50 flex-shrink-0"
              >
                {isLaunching ? (
                  <>
                    <RotateCcw size={14} className="animate-spin text-[#60A5FA]" />
                    <span>Launching...</span>
                  </>
                ) : (
                  <>
                    <Play size={13} fill="currentColor" />
                    <span>Run Test</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Google Auth Option & Presets */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#F1F3F5] text-[11px] font-mono text-[#64748B]">
          <label className="inline-flex items-center gap-2 cursor-pointer text-[#334155]">
            <input
              type="checkbox"
              checked={useGoogleAuth}
              onChange={(e) => setUseGoogleAuth(e.target.checked)}
              className="rounded border-[#CBD5E1] text-[#0F52BA]"
            />
            <Lock size={12} className="text-[#0F52BA]" />
            <span>
              Support Google/Gmail Auth (<strong>{ALLOWED_GOOGLE_TEST_EMAIL}</strong> — no stored passwords)
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[#868C98]">Presets:</span>
            {PRESET_TEST_CASES.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                className="px-2.5 py-1 rounded-lg bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155] transition-colors cursor-pointer"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] text-[#E11D48] text-xs font-mono flex items-center gap-2">
          <AlertTriangle size={15} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Live Session Display or Empty State */}
      {activeSessionId ? (
        <TestingSession
          sessionId={activeSessionId}
          onSyncToGraph={onSyncToGraph}
          onNewTest={() => setActiveSessionId(null)}
        />
      ) : (
        <div className="border border-dashed border-[#CBD5E1] rounded-3xl p-10 text-center text-[#868C98] bg-white/60 space-y-3 font-mono text-xs">
          <Compass size={32} className="mx-auto opacity-30 text-[#0F52BA]" />
          <h4 className="text-sm font-bold text-[#0A0D14]">No active product testing session</h4>
          <p className="max-w-md mx-auto text-[#64748B]">
            Specify any public product URL above and click <strong>Run Test</strong>. Probe will launch an isolated Chromium session, navigate to the site, and attempt the task live.
          </p>
          <button
            type="button"
            onClick={() =>
              handleStartTest(
                'https://links.et/',
                'Verify transaction reference DHV0BHI2GG in the payment receipt input and inspect the response.',
                false
              )
            }
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] font-bold cursor-pointer hover:bg-[#DBEAFE] transition-colors"
          >
            <span>Run Live Test on links.et</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}
    </section>
  );
};

export default TestingWorkspace;
