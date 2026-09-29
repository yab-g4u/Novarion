import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Copy, Check, Users, Globe, ShieldCheck, ExternalLink } from 'lucide-react';
import { CollaboratorPresence } from '../../types/collaboration';
import { getShareableUrl } from '../../lib/collaboration/useInvestigationRoom';
import {
  buildPersistedInvestigationFromIdea,
  saveInvestigationToDatabase,
} from '../../lib/collaboration/investigationStore';

interface ShareInvestigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  query?: string;
  collaborators: CollaboratorPresence[];
}

export const ShareInvestigationModal: React.FC<ShareInvestigationModalProps> = ({
  isOpen,
  onClose,
  roomId,
  query,
  collaborators,
}) => {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const shareableUrl = getShareableUrl(roomId, query);

  // Persist the workspace to the database as soon as the Share modal opens
  useEffect(() => {
    if (isOpen && roomId) {
      const inv = buildPersistedInvestigationFromIdea(
        roomId,
        query || 'AI tools will replace most productivity software'
      );
      void saveInvestigationToDatabase(inv);
    }
  }, [isOpen, roomId, query]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(shareableUrl);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenRoom = () => {
    if (query) {
      try {
        localStorage.setItem('probe_active_idea', query);
      } catch {
        // ignore
      }
    }
    onClose();
    navigate(
      query ? `/r/${roomId}?idea=${encodeURIComponent(query)}` : `/r/${roomId}`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 text-left font-['Geist','Inter',sans-serif]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#F1F3F5]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#0A0D14] text-white flex items-center justify-center shadow-xs">
              <Users size={15} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0A0D14]">
                Share Investigation Workspace
              </h3>
              <p className="text-[11px] font-mono text-[#868C98]">
                Room Code: {roomId}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#F1F3F5] text-[#868C98] hover:text-[#0A0D14] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Query Context */}
        {query && (
          <div className="p-3 rounded-2xl bg-[#FAFAFA] border border-[#E5E7EB] text-xs">
            <span className="text-[10px] font-mono text-[#868C98] uppercase font-bold block mb-0.5">
              Investigated Idea
            </span>
            <p className="text-[#0A0D14] font-medium leading-snug">"{query}"</p>
          </div>
        )}

        {/* Shareable Link Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#0A0D14] block">
              Public Collaborator Link
            </label>
            <span className="text-[10px] font-mono text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-full border border-[#A7F3D0] flex items-center gap-1 font-semibold">
              <ShieldCheck size={11} />
              Persisted &amp; Live Synced
            </span>
          </div>

          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#FAFAFA] border border-[#CBD5E1] focus-within:border-[#0A0D14]">
            <input
              type="text"
              readOnly
              value={shareableUrl}
              data-testid="shareable-workspace-url"
              className="flex-1 px-3 py-1.5 bg-transparent text-xs font-mono text-[#0A0D14] focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopy}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                copied
                  ? 'bg-[#10B981] text-white'
                  : 'bg-[#0A0D14] hover:bg-[#1E293B] text-white'
              }`}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
          <p className="text-[11px] text-[#64748B] leading-relaxed">
            Anyone with this link can open Room{' '}
            <strong className="font-mono text-[#0A0D14]">{roomId}</strong> in any
            browser or incognito window to view the persisted Evidence Graph,
            challenge evidence, add comments, and run validation tests together in
            real time.
          </p>
        </div>

        {/* Active Collaborators Presence */}
        <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-[#0A0D14] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span>Active in Room ({collaborators.length})</span>
            </span>
            <span className="text-[10px] text-[#868C98]">
              investigation:{roomId}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {collaborators.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[#E5E7EB] text-xs font-medium text-[#0A0D14] shadow-2xs"
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                <span>{c.name}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-[11px] font-mono text-[#868C98] pt-2 border-t border-[#F1F3F5]">
          <span className="flex items-center gap-1 min-w-0">
            <Globe size={12} className="text-[#0F52BA] shrink-0" />
            <span className="truncate max-w-[180px]">
              {shareableUrl.replace(/^https?:\/\//, '')}
            </span>
          </span>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleOpenRoom}
              className="text-[#0F52BA] font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Open Room</span>
              <ExternalLink size={11} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-[#0A0D14] font-bold hover:underline cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
