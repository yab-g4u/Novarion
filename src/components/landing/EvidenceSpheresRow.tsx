import React, { useState } from 'react';
import { Play, Pause, ExternalLink, Sparkles, Volume2, CheckCircle2 } from 'lucide-react';

interface SphereSignal {
  id: string;
  number: string;
  source: string;
  gradientClass: string;
  title: string;
  sampleQuote: string;
  sourceDetail: string;
  metric: string;
  audioSimText: string;
}

const SIGNALS: SphereSignal[] = [
  {
    id: 'signal-discourse',
    number: '01',
    source: 'Practitioner Discourse',
    gradientClass: 'evidence-sphere-gradient',
    title: 'Adversarial Operator Threads',
    sampleQuote: '“We tried three AI tools for this. Abandoned all of them because none preserved custom metadata on export.”',
    sourceDetail: 'r/SaaS, Hacker News & X Engineering Founders',
    metric: '2,480 verified threads indexed',
    audioSimText: 'Synthesizing 248 developer threads: High initial enthusiasm; critical retention drop-off at data export.'
  },
  {
    id: 'signal-scholarxiv',
    number: '02',
    source: 'ScholarXIV Literature',
    gradientClass: 'evidence-sphere-gradient-alt',
    title: 'Peer-Reviewed Benchmarks',
    sampleQuote: '“Controlled trial (N=420): Task completion dropped 67% when autonomous agents failed to provide step-by-step confirmation.”',
    sourceDetail: 'ScholarXIV & arXiv Human-Computer Interaction Lab',
    metric: '94% empirical confidence benchmark',
    audioSimText: 'Academic consensus: Users demand transparent review steps before granting background autonomy.'
  },
  {
    id: 'signal-telemetry',
    number: '03',
    source: 'UX Drop-Off Telemetry',
    gradientClass: 'evidence-sphere-gradient',
    title: 'Real-World Friction Telemetry',
    sampleQuote: '“Telemetry scan: 71% of test users paused on the pricing page looking for compliance certifications.”',
    sourceDetail: 'Probe Simulated Browser Engine & Journey Scans',
    metric: 'Actionable 48-hour experiment designed',
    audioSimText: 'Telemetry finding: Enterprise conversion blocked by missing SOC-2 self-serve documentation.'
  }
];

export const EvidenceSpheresRow: React.FC = () => {
  const [activeSphereId, setActiveSphereId] = useState<string | null>(null);

  const togglePlay = (id: string) => {
    setActiveSphereId((prev) => (prev === id ? null : id));
  };

  return (
    <section id="evidence-spheres" className="w-full bg-[#fdfcfc] py-20 sm:py-28 border-b border-[#ebe8e4]">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-12 lg:px-16">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pb-14 border-b border-[#ebe8e4]">
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-[#777169] uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#ff4704]" />
              <span>Multimodal Signal Collection</span>
            </div>
            <h2 className="headline-heading text-[#000000]">
              Signature Evidence Spheres
            </h2>
            <p className="text-base text-[#777169] font-['Inter',sans-serif] leading-relaxed">
              Probe extracts signals across practitioner discussions, peer-reviewed literature, and automated UX telemetry — distilling raw web noise into grounded reality checks.
            </p>
          </div>

          <div className="text-xs font-mono text-[#a59f97] text-left md:text-right">
            <span>Violet Spark #0447ff · Ember Orange #ff4704</span>
            <p className="text-[#777169]">Audio brief synthesis engine active</p>
          </div>
        </div>

        {/* 3-Column Audio Sphere Row (Signature visual from design.md) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 pt-14">
          {SIGNALS.map((signal) => {
            const isPlaying = activeSphereId === signal.id;

            return (
              <div
                key={signal.id}
                className="card-taupe flex flex-col items-center text-center group transition-all duration-300 hover:shadow-subtle"
              >
                {/* Sphere Visual: 200px+ Circle with soft radial violet/orange gradient */}
                <div className="relative w-48 h-48 sm:w-52 sm:h-52 mb-6 flex items-center justify-center">
                  
                  {/* Glowing Radial Sphere with soft edges */}
                  <div
                    className={`w-full h-full rounded-full transition-transform duration-500 group-hover:scale-105 ${signal.gradientClass} shadow-subtle`}
                    style={{
                      boxShadow: '0 12px 36px rgba(4, 71, 255, 0.15), 0 8px 24px rgba(255, 71, 4, 0.12)'
                    }}
                  />

                  {/* Centered White Play/Inspect Button (48px diameter with whisper shadow) */}
                  <button
                    type="button"
                    onClick={() => togglePlay(signal.id)}
                    className="absolute w-12 h-12 rounded-full bg-[#fdfcfc] hover:bg-[#ffffff] text-[#000000] flex items-center justify-center shadow-subtle cursor-pointer transition-transform hover:scale-110 active:scale-95"
                    aria-label={`Inspect ${signal.title}`}
                  >
                    {isPlaying ? (
                      <Pause size={16} className="fill-current text-[#000000]" />
                    ) : (
                      <Play size={16} className="fill-current text-[#000000] ml-0.5" />
                    )}
                  </button>

                  {/* Signal Number Tag in pill */}
                  <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-[#fdfcfc]/90 text-[10px] font-mono text-[#000000] shadow-subtle-2">
                    Signal {signal.number}
                  </span>
                </div>

                {/* Signal Meta */}
                <span className="text-xs font-mono text-[#777169] uppercase tracking-wider mb-1">
                  {signal.source}
                </span>

                <h3 className="text-xl font-whisper text-[#000000] mb-3">
                  {signal.title}
                </h3>

                {/* Excerpt in quote format */}
                <p className="text-sm text-[#44403b] italic leading-relaxed mb-4 px-2 font-['Inter',sans-serif]">
                  {signal.sampleQuote}
                </p>

                {/* Metric pill */}
                <div className="mt-auto pt-4 border-t border-[#ebe8e4] w-full flex items-center justify-between text-xs font-mono text-[#777169]">
                  <span className="truncate pr-2">{signal.sourceDetail}</span>
                  <span className="text-[#000000] font-semibold shrink-0">
                    {signal.metric}
                  </span>
                </div>

                {/* Audio briefing readout if active */}
                {isPlaying && (
                  <div className="mt-4 p-3 rounded-[16px] bg-[#fdfcfc] border border-[#ebe8e4] text-xs text-left w-full space-y-1.5 animate-in fade-in duration-200">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#0447ff]">
                      <Volume2 size={13} className="animate-pulse" />
                      <span>Synthesized Signal Brief:</span>
                    </div>
                    <p className="text-[#44403b] text-xs leading-normal">
                      {signal.audioSimText}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
