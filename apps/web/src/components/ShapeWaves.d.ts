import React from 'react';

export interface ShapeWavesProps {
  text?: string;
  fontFamily?: string;
  fontWeight?: number | string;
  textSize?: number;
  shapes?: 'mixed' | 'squares' | 'circles' | 'triangles';
  cellSize?: number;
  dotSize?: number;
  color?: string;
  hoverColor?: string;
  backgroundColor?: string;
  speed?: number;
  scale?: number;
  contrast?: number;
  brightness?: number;
  flow?: number;
  direction?: number;
  fade?: number;
  interactive?: boolean;
  splashRadius?: number;
  splashStrength?: number;
  glow?: number;
  intro?: boolean;
  introDuration?: number;
  introKey?: number;
  paused?: boolean;
  onError?: (error: Error) => void;
  className?: string;
}

declare const ShapeWaves: React.FC<ShapeWavesProps>;
export default ShapeWaves;
