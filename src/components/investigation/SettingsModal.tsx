import React, { useState } from 'react';
import { X, Sliders, CheckCircle2, ShieldCheck, Zap, Globe, Sparkles } from 'lucide-react';
import { ScholarXivLogo } from '../ScholarXivLogo';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  userEmail = 'founder@probe.dev'
}) => {
  const [scholarXivDepth, setScholarXivDepth] = useState<'deep' | 'standard'>('deep');
  const [evidenceConfidence, setEvidenceConfidence] = useState<number>(75);
  const [autoOpenEvidence, setAutoOpenEvidence] = useState<boolean>(false);
  const [liveStreamEnabled, setLiveStreamEnabled] = useState<boolean>(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs font-['Geist','Inter',sans-serif]">
      <div 
        className="w-full max-w-lg bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#F1F3F5] flex items-center justify-between bg-[#FAFAFA]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0A0D14] text-white flex items-center justify-center">
              <Sliders size={15} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0A0D14]">Research Workspace Settings</h3>
              <p className="text-[11px] text-[#6B7280] font-mono">Preferences for {userEmail}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#868C98] hover:text-[#0A0D14] hover:bg-[#F1F3F5] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-4 sm:p-5 space-y-4 text-xs text-[#0A0D14]">
          {/* ScholarXIV Academic Sweep Depth */}
          <div className="space-y-1.5">
            <label className="font-semibold block flex items-center gap-1.5">
              <ScholarXivLogo className="w-3.5 h-3.5" />
              <span>ScholarXIV Academic Corpus Sweep</span>
            </label>
            <p className="text-[11px] text-[#525866]">
              Controls how many peer-reviewed HCI and empirical studies are cross-referenced during hypothesis validation.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setScholarXivDepth('deep')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  scholarXivDepth === 'deep'
                    ? 'border-[#0091FF] bg-[#EFF6FF] text-[#0091FF] font-semibold'
                    : 'border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#525866]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs">Deep Sweep (Recommended)</span>
                  {scholarXivDepth === 'deep' && <CheckCircle2 size={12} />}
                </div>
                <span className="text-[10px] text-[#6B7280] font-mono mt-0.5 block">10-15 peer-reviewed papers</span>
              </button>

              <button
                type="button"
                onClick={() => setScholarXivDepth('standard')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  scholarXivDepth === 'standard'
                    ? 'border-[#0091FF] bg-[#EFF6FF] text-[#0091FF] font-semibold'
                    : 'border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#525866]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs">Fast Verification</span>
                  {scholarXivDepth === 'standard' && <CheckCircle2 size={12} />}
                </div>
                <span className="text-[10px] text-[#6B7280] font-mono mt-0.5 block">3-5 top cited papers</span>
              </button>
            </div>
          </div>

          {/* Hard Relevance Gate Threshold */}
          <div className="pt-2 border-t border-[#F1F3F5] space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold">Minimum Evidence Relevance Gate</label>
              <span className="font-mono text-xs font-bold text-[#0091FF]">{evidenceConfidence}%</span>
            </div>
            <p className="text-[11px] text-[#525866]">
              Filters out irrelevant Reddit posts, off-topic tweets, and noise below this topical threshold.
            </p>
            <input
              type="range"
              min="50"
              max="90"
              step="5"
              value={evidenceConfidence}
              onChange={(e) => setEvidenceConfidence(Number(e.target.value))}
              className="w-full accent-[#0091FF] cursor-pointer"
            />
          </div>

          {/* Right Panel Defaults */}
          <div className="pt-2 border-t border-[#F1F3F5] space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold block">Keep Evidence Panel Minimal by Default</span>
                <span className="text-[11px] text-[#525866]">
                  Keep right panel collapsed until an evidence citation is clicked.
                </span>
              </div>
              <input
                type="checkbox"
                checked={!autoOpenEvidence}
                onChange={(e) => setAutoOpenEvidence(!e.target.checked)}
                className="w-4 h-4 rounded text-[#0091FF] accent-[#0091FF] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="font-semibold block">Live ThoughtLine Telemetry</span>
                <span className="text-[11px] text-[#525866]">
                  Display observable live multi-stage research trace during inquiry.
                </span>
              </div>
              <input
                type="checkbox"
                checked={liveStreamEnabled}
                onChange={(e) => setLiveStreamEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-[#0091FF] accent-[#0091FF] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-[#F1F3F5] bg-[#FAFAFA] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#0A0D14] hover:bg-[#1E293B] text-white text-xs font-semibold cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
