import React from 'react';

// Probe's official vector logo (Stylized geometric "P" mark with optical aperture sensor and precision graticules)
export const ProbeLogo: React.FC<{ className?: string; size?: number; useImage?: boolean }> = ({
  className = '',
  size = 28,
  useImage = false,
}) => {
  if (useImage) {
    return (
      <img
        src="/probe.png"
        alt="Probe"
        width={size}
        height={size}
        className={`rounded-full object-contain ${className}`}
      />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 ${className}`}
    >
      <rect width="32" height="32" rx="8" fill="#0A0D14" />
      {/* Outer subtle radar concentric target ring */}
      <circle cx="16" cy="16" r="11" stroke="#FFFFFF" strokeOpacity="0.1" strokeWidth="0.8" strokeDasharray="1.5 1.5" />
      
      {/* Probe Vector Glyph: Stylized P with keyhole focal aperture */}
      {/* Stem */}
      <rect x="9" y="8" width="3.5" height="16" rx="1.75" fill="#FFFFFF" />

      {/* P Loop */}
      <path
        d="M 10.5 8 H 18.5 C 22.64 8 26 11.36 26 15.5 C 26 19.64 22.64 23 18.5 23 H 10.5 V 19.5 H 18.5 C 20.71 19.5 22.5 17.71 22.5 15.5 C 22.5 13.29 20.71 11.5 18.5 11.5 H 10.5 V 8 Z"
        fill="#FFFFFF"
      />

      {/* Central Optical Aperture / Eye Node */}
      <circle cx="18.5" cy="15.5" r="3" fill="#0A0D14" />
      <circle cx="18.5" cy="15.5" r="1.5" fill="#FFFFFF" />
      <circle cx="18.5" cy="15.5" r="0.7" fill="#10B981" />

      {/* Precision Micro Graticules */}
      <line x1="18.5" y1="11.5" x2="18.5" y2="12.3" stroke="#10B981" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="18.5" y1="18.7" x2="18.5" y2="19.5" stroke="#10B981" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="14.5" y1="15.5" x2="15.3" y2="15.5" stroke="#10B981" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="21.7" y1="15.5" x2="22.5" y2="15.5" stroke="#10B981" strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  );
};

export const RedditIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 36,
  className = '',
}) => (
  <div
    style={{ width: size, height: size }}
    className={`rounded-full bg-[#FF4500] flex items-center justify-center p-1.5 shadow-xs flex-shrink-0 ${className}`}
  >
    <svg viewBox="0 0 24 24" fill="#FFFFFF" className="w-full h-full">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.56 12 8 12.56 8 13.25c0 .688.56 1.25 1.25 1.25.688 0 1.25-.562 1.25-1.25 0-.69-.562-1.25-1.25-1.25zm5.5 0c-.69 0-1.25.56-1.25 1.25 0 .688.56 1.25 1.25 1.25.688 0 1.25-.562 1.25-1.25 0-.69-.562-1.25-1.25-1.25zm-5.466 3.99a.327.327 0 0 0-.231.095.32.32 0 0 0 0 .455c.783.784 2.052 1.154 2.947 1.154.895 0 2.164-.37 2.947-1.154a.32.32 0 0 0 0-.455.327.327 0 0 0-.456 0c-.61.611-1.66.909-2.491.909-.83 0-1.882-.298-2.492-.909a.32.32 0 0 0-.224-.095z" />
    </svg>
  </div>
);

export const XIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 36,
  className = '',
}) => (
  <div
    style={{ width: size, height: size }}
    className={`rounded-full bg-[#0A0D14] flex items-center justify-center p-2 shadow-xs flex-shrink-0 ${className}`}
  >
    <svg viewBox="0 0 24 24" fill="#FFFFFF" className="w-full h-full">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  </div>
);

export const GitHubIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 36,
  className = '',
}) => (
  <div
    style={{ width: size, height: size }}
    className={`rounded-full bg-[#0A0D14] flex items-center justify-center p-2 shadow-xs flex-shrink-0 ${className}`}
  >
    <svg viewBox="0 0 24 24" fill="#FFFFFF" className="w-full h-full">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  </div>
);

export const GoogleWebIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 36,
  className = '',
}) => (
  <div
    style={{ width: size, height: size }}
    className={`rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center p-2 shadow-xs flex-shrink-0 ${className}`}
  >
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  </div>
);

