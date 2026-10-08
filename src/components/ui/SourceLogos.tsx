import React from 'react';

export const RedditLogo: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="#FF4500" />
    <path
      d="M19 12c0-.83-.67-1.5-1.5-1.5-.4 0-.77.16-1.04.42-1.12-.76-2.65-1.25-4.36-1.3l.74-3.5 2.43.52c.04.66.59 1.18 1.26 1.18.7 0 1.27-.57 1.27-1.27s-.57-1.27-1.27-1.27c-.49 0-.91.28-1.12.69l-2.73-.58c-.14-.03-.28.05-.32.19l-.86 4.04c-1.74.05-3.3.54-4.44 1.3-.27-.26-.64-.42-1.04-.42-.83 0-1.5.67-1.5 1.5 0 .58.33 1.08.81 1.33-.04.22-.06.44-.06.67 0 2.62 2.91 4.75 6.5 4.75s6.5-2.13 6.5-4.75c0-.23-.02-.45-.06-.67.48-.25.81-.75.81-1.33zm-9.75 1c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm5.5 4c-.78.78-2.26.78-3.04 0-.1-.1-.1-.26 0-.36.1-.1.26-.1.36 0 .58.58 1.74.58 2.32 0 .1-.1.26-.1.36 0 .1.1.1.26 0 .36zm-.25-2c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"
      fill="#FFFFFF"
    />
  </svg>
);

export const GitHubLogo: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      fill="#111827"
    />
  </svg>
);

export const XLogo: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      fill="#111827"
    />
  </svg>
);

export const ScholarXivLogo: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Exact ScholarXiv Atom & Research Paper Emblem matching reference */}
    {/* 1. Orbit 1: Vertical Ellipse */}
    <ellipse
      cx="50"
      cy="50"
      rx="16"
      ry="36"
      stroke="#111827"
      strokeWidth="5.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Electron 1 on vertical orbit */}
    <circle cx="56" cy="28" r="5" fill="#111827" />

    {/* 2. Orbit 2: Diagonal Ellipse (tilted down-left to up-right, -30 deg) */}
    <ellipse
      cx="50"
      cy="50"
      rx="37"
      ry="15"
      transform="rotate(-30 50 50)"
      stroke="#111827"
      strokeWidth="5.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Electron 2 on diagonal orbit */}
    <circle cx="28.5" cy="54" r="5" fill="#111827" />

    {/* 3. Orbit 3: Diagonal Ellipse (tilted up-left to down-right, +30 deg) */}
    <ellipse
      cx="50"
      cy="50"
      rx="37"
      ry="15"
      transform="rotate(30 50 50)"
      stroke="#111827"
      strokeWidth="5.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Electron 3 on diagonal orbit */}
    <circle cx="65" cy="65.5" r="5" fill="#111827" />

    {/* 4. Center Document / Paper Core (Vertical sides, slanted top/bottom & stripes) */}
    <path
      d="M44 42 L56 36 V58 L44 64 Z"
      stroke="#111827"
      strokeWidth="5.5"
      strokeLinejoin="round"
      fill="#FFFFFF"
    />
    {/* Three parallel text lines */}
    <path
      d="M45.5 47 L53.5 43"
      stroke="#111827"
      strokeWidth="4"
      strokeLinecap="round"
    />
    <path
      d="M45.5 53 L53.5 49"
      stroke="#111827"
      strokeWidth="4"
      strokeLinecap="round"
    />
    <path
      d="M45.5 59 L53.5 55"
      stroke="#111827"
      strokeWidth="4"
      strokeLinecap="round"
    />
  </svg>
);

export const GoogleLogo: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </svg>
);

export const LinkedInLogo: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="5" fill="#0A66C2" />
    <path
      d="M7.4 9.1H4.6V18h2.8V9.1zM6 7.9c1 0 1.7-.7 1.7-1.6 0-.9-.7-1.6-1.7-1.6s-1.7.7-1.7 1.6c0 .9.7 1.6 1.7 1.6zm13.4 5.7v4.4h-2.8v-4.1c0-1-.4-1.7-1.3-1.7-.7 0-1.1.5-1.3.9-.1.2-.1.4-.1.7V18h-2.8s.04-8.1 0-8.9h2.8v1.3c.4-.6 1-1.5 2.7-1.5 1.9 0 3.5 1.2 3.5 3.7z"
      fill="#FFFFFF"
    />
  </svg>
);
