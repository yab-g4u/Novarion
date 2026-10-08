import React from 'react';
import { MicOff } from 'lucide-react';
import { BotAvatar, type BotAvatarType, type BotAvatarShading } from 'bot-avatars';
import { useVoice } from '../../contexts/VoiceContext';

export interface VoiceControlButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | number;
  showLabel?: boolean;
  type?: BotAvatarType;
  shading?: BotAvatarShading;
}

export const VoiceControlButton: React.FC<VoiceControlButtonProps> = ({
  className = '',
  size = 'md',
  showLabel = false,
  type = 'clover',
  shading = 'fabric',
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
  const isBusy = isConnected && (isExecuting || isSpeaking || isThinking || isListening);

  const avatarSize = typeof size === 'number'
    ? size
    : size === 'sm'
    ? 26
    : size === 'lg'
    ? 44
    : 34;

  const containerPadding = size === 'sm'
    ? 'p-0.5'
    : size === 'lg'
    ? 'p-2'
    : 'p-1';

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={
        isConnected
          ? `Probe Voice Active (${voiceState.toUpperCase()}) — Click bot to stop`
          : 'Click bot to interact with voice'
      }
      aria-label={isConnected ? 'Stop Voice Control' : 'Start Voice Control'}
      className={`relative inline-flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer select-none active:scale-95 group ${containerPadding} ${
        isConnected
          ? isSpeaking
            ? 'bg-[#0096FF]/20 ring-2 ring-[#0096FF] shadow-[0_0_16px_rgba(0,150,255,0.4)]'
            : isExecuting
            ? 'bg-[#F59E0B]/20 ring-2 ring-[#F59E0B] shadow-[0_0_14px_rgba(245,158,11,0.35)]'
            : isThinking
            ? 'bg-[#8B5CF6]/20 ring-2 ring-[#8B5CF6] shadow-[0_0_14px_rgba(139,92,246,0.3)]'
            : 'bg-[#0096FF]/15 ring-2 ring-[#0096FF]/70 shadow-[0_0_12px_rgba(0,150,255,0.25)]'
          : 'bg-[#0096FF]/10 hover:bg-[#0096FF]/20 border border-[#0096FF]/20 hover:border-[#0096FF]/40 shadow-xs'
      } ${className}`}
    >
      {/* Sound wave pulse ring when active */}
      {isConnected && (
        <span
          className={`absolute -inset-1 rounded-full pointer-events-none animate-ping opacity-25 ${
            isSpeaking ? 'bg-[#0096FF]' : isListening ? 'bg-[#10B981]' : 'bg-[#8B5CF6]'
          }`}
        />
      )}

      {/* Bot Avatar from Libraries.dev */}
      <BotAvatar
        type={type}
        size={avatarSize}
        state={isBusy ? 'working' : isConnected ? 'default' : 'sleeping'}
        face={isSpeaking ? 'mouth' : 'eyes'}
        shading={shading}
      />

      {/* Muted indicator badge */}
      {isConnected && isMuted && (
        <span
          title="Microphone is muted"
          className="absolute -bottom-0.5 -right-0.5 bg-[#EF4444] text-white p-0.5 rounded-full shadow-xs ring-1 ring-white"
        >
          <MicOff size={10} />
        </span>
      )}

      {/* Live status dot */}
      {isConnected && !isMuted && (
        <span
          className={`absolute top-0 right-0 w-2 h-2 rounded-full ring-1 ring-white ${
            isSpeaking
              ? 'bg-[#0096FF] animate-bounce'
              : isExecuting
              ? 'bg-[#F59E0B] animate-pulse'
              : isThinking
              ? 'bg-[#8B5CF6] animate-pulse'
              : 'bg-[#10B981] animate-ping'
          }`}
        />
      )}

      {showLabel && (
        <span className="ml-2 font-medium hidden sm:inline text-xs text-[#0A0D14]">
          {isConnected ? voiceState.toUpperCase() : 'Voice'}
        </span>
      )}
    </button>
  );
};
