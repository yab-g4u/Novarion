import React from 'react';

interface ProbeLogoProps {
  className?: string;
  size?: number;
  variant?: 'mark' | 'full';
  inverted?: boolean;
}

/**
 * Authentic Probe Logo
 * Vector reconstruction of the official Probe geometric monogram mark:
 * Stylized 'P' with integrated focal aperture, probe needle, and precision chevron sensors.
 */
export const ProbeLogo: React.FC<ProbeLogoProps> = ({
  className = 'w-8 h-8',
  size,
  variant = 'mark',
  inverted = false,
}) => {
  const fillColor = inverted ? '#FFFFFF' : '#0A0D14';

  const markSvg = (
    <svg
      viewBox="0 0 1000 1000"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-label="Probe Logo"
    >
      {/* 1. Top Arc & Head of the 'P' */}
      <path
        d="
          M 250 310
          L 480 178
          C 660 74 800 170 800 350
          C 800 520 740 680 560 710
          L 560 580
          C 640 560 670 480 670 370
          C 670 260 580 200 480 260
          L 250 395
          Z
        "
        fill={fillColor}
      />

      {/* 2. Middle Chevron + Focal Probe Pin */}
      {/* Probe Eye Node */}
      <circle cx="560" cy="430" r="66" fill={fillColor} />
      
      {/* Middle Chevron with tapered anchor neck leading into eye */}
      <path
        d="
          M 250 490
          L 430 670
          L 505 520
          L 550 450
          L 520 575
          L 525 710
          L 430 805
          L 250 625
          Z
        "
        fill={fillColor}
      />

      {/* 3. Lower Precision Chevron Sensor */}
      <path
        d="
          M 250 645
          L 430 825
          L 525 730
          L 525 805
          L 430 900
          L 250 780
          Z
        "
        fill={fillColor}
      />
    </svg>
  );

  if (variant === 'mark') {
    return markSvg;
  }

  return (
    <div className="inline-flex items-center gap-2.5">
      {markSvg}
      <span className={`font-extrabold text-base tracking-tight ${inverted ? 'text-white' : 'text-[#0A0D14]'}`}>
        PROBE
      </span>
    </div>
  );
};

export default ProbeLogo;
