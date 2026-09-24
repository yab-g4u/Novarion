import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  MousePointer, 
  ExternalLink,
  Search,
  CheckCircle2,
  Trash2,
  UploadCloud,
  ArrowRight,
  Sun,
  Moon,
  Check,
  ChevronDown
} from 'lucide-react';

interface ReceiptData {
  reference: string;
  status: string;
  amount: string;
  payer: string;
  credited: string;
  when: string;
  provider: string;
  isCached: boolean;
  rawJson: Record<string, any>;
}

const SAMPLE_RECEIPT: ReceiptData = {
  reference: 'DHV0BHI2GG',
  status: 'Completed',
  amount: '71 Birr ETB',
  payer: 'Yeabsera Sisay Tadesse',
  credited: 'SAMSON SHEWAREGA GEBREMEDIN',
  when: '31-08-2026 13:23:47',
  provider: 'Telebirr',
  isCached: true,
  rawJson: {
    ok: true,
    provider: 'telebirr',
    reference: 'DHV0BHI2GG',
    status: 'completed',
    amount: 71,
    currency: 'ETB',
    payer: 'Yeabsera Sisay Tadesse',
    credited: 'SAMSON SHEWAREGA GEBREMEDIN',
    timestamp: '2026-08-31T13:23:47Z',
    cached: true,
    verification_source: 'telebirr_upstream_gateway'
  }
};

const BANK_BADGES = [
  { name: 'Telebirr', bg: 'bg-[#DCFCE7]', text: 'text-[#15803D]', border: 'border-[#BBF7D0]' },
  { name: 'CBE', bg: 'bg-[#F3E8FF]', text: 'text-[#7E22CE]', border: 'border-[#E9D5FF]' },
  { name: 'CBE Birr', bg: 'bg-[#FCE7F3]', text: 'text-[#BE185D]', border: 'border-[#FBCFE8]' },
  { name: 'M-PESA', bg: 'bg-[#D1FAE5]', text: 'text-[#047857]', border: 'border-[#A7F3D0]' },
  { name: 'BOA', bg: 'bg-[#FEF08A]', text: 'text-[#854D0E]', border: 'border-[#FDE047]' },
  { name: 'Dashen Bank', bg: 'bg-[#DBEAFE]', text: 'text-[#1D4ED8]', border: 'border-[#BFDBFE]' },
  { name: 'Awash Bank', bg: 'bg-[#FFEDD5]', text: 'text-[#C2410C]', border: 'border-[#FED7AA]' },
  { name: 'Zemen Bank', bg: 'bg-[#FCE7F3]', text: 'text-[#9D174D]', border: 'border-[#FBCFE8]' },
  { name: 'COOPay Ebirr', bg: 'bg-[#CFFAFE]', text: 'text-[#0E7490]', border: 'border-[#A5F3FC]' },
  { name: 'Kaafi Ebirr', bg: 'bg-[#E0F2FE]', text: 'text-[#0369A1]', border: 'border-[#BAE6FD]' },
  { name: 'Amhara Bank', bg: 'bg-[#E0E7FF]', text: 'text-[#4338CA]', border: 'border-[#C7D2FE]' },
  { name: 'Abay Bank', bg: 'bg-[#CCFBF1]', text: 'text-[#0F766E]', border: 'border-[#99F6E4]' },
  { name: 'Oromia Bank', bg: 'bg-[#ECFCCB]', text: 'text-[#4D7C0F]', border: 'border-[#D9F99D]' },
  { name: 'Berhan Bank', bg: 'bg-[#FEF9C3]', text: 'text-[#A16207]', border: 'border-[#FEF08A]' },
  { name: 'Ahadu Bank', bg: 'bg-[#FFE4E6]', text: 'text-[#BE123C]', border: 'border-[#FECDD3]' },
  { name: 'Siinqee Bank', bg: 'bg-[#D1FAE5]', text: 'text-[#065F46]', border: 'border-[#A7F3D0]' },
  { name: 'ZamZam Bank', bg: 'bg-[#E2E8F0]', text: 'text-[#334155]', border: 'border-[#CBD5E1]' },
];

