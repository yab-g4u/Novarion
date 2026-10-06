import React from 'react';
import { Mic, MicOff, Volume2, Loader2, Sparkles } from 'lucide-react';
import { useVoice } from '../../contexts/VoiceContext';

interface VoiceControlButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const VoiceControlButton: React.FC<VoiceControlButtonProps> = ({
  className = '',
  size = 'md',
  showLabel = false,
}) => {
  const { voiceState, isConnected, isMuted, startVoice, stopVoice } = useVoice();

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isConnected) {
      stopVoice();
    } else {
      startVoice();
    }
  };

  const isExecuting = voiceState === 'executing';
  const isSpeaking = voiceState === 'speaking';
  const isThinking = voiceState === 'thinking';
  const isListening = voiceState === 'listening';

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-9 h-9 sm:w-10 sm:h-10 text-sm',
    lg: 'w-11 h-11 text-base'
  }[size];

  const iconSizes = {
    sm: 14,
    md: 17,
    lg: 20
  }[size];

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={
        isConnected
          ? `Gemini Live Voice Active (${voiceState.toUpperCase()}) — Click to stop`
          : 'Operate Probe hands-free with Gemini Live Voice'
      }
      aria-label={isConnected ? 'Stop Voice Control' : 'Start Gemini Live Voice Control'}
      className={`relative inline-flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer select-none ${
        isConnected
          ? isSpeaking
            ? 'bg-[#0096FF] text-white shadow-[0_0_18px_rgba(0,150,255,0.6)] ring-2 ring-white/50 scale-105'
            : isExecuting
            ? 'bg-[#F59E0B] text-white shadow-[0_0_15px_rgba(245,158,11,0.5)] ring-2 ring-[#F59E0B]/30'
            : isThinking
            ? 'bg-[#8B5CF6] text-white shadow-[0_0_15px_rgba(139,92,246,0.4)] animate-pulse'
            : 'bg-[#0096FF] text-white shadow-[0_0_15px_rgba(0,150,255,0.5)] ring-2 ring-white/40'
          : 'bg-[#0096FF]/10 hover:bg-[#0096FF] text-[#0096FF] hover:text-white border border-[#0096FF]/25 hover:border-transparent'
      } ${sizeClasses} ${className}`}
    >
      {/* Animated Sound Wave Ring when active */}
      {isConnected && (
        <span
          className={`absolute -inset-1 rounded-full pointer-events-none animate-ping opacity-25 ${
            isSpeaking ? 'bg-[#0096FF]' : isListening ? 'bg-[#0096FF]' : 'bg-[#8B5CF6]'
          }`}
        />
      )}

      {/* State-specific icon */}
      {isExecuting ? (
        <Sparkles size={iconSizes} className="animate-spin" />
      ) : isThinking ? (
        <Loader2 size={iconSizes} className="animate-spin" />
      ) : isSpeaking ? (
        <Volume2 size={iconSizes} className="animate-bounce" />
      ) : isMuted ? (
        <MicOff size={iconSizes} className="text-[#EF4444]" />
      ) : (
        <Mic size={iconSizes} />
      )}

      {showLabel && (
        <span className="ml-2 font-medium hidden sm:inline text-xs">
          {isConnected ? voiceState.toUpperCase() : 'Voice'}
        </span>
      )}
    </button>
  );
};
