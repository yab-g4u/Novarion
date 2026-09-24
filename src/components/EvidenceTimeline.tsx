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
  Eye
} from 'lucide-react';
import { TIMELINE_DATA } from '../data/mockData';
import { SourceIconSelector } from './Icons';
import { SourceType } from '../types';

export const EvidenceTimeline: React.FC = () => {
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(8); // Default to Sept (Month 9)
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedDayEvent, setSelectedDayEvent] = useState<any | null>(null);
  const [inspectModalEvent, setInspectModalEvent] = useState<any | null>(null);

  const activeMonth = TIMELINE_DATA[selectedMonthIndex];

  // Days in month calculation (standard 2025 calendar days)
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][selectedMonthIndex];
  
  // Starting day of week for 2025 months (0 = Mon, 6 = Sun)
  // Jan 2025 started on Wednesday (index 2)
  const monthStartOffsets = [2, 5, 5, 1, 3, 6, 1, 4, 0, 2, 5, 0];
  const startOffset = monthStartOffsets[selectedMonthIndex];

  // Filter events
  const allMonthEvents = activeMonth.calendarEvents || [];
  const filteredEvents = allMonthEvents.filter((ev) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'reviews') return ev.sourceType === 'playstore';
    if (selectedFilter === 'issues') return ev.sourceType === 'linear' || ev.sourceType === 'github';
    if (selectedFilter === 'community') return ev.sourceType === 'reddit' || ev.sourceType === 'x' || ev.sourceType === 'producthunt';
    if (selectedFilter === 'research') return ev.sourceType === 'research';
    return true;
  });

  const getEventForDay = (dayNum: number) => {
    return allMonthEvents.find((ev) => ev.day === dayNum);
  };

  return (
    <section id="section-timeline" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#EAEAEA]">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-[#525866] mb-2">
            <CalendarIcon size={14} />
            <span>12-MONTH SIGNAL CALENDAR</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0A0D14]">
            See how the signal changes.
          </h2>
          <p className="text-sm text-[#525866] mt-1.5 max-w-2xl">
            Customer demand, developer fatigue, and market consensus are not static. Watch sentiment evolve across 12 months with accessible real-world events.
          </p>
        </div>

        {/* Global 12-Month Telemetry Stats */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="bg-white border border-[#EAEAEA] rounded-xl px-3 py-2 shadow-xs">
            <span className="text-[#868C98] block text-[10px]">TOTAL SIGNALS</span>
            <span className="font-bold text-[#0A0D14]">318,400+</span>
          </div>
          <div className="bg-white border border-[#EAEAEA] rounded-xl px-3 py-2 shadow-xs">
            <span className="text-[#868C98] block text-[10px]">NET DRIFT</span>
            <span className="font-bold text-[#F43F5E]">-27% Fatigue</span>
          </div>
          <div className="bg-white border border-[#EAEAEA] rounded-xl px-3 py-2 shadow-xs">
            <span className="text-[#868C98] block text-[10px]">TRACEABILITY</span>
            <span className="font-bold text-[#10B981]">100% Verified</span>
          </div>
        </div>
      </div>

      {/* 12-MONTH SCRUBBER BAR WITH MINI SPARKLINE */}
      <div className="bg-white border border-[#EAEAEA] rounded-2xl p-4 sm:p-5 shadow-xs mb-8">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 scrollbar-none">
          {TIMELINE_DATA.map((item, idx) => {
            const isSelected = selectedMonthIndex === idx;
            const isCritical = item.sentimentScore < 50;
            return (
              <button
                key={item.month}
                onClick={() => {
                  setSelectedMonthIndex(idx);
                  setSelectedDayEvent(null);
                }}
                className={`flex flex-col items-center min-w-[72px] sm:min-w-[84px] py-2 px-1.5 rounded-xl transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0A0D14] text-white shadow-sm'
                    : 'hover:bg-[#F8FAFC] text-[#525866]'
                }`}
              >
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

            {/* Signal Type Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`text-[11px] font-mono px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  selectedFilter === 'all'
                    ? 'bg-[#0A0D14] text-white'
                    : 'bg-[#F1F3F5] text-[#525866] hover:text-[#0A0D14]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedFilter('reviews')}
                className={`text-[11px] font-mono px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  selectedFilter === 'reviews'
                    ? 'bg-[#0A0D14] text-white'
                    : 'bg-[#F1F3F5] text-[#525866] hover:text-[#0A0D14]'
                }`}
              >
                Reviews
              </button>
              <button
                onClick={() => setSelectedFilter('issues')}
                className={`text-[11px] font-mono px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  selectedFilter === 'issues'
                    ? 'bg-[#0A0D14] text-white'
                    : 'bg-[#F1F3F5] text-[#525866] hover:text-[#0A0D14]'
                }`}
              >
                Issues
              </button>
              <button
                onClick={() => setSelectedFilter('community')}
                className={`text-[11px] font-mono px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  selectedFilter === 'community'
                    ? 'bg-[#0A0D14] text-white'
                    : 'bg-[#F1F3F5] text-[#525866] hover:text-[#0A0D14]'
                }`}
              >
                Community
              </button>
              <button
                onClick={() => setSelectedFilter('research')}
                className={`text-[11px] font-mono px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  selectedFilter === 'research'
                    ? 'bg-[#0A0D14] text-white'
                    : 'bg-[#F1F3F5] text-[#525866] hover:text-[#0A0D14]'
                }`}
              >
                Research
              </button>
            </div>
          </div>

          {/* Weekday Labels (Mon - Sun) */}
          <div className="grid grid-cols-7 text-center gap-1 text-[11px] font-mono font-semibold text-[#868C98]">
            <span>MON</span>
            <span>TUE</span>
            <span>WED</span>
            <span>THU</span>
            <span>FRI</span>
            <span>SAT</span>
            <span>SUN</span>
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {/* Blank leading days */}
            {[...Array(startOffset)].map((_, i) => (
              <div
                key={`empty-${i}`}
                className="h-16 sm:h-20 bg-[#FAFAFA]/50 rounded-xl border border-transparent"
              />
            ))}

            {/* Actual Month Days */}
            {[...Array(daysInMonth)].map((_, i) => {
              const dayNum = i + 1;
              const event = getEventForDay(dayNum);
              const isSelected = selectedDayEvent?.day === dayNum;

              return (
                <div
                  key={`day-${dayNum}`}
                  onClick={() => {
                    if (event) {
                      setSelectedDayEvent(event);
                    }
                  }}
                  className={`h-16 sm:h-20 rounded-xl p-1.5 sm:p-2 border transition-all flex flex-col justify-between ${
                    event
                      ? isSelected
                        ? 'border-[#0A0D14] bg-[#F8FAFC] ring-2 ring-[#0A0D14]/10 cursor-pointer shadow-xs'
                        : event.sentiment === 'contradict'
                        ? 'border-[#FECDD3] bg-[#FFF1F2]/40 hover:bg-[#FFF1F2] cursor-pointer'
                        : 'border-[#A7F3D0] bg-[#ECFDF5]/40 hover:bg-[#ECFDF5] cursor-pointer'
                      : 'border-[#F1F3F5] bg-[#FAFAFA]/40 hover:bg-[#F8FAFC]'
                  }`}
                >
                  {/* Day Number & Event Pill */}
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-mono font-bold ${
                      event ? 'text-[#0A0D14]' : 'text-[#868C98]'
                    }`}>
                      {dayNum}
                    </span>
                    {event && (
                      <span className={`w-2 h-2 rounded-full ${
                        event.sentiment === 'contradict' ? 'bg-[#F43F5E]' : 'bg-[#10B981]'
                      }`} />
                    )}
                  </div>

                  {/* Accessible Event Mini Thumbnail */}
                  {event && (
                    <div className="mt-auto">
                      <div className="flex items-center gap-1">
                        <SourceIconSelector type={event.sourceType} size={16} />
                        <span className="text-[9px] font-mono truncate font-medium text-[#0A0D14] hidden sm:inline">
                          {event.sourceName.split(' ')[0]}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Calendar Legend */}
          <div className="pt-3 border-t border-[#F1F3F5] flex flex-wrap items-center justify-between gap-4 text-xs text-[#525866]">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span className="text-[11px]">Supporting Signal Day</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#F43F5E]" />
                <span className="text-[11px]">Contradiction Spike Day</span>
              </div>
            </div>

            <span className="text-[11px] font-mono text-[#868C98]">
              Click marked days to inspect accessible evidence artifacts
            </span>
          </div>
        </div>

        {/* RIGHT: ACCESSIBLE ARTIFACTS INSPECTOR DRAWER (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-[#EAEAEA] rounded-3xl p-5 sm:p-6 shadow-xs">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F3F5] mb-4">
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-[#0A0D14]" />
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0A0D14]">
                  ACCESSIBLE ARTIFACTS
                </h4>
              </div>
              <span className="text-[10px] font-mono bg-[#0A0D14] text-white px-2 py-0.5 rounded-full font-bold">
                {filteredEvents.length} Verified
              </span>
            </div>

            {/* List of Accessible Evidence in the Selected Month */}
            <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
              {filteredEvents.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#868C98]">
                  No events found for this filter in {activeMonth.month}.
                </div>
              ) : (
                filteredEvents.map((ev, idx) => {
                  const isSelected = selectedDayEvent?.day === ev.day;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDayEvent(ev)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#0A0D14] bg-[#F8FAFC] shadow-sm'
                          : 'border-[#EAEAEA] bg-[#FAFAFA] hover:bg-white hover:border-[#CBD5E1]'
                      }`}
                    >
                      {/* Top row */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <SourceIconSelector type={ev.sourceType} size={22} />
                          <span className="text-xs font-bold text-[#0A0D14]">
                            {ev.sourceName}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-[#868C98]">
                          {ev.date}
                        </span>
                      </div>

                      {/* Title */}
                      <p className="text-xs font-medium text-[#0A0D14] leading-snug line-clamp-2 mb-2">
                        {ev.title}
                      </p>

                      {/* Excerpt */}
                      <p className="text-[11px] text-[#525866] leading-relaxed mb-3">
                        {ev.excerpt}
                      </p>

                      {/* Accessible Link CTA Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectModalEvent(ev);
                        }}
                        className="w-full flex items-center justify-between text-xs font-medium bg-white hover:bg-[#0A0D14] text-[#0A0D14] hover:text-white border border-[#E5E7EB] hover:border-[#0A0D14] rounded-xl px-3 py-2 transition-all cursor-pointer shadow-2xs group"
                      >
                        <span className="truncate">{ev.accessibleItem}</span>
                        <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Month Summary Card */}
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

      {/* ACCESSIBLE ARTIFACT INSPECTOR MODAL */}
      {inspectModalEvent && (
        <div className="fixed inset-0 z-50 bg-[#0A0D14]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#0A0D14] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            {/* Top Close Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA]">
              <div className="flex items-center gap-2">
                <SourceIconSelector type={inspectModalEvent.sourceType} size={28} />
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
            <div className="py-5 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F1F3F5] text-[#0A0D14]">
                <span>{inspectModalEvent.metricLabel}</span>
              </div>

              <h4 className="text-base font-bold text-[#0A0D14] leading-snug">
                {inspectModalEvent.title}
              </h4>

              <div className="bg-[#FAFAFA] border border-[#EAEAEA] rounded-2xl p-4 text-xs text-[#0A0D14] leading-relaxed font-mono">
                "{inspectModalEvent.excerpt}"
              </div>

              <div className="flex items-center gap-2 text-xs text-[#059669]">
                <ShieldCheck size={16} />
                <span>Verified by Probe Signal Crawler · Cryptographic Timestamp Locked</span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-[#EAEAEA] flex items-center justify-end gap-3">
              <button
                onClick={() => setInspectModalEvent(null)}
                className="px-4 py-2 text-xs font-semibold text-[#525866] hover:text-[#0A0D14] cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // Direct action
                  setInspectModalEvent(null);
                }}
                className="px-4 py-2 text-xs font-semibold bg-[#0A0D14] text-white rounded-full hover:bg-[#202530] transition-colors cursor-pointer"
              >
                Done Reading
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
