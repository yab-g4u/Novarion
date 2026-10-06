import React from 'react';

interface ScholarXivLogoProps {
  className?: string;
  size?: number;
  inverted?: boolean;
}

export const ScholarXivLogo: React.FC<ScholarXivLogoProps> = ({
  className = 'w-4 h-4',
  size,
  inverted = false,
}) => {
  const strokeColor = inverted ? '#FFFFFF' : 'currentColor';
  const fillColor = inverted ? '#FFFFFF' : 'currentColor';

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-label="ScholarXIV Logo"
    >
      {/* Central Academic Document Nucleus */}
      <rect
        x="41"
        y="37"
        width="18"
        height="26"
        rx="2.5"
        stroke={strokeColor}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Document stripes (research text) */}
      <line x1="46" y1="43.5" x2="54" y2="43.5" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
      <line x1="46" y1="50" x2="54" y2="50" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
      <line x1="46" y1="56.5" x2="54" y2="56.5" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />

      {/* Orbit 1: Vertical ellipse */}
      <ellipse
        cx="50"
        cy="50"
        rx="15"
        ry="36"
        stroke={strokeColor}
        strokeWidth="3.8"
        strokeLinecap="round"
      />
      {/* Electron node on Orbit 1 */}
      <circle cx="56" cy="18" r="4.2" fill={fillColor} />

      {/* Orbit 2: Diagonal ellipse (+60 deg) */}
      <ellipse
        cx="50"
        cy="50"
        rx="15"
        ry="36"
        transform="rotate(60 50 50)"
        stroke={strokeColor}
        strokeWidth="3.8"
        strokeLinecap="round"
      />
      {/* Electron node on Orbit 2 */}
      <circle cx="21" cy="67" r="4.2" fill={fillColor} />

      {/* Orbit 3: Diagonal ellipse (-60 deg) */}
      <ellipse
        cx="50"
        cy="50"
        rx="15"
        ry="36"
        transform="rotate(-60 50 50)"
        stroke={strokeColor}
        strokeWidth="3.8"
        strokeLinecap="round"
      />
      {/* Electron node on Orbit 3 */}
      <circle cx="79" cy="67" r="4.2" fill={fillColor} />
    </svg>
  );
};

export default ScholarXivLogo;
