import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Custom modern, stroke-based SVG logo: a ring with a small inner dot and a short diagonal handle (probe/lens mark)
const ProbeLogoSvg: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} stroke-current`}
    aria-hidden="true"
  >
    <circle cx="10.5" cy="10.5" r="7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="10.5" cy="10.5" r="2" fill="currentColor" stroke="none" />
    <path d="M15.5 15.5L20.5 20.5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// FadeInUp scroll-reveal component: slides elements up from translate-y-10 and opacity-0 to opacity-100 over 1000ms
const FadeInUp: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
}> = ({ children, className = '', delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    if (domRef.current) {
      observer.observe(domRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={domRef}
      style={{
        transitionDuration: '1000ms',
        transitionDelay: `${delay}ms`,
      }}
      className={`transition-all ease-out transform ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  // Navigation scroll state
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // FAQ accordion state: 5 items
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleGetStarted = () => {
    navigate('/app');
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Marquee evidence sources (5 sources duplicated 4 times)
  const evidenceSources = [
    {
      name: 'Community threads',
      icon: (
        <svg className="w-4 h-4 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <path d="M8 10h.01" />
          <path d="M12 10h.01" />
          <path d="M16 10h.01" />
        </svg>
      )
    },
    {
      name: 'Social posts',
      icon: (
        <svg className="w-4 h-4 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
        </svg>
      )
    },
    {
      name: 'Professional networks',
      icon: (
        <svg className="w-4 h-4 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      )
    },
    {
      name: 'Web sources',
      icon: (
        <svg className="w-4 h-4 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      )
    },
    {
      name: 'Academic papers',
      icon: (
        <svg className="w-4 h-4 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
      )
    }
  ];

  // Quadruple for infinite seamless marquee loop
  const marqueeItems = [...evidenceSources, ...evidenceSources, ...evidenceSources, ...evidenceSources];

  // FAQ Data (5 exact items)
  const faqItems = [
    {
      question: 'Is my idea kept private?',
      answer: 'Yes, Probe is private by default. Your research, ideas, assumptions, and uploaded documents remain private to your workspace session. Sharing an evidence dossier via read-only link is strictly opt-in and requires your explicit action.'
    },
    {
      question: 'Where does the evidence come from?',
      answer: 'Probe retrieves real evidence from public community discussions (Reddit, forums), social posts, professional networks, web documentation, direct competitor teardowns, and peer-reviewed academic papers via ScholarXIV. Every single finding links directly back to its original source.'
    },
    {
      question: 'How does Probe decide what supports or challenges my idea?',
      answer: 'Probe breaks down your idea into foundational assumptions (problem severity, user behavior, willingness to pay, competitor switching inertia). Empirical signals are evaluated against these confirmed hypotheses with a clear, verifiable explanation, and you can reclassify or add evidence anytime.'
    },
    {
      question: 'Does Probe replace talking to customers?',
      answer: 'No. Probe tells you which high-stakes conversations to have and what to test before you waste development hours. It reveals what people are already complaining about with existing solutions, and your own customer interview notes count directly as empirical evidence.'
    },
    {
      question: 'What do I get at the end?',
      answer: 'You get a clear, grounded picture of supported, challenged, and unknown claims, a prioritized validation experiment test plan, and an evidence-backed build brief (PROBE.md) ready for your engineering and design workflow.'
    }
  ];

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-white text-gray-950 font-['Inter',-apple-system,BlinkMacSystemFont,'Segoe_UI',sans-serif] selection:bg-gray-900 selection:text-white">
      {/* 1. NAVIGATION BAR (Sticky & Responsive) */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/80 backdrop-blur-md border-b border-black/5 py-4 shadow-xs'
            : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo + Brand Wordmark */}
          <button
            type="button"
            onClick={() => scrollToSection('about')}
            className="flex items-center gap-2.5 text-gray-950 hover:opacity-85 transition-opacity cursor-pointer group"
          >
            <div className="text-gray-950 group-hover:scale-105 transition-transform">
              <ProbeLogoSvg className="w-6 h-6" />
            </div>
            <span className="font-bold tracking-tight text-lg text-gray-950 font-['Geist',sans-serif]">
              Probe
            </span>
          </button>

          {/* Desktop Center Links */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              type="button"
              onClick={() => scrollToSection('about')}
              className="text-sm font-medium text-gray-600 hover:text-black transition-colors cursor-pointer"
            >
              About
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('features')}
              className="text-sm font-medium text-gray-600 hover:text-black transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('faq')}
              className="text-sm font-medium text-gray-600 hover:text-black transition-colors cursor-pointer"
            >
              FAQ
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('contact')}
              className="text-sm font-medium text-gray-600 hover:text-black transition-colors cursor-pointer"
            >
              Contact
            </button>
          </nav>

          {/* Right Action Button */}
          <div className="hidden md:flex items-center">
            <button
              type="button"
              onClick={handleGetStarted}
              className="bg-[#F1F1F4] hover:bg-[#E7E7EC] text-gray-900 text-sm font-medium px-5 py-2.5 rounded-full border border-black/5 transition-all shadow-2xs hover:shadow-xs cursor-pointer"
            >
              Get started
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-black focus:outline-none"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-b border-black/5 px-6 py-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <button
              type="button"
              onClick={() => scrollToSection('about')}
              className="block w-full text-left text-base font-medium text-gray-700 hover:text-black py-2"
            >
              About
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('features')}
              className="block w-full text-left text-base font-medium text-gray-700 hover:text-black py-2"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('faq')}
              className="block w-full text-left text-base font-medium text-gray-700 hover:text-black py-2"
            >
              FAQ
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('contact')}
              className="block w-full text-left text-base font-medium text-gray-700 hover:text-black py-2"
            >
              Contact
            </button>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleGetStarted}
                className="w-full bg-[#F1F1F4] hover:bg-[#E7E7EC] text-gray-900 text-sm font-medium py-3 rounded-full border border-black/5 text-center shadow-2xs"
              >
                Get started
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION (id="about") */}
      <section id="about" className="min-h-screen flex flex-col items-center justify-center pt-32 pb-20 relative z-0 overflow-hidden">
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
          className="absolute inset-0 -z-10 object-cover min-w-full min-h-full opacity-50"
          src="https://cdn.sceneai.art/Hero%20Section%20Video/50b4f304-cdca-4e12-8735-580d225834be.mp4"
        />
        {/* White Gradient Overlay */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/70 via-white/30 to-white" aria-hidden="true" />

        <div className="max-w-4xl mx-auto px-6 flex flex-col items-center text-center">
          {/* Top Badge */}
          <FadeInUp delay={100}>
            <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-black/5 border border-black/10 text-xs font-medium text-gray-700 mb-8 backdrop-blur-sm shadow-2xs">
              <span>✨ Evidence-driven product discovery</span>
            </div>
          </FadeInUp>

          {/* Headline */}
          <FadeInUp delay={200}>
            <h1 className="text-5xl md:text-7xl font-medium tracking-tight mb-6 text-gray-950 font-['Geist',sans-serif] leading-[1.1]">
              Before you vibe code it, <br />
              <span className="font-serif italic font-normal">Probe it.</span>
            </h1>
          </FadeInUp>

          {/* Sub-text: exactly text-[16px] */}
          <FadeInUp delay={300}>
            <p className="text-[16px] text-gray-600 max-w-2xl text-center leading-relaxed mb-10">
              Probe researches real conversations, competitors, and papers, then shows what supports your idea, what challenges it, and what you still don't know.
            </p>
          </FadeInUp>

          {/* Buttons: Flex row */}
          <FadeInUp delay={400}>
            <div className="flex flex-row items-center gap-4">
              <button
                type="button"
                onClick={handleGetStarted}
                className="bg-black hover:bg-gray-800 text-white font-medium text-sm px-6 py-3 rounded-full transition-all shadow-xs hover:shadow-sm cursor-pointer"
              >
                Get started
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('features')}
                className="bg-[#F1F1F4] hover:bg-[#E7E7EC] text-gray-900 font-medium text-sm px-6 py-3 rounded-full border border-black/5 transition-all shadow-2xs cursor-pointer"
              >
                Learn more
              </button>
            </div>
          </FadeInUp>
        </div>

        {/* Marquee Section ("Probe researches real evidence from") */}
        <div className="w-full mt-24">
          <FadeInUp delay={500}>
            <p className="text-sm text-gray-500 font-medium mb-8 text-center">
              Probe researches real evidence from
            </p>
          </FadeInUp>

          {/* Marquee container with mask-image gradient fade */}
          <div
            className="w-full overflow-hidden"
            style={{
              maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
            }}
          >
            <div className="flex w-max animate-[marquee_30s_linear_infinite]">
              {marqueeItems.map((item, idx) => (
                <div
                  key={`marquee-${item.name}-${idx}`}
                  className="flex-shrink-0 px-8 flex items-center gap-2.5 text-gray-500 font-medium text-sm select-none"
                >
                  <span className="text-gray-400">{item.icon}</span>
                  <span className="whitespace-nowrap">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURE 1: EVIDENCE GRAPH (id="features") */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto border-t border-black/5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Text */}
          <FadeInUp delay={100}>
            <div>
              <div className="inline-flex items-center gap-1.5 text-amber-600 font-medium text-xs mb-3">
                <span>✨ Evidence Graph</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-semibold text-gray-950 tracking-tight leading-tight mb-6 font-['Geist',sans-serif]">
                Where evidence meets your assumptions.
              </h2>
              <p className="text-gray-600 text-base leading-relaxed mb-8">
                Describe your idea and Probe turns it into the assumptions that must be true, then sorts real evidence into what supports them, what challenges them, and what is still unknown. Every claim links back to its source.
              </p>
              <button
                type="button"
                onClick={handleGetStarted}
                className="bg-black hover:bg-gray-800 text-white font-medium text-sm px-6 py-3 rounded-full transition-all shadow-xs cursor-pointer"
              >
                Get started
              </button>
            </div>
          </FadeInUp>

          {/* Right Mockup */}
          <FadeInUp delay={200}>
            <div className="rounded-3xl overflow-hidden p-6 sm:p-8 border border-black/10 relative shadow-sm min-h-[460px] flex items-center justify-center">
              {/* Background Video */}
              <video
                autoPlay
                loop
                muted
                playsInline
                aria-hidden="true"
                className="absolute inset-0 object-cover w-full h-full -z-10"
                src="https://cdn.sceneai.art/Hero%20Section%20Video/1bcc8fa3-37f6-4c53-8591-0347e4c7f8ac.mp4"
              />
              <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] -z-10" aria-hidden="true" />

              {/* Floating UI Element Card */}
              <div className="w-full max-w-md bg-white/90 backdrop-blur-xl border border-black/10 rounded-2xl p-5 sm:p-6 shadow-xl relative z-10 text-xs">
                {/* Top Chips */}
                <div className="flex flex-wrap items-center gap-1.5 mb-5">
                  <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-medium text-[11px] border border-black/5">
                    Find problems
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-medium text-[11px] border border-black/5">
                    Challenge this
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-medium text-[11px] border border-black/5">
                    Competitors
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-medium text-[11px] border border-black/5">
                    Plan a test
                  </span>
                </div>

                {/* Middle Claim */}
                <div className="p-3.5 rounded-xl bg-gray-50/90 border border-black/5 mb-4">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-semibold block mb-1">
                    Extracted Assumption
                  </span>
                  <p className="text-gray-900 font-medium text-sm leading-snug">
                    "Freelancers lose hours every week chasing invoices."
                  </p>
                </div>

                {/* Segmented Balance Bar */}
                <div className="space-y-2 mb-4">
                  <div className="h-2 w-full rounded-full bg-gray-100 flex overflow-hidden">
                    {/* Teal = Supports */}
                    <div className="h-full bg-teal-500 w-[55%]" title="Supports (55%)" />
                    {/* Orange = Challenges */}
                    <div className="h-full bg-orange-500 w-[27%]" title="Challenges (27%)" />
                    {/* Violet = Unknown */}
                    <div className="h-full bg-violet-500 w-[18%]" title="Unknown (18%)" />
                  </div>

                  {/* Chips (Each with icon + text, never colour alone) */}
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-teal-50 text-teal-700 border border-teal-200 text-[11px] font-medium">
                      <svg className="w-3 h-3 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>+ 6 supports</span>
                    </span>

                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-orange-50 text-orange-700 border border-orange-200 text-[11px] font-medium">
                      <svg className="w-3 h-3 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                      <span>! 3 challenges</span>
                    </span>

                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-violet-50 text-violet-700 border border-violet-200 text-[11px] font-medium">
                      <svg className="w-3 h-3 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                      <span>? 2 unknown</span>
                    </span>
                  </div>
                </div>

                {/* Bottom Input with Mic & Soundwave */}
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-black/10 bg-white shadow-2xs">
                  <span className="text-gray-400 text-xs">Describe your idea...</span>
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <button type="button" className="p-1 hover:text-black transition-colors" aria-label="Microphone">
                      <svg className="w-3.5 h-3.5 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="22" />
                      </svg>
                    </button>
                    <button type="button" className="p-1 hover:text-black transition-colors" aria-label="Soundwave">
                      <svg className="w-3.5 h-3.5 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="4" y1="10" x2="4" y2="14" />
                        <line x1="8" y1="6" x2="8" y2="18" />
                        <line x1="12" y1="3" x2="12" y2="21" />
                        <line x1="16" y1="8" x2="16" y2="16" />
                        <line x1="20" y1="11" x2="20" y2="13" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* 4. FEATURE 2: PRODUCT TESTING */}
      <section className="py-24 px-6 max-w-7xl mx-auto border-t border-black/5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Mockup */}
          <FadeInUp delay={100} className="order-2 lg:order-1">
            <div className="rounded-3xl overflow-hidden p-6 sm:p-8 border border-black/10 relative shadow-sm min-h-[460px] flex items-center justify-center">
              {/* Background Video */}
              <video
                autoPlay
                loop
                muted
                playsInline
                aria-hidden="true"
                className="absolute inset-0 object-cover w-full h-full -z-10"
                src="https://cdn.sceneai.art/Hero%20Section%20Video/736fd4a0-70ac-4f44-9633-55769ead6aca.mp4"
              />
              <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] -z-10" aria-hidden="true" />

              {/* Floating UI Element Card */}
              <div className="w-full max-w-md bg-white/90 backdrop-blur-xl border border-black/10 rounded-2xl p-5 sm:p-6 shadow-xl relative z-10 text-xs">
                {/* Agent Header with Play button, time, and visual waveform */}
                <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-black/5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center">
                      <svg className="w-3 h-3 fill-current ml-0.5" viewBox="0 0 24 24">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-950 text-xs block">
                        11:06 AM – Test agent
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        Playwright Session Active
                      </span>
                    </div>
                  </div>

                  {/* Visual Waveform */}
                  <div className="flex items-center gap-1 h-5 px-2 py-1 rounded bg-gray-100/80">
                    <span className="w-0.5 h-2 bg-gray-500 rounded-full animate-pulse" />
                    <span className="w-0.5 h-4 bg-gray-900 rounded-full animate-pulse" />
                    <span className="w-0.5 h-3 bg-gray-600 rounded-full animate-pulse" />
                    <span className="w-0.5 h-5 bg-gray-900 rounded-full animate-pulse" />
                    <span className="w-0.5 h-2 bg-gray-400 rounded-full animate-pulse" />
                  </div>
                </div>

                {/* Timestamped Friction Notes */}
                <div className="space-y-2.5 mb-5">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-gray-50/80 border border-black/5">
                    <span className="font-mono text-[10px] font-bold text-gray-500 mt-0.5">
                      0:08
                    </span>
                    <p className="text-gray-800 text-[11px] leading-snug">
                      Clicked "Start free". The form asked for 9 fields.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-gray-50/80 border border-black/5">
                    <span className="font-mono text-[10px] font-bold text-gray-500 mt-0.5">
                      0:21
                    </span>
                    <p className="text-gray-800 text-[11px] leading-snug">
                      Waited 4 seconds for the dashboard to load.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-gray-50/80 border border-black/5">
                    <span className="font-mono text-[10px] font-bold text-gray-500 mt-0.5">
                      0:34
                    </span>
                    <p className="text-gray-800 text-[11px] leading-snug">
                      Landed on an empty page with no first step suggested.
                    </p>
                  </div>
                </div>

                {/* Ending Chip: ! Challenges: onboarding feels heavy */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold">
                  <svg className="w-3.5 h-3.5 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <span>! Challenges: onboarding feels heavy</span>
                </div>
              </div>
            </div>
          </FadeInUp>

          {/* Right Text */}
          <FadeInUp delay={200} className="order-1 lg:order-2">
            <div>
              <div className="inline-flex items-center gap-1.5 text-emerald-600 font-medium text-xs mb-3">
                <span>✨ Product testing</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-semibold text-gray-950 tracking-tight leading-tight mb-6 font-['Geist',sans-serif]">
                See where people get stuck, before you build more.
              </h2>
              <p className="text-gray-600 text-base leading-relaxed mb-8">
                Probe can walk through a real product, flag friction with a replay, and turn every unanswered question into a validation experiment. Results flow back into your evidence, so the picture updates as you learn.
              </p>
              <button
                type="button"
                onClick={handleGetStarted}
                className="bg-black hover:bg-gray-800 text-white font-medium text-sm px-6 py-3 rounded-full transition-all shadow-xs cursor-pointer"
              >
                Get started
              </button>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* 5. FAQ SECTION (id="faq") */}
      <section id="faq" className="py-32 px-6 max-w-3xl mx-auto border-t border-black/5">
        <FadeInUp delay={100}>
          <h2 className="text-4xl md:text-5xl font-semibold text-center mb-12 text-gray-950 font-['Geist',sans-serif] tracking-tight">
            We've got answers
          </h2>
        </FadeInUp>

        {/* Main wrapper: completely transparent with visible border: border border-black/10 rounded-xl bg-transparent */}
        <FadeInUp delay={200}>
          <div className="border border-black/10 rounded-xl bg-transparent overflow-hidden">
            {faqItems.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              const isLast = idx === faqItems.length - 1;

              return (
                <div
                  key={`faq-${idx}`}
                  className={`${!isLast ? 'border-b border-black/10' : ''}`}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between py-6 px-6 text-left cursor-pointer group transition-colors hover:bg-black/[0.02]"
                    aria-expanded={isOpen}
                  >
                    <span className="text-base text-gray-950 font-medium pr-4 leading-snug">
                      {item.question}
                    </span>
                    {/* Plus (+) that rotates perfectly into an (x) when opened */}
                    <span
                      className={`text-xl font-light text-gray-500 transition-transform duration-300 flex-shrink-0 ${
                        isOpen ? 'rotate-45 text-gray-900' : 'rotate-0'
                      }`}
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </button>

                  {/* Answer body using CSS grid trick (grid-template-rows: 0fr to 1fr) */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateRows: isOpen ? '1fr' : '0fr',
                      transition: 'grid-template-rows 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    <div className="overflow-hidden">
                      <p className="text-gray-600 text-sm pb-6 px-6 leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </FadeInUp>
      </section>

      {/* 6. FOOTER SECTION (id="contact") */}
      <footer id="contact" className="relative z-0 pt-32 pb-10 px-6 border-t border-black/5 overflow-hidden">
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
          className="absolute inset-0 object-cover w-full h-full opacity-40 -z-10"
          src="https://cdn.sceneai.art/Hero%20Section%20Video/50b4f304-cdca-4e12-8735-580d225834be.mp4"
        />
        {/* Strong White Overlay so links remain completely legible */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/70 to-white -z-10" aria-hidden="true" />

        <div className="max-w-7xl mx-auto">
          {/* Top CTA */}
          <FadeInUp delay={100}>
            <div className="text-center mb-32">
              <h2 className="text-4xl md:text-6xl font-medium tracking-tight mb-8 text-gray-950 font-['Geist',sans-serif]">
                Ready to probe your <span className="font-serif italic font-normal">idea?</span>
              </h2>

              <div className="flex flex-row justify-center items-center gap-4">
                <button
                  type="button"
                  onClick={handleGetStarted}
                  className="bg-black hover:bg-gray-800 text-white font-medium text-sm px-6 py-3 rounded-full transition-all shadow-xs cursor-pointer"
                >
                  Get started
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('features')}
                  className="bg-[#F1F1F4] hover:bg-[#E7E7EC] text-gray-900 font-medium text-sm px-6 py-3 rounded-full border border-black/5 transition-all shadow-2xs cursor-pointer"
                >
                  Learn more
                </button>
              </div>
            </div>
          </FadeInUp>

          {/* Link Grid: 4 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-24 text-sm">
            {/* Col 1: Logo + Title */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ProbeLogoSvg className="w-5 h-5 text-gray-950" />
                <span className="font-bold text-xl text-gray-950 font-['Geist',sans-serif]">
                  Probe
                </span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed font-serif italic">
                "Before you vibe code it, Probe it."
              </p>
            </div>

            {/* Col 2 (Product): About, Pricing, Changelog, Contact */}
            <div>
              <span className="font-semibold text-xs text-gray-950 uppercase tracking-wider block mb-3">
                Product
              </span>
              <ul className="space-y-2.5">
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('about')}
                    className="text-sm text-gray-500 hover:text-black transition-colors"
                  >
                    About
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('features')}
                    className="text-sm text-gray-500 hover:text-black transition-colors"
                  >
                    Pricing
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('features')}
                    className="text-sm text-gray-500 hover:text-black transition-colors"
                  >
                    Changelog
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('contact')}
                    className="text-sm text-gray-500 hover:text-black transition-colors"
                  >
                    Contact
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3 (Legal): Terms of service, Privacy policy, 404 */}
            <div>
              <span className="font-semibold text-xs text-gray-950 uppercase tracking-wider block mb-3">
                Legal
              </span>
              <ul className="space-y-2.5">
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('faq')}
                    className="text-sm text-gray-500 hover:text-black transition-colors"
                  >
                    Terms of service
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('faq')}
                    className="text-sm text-gray-500 hover:text-black transition-colors"
                  >
                    Privacy policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('about')}
                    className="text-sm text-gray-500 hover:text-black transition-colors"
                  >
                    404
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 4 (Connect): Instagram, YouTube, LinkedIn, Twitter / X */}
            <div>
              <span className="font-semibold text-xs text-gray-950 uppercase tracking-wider block mb-3">
                Connect
              </span>
              <ul className="space-y-2.5">
                <li>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-500 hover:text-black transition-colors"
                  >
                    Instagram
                  </a>
                </li>
                <li>
                  <a
                    href="https://youtube.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-500 hover:text-black transition-colors"
                  >
                    YouTube
                  </a>
                </li>
                <li>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-500 hover:text-black transition-colors"
                  >
                    LinkedIn
                  </a>
                </li>
                <li>
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-500 hover:text-black transition-colors"
                  >
                    Twitter / X
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar: EXACTLY as specified */}
          <div className="border-t border-black/5 pt-8 text-center text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-center gap-2">
            <span>© 2026 Probe. All rights reserved</span>
            <span className="hidden sm:inline">•</span>
            <span>
              Built by <span className="text-gray-800 font-medium">Re-text</span>
            </span>
            <span className="hidden sm:inline">•</span>
            <span>
              Made with <span className="text-gray-800 font-medium">Claude</span>.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
