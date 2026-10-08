import React from 'react';
import { ArrowRight } from 'lucide-react';

export const TrustLogoGrid: React.FC = () => {
  const partners = [
    { name: 'NVIDIA', note: 'Inception Program' },
    { name: 'Stanford HCI', note: 'Empirical Labs' },
    { name: 'Y Combinator', note: 'Batch Founders' },
    { name: 'Twilio', note: 'Signal Infrastructure' },
    { name: 'Hacker News', note: 'Operator Discourse' },
    { name: 'arXiv / ScholarXIV', note: 'Peer-Reviewed Benchmarks' },
  ];

  return (
    <section className="w-full bg-[#fdfcfc] border-y border-[#ebe8e4] py-16 sm:py-20">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-12 lg:px-16">
        
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-10">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-[#a59f97]">
              Adversarial Validation Network
            </p>
            <h2 className="text-xl sm:text-2xl font-whisper text-[#000000] mt-1">
              Trusted by high-conviction founders &amp; product researchers
            </h2>
          </div>

          <button
            type="button"
            className="btn-pill-outline text-xs px-4 py-2 cursor-pointer shrink-0"
            onClick={() => {
              const el = document.getElementById('testimonials');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <span>Read founder case studies</span>
            <ArrowRight size={12} />
          </button>
        </div>

        {/* 6-Column Grayscale Partner Grid on Eggshell Canvas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8 items-center pt-4">
          {partners.map((partner) => (
            <div
              key={partner.name}
              className="flex flex-col items-center justify-center p-4 text-center group transition-opacity hover:opacity-100 opacity-70"
            >
              <span className="font-['Inter',sans-serif] font-semibold text-base sm:text-lg tracking-tight text-[#44403b] group-hover:text-[#000000] transition-colors">
                {partner.name}
              </span>
              <span className="text-[11px] font-mono text-[#a59f97] mt-0.5">
                {partner.note}
              </span>
            </div>
          ))}
        </div>

        {/* Micro statistics row with hairline divider */}
        <div className="mt-12 pt-8 border-t border-[#ebe8e4] grid grid-cols-2 md:grid-cols-4 gap-6 text-center sm:text-left">
          <div>
            <span className="text-2xl sm:text-3xl font-whisper text-[#000000]">84%</span>
            <p className="text-xs text-[#777169] mt-0.5">Assumptions proven invalid before code</p>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-whisper text-[#000000]">30s</span>
            <p className="text-xs text-[#777169] mt-0.5">Average contradiction discovery time</p>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-whisper text-[#000000]">12,400+</span>
            <p className="text-xs text-[#777169] mt-0.5">Practitioner threads indexed</p>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-whisper text-[#000000]">4.8×</span>
            <p className="text-xs text-[#777169] mt-0.5">Reduction in post-launch pivots</p>
          </div>
        </div>

      </div>
    </section>
  );
};
