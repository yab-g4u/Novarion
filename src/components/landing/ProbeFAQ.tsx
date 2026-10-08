import React, { useState } from 'react';
import { ChevronDown, Plus, Minus, Search, Sparkles, ArrowRight, HelpCircle } from 'lucide-react';

interface FAQItem {
  id: string;
  category: 'signals' | 'testing' | 'graph' | 'security';
  question: string;
  answer: string;
  tag?: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'diff-chatgpt',
    category: 'signals',
    question: 'How is Probe fundamentally different from asking ChatGPT or doing manual desk research?',
    answer:
      'LLMs alone hallucinate plausible-sounding consensus without verifying if paying buyers actually exist. Probe does not rely on static training memory: it dispatches autonomous agents across Reddit (e.g., r/sales, r/startups), GitHub discussions, Hacker News, X, arXiv research papers, and G2 buyer reviews. It isolates contradicting signals, operational blind spots, and real willingness-to-pay sentiment, compiling them into a verified, topological Evidence Graph with traceable citations.',
    tag: 'Core Distinction',
  },
  {
    id: 'living-graph',
    category: 'graph',
    question: 'How does the Living Evidence Graph categorize and connect market signals?',
    answer:
      'When you enter a product idea or assumption, Probe deconstructs it into core hypotheses, latent assumptions, and operational risks. As live signals are ingested, every datapoint is algorithmically categorized into Supporting (corroborating data), Challenging (fatal contradiction), or Blind Spot (untested legal/operational liability). Connectors link each source directly to the hypothesis it influences, giving you a transparent visual map of truth.',
    tag: 'Evidence Graph',
  },
  {
    id: 'product-testing',
    category: 'testing',
    question: 'What is the simulated user testing and friction extraction engine?',
    answer:
      'Before writing production code or running expensive ads, Probe simulates autonomous buyer persona sessions (e.g., skeptical enterprise buyers, technical architects, early adopters) navigating your proposed workflow, value proposition, and pricing structure. It records hesitation telemetry, click friction points, and recommends specific copy variants to boost conversion before you launch.',
    tag: 'UX Simulator',
  },
  {
    id: 'research-sources',
    category: 'signals',
    question: 'Which research sources does Probe search in real time?',
    answer:
      'Probe continuously monitors 10+ empirical sources: Reddit community discussions, X real-time discourse, GitHub code signals & repository issues, Google Scholar & arXiv preprints, Product Hunt launch telemetry, LinkedIn buyer sentiment polls, Hacker News threads, G2 software reviews, and public web archives.',
    tag: 'Data Sources',
  },
  {
    id: 'conviction-score',
    category: 'graph',
    question: 'How is the Conviction Score calculated?',
    answer:
      'The Conviction Score (0–100%) represents the empirical weight of verified evidence against fatal risks. It factors in signal volume, contradiction severity, buyer willingness-to-pay velocity, domain/regulatory deliverability hurdles, and alternative open-source competitor density.',
    tag: 'Scoring Algorithm',
  },
  {
    id: 'security-privacy',
    category: 'security',
    question: 'Is my idea private and secure when investigated on Probe?',
    answer:
      'Yes. Your queries, hypotheses, and proprietary research are never used to train public machine learning models. Every investigation is sandboxed to your private workspace, and evidence dossier exports can be restricted or shared via password-protected or signed links.',
    tag: 'Privacy & Security',
  },
  {
    id: 'export-sharing',
    category: 'graph',
    question: 'Can I export my evidence and share investigations with investors or co-founders?',
    answer:
      'Yes. You can export interactive Evidence Graphs, synthesis memos, and friction logs as interactive web permalinks, high-resolution SVG/PNG topology diagrams, or structured CSV/JSON data for investor diligence decks and founder briefs.',
    tag: 'Collaboration',
  },
  {
    id: 'investigation-speed',
    category: 'signals',
    question: 'How quickly does a full empirical investigation complete?',
    answer:
      'Real-time synthesis streams initial signals in under 3 seconds. A multi-source crawl across hundreds of community discussions, academic papers, and competitor databases synthesizes into a complete Evidence Graph in approximately 45–90 seconds.',
    tag: 'Performance',
  },
];