export const GooglePlayIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 36,
  className = '',
}) => (
  <div
    style={{ width: size, height: size }}
    className={`rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center p-2 shadow-xs flex-shrink-0 ${className}`}
  >
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <path fill="#4285F4" d="M3.6 2.3L13.8 12.5 3.6 22.7c-.4-.4-.6-.9-.6-1.5V3.8c0-.6.2-1.1.6-1.5z" />
      <path fill="#FBBC05" d="M17.4 9.1L4.8 1.9c-.4-.2-.8-.3-1.2-.3l10.2 10.9 3.6-3.4z" />
      <path fill="#34A853" d="M13.8 12.5L3.6 23.4c.4.1.8 0 1.2-.2l12.6-7.2-3.6-3.5z" />
      <path fill="#EA4335" d="M21.2 11.3l-3.8-2.2-3.6 3.4 3.6 3.5 3.8-2.2c.8-.5.8-1.5 0-2.5z" />
    </svg>
  </div>
);

export const ProductHuntIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 36,
  className = '',
}) => (
  <div
    style={{ width: size, height: size }}
    className={`rounded-full bg-[#DA552F] flex items-center justify-center p-2 shadow-xs flex-shrink-0 ${className}`}
  >
    <svg viewBox="0 0 24 24" fill="#FFFFFF" className="w-full h-full">
      <path d="M13.6 8.5h-3.1v3.8h3.1c1 0 1.8-.8 1.8-1.9 0-1-.8-1.9-1.8-1.9zm0-2.5c2.4 0 4.3 1.9 4.3 4.4s-1.9 4.4-4.3 4.4h-3.1V18H8V6h5.6zM12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0z" />
    </svg>
  </div>
);

export const LinearIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 36,
  className = '',
}) => (
  <div
    style={{ width: size, height: size }}
    className={`rounded-full bg-[#5E6AD2] flex items-center justify-center p-2 shadow-xs flex-shrink-0 ${className}`}
  >
    <svg viewBox="0 0 24 24" fill="#FFFFFF" className="w-full h-full">
      <path d="M3.2 15.3l5.5-5.5 2.8 2.8-5.5 5.5c-.8.8-2 .8-2.8 0s-.8-2 0-2.8zm5.5-5.5l7.6-7.6c.8-.8 2-.8 2.8 0s.8 2 0 2.8l-7.6 7.6-2.8-2.8zm12.1-4.8l-9.9 9.9c-.8.8-.8 2 0 2.8s2 .8 2.8 0l9.9-9.9c.8-.8.8-2 0-2.8s-2-.8-2.8 0z" />
    </svg>
  </div>
);

export const ProductReviewsIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 36,
  className = '',
}) => (
  <div
    style={{ width: size, height: size }}
    className={`rounded-full bg-white border border-[#FDE68A] flex items-center justify-center p-2 shadow-xs flex-shrink-0 ${className}`}
  >
    <svg viewBox="0 0 24 24" fill="#F59E0B" className="w-full h-full">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  </div>
);

export const ResearchPapersIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 36,
  className = '',
}) => (
  <div
    style={{ width: size, height: size }}
    className={`rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center p-2 shadow-xs flex-shrink-0 ${className}`}
  >
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="#0A0D14"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-full h-full"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  </div>
);

export const UnknownIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 36,
  className = '',
}) => (
  <div
    style={{ width: size, height: size }}
    className={`rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center text-[#525866] font-semibold text-sm shadow-xs flex-shrink-0 ${className}`}
  >
    ?
  </div>
);

export const SourceIconSelector: React.FC<{
  type: string;
  size?: number;
  className?: string;
}> = ({ type, size = 32, className = '' }) => {
  switch (type.toLowerCase()) {
    case 'reddit':
      return <RedditIcon size={size} className={className} />;
    case 'x':
    case 'twitter':
      return <XIcon size={size} className={className} />;
    case 'github':
      return <GitHubIcon size={size} className={className} />;
    case 'google':
      return <GoogleWebIcon size={size} className={className} />;
    case 'playstore':
    case 'googleplay':
      return <GooglePlayIcon size={size} className={className} />;
    case 'producthunt':
      return <ProductHuntIcon size={size} className={className} />;
    case 'linear':
      return <LinearIcon size={size} className={className} />;
    case 'reviews':
      return <ProductReviewsIcon size={size} className={className} />;
    case 'research':
      return <ResearchPapersIcon size={size} className={className} />;
    default:
      return <UnknownIcon size={size} className={className} />;
  }
};
