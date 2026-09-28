import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  ExternalLink, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Star, 
  FileText, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  Eye,
  FlaskConical,
  Scale,
  Sparkles,
  Layers
} from 'lucide-react';
import { TIMELINE_DATA } from '../data/mockData';
import { SourceIconSelector } from './Icons';
import { SourceType } from '../types';
import { useInvestigationRoom } from '../lib/collaboration/useInvestigationRoom';
import { ValidationTest } from '../types/collaboration';

interface EvidenceTimelineProps {
  roomId?: string;
  onNavigateToGraphNode?: (nodeId: string) => void;
  onTestCompletedAsEvidence?: (evidence: any) => void;
}

export const EvidenceTimeline: React.FC<EvidenceTimelineProps> = ({
  roomId,
  onNavigateToGraphNode,
  onTestCompletedAsEvidence,
}) => {
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(8); // Default to Sept (Month 9)
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedDayEvent, setSelectedDayEvent] = useState<any | null>(null);
  const [inspectModalEvent, setInspectModalEvent] = useState<any | null>(null);

  // Hook into realtime room tests
  const { tests, updateTestStatus } = useInvestigationRoom(roomId);

  // Completion modal state
  const [completingTest, setCompletingTest] = useState<ValidationTest | null>(null);
  const [testResultSummary, setTestResultSummary] = useState('');
  const [testVerdict, setTestVerdict] = useState<'SUPPORTS' | 'CHALLENGES' | 'INCONCLUSIVE'>('SUPPORTS');

  const activeMonth = TIMELINE_DATA[selectedMonthIndex];

  // Days in month calculation (standard 2025 calendar days)
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][selectedMonthIndex];
  
  // Starting day of week for 2025 months (0 = Mon, 6 = Sun)
  const monthStartOffsets = [2, 5, 5, 1, 3, 6, 1, 4, 0, 2, 5, 0];
  const startOffset = monthStartOffsets[selectedMonthIndex];

  // Map dynamic tests to calendar events for the active month
  const dynamicTestsForMonth = tests.filter((t) => (t.monthIndex ?? 8) === selectedMonthIndex);

  // Format dynamic tests as calendar events
  const dynamicEvents = dynamicTestsForMonth.map((t) => ({
    id: t.id,
    day: t.day || 18,
    sourceType: 'linear' as const,
    sourceName: `NEXT TEST: ${t.methodLabel}`,
    title: t.question,
    date: `${activeMonth.month.split(' ')[0]} ${t.day || 18}, 2025`,
    excerpt: `Target: ${t.target}. Success Signal: ${t.successSignal}`,
    accessibleItem: `Linked to Node: ${t.originatingNodeLabel} →`,
    metricLabel: `Validation Experiment · ${t.status}`,
    isDynamicTest: true,
    testData: t,
  }));

  // Filter events
  const baseMonthEvents = activeMonth.calendarEvents || [];
  const allMonthEvents = [...dynamicEvents, ...baseMonthEvents];

  const filteredEvents = allMonthEvents.filter((ev) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'tests') return (ev as any).isDynamicTest;
    if (selectedFilter === 'reviews') return ev.sourceType === 'playstore';
    if (selectedFilter === 'issues') return ev.sourceType === 'linear' || ev.sourceType === 'github';
    if (selectedFilter === 'community') return ev.sourceType === 'reddit' || ev.sourceType === 'x' || ev.sourceType === 'producthunt';
    if (selectedFilter === 'research') return ev.sourceType === 'research';
    return true;
  });

  const getEventForDay = (dayNum: number) => {
    return allMonthEvents.find((ev) => ev.day === dayNum);
  };

  const handleCompleteTestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingTest) return;

    const summary = testResultSummary.trim() || 'Real-world validation experiment run with verified participants.';
    updateTestStatus(completingTest.id, 'COMPLETED', summary, testVerdict);

    if (onTestCompletedAsEvidence) {
      onTestCompletedAsEvidence({
        id: `ev-${completingTest.id}`,
        title: `Validation Test Result: ${completingTest.question}`,
        excerpt: summary,
        relationship: testVerdict === 'SUPPORTS' ? 'Supports' : testVerdict === 'CHALLENGES' ? 'Challenges' : 'Unknown',
        sourceType: 'docs',
        sourceName: completingTest.methodLabel,
        originatingNodeId: completingTest.originatingNodeId,
      });
    }

    setCompletingTest(null);
    setTestResultSummary('');
  };

  return (
    <section id="section-timeline" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto select-none font-['Geist','Inter',sans-serif]">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-[#525866] mb-2">
            <CalendarIcon size={14} />
            <span>12-MONTH SIGNAL & EXPERIMENT CALENDAR</span>
            {tests.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-[10px] font-bold border border-[#C7D2FE]">
                <FlaskConical size={11} />
                <span>{tests.length} Active {tests.length === 1 ? 'Test' : 'Tests'} Linked</span>
              </span>
            )}
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0A0D14]">
            Turn uncertainty into the next experiment.
          </h2>
          <p className="text-sm text-[#525866] mt-1.5 max-w-2xl">
            Unresolved graph questions and high-risk assumptions become scheduled real-world validation tests. When completed, their results return directly to the graph as new evidence.
          </p>
        </div>

        {/* Global 12-Month Telemetry Stats */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="bg-white border border-[#EAEAEA] rounded-xl px-3 py-2 shadow-xs">
            <span className="text-[#868C98] block text-[10px]">SCHEDULED TESTS</span>
            <span className="font-bold text-[#4F46E5]">{tests.length} Experiments</span>
          </div>
          <div className="bg-white border border-[#EAEAEA] rounded-xl px-3 py-2 shadow-xs">
            <span className="text-[#868C98] block text-[10px]">TOTAL SIGNALS</span>
            <span className="font-bold text-[#0A0D14]">318,400+</span>
          </div>
          <div className="bg-white border border-[#EAEAEA] rounded-xl px-3 py-2 shadow-xs">
            <span className="text-[#868C98] block text-[10px]">TRACEABILITY</span>
            <span className="font-bold text-[#10B981]">100% Graph-Linked</span>
          </div>
        </div>
      </div>

      {/* 12-MONTH SCRUBBER BAR WITH MINI SPARKLINE */}
      <div className="probe-glass rounded-2xl p-4 sm:p-5 mb-8">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 scrollbar-none">
          {TIMELINE_DATA.map((item, idx) => {
            const isSelected = selectedMonthIndex === idx;
            const isCritical = item.sentimentScore < 50;
            const monthTests = tests.filter((t) => (t.monthIndex ?? 8) === idx);

            return (
              <button
                key={item.month}
                onClick={() => {
                  setSelectedMonthIndex(idx);
                  setSelectedDayEvent(null);
                }}
                className={`flex flex-col items-center min-w-[72px] sm:min-w-[84px] py-2 px-1.5 rounded-xl transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-[#0A0D14] text-white shadow-sm'
                    : 'hover:bg-[#F8FAFC] text-[#525866]'
                }`}
              >
                {monthTests.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#4F46E5] ring-2 ring-white" />
                )}

                <span className={`text-[11px] font-mono font-medium ${isSelected ? 'text-white' : 'text-[#868C98]'}`}>
                  {item.month.split(' ')[0]}
                </span>
                
                {/* Mini Sentiment Bar */}
                <div className="w-8 h-1.5 bg-[#E5E7EB] rounded-full my-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isCritical ? 'bg-[#F43F5E]' : item.sentimentScore > 65 ? 'bg-[#10B981]' : 'bg-[#F59E0B]'
                    }`}
                    style={{ width: `${item.sentimentScore}%` }}
                  />
                </div>

                <span className={`text-[10px] font-mono font-bold ${
                  isSelected ? 'text-white' : isCritical ? 'text-[#F43F5E]' : 'text-[#059669]'
                }`}>
                  {item.sentimentScore}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CALENDAR UI SYSTEM (MAIN BOARD) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT / CENTER: INTERACTIVE MONTHLY CALENDAR GRID (8 Cols) */}
        <div className="lg:col-span-8 bg-white border border-[#EAEAEA] rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
          {/* Calendar Header with Month Controls & Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F1F3F5]">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSelectedMonthIndex((prev) => Math.max(0, prev - 1))}
                  disabled={selectedMonthIndex === 0}
                  className="p-1.5 rounded-lg border border-[#E5E7EB] hover:bg-[#F8FAFC] disabled:opacity-30 cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setSelectedMonthIndex((prev) => Math.min(11, prev + 1))}
                  disabled={selectedMonthIndex === 11}
                  className="p-1.5 rounded-lg border border-[#E5E7EB] hover:bg-[#F8FAFC] disabled:opacity-30 cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#0A0D14]">
                  {activeMonth.month}
                </h3>
                <span className="text-xs text-[#525866] font-mono">
                  {activeMonth.dominantTheme}
                </span>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-[#F1F3F5] p-1 rounded-xl text-xs font-mono overflow-x-auto">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  selectedFilter === 'all' ? 'bg-white text-[#0A0D14] font-bold shadow-2xs' : 'text-[#64748B]'
                }`}
              >
                All
              </button>
              {tests.length > 0 && (
                <button
                  onClick={() => setSelectedFilter('tests')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                    selectedFilter === 'tests' ? 'bg-[#4F46E5] text-white font-bold shadow-2xs' : 'text-[#4F46E5] font-semibold'
                  }`}
                >
                  <FlaskConical size={11} />
                  <span>Experiments ({dynamicTestsForMonth.length})</span>
                </button>
              )}
              <button
                onClick={() => setSelectedFilter('reviews')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  selectedFilter === 'reviews' ? 'bg-white text-[#0A0D14] font-bold shadow-2xs' : 'text-[#64748B]'
                }`}
              >
                Reviews
              </button>
              <button
                onClick={() => setSelectedFilter('issues')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  selectedFilter === 'issues' ? 'bg-white text-[#0A0D14] font-bold shadow-2xs' : 'text-[#64748B]'
                }`}
              >
                Issues
              </button>
              <button
                onClick={() => setSelectedFilter('community')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  selectedFilter === 'community' ? 'bg-white text-[#0A0D14] font-bold shadow-2xs' : 'text-[#64748B]'
                }`}
              >
                Discussions
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 text-center text-xs font-mono text-[#868C98] font-bold uppercase tracking-wider">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>

          {/* 7x5/6 Date Cells */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty Offset cells */}
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="h-20 sm:h-24 bg-[#FAFAFA]/50 rounded-xl" />
            ))}

            {/* Actual Month Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const event = getEventForDay(dayNum);
              const isSelected = selectedDayEvent?.day === dayNum;
              const isTest = (event as any)?.isDynamicTest;

              return (
                <div
                  key={`day-${dayNum}`}
                  onClick={() => event && setSelectedDayEvent(event)}
                  className={`h-20 sm:h-24 p-2 rounded-2xl border transition-all flex flex-col justify-between select-none ${
                    isTest
                      ? 'border-[#C7D2FE] bg-[#EEF2FF]/60 hover:border-[#4F46E5] cursor-pointer'
                      : event
                      ? 'border-[#CBD5E1] bg-white hover:border-[#0A0D14] cursor-pointer shadow-2xs'
                      : 'border-[#F1F3F5] bg-[#FAFAFA] text-[#CBD5E1]'
                  } ${isSelected ? 'ring-2 ring-[#0A0D14] !border-[#0A0D14]' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-mono font-bold ${
                      isTest ? 'text-[#4F46E5]' : event ? 'text-[#0A0D14]' : 'text-[#868C98]'
                    }`}>
                      {dayNum}
                    </span>

                    {isTest && (
                      <span className="w-2 h-2 rounded-full bg-[#4F46E5] animate-pulse" title="Next Test Experiment" />
                    )}
                  </div>

                  {event && (
                    <div className="mt-1">
                      <div className="flex items-center gap-1">
                        {isTest ? (
                          <FlaskConical size={13} className="text-[#4F46E5] shrink-0" />
                        ) : (
                          <SourceIconSelector type={event.sourceType} size={14} />
                        )}
                        <span className={`text-[10px] font-bold truncate ${
                          isTest ? 'text-[#4F46E5]' : 'text-[#0A0D14]'
                        }`}>
                          {isTest ? 'EXPERIMENT' : event.sourceName}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#525866] line-clamp-1 mt-0.5">
                        {event.title}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT SIDEBAR: EXPERIMENT & EVENT DETAILS */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Active Events / Tests in Selected Month */}
          <div className="bg-white border border-[#EAEAEA] rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-[#0A0D14] flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#0F52BA]" />
                <span>Month Events & Experiments ({filteredEvents.length})</span>
              </h4>
              <span className="text-[10px] font-mono text-[#868C98]">Interactive</span>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {filteredEvents.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#868C98] rounded-2xl bg-[#FAFAFA] border border-dashed border-[#E5E7EB]">
                  No events match the selected filter.
                </div>
              ) : (
                filteredEvents.map((ev, idx) => {
                  const isTest = (ev as any).isDynamicTest;
                  const testData = (ev as any).testData as ValidationTest | undefined;
                  const eventKey = (ev as any).id || `${ev.day}-${ev.title}-${idx}`;

                  return (
                    <div
                      key={eventKey}
                      onClick={() => setInspectModalEvent(ev)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isTest
                          ? 'bg-[#EEF2FF]/60 border-[#C7D2FE] hover:border-[#4F46E5]'
                          : 'bg-[#FAFAFA] border-[#EAEAEA] hover:border-[#CBD5E1]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          {isTest ? (
                            <FlaskConical size={14} className="text-[#4F46E5]" />
                          ) : (
                            <SourceIconSelector type={ev.sourceType} size={15} />
                          )}
                          <span className={`text-xs font-bold ${isTest ? 'text-[#4F46E5]' : 'text-[#0A0D14]'}`}>
                            {ev.sourceName}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-[#868C98]">
                          {ev.date}
                        </span>
                      </div>

                      <p className="text-xs font-medium text-[#0A0D14] leading-snug line-clamp-2 mb-2">
                        {ev.title}
                      </p>

                      <p className="text-[11px] text-[#525866] leading-relaxed mb-3">
                        {ev.excerpt}
                      </p>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between gap-2">
                        {isTest && testData && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onNavigateToGraphNode) {
                                onNavigateToGraphNode(testData.originatingNodeId);
                              }
                            }}
                            className="flex items-center gap-1 text-[10px] font-mono text-[#4F46E5] hover:underline"
                          >
                            <Layers size={11} />
                            <span>Origin: {testData.originatingNodeLabel.substring(0, 18)}...</span>
                          </button>
                        )}

                        <span className="text-xs font-medium text-[#0F52BA] hover:underline flex items-center gap-1 ml-auto">
                          <span>Inspect</span>
                          <ArrowRight size={11} />
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Month Signal Takeaway Card */}
          <div className="bg-[#FAFAFA] border border-[#EAEAEA] rounded-2xl p-4 text-xs text-[#525866] space-y-2">
            <div className="flex items-center justify-between font-mono">
              <span className="text-[#868C98]">DISCUSSION VOLUME</span>
              <strong className="text-[#0A0D14]">{activeMonth.discussionVolume.toLocaleString()} posts</strong>
            </div>
            <div className="flex items-center justify-between font-mono">
              <span className="text-[#868C98]">CONTRADICTION RATIO</span>
              <strong className="text-[#F43F5E]">{activeMonth.contradictPct}% critical</strong>
            </div>
            <div className="pt-2 border-t border-[#EAEAEA] text-[11px] leading-relaxed">
              <strong className="text-[#0A0D14]">Signal takeaway:</strong> {activeMonth.signalSnippet}
            </div>
          </div>

        </div>
      </div>

      {/* ACCESSIBLE ARTIFACT / TEST INSPECTOR MODAL */}
      {inspectModalEvent && (
        <div className="fixed inset-0 z-50 bg-[#0A0D14]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#0A0D14] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            {/* Top Close Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA]">
              <div className="flex items-center gap-2">
                {inspectModalEvent.isDynamicTest ? (
                  <div className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
                    <FlaskConical size={18} />
                  </div>
                ) : (
                  <SourceIconSelector type={inspectModalEvent.sourceType} size={28} />
                )}
                <div>
                  <h3 className="text-sm font-bold text-[#0A0D14]">{inspectModalEvent.sourceName}</h3>
                  <span className="text-[11px] font-mono text-[#868C98]">{inspectModalEvent.date}</span>
                </div>
              </div>
              <button
                onClick={() => setInspectModalEvent(null)}
                className="w-8 h-8 rounded-full border border-[#E5E7EB] hover:bg-[#F1F3F5] flex items-center justify-center text-[#525866] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-5 space-y-4 text-xs">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F1F3F5] text-[#0A0D14]">
                <span>{inspectModalEvent.metricLabel}</span>
              </div>

              <h4 className="text-base font-bold text-[#0A0D14] leading-snug">
                {inspectModalEvent.title}
              </h4>

              <div className="bg-[#FAFAFA] border border-[#EAEAEA] rounded-2xl p-4 text-[#0A0D14] leading-relaxed font-mono">
                "{inspectModalEvent.excerpt}"
              </div>

              {/* If this is an experiment linked to a graph node */}
              {inspectModalEvent.isDynamicTest && inspectModalEvent.testData && (
                <div className="p-4 rounded-2xl bg-[#EEF2FF] border border-[#C7D2FE] space-y-3">
                  <div className="font-bold text-[#4F46E5] flex items-center gap-1">
                    <Layers size={13} />
                    <span>Originating Graph Context</span>
                  </div>
                  <p className="text-[#374151]">
                    This test was spawned directly from graph node: <strong>"{inspectModalEvent.testData.originatingNodeLabel}"</strong> to resolve empirical uncertainty.
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {onNavigateToGraphNode && (
                      <button
                        type="button"
                        onClick={() => {
                          onNavigateToGraphNode(inspectModalEvent.testData.originatingNodeId);
                          setInspectModalEvent(null);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-[#0A0D14] text-white font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Layers size={13} />
                        <span>Jump to Graph Node</span>
                      </button>
                    )}

                    {inspectModalEvent.testData.status !== 'COMPLETED' && (
                      <button
                        type="button"
                        onClick={() => {
                          setCompletingTest(inspectModalEvent.testData);
                          setInspectModalEvent(null);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <CheckCircle2 size={13} />
                        <span>Complete Experiment & Generate Evidence</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {!inspectModalEvent.isDynamicTest && (
                <div className="flex items-center gap-2 text-[#059669]">
                  <ShieldCheck size={16} />
                  <span>Verified by Probe Signal Crawler · Cryptographic Timestamp Locked</span>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-[#EAEAEA] flex items-center justify-end gap-3">
              <button
                onClick={() => setInspectModalEvent(null)}
                className="px-4 py-2 text-xs font-semibold bg-[#0A0D14] text-white rounded-full hover:bg-[#202530] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETE TEST & RETURN RESULT TO GRAPH MODAL */}
      {completingTest && (
        <div className="fixed inset-0 z-50 bg-[#0A0D14]/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#0A0D14] rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F3F5]">
              <div className="flex items-center gap-2">
                <FlaskConical size={16} className="text-[#4F46E5]" />
                <h3 className="text-sm font-bold text-[#0A0D14]">Record Test Verdict & Return to Graph</h3>
              </div>
              <button
                onClick={() => setCompletingTest(null)}
                className="p-1 rounded text-[#868C98] hover:text-[#0A0D14]"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#525866]">
              Experiment: <strong>"{completingTest.question}"</strong>
            </p>

            <form onSubmit={handleCompleteTestSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-mono text-[#868C98] uppercase font-bold block mb-1">
                  Empirical Result Summary:
                </label>
                <textarea
                  value={testResultSummary}
                  onChange={(e) => setTestResultSummary(e.target.value)}
                  placeholder="e.g. Out of 100 landing page visitors, 21 submitted payment intent without price pushback."
                  required
                  rows={3}
                  className="w-full p-2.5 rounded-xl bg-[#FAFAFA] border border-[#CBD5E1] text-[#0A0D14] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#868C98] uppercase font-bold block mb-1">
                  Graph Relationship Verdict:
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTestVerdict('SUPPORTS')}
                    className={`flex-1 py-1.5 rounded-xl font-bold cursor-pointer ${
                      testVerdict === 'SUPPORTS' ? 'bg-[#10B981] text-white' : 'bg-white border text-[#525866]'
                    }`}
                  >
                    ↑ Supports
                  </button>
                  <button
                    type="button"
                    onClick={() => setTestVerdict('CHALLENGES')}
                    className={`flex-1 py-1.5 rounded-xl font-bold cursor-pointer ${
                      testVerdict === 'CHALLENGES' ? 'bg-[#EF4444] text-white' : 'bg-white border text-[#525866]'
                    }`}
                  >
                    ↓ Challenges
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCompletingTest(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#525866] hover:bg-[#F1F3F5] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0A0D14] hover:bg-[#1E293B] text-white text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Save & Feed New Evidence to Graph
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </section>
  );
};

export default EvidenceTimeline;