export const ProbeFAQ: React.FC<{ onStartInvestigating?: () => void }> = ({ onStartInvestigating }) => {
  const [openId, setOpenId] = useState<string | null>('diff-chatgpt');
  const [activeCategory, setActiveCategory] = useState<'all' | 'signals' | 'graph' | 'testing' | 'security'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleOpen = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  const filteredItems = FAQ_ITEMS.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch =
      searchQuery === '' ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section 
      id="section-faq" 
      className="w-full bg-[#FAF9F5] border-t border-[#E5E7EB] py-20 sm:py-28 text-[#111111] font-['Geist','Inter',sans-serif]"
      style={{
        backgroundImage: 'radial-gradient(#CBD5E1 0.75px, transparent 0.75px)',
        backgroundSize: '24px 24px',
      }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E5E7EB] text-xs font-mono text-[#4B5563] shadow-2xs mb-4">
            <HelpCircle size={12} className="text-[#1E65F6]" />
            <span className="uppercase tracking-wider font-semibold">Validation Intelligence FAQ</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#111111] leading-tight">
            Frequently asked questions.
          </h2>

          <p className="mt-4 text-base sm:text-lg text-[#4B5563] leading-relaxed">
            Everything you need to know about autonomous market signal extraction, our living Evidence Graph, and simulated validation experiments.
          </p>
        </div>

        {/* Category Filters & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 pb-4 border-b border-[#E5E7EB]">
          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none w-full sm:w-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                activeCategory === 'all'
                  ? 'bg-[#111111] text-white shadow-2xs'
                  : 'bg-white border border-[#E5E7EB] text-[#4B5563] hover:text-[#111111]'
              }`}
            >
              All Questions
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('signals')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                activeCategory === 'signals'
                  ? 'bg-[#111111] text-white shadow-2xs'
                  : 'bg-white border border-[#E5E7EB] text-[#4B5563] hover:text-[#111111]'
              }`}
            >
              Market Signals
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('graph')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                activeCategory === 'graph'
                  ? 'bg-[#111111] text-white shadow-2xs'
                  : 'bg-white border border-[#E5E7EB] text-[#4B5563] hover:text-[#111111]'
              }`}
            >
              Evidence Graph
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('testing')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                activeCategory === 'testing'
                  ? 'bg-[#111111] text-white shadow-2xs'
                  : 'bg-white border border-[#E5E7EB] text-[#4B5563] hover:text-[#111111]'
              }`}
            >
              Product Testing
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('security')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                activeCategory === 'security'
                  ? 'bg-[#111111] text-white shadow-2xs'
                  : 'bg-white border border-[#E5E7EB] text-[#4B5563] hover:text-[#111111]'
              }`}
            >
              Privacy & Security
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search answers..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#E5E7EB] rounded-full outline-none focus:border-[#1E65F6] text-[#111111] placeholder:text-[#9CA3AF]"
            />
          </div>
        </div>

        {/* Accordion Stack */}
        <div className="flex flex-col gap-3">
          {filteredItems.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div
                key={item.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'bg-white border-[#CBD5E1] shadow-xs'
                    : 'bg-white/80 border-[#E5E7EB] hover:border-[#D1D5DB] hover:bg-white'
                }`}
              >
                {/* Accordion Trigger */}
                <button
                  type="button"
                  onClick={() => toggleOpen(item.id)}
                  className="w-full px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between text-left gap-4 cursor-pointer focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm sm:text-[16px] font-semibold text-[#111111] leading-snug">
                      {item.question}
                    </span>
                    {item.tag && (
                      <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-[#F4F4F5] text-[#525866] text-[10px] font-mono uppercase tracking-wider shrink-0">
                        {item.tag}
                      </span>
                    )}
                  </div>

                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                    isOpen
                      ? 'bg-[#111111] text-white border-[#111111]'
                      : 'bg-[#F9FAFB] text-[#4B5563] border-[#E5E7EB] hover:bg-neutral-100'
                  }`}>
                    {isOpen ? <Minus size={14} /> : <Plus size={14} />}
                  </div>
                </button>

                {/* Accordion Content */}
                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 pt-1 border-t border-[#F1F3F5] animate-in fade-in duration-150">
                    <p className="text-sm sm:text-[14.5px] text-[#4B5563] leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="text-center py-12 text-sm text-[#6B7280]">
              No questions matched &ldquo;{searchQuery}&rdquo;. Try another search term or select All Questions.
            </div>
          )}
        </div>

        {/* Bottom Callout: Still have questions? */}
        <div className="mt-12 sm:mt-16 rounded-2xl bg-white border border-[#E5E7EB] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xs">
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#1E65F6]">
              Ready to challenge your assumptions?
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-[#111111] mt-1">
              Put your idea under pressure now.
            </h3>
            <p className="text-xs sm:text-sm text-[#4B5563] mt-1 max-w-md">
              Run an empirical investigation across Reddit, GitHub, X, and academic research in under 60 seconds.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (onStartInvestigating) {
                  onStartInvestigating();
                } else {
                  const el = document.getElementById('live-investigation');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="px-5 py-2.5 rounded-full bg-[#111111] hover:bg-[#1E65F6] text-white text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <span>Test an idea</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};

export default ProbeFAQ;
