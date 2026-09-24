import React from 'react';
import { X, ExternalLink, ShieldCheck, AlertCircle, Copy, Check } from 'lucide-react';
import { EvidenceSource } from '../types';
import { SourceIconSelector } from './Icons';

interface EvidenceModalProps {
  source: EvidenceSource | null;
  onClose: () => void;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({ source, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!source) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(`"${source.quote}" — ${source.sourceLabel} (${source.timeAgo})`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSentimentPill = () => {
    if (source.sentiment === 'support') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
          Supports Assumption
        </span>
      );
    }
    if (source.sentiment === 'contradict') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F43F5E]" />
          Challenges Assumption
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
        Inconclusive Signal
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs animate-fadeIn">
      <div
        className="w-full max-w-lg bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-2xl space-y-5 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <SourceIconSelector type={source.sourceType} size={38} />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#0A0D14]">
                  {source.sourceLabel}
                </h3>
                {source.subredditOrChannel && (
                  <span className="text-xs text-[#525866] font-mono">
                    {source.subredditOrChannel}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#868C98] mt-0.5">
                Observed {source.timeAgo} {source.author ? `by ${source.author}` : ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#868C98] hover:text-[#0A0D14] hover:bg-[#F3F4F6] transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sentiment & Confidence Pill */}
        <div className="flex items-center justify-between pt-1">
          {getSentimentPill()}
          <span className="text-xs font-mono text-[#525866]">
            Confidence: <strong className="text-[#0A0D14]">{source.confidenceScore}%</strong>
          </span>
        </div>

        {/* Primary Quote */}
        <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-sm text-[#0A0D14] font-medium leading-relaxed italic">
          "{source.quote}"
        </div>

        {/* Context Snippet */}
        {source.snippet && (
          <div className="space-y-1.5 text-xs">
            <span className="font-semibold text-[#525866] uppercase tracking-wider text-[10px]">
              Discussion Context
            </span>
            <p className="text-[#525866] leading-relaxed bg-[#F8F9FA] p-3 rounded-lg border border-[#EFEFEF]">
              {source.snippet}
            </p>
          </div>
        )}

        {/* Social / Citation Engagement Metrics */}
        {source.metrics && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            {source.metrics.upvotes !== undefined && (
              <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <span className="text-[#64748B]">Upvotes / Likes</span>
                <span className="font-mono font-bold text-[#0F172A]">{source.metrics.upvotes.toLocaleString()}</span>
              </div>
            )}
            {source.metrics.replies !== undefined && (
              <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <span className="text-[#64748B]">Discussion Replies</span>
                <span className="font-mono font-bold text-[#0F172A]">{source.metrics.replies.toLocaleString()}</span>
              </div>
            )}
            {source.metrics.stars !== undefined && (
              <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <span className="text-[#64748B]">GitHub Stars</span>
                <span className="font-mono font-bold text-[#0F172A]">{source.metrics.stars.toLocaleString()}</span>
              </div>
            )}
            {source.metrics.citations !== undefined && (
              <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <span className="text-[#64748B]">Academic Citations</span>
                <span className="font-mono font-bold text-[#0F172A]">{source.metrics.citations}</span>
              </div>
            )}
          </div>
        )}

        {/* Bottom Actions */}
        <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#0A0D14] font-medium transition"
          >
            {copied ? <Check size={13} className="text-[#10B981]" /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy Evidence Citation'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#0A0D14] hover:bg-[#202530] text-white font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
