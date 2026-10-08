import React from 'react';

export const BauhausTestimonials: React.FC = () => {
  const testimonials = [
    {
      quote: '“Probe saved our team 4 months of building an enterprise feature our buyers would never have adopted. The contradiction engine found the exact regulatory hurdle in 30 seconds.”',
      author: 'Sarah Lin',
      role: 'Founder & CEO, Synthra (YC W24)',
      metric: 'Saved 16 engineering weeks'
    },
    {
      quote: '“Instead of pitching investors with optimistic slides, we walked in with a Probe live evidence topology showing 18 grounded academic citations and real practitioner quotes.”',
      author: 'Marcus Vance',
      role: 'Co-founder, LatticeGraph',
      metric: 'Raised $2.4M Seed'
    },
    {
      quote: '“The real-world UX testing surfaced three friction points on our onboarding flow that were causing 60% of test users to bounce before reaching our core feature.”',
      author: 'Elena Rostova',
      role: 'Head of Product, Kinetix AI',
      metric: '32% lift in onboarding completion'
    }
  ];

  return (
    <section id="testimonials" className="w-full bg-[#fdfcfc] py-20 sm:py-28 border-b border-[#ebe8e4]">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-12 lg:px-16">
        
        {/* Section Header */}
        <div className="max-w-2xl space-y-3 mb-14">
          <div className="flex items-center gap-2 text-xs font-mono text-[#777169] uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#000000]" />
            <span>Practitioner Field Notes</span>
          </div>
          <h2 className="headline-heading text-[#000000]">
            From founders who probed before building
          </h2>
        </div>

        {/* 3 Editorial Quote Blocks with Hairline Dividers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="p-8 rounded-[20px] bg-[#f5f3f1] border border-[#ebe8e4] flex flex-col justify-between space-y-6"
            >
              <p className="text-base sm:text-[17px] font-whisper text-[#000000] leading-relaxed">
                {t.quote}
              </p>

              <div className="pt-4 border-t border-[#ebe8e4] space-y-1">
                <div className="font-['Inter',sans-serif] font-semibold text-sm text-[#000000]">
                  {t.author}
                </div>
                <div className="text-xs text-[#777169]">
                  {t.role}
                </div>
                <div className="text-[11px] font-mono text-[#000000] pt-1">
                  {t.metric}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
