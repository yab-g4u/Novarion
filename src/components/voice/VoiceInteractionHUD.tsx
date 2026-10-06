import React, { useState } from 'react';
import { 
  Mic, 
  MicOff, 
  Square, 
  X, 
  Sparkles, 
  Volume2, 
  Loader2, 
  Send, 
  ChevronUp, 
  ChevronDown,
  AlertCircle
} from 'lucide-react';
import { useVoice } from '../../contexts/VoiceContext';

export const VoiceInteractionHUD: React.FC = () => {
  const {
    voiceState,
    isConnected,
    isMuted,
    userTranscript,
    agentTranscript,
    currentAction,
    currentActionArgs,
    errorMessage,
    stopVoice,
    stopSpeaking,
    toggleMute,
    sendTextMessage,
    dismissError
  } = useVoice();

  const [isMinimized, setIsMinimized] = useState(false);
  const [textInput, setTextInput] = useState('');

  if (!isConnected && !errorMessage) {
    return null;
  }

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    sendTextMessage(textInput.trim());
    setTextInput('');
  };

  const getStatusBadge = () => {
    switch (voiceState) {
      case 'listening':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
            <span>LISTENING</span>
          </span>
        );
      case 'thinking':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]">
            <Loader2 size={11} className="animate-spin text-[#7C3AED]" />
            <span>THINKING</span>
          </span>
        );
      case 'executing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] animate-pulse">
            <Sparkles size={11} className="text-[#D97706]" />
            <span>EXECUTING PROBE ACTION</span>
          </span>
        );
      case 'speaking':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
            <Volume2 size={11} className="text-[#1D4ED8] animate-bounce" />
            <span>PROBE SPEAKING</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-[#F1F3F5] text-[#525866]">
            <span>READY</span>
          </span>
        );
    }
  };

  const formatActionName = (name: string | null) => {
    if (!name) return '';
    return name
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-[calc(100vw-2.5rem)] font-['Geist','Inter',sans-serif] transition-all">
      {/* ERROR BANNER IF PRESENT */}
      {errorMessage && (
        <div className="mb-2 p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl shadow-lg flex items-start justify-between gap-2 text-xs text-[#991B1B]">
          <div className="flex items-start gap-2">
            <AlertCircle size={15} className="text-[#DC2626] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Voice Error</p>
              <p className="text-[11px] text-[#B91C1C] mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissError}
            className="p-1 text-[#DC2626] hover:bg-[#FEE2E2] rounded-lg cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ACTIVE VOICE HUD CONTAINER */}
      {isConnected && (
        <div className="bg-white/95 backdrop-blur-xl border border-[#0A0D14]/15 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] p-4 overflow-hidden transition-all">
          {/* TOP BAR: BADGE, MODEL TAG, CONTROLS */}
          <div className="flex items-center justify-between pb-2.5 border-b border-[#F1F3F5]">
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#868C98]">
                Gemini 3.8 Live
              </span>
            </div>

            <div className="flex items-center gap-1">
              {/* Mute Microphone Toggle */}
              <button
                type="button"
                onClick={toggleMute}
                title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  isMuted ? 'bg-[#FEE2E2] text-[#DC2626]' : 'text-[#868C98] hover:text-[#0A0D14] hover:bg-[#F1F3F5]'
                }`}
              >
                {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
              </button>

              {/* Stop Speaking Barge-In Button */}
              {voiceState === 'speaking' && (
                <button
                  type="button"
                  onClick={stopSpeaking}
                  title="Interrupt / Stop Probe speaking"
                  className="px-2 py-1 rounded-full bg-[#FEE2E2] hover:bg-[#FCA5A5] text-[#DC2626] text-[10px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Square size={10} fill="currentColor" />
                  <span>STOP</span>
                </button>
              )}

              {/* Minimize / Expand Toggle */}
              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Expand voice panel' : 'Minimize voice panel'}
                className="p-1.5 text-[#868C98] hover:text-[#0A0D14] hover:bg-[#F1F3F5] rounded-full transition-colors cursor-pointer"
              >
                {isMinimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {/* Disconnect Voice Button */}
              <button
                type="button"
                onClick={stopVoice}
                title="Disconnect Gemini Live Voice"
                className="p-1.5 text-[#868C98] hover:text-[#DC2626] hover:bg-[#FEE2E2]/60 rounded-full transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <div className="pt-3 space-y-3">
              {/* EXECUTING ACTION CALLOUT */}
              {currentAction && (
                <div className="p-2.5 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E] flex items-center gap-2">
                  <Sparkles size={14} className="text-[#D97706] animate-spin shrink-0" />
                  <div className="truncate">
                    <span className="font-bold">Operating Probe:</span>{' '}
                    <span className="font-mono text-[11px] bg-[#FEF3C7] px-1.5 py-0.5 rounded">
                      {formatActionName(currentAction)}
                    </span>
                    {currentActionArgs && Object.keys(currentActionArgs).length > 0 && (
                      <span className="text-[11px] text-[#B45309] ml-1.5 truncate">
                        {currentActionArgs.idea || currentActionArgs.task || currentActionArgs.view || ''}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* LIVE USER TRANSCRIPT */}
              {userTranscript && (
                <div className="flex items-start gap-2 text-xs">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#868C98] mt-0.5 shrink-0">
                    You:
                  </span>
                  <p className="text-[#0A0D14] font-medium leading-relaxed bg-[#F8FAFC] p-2 rounded-xl border border-[#E2E8F0] flex-1">
                    "{userTranscript}"
                  </p>
                </div>
              )}

              {/* LIVE AGENT SPOKEN RESPONSE TRANSCRIPT */}
              {agentTranscript && (
                <div className="flex items-start gap-2 text-xs">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#0F52BA] mt-0.5 shrink-0">
                    Probe:
                  </span>
                  <p className="text-[#0A0D14] font-medium leading-relaxed bg-[#EFF6FF]/60 p-2 rounded-xl border border-[#DBEAFE] flex-1">
                    {agentTranscript}
                  </p>
                </div>
              )}

              {/* AUDIO VISUALIZER / AMBIENT BARS */}
              <div className="flex items-center justify-between px-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-[#868C98]">Live Audio Stream</span>
                  <div className="flex items-center gap-0.5 h-3">
                    <span
                      className={`w-1 rounded-full transition-all duration-150 ${
                        voiceState === 'speaking'
                          ? 'h-3 bg-[#0F52BA] animate-pulse'
                          : voiceState === 'listening'
                          ? 'h-2 bg-[#10B981]'
                          : 'h-1 bg-[#D1D5DB]'
                      }`}
                    />
                    <span
                      className={`w-1 rounded-full transition-all duration-150 ${
                        voiceState === 'speaking'
                          ? 'h-4 bg-[#0F52BA] animate-pulse delay-75'
                          : voiceState === 'listening'
                          ? 'h-3 bg-[#10B981] delay-75'
                          : 'h-1 bg-[#D1D5DB]'
                      }`}
                    />
                    <span
                      className={`w-1 rounded-full transition-all duration-150 ${
                        voiceState === 'speaking'
                          ? 'h-2 bg-[#0F52BA] animate-pulse delay-150'
                          : voiceState === 'listening'
                          ? 'h-2 bg-[#10B981] delay-150'
                          : 'h-1 bg-[#D1D5DB]'
                      }`}
                    />
                    <span
                      className={`w-1 rounded-full transition-all duration-150 ${
                        voiceState === 'speaking'
                          ? 'h-3 bg-[#0F52BA] animate-pulse'
                          : voiceState === 'listening'
                          ? 'h-1.5 bg-[#10B981]'
                          : 'h-1 bg-[#D1D5DB]'
                      }`}
                    />
                  </div>
                </div>

                <span className="text-[10px] font-mono text-[#868C98]">Hands-free continuous</span>
              </div>

              {/* OPTIONAL TEXT FALLBACK INPUT */}
              <form onSubmit={handleSendText} className="flex items-center gap-1.5 pt-1">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Or type a voice prompt..."
                  className="flex-1 text-xs px-3 py-1.5 rounded-full bg-[#F1F3F5] border border-[#E5E7EB] focus:outline-none focus:border-[#0A0D14] text-[#0A0D14] placeholder:text-[#868C98]"
                />
                <button
                  type="submit"
                  disabled={!textInput.trim()}
                  className="p-1.5 rounded-full bg-[#0A0D14] text-white hover:bg-[#1E293B] disabled:opacity-30 cursor-pointer shrink-0"
                >
                  <Send size={11} />
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
