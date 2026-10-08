import React from 'react';

/**
 * FloatingVoicePill is intentionally disabled to avoid duplicate floating widgets
 * and overlapping voice avatars. The applet renders exactly one unified voice control
 * beside the chat input using <VoiceControlButton />.
 */
export const FloatingVoicePill: React.FC = () => {
  return null;
};

export default FloatingVoicePill;
