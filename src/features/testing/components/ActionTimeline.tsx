import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  MousePointer,
  Keyboard,
  Compass,
  ArrowRight,
  Eye,
  Sliders,
  AlertTriangle
} from 'lucide-react';
import { ActionRecord, ScreenshotRecord } from '../../../../apps/api/src/modules/testing/testing.types';

interface ActionTimelineProps {
  events: ActionRecord[];
  screenshots: ScreenshotRecord[];
  onSelectEventScreenshot?: (screenshot: ScreenshotRecord) => void;
}

export const ActionTimeline: React.FC<ActionTimelineProps> = ({
  events,
  screenshots,
  onSelectEventScreenshot
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const getActionIcon = (type: string, success: boolean) => {
    if (!success) return <XCircle size={13} className="text-[#E11D48]" />;
    switch (type) {
      case 'NAVIGATE':
        return <Compass size={13} className="text-[#0F52BA]" />;
      case 'CLICK':
        return <MousePointer size={13} className="text-[#059669]" />;
      case 'TYPE':
        return <Keyboard size={13} className="text-[#7C3AED]" />;
      case 'PRESS_KEY':
        return <Keyboard size={13} className="text-[#D97706]" />;
      default:
        return <CheckCircle2 size={13} className="text-[#059669]" />;
    }
  };

  const handleEventClick = (event: ActionRecord) => {
    setSelectedEventId(event.id);
    if (event.screenshotId && onSelectEventScreenshot) {
      const match = screenshots.find((s) => s.id === event.screenshotId);
      if (match) onSelectEventScreenshot(match);
    }
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-3xl p-4 sm:p-5 flex flex-col text-left">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#F1F3F5] text-xs font-mono font-bold uppercase tracking-wider text-[#868C98]">
        <div className="flex items-center gap-2 text-[#0A0D14]">
          <Clock size={14} className="text-[#0F52BA]" />
          <span>REAL ACTION TIMELINE ({events.length})</span>
        </div>
        <span className="text-[11px] font-normal normal-case text-[#64748B]">Click event to inspect screenshot</span>
      </div>

      {events.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#868C98] font-mono">
          <Clock size={20} className="mx-auto mb-2 opacity-40 text-[#64748B]" />
          <span>Awaiting first interaction event...</span>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {events.map((ev, idx) => {
            const isSelected = selectedEventId === ev.id;
            const hasScreenshot = Boolean(ev.screenshotId);

            return (
              <div
                key={ev.id}
                onClick={() => handleEventClick(ev)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer text-xs ${
                  isSelected
                    ? 'bg-[#EFF6FF] border-[#3B82F6] shadow-xs'
                    : 'bg-[#FAFAFA] border-[#E5E7EB] hover:border-[#CBD5E1]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    <span className="mt-0.5">{getActionIcon(ev.type, ev.success)}</span>
                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-[10px] uppercase px-1.5 py-0.5 rounded bg-white border border-[#E2E8F0] text-[#0A0D14]">
                          {ev.type}
                        </span>
                        <span className="font-semibold text-[#0A0D14]">
                          {ev.target || 'Page Action'}
                        </span>
                      </div>

                      {ev.value && (
                        <div className="text-[11px] font-mono text-[#64748B] bg-white px-2 py-0.5 rounded border border-[#E2E8F0] inline-block">
                          Value: <strong className="text-[#0A0D14]">{ev.value}</strong>
                        </div>
                      )}

                      {ev.error && (
                        <div className="text-[11px] text-[#E11D48] flex items-center gap-1 mt-1 font-mono">
                          <AlertTriangle size={11} />
                          <span>{ev.error}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 space-y-1">
                    <span className="text-[10px] font-mono text-[#868C98] block">
                      {ev.durationMs}ms
                    </span>
                    {hasScreenshot && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-mono text-[#0F52BA] bg-white px-1.5 py-0.5 rounded border border-[#BFDBFE]">
                        <Eye size={10} />
                        <span>Screenshot</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActionTimeline;
