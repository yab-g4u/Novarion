import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  RotateCcw,
  MousePointer,
  ExternalLink,
  CheckCircle2,
  Check,
  Globe,
  Terminal,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Sparkles,
  Clock,
  Activity,
  RefreshCw,
  XCircle,
  Lock,
  WifiOff
} from 'lucide-react';
import { ALLOWED_GOOGLE_TEST_EMAIL, type BrowserSessionData } from '../lib/testing/testing.types';
import { updateProbeLiveState } from '../lib/voxide/probeVoxideBridge';

const PRESET_PRODUCTS = [
  {
    name: 'links.et (Receipt Verify)',
    url: 'https://links.et',
    task: 'Verify transaction reference DHV0BHI2GG in the payment receipt input and inspect the result',
    useGoogleAuth: false,
    tag: 'Live Form Test'
  },
  {
    name: 'links.et/signup (Google Auth)',
    url: 'https://links.et/signup',
    task: 'Detect authentication requirements and test Continue with Google sign-in',
    useGoogleAuth: true,
    tag: 'Google Auth Test'
  },
  {
    name: 'example.com',
    url: 'https://example.com',
    task: 'Explore landing page content, click the More information link, and verify navigation timing',
    useGoogleAuth: false,
    tag: 'Navigation Test'
  },
  {
    name: 'news.ycombinator.com',
    url: 'https://news.ycombinator.com',
    task: 'Browse frontpage submissions, click Newest navigation link, and measure page responsiveness',
    useGoogleAuth: false,
    tag: 'Live DOM Test'
  }
];

