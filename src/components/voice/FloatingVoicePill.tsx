import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Mic, 
  MicOff, 
  Square, 
  X, 
  Sparkles, 
  Volume2, 
  Loader2, 
  ChevronUp, 
  ChevronDown,
  AlertCircle
} from 'lucide-react';
import { BotAvatar } from 'bot-avatars';
import { useVoice } from '../../contexts/VoiceContext';

export const FloatingVoicePill: React.FC = () => {
  const location = useLocation();
  const isWorkspace = location.pathname.startsWith('/app') || location.pathname.startsWith('/r/');
  const {
    voiceState,
    isConnected,
    isMuted,
    userTranscript,
    agentTranscript,
    currentAction,
    currentActionArgs,
    errorMessage,
    startVoice,
    stopVoice,
    stopSpeaking,
    toggleMute,
    dismissError
  } = useVoice();

  const [isExpanded, setIsExpanded] = useState(false);
  const [pulseWave, setPulseWave] = useState(0);

  // Cycle animation frame for waveform dots when listening or speaking
  useEffect(() => {
    if (isConnected && (voiceState === 'listening' || voiceState === 'speaking')) {
      const interval = setInterval(() => {
        setPulseWave((prev) => (prev + 1) % 6);
      }, 140);
      return () => clearInterval(interval);
    }
  }, [isConnected, voiceState]);

  // Automatically expand card when user speaks or tool executes so they see live feedback
  useEffect(() => {
    if (userTranscript || currentAction || agentTranscript) {
      setIsExpanded(true);
    }
  }, [userTranscript, currentAction, agentTranscript]);

  const handlePillClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isConnected) {
      startVoice();
      setIsExpanded(true);
    } else {
      // Toggle card expansion when clicked while active
      setIsExpanded((prev) => !prev);
    }
  };

  const isExecuting = voiceState === 'executing';
  const isSpeaking = voiceState === 'speaking';
  const isThinking = voiceState === 'thinking';
  const isListening = voiceState === 'listening';
  const isBusy = isConnected && (isExecuting || isSpeaking || isThinking || isListening);

  const formatActionName = (name: string | null) => {
    if (!name) return '';
    return name
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  // When in workspace and voice is idle (not connected) with no error,
  // do not render the floating pill over the workspace chat interface.
  // The workspace already provides integrated voice buttons in the input and header.
  if (isWorkspace && !isConnected && !errorMessage) {
    return null;
  }

  return (
    <div
      className={`fixed ${
        isWorkspace
          ? 'top-14 right-4 sm:top-14 sm:right-6 items-end'
          : 'bottom-6 left-1/2 -translate-x-1/2 items-center'
      } z-40 flex flex-col select-none font-['Geist','Inter',-apple-system,sans-serif] transition-all duration-300`}
    >
      {/* 1. ERROR BANNER */}
      {errorMessage && (
        <div className="mb-2 max-w-sm w-[90vw] p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl shadow-xl flex items-start justify-between gap-2 text-xs text-[#991B1B] animate-in fade-in slide-in-from-top-2">
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

      {/* 2. EXPANDED STATUS & TRANSCRIPT CARD */}
      {isConnected && isExpanded && (
        <div className={`max-w-md w-[92vw] sm:w-[420px] bg-white/95 backdrop-blur-xl border border-[#0A0D14]/12 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.14)] p-4 animate-in fade-in ${
          isWorkspace ? 'mb-2.5 order-2 slide-in-from-top-3' : 'mb-3 slide-in-from-bottom-3'
        } transition-all`}>
          {/* Card Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-[#F1F3F5]">
            <div className="flex items-center gap-2">
              <BotAvatar
                type="clover"
                size={22}
                state={isBusy ? 'working' : 'default'}
                face={isSpeaking ? 'mouth' : 'eyes'}
                shading="fabric"
              />
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  isSpeaking
                    ? 'bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]'
                    : isExecuting
                    ? 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]'
                    : isThinking
                    ? 'bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]'
                    : 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSpeaking
                      ? 'bg-[#1D4ED8] animate-bounce'
                      : isExecuting
                      ? 'bg-[#D97706] animate-pulse'
                      : isThinking
                      ? 'bg-[#7C3AED] animate-ping'
                      : 'bg-[#059669] animate-ping'
                  }`}
                />
                <span>{voiceState.toUpperCase()}</span>
              </span>
              <span className="text-[10px] font-mono text-[#868C98]">Gemini 3.8 Live</span>
            </div>

            <div className="flex items-center gap-1">
              {/* Mute Toggle */}
              <button
                type="button"
                onClick={toggleMute}
                title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  isMuted ? 'bg-[#FEE2E2] text-[#DC2626]' : 'text-[#868C98] hover:text-[#0A0D14] hover:bg-[#F1F3F5]'
                }`}
              >
                {isMuted ? <MicOff size={13} /> : <Mic size={13} />}
              </button>

              {/* Stop Speaking (Barge-in) */}
              {isSpeaking && (
                <button
                  type="button"
                  onClick={stopSpeaking}
                  title="Interrupt / Stop Probe speaking"
                  className="px-2 py-0.5 rounded-full bg-[#FEE2E2] hover:bg-[#FCA5A5] text-[#DC2626] text-[10px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Square size={9} fill="currentColor" />
                  <span>STOP</span>
                </button>
              )}

              {/* Minimize Card */}
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                title="Collapse details"
                className="p-1.5 text-[#868C98] hover:text-[#0A0D14] hover:bg-[#F1F3F5] rounded-full transition-colors cursor-pointer"
              >
                <ChevronDown size={14} />
              </button>

              {/* Disconnect Voice Mode */}
              <button
                type="button"
                onClick={stopVoice}
                title="Turn off voice control"
                className="p-1.5 text-[#868C98] hover:text-[#DC2626] hover:bg-[#FEE2E2]/60 rounded-full transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Action Callout if executing */}
          {currentAction && (
            <div className="mt-2.5 p-2 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E] flex items-center gap-2">
              <Sparkles size={13} className="text-[#D97706] animate-spin shrink-0" />
              <div className="truncate">
                <span className="font-bold">Controlling Probe:</span>{' '}
                <span className="font-mono text-[11px] bg-[#FEF3C7] px-1.5 py-0.5 rounded">
                  {formatActionName(currentAction)}
                </span>
                {currentActionArgs && (currentActionArgs.idea || currentActionArgs.task || currentActionArgs.view) && (
                  <span className="text-[11px] text-[#B45309] ml-1.5 truncate">
                    {currentActionArgs.idea || currentActionArgs.task || currentActionArgs.view}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Live User Transcript */}
          {userTranscript && (
            <div className="mt-2.5 flex items-start gap-2 text-xs">
              <span className="text-[10px] font-mono font-bold uppercase text-[#868C98] mt-0.5 shrink-0">You:</span>
              <p className="text-[#0A0D14] font-medium leading-relaxed bg-[#F8FAFC] p-2 rounded-xl border border-[#E2E8F0] flex-1">
                "{userTranscript}"
              </p>
            </div>
          )}

          {/* Live Agent Spoken Response */}
          {agentTranscript && (
            <div className="mt-2 flex items-start gap-2 text-xs">
              <div className="shrink-0 flex items-center gap-1 text-[10px] font-mono font-bold uppercase text-[#0091FF] mt-0.5">
                <BotAvatar type="clover" size={16} state={isSpeaking ? 'working' : 'default'} face={isSpeaking ? 'mouth' : 'eyes'} />
                <span>Probe:</span>
              </div>
              <p className="text-[#0A0D14] font-medium leading-relaxed bg-[#EFF6FF]/60 p-2 rounded-xl border border-[#DBEAFE] flex-1">
                {agentTranscript}
              </p>
            </div>
          )}

          <div className="mt-2 pt-2 border-t border-[#F1F3F5] flex items-center justify-between text-[10px] font-mono text-[#868C98]">
            <span>Speak commands hands-free anytime</span>
            <span>Click pill to toggle</span>
          </div>
        </div>
      )}

      {/* 3. THE FLOATING PILL (EXACT CLONE WITH BOT AVATAR) */}
      <div className="relative group">
        <button
          type="button"
          onClick={handlePillClick}
          title={
            isConnected
              ? `Probe Voice Active (${voiceState.toUpperCase()}) — Click to toggle details or stop`
              : 'Click bot avatar to operate Probe with voice'
          }
          aria-label="Probe Voice Control"
          className={`flex items-center gap-3 px-5 py-2.5 rounded-full transition-all duration-300 cursor-pointer select-none active:scale-95 ${
            isConnected
              ? 'bg-[#0096FF] text-white shadow-[0_8px_30px_rgba(0,150,255,0.45),0_2px_8px_rgba(0,0,0,0.12)] ring-2 ring-white/40'
              : 'bg-[#0096FF] hover:bg-[#0088F0] text-white shadow-[0_8px_24px_rgba(0,150,255,0.38),0_2px_6px_rgba(0,0,0,0.1)] hover:shadow-[0_10px_28px_rgba(0,150,255,0.5)]'
          }`}
        >
          {/* Bot Avatar from Libraries.dev on Left */}
          <div className="shrink-0 flex items-center justify-center relative">
            <BotAvatar
              type="clover"
              size={30}
              state={isBusy ? 'working' : isConnected ? 'default' : 'sleeping'}
              face={isSpeaking ? 'mouth' : 'eyes'}
              shading="fabric"
            />
            {isMuted && (
              <span className="absolute -bottom-1 -right-1 bg-[#EF4444] text-white p-0.5 rounded-full ring-1 ring-white">
                <MicOff size={10} />
              </span>
            )}
          </div>

          {/* Sequence of White Square Dots (▪ ▪ ▪ ▪ ▪ ▪) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {[0, 1, 2, 3, 4, 5].map((index) => {
              // Calculate dynamic height / scale when active
              let dotClass = 'w-2 h-2 rounded-[2px] bg-white transition-all duration-150';
              if (isConnected && isSpeaking) {
                const isActive = (pulseWave + index) % 6 === 0 || (pulseWave + index) % 6 === 1;
                dotClass += isActive ? ' scale-125 opacity-100' : ' opacity-70';
              } else if (isConnected && isListening) {
                const isActive = pulseWave === index;
                dotClass += isActive ? ' scale-110 opacity-100' : ' opacity-85';
              } else if (isConnected && isThinking) {
                dotClass += ' animate-pulse opacity-90';
              } else {
                dotClass += ' opacity-95 group-hover:opacity-100';
              }

              return <span key={index} className={dotClass} />;
            })}
          </div>
        </button>

        {/* Ambient Ring Glow when Active */}
        {isConnected && (
          <span className="absolute -inset-1 rounded-full pointer-events-none animate-ping opacity-20 bg-[#0096FF]" />
        )}
      </div>
    </div>
  );
};