export const UserTesting: React.FC = () => {
  // Session Simulation State
  // Phase 0: Arrives at links.et
  // Phase 1: User cursor approaches and focuses input
  // Phase 2: Enters 'DHV0BHI2GG'
  // Phase 3: Moves cursor to Verify button and clicks
  // Phase 4: Upstream bank query (loading state)
  // Phase 5: Verified receipt rendered and read
  const [phase, setPhase] = useState<number>(5); // Default to verified state so the viewer immediately sees the real product
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>('DHV0BHI2GG');
  const [isFocused, setIsFocused] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isReceiptVisible, setIsReceiptVisible] = useState<boolean>(true);
  const [showRawJson, setShowRawJson] = useState<boolean>(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 74, y: 35 });
  const [observation, setObservation] = useState<string>('Task completed · Verified Telebirr receipt');

  const containerRef = useRef<HTMLDivElement>(null);

  // Play through user simulated interaction
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (isPlaying) {
      if (phase === 0) {
        // Initial state
        setInputValue('');
        setIsFocused(false);
        setIsReceiptVisible(false);
        setIsLoading(false);
        setShowRawJson(false);
        setCursorPos({ x: 30, y: 15 });
        setObservation('User encounters links.et verification interface');

        timer = setTimeout(() => {
          setPhase(1);
        }, 1600);
      } else if (phase === 1) {
        // Approaches and focuses input
        setCursorPos({ x: 38, y: 34 });
        setIsFocused(true);
        setObservation('User focused input field');

        timer = setTimeout(() => {
          setPhase(2);
        }, 1800);
      } else if (phase === 2) {
        // Types/pastes DHV0BHI2GG
        setInputValue('DHV0BHI2GG');
        setCursorPos({ x: 48, y: 34 });
        setObservation('User entered transaction reference: DHV0BHI2GG');

        timer = setTimeout(() => {
          setPhase(3);
        }, 1600);
      } else if (phase === 3) {
        // Moves cursor to Verify button and clicks
        setCursorPos({ x: 74, y: 35 });
        setObservation('User submitted reference for verification');

        timer = setTimeout(() => {
          setIsLoading(true);
          setPhase(4);
        }, 1200);
      } else if (phase === 4) {
        // Upstream verification
        setObservation('Querying upstream bank gateway...');

        timer = setTimeout(() => {
          setIsLoading(false);
          setIsReceiptVisible(true);
          setPhase(5);
          setIsPlaying(false);
        }, 1400);
      } else if (phase === 5) {
        // Completed
        setObservation('Task completed · Real receipt verified');
      }
    }

    return () => clearTimeout(timer);
  }, [isPlaying, phase]);

  const handleStartSimulation = () => {
    setPhase(0);
    setIsPlaying(true);
  };

  const handlePauseSimulation = () => {
    setIsPlaying(!isPlaying);
  };

  const handleManualVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setIsLoading(true);
    setIsReceiptVisible(false);
    setObservation('Verifying reference against upstream provider...');

    setTimeout(() => {
      setIsLoading(false);
      setIsReceiptVisible(true);
      setPhase(5);
      setObservation('Task completed · Verified Telebirr receipt');
    }, 900);
  };

  return (
    <section id="section-simulation" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#EAEAEA]">
      {/* SECTION HEADER */}
      <div className="max-w-3xl mb-10">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0A0D14]">
          Let someone try it before you do.
        </h2>
        <p className="text-base text-[#525866] mt-2.5 leading-relaxed">
          Probe puts a real product through a real task and shows where the experience breaks down.
        </p>
      </div>

      {/* REPLAY CONTROLS & STATUS BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        {/* Task Objective Badge */}
        <div className="flex items-center gap-2.5 text-xs">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span className="font-bold text-[#0A0D14]">Task:</span>
          <span className="text-[#374151] font-mono bg-white px-2.5 py-1 rounded-md border border-[#E5E7EB] shadow-2xs">
            "Verify this payment." ENTER THIS <strong className="text-[#0A0D14]">DHV0BHI2GG</strong>
          </span>
        </div>

        {/* Live Interaction Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={isPlaying ? handlePauseSimulation : handleStartSimulation}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#0A0D14] hover:bg-[#202530] text-white transition-all cursor-pointer shadow-xs"
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            <span>{isPlaying ? 'Pause Run' : 'Simulate User Run'}</span>
          </button>
          <button
            onClick={() => {
              setPhase(0);
              setIsPlaying(true);
            }}
            className="p-1.5 rounded-full border border-[#E5E7EB] hover:bg-[#F8FAFC] text-[#525866] transition cursor-pointer"
            title="Restart Session"
          >
            <RotateCcw size={13} />
          </button>
          <a
            href="https://links.et/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[#525866] hover:text-[#0A0D14] transition ml-1"
          >
            <span>Visit links.et</span>
            <ExternalLink size={11} className="opacity-70" />
          </a>
        </div>
      </div>

      {/* THE REAL PRODUCT INTERFACE: links.et EMBED / RECREATION */}
      <div 
        ref={containerRef}
        className="relative bg-[#0B0D10] text-[#F3F4F6] border border-[#222730] rounded-3xl overflow-hidden shadow-xl"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.08) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      >
        {/* Browser Window Chrome */}
        <div className="h-10 px-4 bg-[#11141A] border-b border-[#222730] flex items-center justify-between text-xs text-[#9CA3AF]">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
            </div>
            <div className="bg-[#0B0D10] border border-[#222730] rounded-md px-3 py-0.5 text-[11px] font-mono text-[#D1D5DB] flex items-center gap-1.5">
              <span className="text-[#10B981]">🔒</span>
              <span>https://links.et</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-[#8B949E]">
            <span className="hidden sm:inline">Active Usability Session</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
          </div>
        </div>

        {/* links.et Actual Product Header Bar */}
        <header className="px-6 py-4 flex items-center justify-between border-b border-[#1A1E26]">
          <div className="flex items-center gap-6">
            <a href="https://links.et/" target="_blank" rel="noreferrer" className="flex items-center text-sm font-semibold tracking-tight text-white hover:opacity-90">
              <span>links</span>
              <span className="text-[#8B949E]">.et</span>
            </a>
            <nav className="hidden md:flex items-center gap-5 text-xs text-[#9CA3AF]">
              <span className="hover:text-white transition cursor-pointer">Pricing</span>
              <span className="hover:text-white transition cursor-pointer">Docs</span>
              <span className="hover:text-white transition cursor-pointer">Dashboard</span>
              <span className="hover:text-white transition cursor-pointer">Status</span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-[#151921] border border-[#242A36] rounded-lg text-xs text-[#8B949E]">
              <Search size={12} />
              <span>Search</span>
              <span className="text-[10px] bg-[#222834] px-1 py-0.2 rounded font-mono text-[#9CA3AF]">Ctrl K</span>
            </div>
            <div className="p-1.5 rounded-lg bg-[#151921] border border-[#242A36] text-[#9CA3AF] flex items-center justify-center">
              <Moon size={12} />
            </div>
          </div>
        </header>

        {/* links.et Content Canvas */}
        <div className="px-4 sm:px-8 py-10 max-w-4xl mx-auto space-y-8">
          {/* Main Headline */}
          <div className="text-center space-y-2.5 max-w-2xl mx-auto">
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Verify any Ethiopian payment link.
            </h3>
            <p className="text-xs sm:text-sm text-[#9CA3AF] leading-relaxed">
              Paste a payment link, reference, or screenshot from any Ethiopian bank or wallet. We check it with the bank and show you the real receipt.
            </p>
          </div>

          {/* Verification Search / Input Box */}
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleManualVerify} className="relative">
              <div
                className={`flex items-center bg-[#0E1117] rounded-xl px-4 py-2 transition-all ${
                  isFocused || phase >= 1
                    ? 'border-2 border-[#22C55E] ring-4 ring-[#22C55E]/15'
                    : 'border border-[#262C38]'
                }`}
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Paste a payment link or reference (e.g. DHV0BHI2GG)"
                  className="w-full bg-transparent text-sm sm:text-base font-mono text-white placeholder-[#5B6375] focus:outline-hidden py-1 tracking-wide"
                />

                <button
                  type="submit"
                  disabled={isLoading}
                  className="ml-2 px-4 py-2 bg-white text-[#0A0D14] hover:bg-[#F3F4F6] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs flex-shrink-0"
                >
                  {isLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-[#0A0D14] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Search size={13} />
                  )}
                  <span>Verify</span>
                </button>
              </div>

              <div className="mt-2 text-[11px] text-[#6B7280] flex items-center justify-between font-mono">
                <span>Anonymous · 10 verifications per hour per IP · cached forever</span>
              </div>
            </form>
          </div>

          {/* REAL links.et RECEIPT CARD (DISPLAYED ON VERIFIED RESPONSE) */}
          {isReceiptVisible && (
            <div className="max-w-2xl mx-auto bg-[#13161C] border border-[#222630] rounded-2xl p-5 sm:p-6 shadow-xl space-y-5 animate-in fade-in duration-300">
              {/* Receipt Header */}
              <div className="flex items-center justify-between border-b border-[#1E232E] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5 text-[#22C55E] font-bold text-sm">
                    <CheckCircle2 size={16} />
                    <span>Verified</span>
                  </div>
                  {SAMPLE_RECEIPT.isCached && (
                    <span className="px-2 py-0.5 rounded-full bg-[#1F242D] border border-[#2D3340] text-[10px] font-mono text-[#9CA3AF]">
                      cache hit
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setIsReceiptVisible(false);
                      setInputValue('');
                    }}
                    className="flex items-center gap-1 text-[11px] text-[#8B949E] hover:text-[#D1D5DB] px-2.5 py-1 rounded-md border border-[#242A36] bg-[#171B24] cursor-pointer"
                  >
                    <Trash2 size={11} />
                    <span>Invalidate</span>
                  </button>

                  <span className="px-3 py-1 rounded-md bg-[#86EFAC]/10 border border-[#86EFAC]/30 text-xs font-semibold text-[#86EFAC]">
                    {SAMPLE_RECEIPT.provider}
                  </span>
                </div>
              </div>

              {/* Receipt Details 3-Column Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] text-[#6B7280] uppercase tracking-wider block">Reference</span>
                    <strong className="text-sm font-mono text-white block mt-0.5">{SAMPLE_RECEIPT.reference}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6B7280] uppercase tracking-wider block">Payer</span>
                    <p className="text-xs text-white font-medium block mt-0.5">{SAMPLE_RECEIPT.payer}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] text-[#6B7280] uppercase tracking-wider block">Status</span>
                    <span className="text-sm font-semibold text-[#22C55E] block mt-0.5">{SAMPLE_RECEIPT.status}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6B7280] uppercase tracking-wider block">Credited</span>
                    <p className="text-xs text-white font-medium block mt-0.5">{SAMPLE_RECEIPT.credited}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] text-[#6B7280] uppercase tracking-wider block">Amount</span>
                    <strong className="text-sm font-bold text-white block mt-0.5">{SAMPLE_RECEIPT.amount}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6B7280] uppercase tracking-wider block">When</span>
                    <p className="text-xs font-mono text-[#D1D5DB] block mt-0.5">{SAMPLE_RECEIPT.when}</p>
                  </div>
                </div>
              </div>

              {/* Raw JSON Toggle */}
              <div className="pt-2 border-t border-[#1E232E] text-xs">
                <button
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="text-[11px] text-[#8B949E] hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <ChevronDown size={12} className={`transition-transform ${showRawJson ? 'rotate-180' : ''}`} />
                  <span>{showRawJson ? 'Hide raw JSON' : 'Show raw JSON'}</span>
                </button>

                {showRawJson && (
                  <pre className="mt-3 p-3 rounded-xl bg-[#0B0D10] border border-[#222730] text-[11px] font-mono text-[#86EFAC] overflow-x-auto">
                    {JSON.stringify(SAMPLE_RECEIPT.rawJson, null, 2)}
                  </pre>
                )}

                <div className="mt-3 flex items-center justify-between text-[11px] text-[#6B7280]">
                  <span>8 demo verifications left this hour</span>
                  <span className="text-[10px] text-[#86EFAC]">Upstream Verified ✓</span>
                </div>
              </div>
            </div>
          )}

          {/* Screenshot Upload Dropzone (from links.et homepage) */}
          <div className="max-w-2xl mx-auto pt-4">
            <div className="relative flex py-2 items-center">
              <div className="grow border-t border-[#1F242E]"></div>
              <span className="shrink mx-4 text-[10px] font-mono uppercase tracking-widest text-[#6B7280]">
                OR EXTRACT FROM A SCREENSHOT
              </span>
              <div className="grow border-t border-[#1F242E]"></div>
            </div>

            <div className="mt-3 border border-dashed border-[#2A313E] rounded-2xl p-6 text-center bg-[#0E1117]/50 hover:bg-[#0E1117] transition space-y-2">
              <div className="w-9 h-9 rounded-full bg-[#181D26] text-[#8B949E] flex items-center justify-center mx-auto">
                <UploadCloud size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Drop a receipt screenshot here</p>
                <p className="text-[11px] text-[#6B7280] mt-0.5">
                  or click to choose, or just paste with <span className="bg-[#1C212C] px-1 py-0.2 rounded font-mono text-zinc-300">Ctrl V</span>
                </p>
              </div>
              <p className="text-[10px] text-[#555E70]">
                Telebirr screenshots get the transaction number lifted out and cross-checked upstream.
              </p>
            </div>
          </div>

          {/* Supported Bank Badges */}
          <div className="pt-2 text-center space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#6B7280]">
              SUPPORTS
            </span>
            <div className="flex flex-wrap justify-center gap-1.5 max-w-2xl mx-auto">
              {BANK_BADGES.map((b) => (
                <span
                  key={b.name}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-semibold ${b.bg} ${b.text} ${b.border} border`}
                >
                  {b.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* SIMULATED NATURAL TESTER CURSOR */}
        <div
          className="absolute pointer-events-none transition-all duration-700 ease-out z-40"
          style={{
            left: `${cursorPos.x}%`,
            top: `${cursorPos.y}%`,
          }}
        >
          <MousePointer size={22} className="text-white fill-white -rotate-12 drop-shadow-lg" />
          <div className="bg-white text-[#0A0D14] text-[10px] font-bold px-2 py-0.5 rounded shadow whitespace-nowrap ml-3 -mt-2">
            Simulated Tester
          </div>
        </div>

        {/* SUBTLE OBSERVATION BAR AT BOTTOM OF WINDOW */}
        <div className="px-5 py-3 bg-[#0B0D10] border-t border-[#1F242E] flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-[#9CA3AF]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[#6B7280]">Observation:</span>
            <span className="text-white font-medium font-sans">{observation}</span>
          </div>

          <div className="text-[11px] text-[#6B7280]">
            Target: links.et
          </div>
        </div>
      </div>

      {/* PROBE OBSERVED: AGENTIC UI EXPRESSIVE GRAPHIC REPORT */}
      <div className="mt-12 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#525866]">
            Probe Observed
          </span>
          <span className="h-px bg-[#E5E7EB] flex-1" />
        </div>

        {/* Graphic Agentic Diagnostic Report Card */}
        <div className="bg-white border border-[#EAEAEA] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          {/* Top Line Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#F1F3F5]">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] text-xs font-semibold">
                  Zero Provider Friction
                </span>
                <span className="text-xs text-[#6B7280] font-mono">Session ID: PRB-LNK-882</span>
              </div>
              <h4 className="text-lg font-bold text-[#0A0D14] mt-1.5">
                Upstream provider auto-resolved from reference syntax without manual bank selection.
              </h4>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] font-mono text-[#868C98] uppercase block">Resolution Latency</span>
                <span className="text-sm font-bold font-mono text-[#0A0D14]">1.14s</span>
              </div>
              <div className="w-px h-8 bg-[#E5E7EB]" />
              <div className="text-right">
                <span className="text-[10px] font-mono text-[#868C98] uppercase block">Path Efficiency</span>
                <span className="text-sm font-bold font-mono text-[#10B981]">100% (1/1)</span>
              </div>
            </div>
          </div>

          {/* Expressive Graphic Flow Graph */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Step 1: Input Ingest */}
            <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#E5E7EB] space-y-2 relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[#868C98] uppercase">01 · INGEST</span>
                <Check size={13} className="text-[#10B981]" />
              </div>
              <div className="font-mono text-xs font-bold text-[#0A0D14]">DHV0BHI2GG</div>
              <p className="text-[11px] text-[#525866]">
                Direct reference input pasted into primary verification field.
              </p>
            </div>

            {/* Step 2: Format Parse */}
            <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#E5E7EB] space-y-2 relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[#868C98] uppercase">02 · SYNTAX MATCH</span>
                <Check size={13} className="text-[#10B981]" />
              </div>
              <div className="font-mono text-xs font-bold text-[#0A0D14]">10-char Alphanumeric</div>
              <p className="text-[11px] text-[#525866]">
                Identified as Telebirr standard payment transaction identifier.
              </p>
            </div>

            {/* Step 3: Provider Routing */}
            <div className="p-4 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] space-y-2 relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[#047857] uppercase">03 · AUTO ROUTING</span>
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              </div>
              <div className="font-semibold text-xs text-[#065F46]">Telebirr Upstream Gateway</div>
              <p className="text-[11px] text-[#047857]">
                Zero dropdown clicks: routed directly without provider ambiguity.
              </p>
            </div>

            {/* Step 4: Receipt Parsed */}
            <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#E5E7EB] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[#868C98] uppercase">04 · OUTCOME</span>
                <span className="text-[10px] font-mono font-semibold text-[#10B981]">200 OK</span>
              </div>
              <div className="font-semibold text-xs text-[#0A0D14]">71 ETB Verified</div>
              <p className="text-[11px] text-[#525866]">
                Payer and Credited entities verified and rendered in structured receipt.
              </p>
            </div>
          </div>

          {/* Concrete Finding & Recommendation */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <span className="font-bold text-[#0A0D14]">Concrete Usability Finding:</span>
              <p className="text-[#525866] leading-relaxed max-w-2xl">
                The product successfully avoids bank-selection dropdown friction by auto-detecting the Ethiopian payment provider (Telebirr) directly from the reference string pattern, resulting in a single-click verification loop.
              </p>
            </div>

            <div className="flex-shrink-0">
              <a
                href="https://links.et/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0A0D14] text-white hover:bg-[#202530] transition text-xs font-semibold"
              >
                <span>Verify Live on links.et</span>
                <ArrowRight size={12} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UserTesting;