export const ProductTestingSection: React.FC = () => {
  const [inputUrl, setInputUrl] = useState<string>('https://links.et');
  const [inputTask, setInputTask] = useState<string>(
    'Verify transaction reference DHV0BHI2GG in the payment receipt input and inspect the result'
  );
  const [enableGoogleAuth, setEnableGoogleAuth] = useState<boolean>(false);
  const [isLaunchingPlaywright, setIsLaunchingPlaywright] = useState<boolean>(false);
  const [playwrightStatus, setPlaywrightStatus] = useState<string>('IDLE');
  const [sessionData, setSessionData] = useState<BrowserSessionData | null>(null);
  const [currentScreenshot, setCurrentScreenshot] = useState<string | null>(null);
  const [activeStepDescription, setActiveStepDescription] = useState<string>('');
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const pollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activePollRunIdRef = useRef<number>(0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const normalizeUrl = (raw: string) => {
    let clean = raw.trim();
    if (!clean) return '';
    if (clean.includes('%3A') || clean.includes('%3a') || clean.includes('%2F') || clean.includes('%2f')) {
      try {
        clean = decodeURIComponent(clean).trim();
      } catch {
        // Ignore malformed encoding
      }
    }
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `https://${clean}`;
    }
    return clean;
  };

  const isTerminalStatus = (status?: string) =>
    status === 'COMPLETED' ||
    status === 'FAILED' ||
    status === 'BLOCKED' ||
    status === 'AUTHENTICATION_REQUIRED' ||
    status === 'TIMEOUT' ||
    status === 'STOPPED';

  const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 15000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)}s`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  };

  const stopPolling = () => {
    activePollRunIdRef.current += 1;
    if (pollingTimerRef.current) {
      clearTimeout(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  };

  const startPollingForSession = (
    newSessionId: string,
    finalUrl: string,
    initialPayload?: BrowserSessionData
  ) => {
    stopPolling();
    const currentRunId = activePollRunIdRef.current;

    setIsLaunchingPlaywright(true);
    setLaunchError(null);

    const applySessionSnapshot = (sess: BrowserSessionData): boolean => {
      if (activePollRunIdRef.current !== currentRunId) return true;

      setSessionData(sess);
      setPlaywrightStatus(sess.status);
      updateProbeLiveState({
        activeTestingSessionId: sess.sessionId,
        activeTestingStatus: sess.status
      });

      if (sess.events && sess.events.length > 0) {
        const lastEv = sess.events[sess.events.length - 1];
        setActiveStepDescription(
          `Step ${sess.events.length}: [${lastEv.type}] ${lastEv.target || ''}${
            !lastEv.success && lastEv.error ? ` — Error: ${lastEv.error}` : ''
          }`
        );
      } else if (sess.errors && sess.errors.length > 0) {
        setActiveStepDescription(sess.errors[0]);
      } else if (sess.status === 'QUEUED' || sess.status === 'STARTING') {
        setActiveStepDescription(`Starting headless Chromium and opening ${finalUrl}...`);
      }

      if (sess.screenshots && sess.screenshots.length > 0) {
        const latest = sess.screenshots[sess.screenshots.length - 1];
        setCurrentScreenshot((prev) => prev || latest.dataUrl);
        if (!isTerminalStatus(sess.status)) {
          setCurrentScreenshot(latest.dataUrl);
        }
      }

      if (isTerminalStatus(sess.status)) {
        stopPolling();
        setIsLaunchingPlaywright(false);
        if (sess.screenshots && sess.screenshots.length > 0) {
          setCurrentScreenshot(sess.screenshots[sess.screenshots.length - 1].dataUrl);
        }
        if (sess.status === 'FAILED' && sess.errors && sess.errors.length > 0) {
          setLaunchError(sess.errors[0]);
        }
        return true;
      }
      return false;
    };

    if (initialPayload && applySessionSnapshot(initialPayload)) {
      return;
    }

    const pollStartedAt = Date.now();
    const MAX_POLL_DURATION_MS = 75000;
    const MAX_CONSECUTIVE_ERRORS = 4;
    const BASE_POLL_INTERVAL_MS = 1200;
    let consecutiveErrors = 0;

    const pollOnce = async () => {
      if (activePollRunIdRef.current !== currentRunId) return;

      if (Date.now() - pollStartedAt > MAX_POLL_DURATION_MS) {
        stopPolling();
        setIsLaunchingPlaywright(false);
        setPlaywrightStatus('TIMEOUT');
        const timeoutMsg =
          'Playwright session timed out after 75 seconds while testing the target URL.';
        setLaunchError(timeoutMsg);
        setActiveStepDescription(`Timeout: ${timeoutMsg}`);
        return;
      }

      try {
        const checkRes = await fetchWithTimeout(
          `/api/testing/session/${encodeURIComponent(newSessionId)}`,
          { method: 'GET' },
          10000
        );

        if (activePollRunIdRef.current !== currentRunId) return;

        if (checkRes.ok) {
          consecutiveErrors = 0;
          const sess: BrowserSessionData = await checkRes.json();
          const done = applySessionSnapshot(sess);
          if (!done && activePollRunIdRef.current === currentRunId) {
            pollingTimerRef.current = setTimeout(pollOnce, BASE_POLL_INTERVAL_MS);
          }
          return;
        }

        const errBody = await checkRes.json().catch(() => ({}));
        if (checkRes.status === 404) {
          consecutiveErrors += 1;
          if (consecutiveErrors >= 2) {
            stopPolling();
            setIsLaunchingPlaywright(false);
            setPlaywrightStatus('FAILED');
            const notFoundMsg =
              errBody?.message ||
              'Testing session expired or the server restarted while loading the target page.';
            setLaunchError(notFoundMsg);
            setActiveStepDescription(`Error: ${notFoundMsg}`);
            return;
          }
        } else {
          consecutiveErrors += 1;
        }

        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          stopPolling();
          setIsLaunchingPlaywright(false);
          setPlaywrightStatus('FAILED');
          const failMsg =
            errBody?.message ||
            errBody?.error ||
            `Playwright session failed after ${MAX_CONSECUTIVE_ERRORS} retries (HTTP ${checkRes.status}). The target site may be unreachable or exceeded container memory limits.`;
          setLaunchError(failMsg);
          setActiveStepDescription(`Error: ${failMsg}`);
          return;
        }

        const backoffMs = Math.min(1500 * Math.pow(2, consecutiveErrors - 1), 10000);
        setActiveStepDescription(
          `Waiting for browser session response (HTTP ${checkRes.status}, retry ${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS})...`
        );
        if (activePollRunIdRef.current === currentRunId) {
          pollingTimerRef.current = setTimeout(pollOnce, backoffMs);
        }
      } catch (pollErr: any) {
        if (activePollRunIdRef.current !== currentRunId) return;
        consecutiveErrors += 1;

        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          stopPolling();
          setIsLaunchingPlaywright(false);
          setPlaywrightStatus('FAILED');
          const netMsg =
            pollErr?.message ||
            'Lost connection to Playwright testing backend after multiple retries.';
          setLaunchError(netMsg);
          setActiveStepDescription(`Error: ${netMsg}`);
          return;
        }

        const backoffMs = Math.min(1500 * Math.pow(2, consecutiveErrors - 1), 10000);
        setActiveStepDescription(
          `Reconnecting to browser session (retry ${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS})...`
        );
        pollingTimerRef.current = setTimeout(pollOnce, backoffMs);
      }
    };

    pollingTimerRef.current = setTimeout(pollOnce, BASE_POLL_INTERVAL_MS);
  };

  const handleLaunchPlaywrightStudy = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalUrl = normalizeUrl(inputUrl);
    if (!finalUrl) {
      setLaunchError('Please enter a valid website URL to test.');
      return;
    }

    stopPolling();
    setIsLaunchingPlaywright(true);
    setPlaywrightStatus('STARTING');
    setLaunchError(null);
    setSessionData(null);
    setCurrentScreenshot(null);
    setActiveStepDescription(`Launching real Playwright Chromium browser and opening ${finalUrl}...`);

    try {
      const res = await fetchWithTimeout(
        '/api/testing/session',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productUrl: finalUrl,
            task: inputTask || 'Explore landing page, test primary navigation, and evaluate UX friction',
            authEmail: enableGoogleAuth ? ALLOWED_GOOGLE_TEST_EMAIL : undefined,
            maxSteps: 8,
            timeoutMs: 45000
          })
        },
        20000
      );

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errMsg =
          payload?.message ||
          payload?.error ||
          (res.status === 502 || res.status === 503
            ? `Playwright testing service is temporarily unavailable (HTTP ${res.status}). Please retry in a few seconds.`
            : `Failed to start Playwright browser session (HTTP ${res.status})`);
        throw new Error(errMsg);
      }

      const newSessionId = payload.sessionId;
      if (!newSessionId) {
        throw new Error('Server did not return a valid testing session ID.');
      }

      startPollingForSession(newSessionId, finalUrl, payload);
    } catch (err: any) {
      stopPolling();
      setIsLaunchingPlaywright(false);
      setPlaywrightStatus('FAILED');
      const msg = err?.message || 'Unable to launch Playwright browser session';
      setLaunchError(msg);
      setActiveStepDescription(`Error: ${msg}`);
    }
  };

  useEffect(() => {
    const onVoxideProductTest = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (!detail) return;
      if (detail.productUrl) setInputUrl(detail.productUrl);
      if (detail.task) setInputTask(detail.task);
      if (typeof detail.useGoogleAuth === 'boolean') setEnableGoogleAuth(detail.useGoogleAuth);
      if (detail.sessionId) {
        startPollingForSession(
          detail.sessionId,
          detail.productUrl || inputUrl,
          detail.initialSnapshot
        );
      }
    };
    window.addEventListener('probe:voxide-product-test', onVoxideProductTest);
    return () => {
      window.removeEventListener('probe:voxide-product-test', onVoxideProductTest);
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const screenshots = sessionData?.screenshots || [];
  const sessionEvents = sessionData?.events || [];
  const consoleErrors = sessionData?.consoleErrors || [];
  const networkFailures = sessionData?.networkFailures || [];
  const navTiming = sessionData?.navigationTiming;
  const authInfo = sessionData?.authDetection;
  const currentBrowsedUrl = sessionData?.currentUrl || inputUrl;
  const currentTitle = sessionData?.currentTitle || '';
  const finished = isTerminalStatus(sessionData?.status);

  return (
    <section
      id="section-testing"
      className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-['Geist','Inter',sans-serif] text-[#0A0D14]"
    >
      {/* 1. SECTION HEADLINE */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1F3F5] text-[11px] font-mono font-semibold uppercase tracking-wider text-[#525866] mb-3">
            <Activity size={13} className="text-[#0F52BA]" />
            <span>REAL PLAYWRIGHT BROWSER TESTING</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0A0D14] leading-[1.12]">
            Test any live product with a real browser.
          </h2>
          <p className="mt-3 text-base sm:text-lg text-[#525866] leading-relaxed">
            Enter any live website URL to launch an isolated headless Chromium session via Playwright, measure real navigation timing, detect authentication barriers, execute live DOM interactions, and capture console/network failures.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* A. PRODUCT URL, TASK & GOOGLE AUTH CONFIGURATION BAR */}
        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-5 sm:p-7 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#0A0D14] uppercase tracking-wider font-mono flex items-center gap-2">
              <Globe size={14} className="text-[#0F52BA]" />
              <span>Specify Target Website URL & Real User Task</span>
            </span>
            <span className="text-[11px] font-mono text-[#059669] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-[#A7F3D0] flex items-center gap-1 font-semibold">
              <ShieldCheck size={12} />
              Live Headless Chromium · Zero Mock Rendering
            </span>
          </div>

          <form onSubmit={handleLaunchPlaywrightStudy} className="space-y-3">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              {/* Product URL Input */}
              <div className="lg:col-span-5 relative flex items-center">
                <span className="absolute left-3.5 text-[#868C98] font-mono text-xs pointer-events-none">
                  URL
                </span>
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://links.et, https://example.com..."
                  className="w-full pl-13 pr-4 py-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-2xl text-xs sm:text-sm font-mono text-[#0A0D14] placeholder-[#94A3B8] focus:outline-none focus:border-[#0A0D14] focus:bg-white transition-all"
                />
              </div>

              {/* Specific Task Input */}
              <div className="lg:col-span-5 relative flex items-center">
                <span className="absolute left-3.5 text-[#868C98] font-mono text-xs pointer-events-none">
                  Task
                </span>
                <input
                  type="text"
                  value={inputTask}
                  onChange={(e) => setInputTask(e.target.value)}
                  placeholder="Describe the concrete user task to run on the target URL..."
                  className="w-full pl-14 pr-4 py-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-2xl text-xs sm:text-sm font-medium text-[#0A0D14] placeholder-[#94A3B8] focus:outline-none focus:border-[#0A0D14] focus:bg-white transition-all"
                />
              </div>

              {/* Launch Button */}
              <div className="lg:col-span-2">
                <button
                  type="submit"
                  disabled={isLaunchingPlaywright}
                  className={`w-full h-full min-h-[46px] rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                    isLaunchingPlaywright
                      ? 'bg-[#E5E7EB] text-[#868C98] cursor-not-allowed'
                      : 'bg-[#0A0D14] hover:bg-[#1E293B] text-white active:scale-95'
                  }`}
                >
                  {isLaunchingPlaywright ? (
                    <>
                      <RefreshCw size={14} className="animate-spin text-[#0F52BA]" />
                      <span>Testing...</span>
                    </>
                  ) : (
                    <>
                      <Play size={13} fill="currentColor" />
                      <span>Run Playwright</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Google/Gmail Authenticated Testing Option */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#F1F3F5] text-xs">
              <label className="inline-flex items-center gap-2 cursor-pointer text-[#334155] font-mono text-[11px]">
                <input
                  type="checkbox"
                  checked={enableGoogleAuth}
                  onChange={(e) => setEnableGoogleAuth(e.target.checked)}
                  className="rounded border-[#CBD5E1] text-[#0F52BA] focus:ring-[#0F52BA]"
                />
                <Lock size={12} className="text-[#0F52BA]" />
                <span>
                  Use Google/Gmail Auth where site supports Google Sign-In (never stores passwords)
                </span>
              </label>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-mono text-[#868C98] mr-1">Presets:</span>
                {PRESET_PRODUCTS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setInputUrl(preset.url);
                      setInputTask(preset.task);
                      setEnableGoogleAuth(preset.useGoogleAuth);
                    }}
                    className={`px-2.5 py-1 rounded-xl border text-[11px] font-mono transition-all cursor-pointer ${
                      inputUrl === preset.url && enableGoogleAuth === preset.useGoogleAuth
                        ? 'bg-[#0A0D14] text-white border-[#0A0D14] font-bold'
                        : 'bg-white hover:bg-[#F8FAFC] text-[#525866] border-[#E5E7EB]'
                    }`}
                  >
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </form>

          {launchError && (
            <div className="p-3.5 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] text-[#E11D48] text-xs font-mono flex items-start gap-2">
              <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block">Playwright Session Error</strong>
                <span>{launchError}</span>
              </div>
            </div>
          )}
        </div>

        {/* B. PLAYWRIGHT REAL BROWSER VIEWPORT & LIVE ACTION STREAM */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Real Browser Window (Playwright Live Viewport) */}
          <div className="lg:col-span-8 bg-[#0B0D10] text-[#F3F4F6] border border-[#222730] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            {/* Browser Chrome Header */}
            <div className="h-11 px-4 bg-[#11141A] border-b border-[#222730] flex items-center justify-between text-xs text-[#9CA3AF] gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                </div>
                <div className="bg-[#0B0D10] border border-[#222730] rounded-lg px-2.5 py-1 text-[11px] font-mono text-[#D1D5DB] flex items-center gap-1.5 truncate flex-1 max-w-lg">
                  <Lock size={11} className="text-[#10B981] flex-shrink-0" />
                  <span className="truncate">{currentBrowsedUrl}</span>
                </div>
                <a
                  href={normalizeUrl(currentBrowsedUrl) || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#9CA3AF] hover:text-white p-1"
                  title="Open actual URL in new tab"
                >
                  <ExternalLink size={13} />
                </a>
              </div>

              <div className="flex items-center gap-2.5 text-[11px] font-mono flex-shrink-0">
                {navTiming?.loadTimeMs && (
                  <span className="px-2 py-0.5 rounded bg-[#1E293B] text-[#38BDF8]">
                    Load: {navTiming.loadTimeMs}ms
                  </span>
                )}
                <span
                  className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                    playwrightStatus === 'COMPLETED'
                      ? 'bg-[#064E3B] text-[#34D399]'
                      : playwrightStatus === 'RUNNING'
                      ? 'bg-[#1E3A8A] text-[#93C5FD]'
                      : playwrightStatus === 'AUTHENTICATION_REQUIRED' || playwrightStatus === 'BLOCKED'
                      ? 'bg-[#78350F] text-[#FCD34D]'
                      : playwrightStatus === 'FAILED'
                      ? 'bg-[#881337] text-[#FDA4AF]'
                      : 'bg-[#1F2937] text-[#9CA3AF]'
                  }`}
                >
                  {playwrightStatus}
                </span>
              </div>
            </div>

            {/* Viewport Screen Area */}
            <div className="relative min-h-[380px] sm:min-h-[460px] bg-[#0E1217] flex items-center justify-center overflow-hidden">
              {currentScreenshot ? (
                <div className="relative w-full h-full flex items-center justify-center p-2">
                  <img
                    src={currentScreenshot}
                    alt="Playwright Real Browser Viewport"
                    className="max-w-full max-h-[450px] rounded-xl object-contain shadow-lg border border-[#222730]"
                  />

                  {isLaunchingPlaywright && (
                    <div className="absolute top-4 right-4 pointer-events-none flex items-center gap-1.5 bg-[#0A0D14]/90 text-white px-3 py-1 rounded-lg border border-white/15 text-[11px] font-mono">
                      <MousePointer size={13} className="text-[#38BDF8] animate-bounce" />
                      <span>Playwright Executing Live Task</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-8 space-y-3 max-w-md">
                  <div className="w-12 h-12 rounded-2xl bg-[#1E293B] text-[#94A3B8] flex items-center justify-center mx-auto shadow-inner">
                    <Globe size={24} />
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    {isLaunchingPlaywright
                      ? `Navigating to ${normalizeUrl(inputUrl)}...`
                      : 'Real Playwright Browser Ready'}
                  </h4>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    {isLaunchingPlaywright
                      ? 'Headless Chromium is opening the target URL, capturing real viewport screenshots, and inspecting DOM elements.'
                      : 'Enter any website URL above and click "Run Playwright" to open the real site in Chromium and run live interactions.'}
                  </p>
                </div>
              )}

              {/* Bottom Status Bar */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between p-2.5 rounded-xl bg-[#090D16]/90 backdrop-blur-md border border-[#1E293B] text-xs font-mono gap-2">
                <div className="flex items-center gap-2 truncate">
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      playwrightStatus === 'FAILED'
                        ? 'bg-[#EF4444]'
                        : playwrightStatus === 'AUTHENTICATION_REQUIRED'
                        ? 'bg-[#F59E0B]'
                        : 'bg-[#38BDF8]'
                    }`}
                  />
                  <span className="text-[#E2E8F0] font-semibold truncate">
                    {activeStepDescription || 'Ready to launch real browser session'}
                  </span>
                </div>
                {currentTitle && (
                  <span className="text-[#94A3B8] truncate max-w-[240px] hidden md:inline">
                    "{currentTitle}"
                  </span>
                )}
              </div>
            </div>

            {/* Captured Screenshots Filmstrip */}
            {screenshots.length > 0 && (
              <div className="bg-[#11141A] border-t border-[#222730] p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#9CA3AF]">
                  <span className="flex items-center gap-1.5 font-bold text-white">
                    <Layers size={13} className="text-[#38BDF8]" />
                    <span>Captured Real Browser Screenshots ({screenshots.length})</span>
                  </span>
                  <span className="text-[10px] text-[#64748B]">Click thumbnail to inspect frame</span>
                </div>
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                  {screenshots.map((scr, idx) => (
                    <button
                      key={scr.id || idx}
                      type="button"
                      onClick={() => setCurrentScreenshot(scr.dataUrl)}
                      className={`group relative flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        currentScreenshot === scr.dataUrl
                          ? 'border-[#38BDF8] shadow-md'
                          : 'border-[#222730] hover:border-[#4B5563] opacity-75 hover:opacity-100'
                      }`}
                      style={{ width: '104px', height: '64px' }}
                    >
                      <img
                        src={scr.dataUrl}
                        alt={`Step ${idx + 1} (${scr.trigger})`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 right-1 bg-black/80 text-[9px] font-mono font-bold text-white px-1.5 py-0.5 rounded">
                        #{idx + 1} {scr.trigger}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Live Telemetry, Timing, Auth & Action Log */}
          <div className="lg:col-span-4 bg-white border border-[#E5E7EB] rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F1F3F5]">
                <span className="font-mono text-xs font-bold text-[#0A0D14] flex items-center gap-1.5 uppercase">
                  <Terminal size={14} className="text-[#0F52BA]" />
                  <span>Live Browser Telemetry</span>
                </span>
                <span className="text-[10px] font-mono text-[#868C98]">
                  {sessionEvents.length} action(s)
                </span>
              </div>

              {/* Navigation Timing & Auth Detection Summary */}
              {(navTiming || authInfo) && (
                <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2 text-[11px] font-mono">
                  {navTiming && (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[#64748B]">Page Load / Timing:</span>
                      <span className="font-bold text-[#0A0D14]">
                        {navTiming.loadTimeMs}ms
                        {navTiming.ttfbMs !== undefined ? ` (TTFB ${navTiming.ttfbMs}ms)` : ''}
                      </span>
                    </div>
                  )}
                  {authInfo && (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[#64748B]">Auth Required:</span>
                      <span
                        className={`font-bold ${
                          authInfo.authRequired ? 'text-[#D97706]' : 'text-[#059669]'
                        }`}
                      >
                        {authInfo.authRequired
                          ? `Yes (${authInfo.supportsGoogleAuth ? 'Google Auth Supported' : 'Password Wall'})`
                          : 'No (Public Access)'}
                      </span>
                    </div>
                  )}
                  {authInfo?.reason && (
                    <p className="text-[10px] text-[#475569] leading-snug border-t border-[#E2E8F0] pt-1.5">
                      {authInfo.reason}
                    </p>
                  )}
                </div>
              )}

              {/* Action Log Entries */}
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 text-xs font-mono">
                {sessionEvents.length === 0 ? (
                  <div className="p-6 text-center text-[#868C98] space-y-2">
                    <Clock size={18} className="mx-auto text-[#CBD5E1]" />
                    <p className="text-[11px]">
                      No browser actions recorded yet. Click "Run Playwright" to execute against the live URL.
                    </p>
                  </div>
                ) : (
                  sessionEvents.map((ev, idx) => (
                    <div
                      key={ev.id || idx}
                      className={`p-2.5 rounded-xl border space-y-1 ${
                        ev.success
                          ? 'bg-[#F8FAFC] border-[#E2E8F0]'
                          : 'bg-[#FFF1F2] border-[#FECDD3]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span
                          className={`font-bold flex items-center gap-1 ${
                            ev.success ? 'text-[#0F52BA]' : 'text-[#E11D48]'
                          }`}
                        >
                          {ev.success ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                          <span>
                            {idx + 1}. [{ev.type}]
                          </span>
                        </span>
                        <span className="text-[#64748B]">{ev.durationMs}ms</span>
                      </div>
                      <p className="text-[11px] text-[#0A0D14] font-medium leading-snug break-words">
                        {ev.target || ev.type}
                      </p>
                      {ev.value && (
                        <p className="text-[10px] text-[#475569] bg-white px-1.5 py-0.5 rounded border border-[#E2E8F0] truncate">
                          Input: <strong>{ev.value}</strong>
                        </p>
                      )}
                      {ev.error && (
                        <p className="text-[10px] text-[#E11D48] font-semibold break-words">
                          Error: {ev.error}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Console Errors & Failed Network Requests */}
              {(consoleErrors.length > 0 || networkFailures.length > 0) && (
                <div className="p-3 rounded-2xl bg-[#FFF1F2]/60 border border-[#FECDD3] space-y-1.5 text-[10px] font-mono">
                  <div className="flex items-center justify-between font-bold text-[#BE123C]">
                    <span className="flex items-center gap-1">
                      <WifiOff size={11} />
                      <span>Console & Network Diagnostics</span>
                    </span>
                    <span>
                      {consoleErrors.length} console · {networkFailures.length} network
                    </span>
                  </div>
                  <div className="max-h-28 overflow-y-auto space-y-1 text-[#881337]">
                    {consoleErrors.slice(0, 5).map((ce) => (
                      <div key={ce.id} className="truncate" title={ce.text}>
                        [{ce.type}] {ce.text}
                      </div>
                    ))}
                    {networkFailures.slice(0, 5).map((nf) => (
                      <div key={nf.id} className="truncate" title={`${nf.method} ${nf.url} (${nf.failureText})`}>
                        [{nf.method} {nf.failureText}] {nf.url}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Status and Rerun Button */}
            <div className="pt-3 border-t border-[#F1F3F5] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#868C98]">Session Status:</span>
                <span
                  className={`font-bold ${
                    playwrightStatus === 'RUNNING'
                      ? 'text-[#0F52BA]'
                      : playwrightStatus === 'COMPLETED'
                      ? 'text-[#059669]'
                      : playwrightStatus === 'AUTHENTICATION_REQUIRED' || playwrightStatus === 'BLOCKED'
                      ? 'text-[#D97706]'
                      : playwrightStatus === 'FAILED'
                      ? 'text-[#E11D48]'
                      : 'text-[#525866]'
                  }`}
                >
                  {playwrightStatus}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleLaunchPlaywrightStudy()}
                disabled={isLaunchingPlaywright}
                className="w-full py-2.5 rounded-xl bg-[#F1F3F5] hover:bg-[#E5E7EB] text-[#0A0D14] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RotateCcw size={13} />
                <span>Rerun Live Browser Test</span>
              </button>
            </div>
          </div>
        </div>

        {/* C. STRUCTURED EMPIRICAL TEST RESULTS */}
        {sessionData && finished && (
          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F1F3F5]">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-xl text-white flex items-center justify-center shadow-xs ${
                    sessionData.status === 'COMPLETED'
                      ? 'bg-[#10B981]'
                      : sessionData.status === 'AUTHENTICATION_REQUIRED' || sessionData.status === 'BLOCKED'
                      ? 'bg-[#F59E0B]'
                      : 'bg-[#E11D48]'
                  }`}
                >
                  {sessionData.status === 'COMPLETED' ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <AlertTriangle size={16} />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0A0D14]">
                    Playwright Test Result: {sessionData.status}
                  </h3>
                  <p className="text-xs text-[#64748B] font-mono">
                    URL: {sessionData.currentUrl} {sessionData.currentTitle ? `· "${sessionData.currentTitle}"` : ''}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  showToast('Empirical Playwright test results attached to Living Evidence Graph!')
                }
                className="px-4 py-2 rounded-xl bg-[#0A0D14] hover:bg-[#1E293B] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer self-start sm:self-auto"
              >
                <Sparkles size={13} className="text-[#10B981]" />
                <span>Attach to Evidence Graph</span>
              </button>
            </div>

            {/* Real Measured Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-left font-mono">
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[11px] text-[#64748B] block mb-1">Page Load Time</span>
                <span className="text-lg sm:text-xl font-bold text-[#0A0D14]">
                  {sessionData.navigationTiming?.loadTimeMs ?? sessionData.metrics?.pageLoadMs ?? '—'}ms
                </span>
                {sessionData.navigationTiming?.ttfbMs !== undefined && (
                  <span className="text-[10px] text-[#64748B] block mt-0.5">
                    TTFB: {sessionData.navigationTiming.ttfbMs}ms
                  </span>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[11px] text-[#64748B] block mb-1">Steps Executed</span>
                <span className="text-lg sm:text-xl font-bold text-[#0F52BA]">
                  {sessionData.events.length} actions
                </span>
                <span className="text-[10px] text-[#64748B] block mt-0.5">
                  {sessionData.events.filter((e) => !e.success).length} failed
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[11px] text-[#64748B] block mb-1">Interactive Elements</span>
                <span className="text-lg sm:text-xl font-bold text-[#0A0D14]">
                  {sessionData.pages?.[0]?.elements?.length ?? 0}
                </span>
                <span className="text-[10px] text-[#64748B] block mt-0.5">
                  {sessionData.pages?.[0]?.forms?.length ?? 0} form(s)
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[11px] text-[#64748B] block mb-1">Auth Status</span>
                <span
                  className={`text-sm sm:text-base font-bold ${
                    sessionData.authDetection?.authRequired ? 'text-[#D97706]' : 'text-[#059669]'
                  }`}
                >
                  {sessionData.authDetection?.authRequired ? 'Auth Required' : 'Open Access'}
                </span>
                <span className="text-[10px] text-[#64748B] block mt-0.5">
                  {sessionData.authDetection?.supportsGoogleAuth
                    ? 'Google OAuth detected'
                    : 'Standard access'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[11px] text-[#64748B] block mb-1">Console / Net Errors</span>
                <span
                  className={`text-lg sm:text-xl font-bold ${
                    consoleErrors.length + networkFailures.length > 0
                      ? 'text-[#E11D48]'
                      : 'text-[#059669]'
                  }`}
                >
                  {consoleErrors.length + networkFailures.length}
                </span>
                <span className="text-[10px] text-[#64748B] block mt-0.5">
                  {consoleErrors.length} console · {networkFailures.length} HTTP
                </span>
              </div>
            </div>

            {/* Real Error Banner if Session Failed or Hit Auth Barrier */}
            {sessionData.errors && sessionData.errors.length > 0 && (
              <div className="p-4 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] space-y-1 text-xs font-mono text-[#BE123C]">
                <strong className="block uppercase">Recorded Session Errors / Blockers:</strong>
                {sessionData.errors.map((err, i) => (
                  <div key={i}>• {err}</div>
                ))}
              </div>
            )}

            {/* Diagnostic Findings */}
            {sessionData.findings && sessionData.findings.length > 0 && (
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-[#0A0D14] font-mono uppercase tracking-wider block">
                  Empirical Findings & Observations ({sessionData.findings.length})
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sessionData.findings.map((f, idx) => (
                    <div
                      key={f.id || idx}
                      className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#E5E7EB] space-y-1.5"
                    >
                      <h4 className="text-xs font-bold text-[#0A0D14] flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            f.type === 'POSITIVE'
                              ? 'bg-[#10B981]'
                              : f.type === 'BLOCKER'
                              ? 'bg-[#E11D48]'
                              : 'bg-[#F59E0B]'
                          }`}
                        />
                        <span>{f.title}</span>
                      </h4>
                      <p className="text-xs text-[#525866] leading-relaxed">{f.description}</p>
                      {f.evidence && f.evidence.length > 0 && (
                        <div className="text-[10px] font-mono text-[#64748B] pt-1">
                          {f.evidence.join(' · ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0A0D14] text-white text-xs font-mono px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2">
          <Check size={14} className="text-[#10B981]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </section>
  );
};

export default ProductTestingSection;
