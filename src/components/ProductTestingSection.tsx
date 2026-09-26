import React, { useState, useEffect } from 'react';
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

export const ProductTestingSection: React.FC = () => {
  const [phase, setPhase] = useState<number>(5); // Default to verified state so user immediately sees actual product
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>('DHV0BHI2GG');
  const [isFocused, setIsFocused] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isReceiptVisible, setIsReceiptVisible] = useState<boolean>(true);
  const [showRawJson, setShowRawJson] = useState<boolean>(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 74, y: 35 });
  const [observation, setObservation] = useState<string>('Task completed · Real receipt verified');

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (isPlaying) {
      if (phase === 0) {
        setInputValue('');
        setIsFocused(false);
        setIsReceiptVisible(false);
        setIsLoading(false);
        setShowRawJson(false);
        setCursorPos({ x: 30, y: 15 });
        setObservation('User encounters links.et verification interface');

        timer = setTimeout(() => setPhase(1), 1600);
      } else if (phase === 1) {
        setCursorPos({ x: 38, y: 34 });
        setIsFocused(true);
        setObservation('User focused input field');

        timer = setTimeout(() => setPhase(2), 1800);
      } else if (phase === 2) {
        setInputValue('DHV0BHI2GG');
        setCursorPos({ x: 48, y: 34 });
        setObservation('User entered transaction reference: DHV0BHI2GG');

        timer = setTimeout(() => setPhase(3), 1600);
      } else if (phase === 3) {
        setCursorPos({ x: 74, y: 35 });
        setObservation('User submitted reference for verification');

        timer = setTimeout(() => {
          setIsLoading(true);
          setPhase(4);
        }, 1200);
      } else if (phase === 4) {
        setObservation('Querying upstream bank gateway...');

        timer = setTimeout(() => {
          setIsLoading(false);
          setIsReceiptVisible(true);
          setPhase(5);
          setIsPlaying(false);
        }, 1400);
      } else if (phase === 5) {
        setObservation('Task completed · Real receipt verified');
      }
    }

    return () => clearTimeout(timer);
  }, [isPlaying, phase]);

  const handleStartSimulation = () => {
    setPhase(0);
    setIsPlaying(true);
  };

  const handleManualVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setIsLoading(true);
    setIsReceiptVisible(false);
    setObservation('Querying upstream bank gateway...');

    setTimeout(() => {
      setIsLoading(false);
      setIsReceiptVisible(true);
      setPhase(5);
      setObservation('Task completed · Verified Telebirr receipt');
    }, 900);
  };

  return (
    <section id="section-testing" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#EAEAEA]">
      {/* Editorial Headline */}
      <div className="max-w-3xl mb-12 sm:mb-16">
        <span className="font-mono text-xs uppercase tracking-wider text-[#8C919D] block mb-3">
          Product Usability Engine
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0F1117] leading-[1.12]">
          Let someone try it before you do.
        </h2>
        <p className="mt-4 text-base sm:text-lg text-[#5B616E] leading-relaxed">
          Probe puts a real product through a real task and shows where the experience breaks down.
        </p>
      </div>

      {/* Replay Controls & Task Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        {/* Task Objective Badge */}
        <div className="flex items-center gap-2.5 text-xs">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span className="font-bold text-[#0F1117]">Task:</span>
          <span className="text-[#374151] font-mono bg-white px-2.5 py-1 rounded-md border border-[#E5E7EB] shadow-2xs">
            "Verify this payment." ENTER THIS <strong className="text-[#0F1117]">DHV0BHI2GG</strong>
          </span>
        </div>

        {/* Live Interaction Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={isPlaying ? () => setIsPlaying(false) : handleStartSimulation}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-[#0F1117] hover:bg-[#202530] text-white transition-all cursor-pointer shadow-xs"
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            <span>{isPlaying ? 'Pause Run' : 'Simulate User Run'}</span>
          </button>
          <button
            onClick={() => {
              setPhase(0);
              setIsPlaying(true);
            }}
            className="p-1.5 rounded-md border border-[#E5E7EB] hover:bg-[#F8FAFC] text-[#525866] transition cursor-pointer"
            title="Restart Session"
          >
            <RotateCcw size={13} />
          </button>
          <a
            href="https://links.et/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[#525866] hover:text-[#0F1117] transition ml-1 font-medium"
          >
            <span>Visit links.et</span>
            <ExternalLink size={11} className="opacity-70" />
          </a>
        </div>
      </div>

      {/* Authentic links.et Product Interface */}
      <div 
        className="relative bg-[#0B0D10] text-[#F3F4F6] border border-[#222730] rounded-xl overflow-hidden shadow-xl"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.08) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      >
        {/* Browser Frame Chrome */}
        <div className="h-9 px-4 bg-[#11141A] border-b border-[#222730] flex items-center justify-between text-xs text-[#9CA3AF]">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
            </div>
            <div className="bg-[#0B0D10] border border-[#222730] rounded px-2.5 py-0.5 text-[11px] font-mono text-[#D1D5DB] flex items-center gap-1.5">
              <span className="text-[#10B981]">🔒</span>
              <span>https://links.et</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-[#8B949E]">
            <span className="hidden sm:inline">Active Usability Session</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
          </div>
        </div>

        {/* links.et Header */}
        <header className="px-6 py-4 flex items-center justify-between border-b border-[#1A1E26]">
          <div className="flex items-center gap-6">
            <a href="https://links.et/" target="_blank" rel="noreferrer" className="flex items-center text-sm font-semibold tracking-tight text-white hover:opacity-90">
              <span>links</span>
              <span className="text-[#8B949E]">.et</span>
            </a>
            <nav className="hidden md:flex items-center gap-5 text-xs text-[#9CA3AF]">
              <span>Pricing</span>
              <span>Docs</span>
              <span>Dashboard</span>
              <span>Status</span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-[#151921] border border-[#242A36] rounded text-xs text-[#8B949E]">
              <Search size={12} />
              <span>Search</span>
              <span className="text-[10px] bg-[#222834] px-1 py-0.2 rounded font-mono text-[#9CA3AF]">Ctrl K</span>
            </div>
            <div className="p-1.5 rounded bg-[#151921] border border-[#242A36] text-[#9CA3AF] flex items-center justify-center">
              <Moon size={12} />
            </div>
          </div>
        </header>

        {/* links.et Canvas */}
        <div className="px-4 sm:px-8 py-10 max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2.5 max-w-2xl mx-auto">
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Verify any Ethiopian payment link.
            </h3>
            <p className="text-xs sm:text-sm text-[#9CA3AF] leading-relaxed">
              Paste a payment link, reference, or screenshot from any Ethiopian bank or wallet. We check it with the bank and show you the real receipt.
            </p>
          </div>

          {/* Verification Search Box */}
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
                  className="ml-2 px-4 py-2 bg-white text-[#0A0D14] hover:bg-[#F3F4F6] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0"
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

          {/* links.et Receipt Card */}
          {isReceiptVisible && (
            <div className="max-w-2xl mx-auto bg-[#13161C] border border-[#222630] rounded-xl p-5 sm:p-6 shadow-xl space-y-5 animate-in fade-in duration-300">
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
                    className="flex items-center gap-1 text-[11px] text-[#8B949E] hover:text-[#D1D5DB] px-2.5 py-1 rounded border border-[#242A36] bg-[#171B24] cursor-pointer"
                  >
                    <Trash2 size={11} />
                    <span>Invalidate</span>
                  </button>

                  <span className="px-3 py-1 rounded bg-[#86EFAC]/10 border border-[#86EFAC]/30 text-xs font-semibold text-[#86EFAC]">
                    {SAMPLE_RECEIPT.provider}
                  </span>
                </div>
              </div>

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

              <div className="pt-2 border-t border-[#1E232E] text-xs">
                <button
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="text-[11px] text-[#8B949E] hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <ChevronDown size={12} className={`transition-transform ${showRawJson ? 'rotate-180' : ''}`} />
                  <span>{showRawJson ? 'Hide raw JSON' : 'Show raw JSON'}</span>
                </button>

                {showRawJson && (
                  <pre className="mt-3 p-3 rounded-lg bg-[#0B0D10] border border-[#222730] text-[11px] font-mono text-[#86EFAC] overflow-x-auto">
                    {JSON.stringify(SAMPLE_RECEIPT.rawJson, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* Screenshot Upload Dropzone */}
          <div className="max-w-2xl mx-auto pt-2">
            <div className="relative flex py-2 items-center">
              <div className="grow border-t border-[#1F242E]"></div>
              <span className="shrink mx-4 text-[10px] font-mono uppercase tracking-widest text-[#6B7280]">
                OR EXTRACT FROM A SCREENSHOT
              </span>
              <div className="grow border-t border-[#1F242E]"></div>
            </div>

            <div className="mt-2 border border-dashed border-[#2A313E] rounded-xl p-5 text-center bg-[#0E1117]/50 space-y-1.5">
              <div className="w-8 h-8 rounded-full bg-[#181D26] text-[#8B949E] flex items-center justify-center mx-auto">
                <UploadCloud size={16} />
              </div>
              <p className="text-xs font-semibold text-white">Drop a receipt screenshot here</p>
              <p className="text-[10px] text-[#6B7280]">
                Telebirr screenshots get the transaction number lifted out and cross-checked upstream.
              </p>
            </div>
          </div>

          {/* Supported Bank Badges */}
          <div className="pt-2 text-center space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#6B7280]">
              SUPPORTS
            </span>
            <div className="flex flex-wrap justify-center gap-1 max-w-2xl mx-auto">
              {BANK_BADGES.map((b) => (
                <span
                  key={b.name}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium ${b.bg} ${b.text} ${b.border} border`}
                >
                  {b.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Real User Pointer Simulation */}
        <div
          className="absolute pointer-events-none transition-all duration-700 ease-out z-40"
          style={{
            left: `${cursorPos.x}%`,
            top: `${cursorPos.y}%`,
          }}
        >
          <MousePointer size={20} className="text-white fill-white -rotate-12 drop-shadow-md" />
          <div className="bg-white text-[#0A0D14] text-[10px] font-bold px-1.5 py-0.2 rounded shadow whitespace-nowrap ml-3 -mt-2">
            Tester
          </div>
        </div>

        {/* Probe Subtle Observation Layer */}
        <div className="px-5 py-3 bg-[#0B0D10] border-t border-[#1F242E] flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-[#9CA3AF]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[#6B7280]">Probe observed:</span>
            <span className="text-white font-medium font-sans">{observation}</span>
          </div>

          <span className="text-[11px] text-[#6B7280]">links.et · 1.14s latency</span>
        </div>
      </div>

      {/* Expressive Graphic Diagnostic Report */}
      <div className="mt-8 bg-white border border-[#E5E7EB] rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F0F0EE]">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-[#8C919D] block mb-1">
              Probe Finding
            </span>
            <h4 className="text-base sm:text-lg font-bold text-[#0F1117]">
              Zero Provider Friction · Direct Token Resolution
            </h4>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-[#8C919D] block text-[10px]">EFFICIENCY</span>
              <span className="font-semibold text-[#059669]">100% Single-Path</span>
            </div>
            <div className="w-px h-6 bg-[#EAEAEA]" />
            <div>
              <span className="text-[#8C919D] block text-[10px]">RESOLVED IN</span>
              <span className="font-semibold text-[#0F1117]">1.14s</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-lg bg-[#FAFAFA] border border-[#EAEAEA] space-y-1">
            <span className="font-mono text-[10px] text-[#8C919D]">01 · INPUT</span>
            <div className="font-mono font-bold text-[#0F1117]">DHV0BHI2GG</div>
            <p className="text-[11px] text-[#5B616E]">Pasted reference code into primary field.</p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#FAFAFA] border border-[#EAEAEA] space-y-1">
            <span className="font-mono text-[10px] text-[#8C919D]">02 · PARSE</span>
            <div className="font-semibold text-[#0F1117]">Alphanumeric 10-char</div>
            <p className="text-[11px] text-[#5B616E]">Deterministically matched Telebirr format.</p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#FAFAFA] border border-[#EAEAEA] space-y-1">
            <span className="font-mono text-[10px] text-[#8C919D]">03 · ROUTING</span>
            <div className="font-semibold text-[#059669]">Auto Telebirr Gateway</div>
            <p className="text-[11px] text-[#5B616E]">Bypassed manual bank selector dropdown.</p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#FAFAFA] border border-[#EAEAEA] space-y-1">
            <span className="font-mono text-[10px] text-[#8C919D]">04 · OUTCOME</span>
            <div className="font-semibold text-[#0F1117]">71 ETB Verified</div>
            <p className="text-[11px] text-[#5B616E]">Ledger confirmation rendered with legal names.</p>
          </div>
        </div>

        <p className="text-xs text-[#5B616E] leading-relaxed">
          <strong className="text-[#0F1117]">Usability Conclusion:</strong> The user experienced zero ambiguous routing. Because links.et automatically identifies Telebirr references from token syntax, the interaction took only 1 step instead of requiring bank selection, matching the &lt;4.8s retail checkout threshold.
        </p>
      </div>
    </section>
  );
};
