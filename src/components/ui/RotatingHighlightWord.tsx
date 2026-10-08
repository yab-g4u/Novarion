import React, { useState, useEffect, useRef, useMemo } from 'react';

export interface RotatingHighlightWordProps {
  /**
   * The list of words to rotate through in order.
   * Default: ['Validate', 'Challenge', 'Discover', 'Refine']
   */
  words?: string[];
  /**
   * Time in milliseconds to hold each word before beginning the transition.
   * Default: 2500ms (~2.5s)
   */
  holdDuration?: number;
  /**
   * Duration of the transition animation in milliseconds.
   * Default: 420ms (between 350-500ms)
   */
  transitionDuration?: number;
  /**
   * Distance in pixels for the translateY movement.
   * Outgoing word moves up by -shiftDistance px, incoming word starts at +shiftDistance px.
   * Default: 12px (between 8-16px)
   */
  shiftDistance?: number;
  /**
   * Optional punctuation or suffix appended to each word (e.g. ".").
   * Default: ""
   */
  suffix?: string;
  /**
   * Hex or CSS color for the rotating keyword.
   * Probe's bright electric-blue accent. Default: "#0091FF"
   */
  highlightColor?: string;
  /**
   * Optional container className for additional alignment or responsive styling.
   */
  className?: string;
  /**
   * Optional className applied to the individual word element.
   */
  wordClassName?: string;
  /**
   * Text alignment within the reserved box: 'center' | 'left' | 'right'.
   * Default: 'center'
   */
  align?: 'center' | 'left' | 'right';
}

const DEFAULT_WORDS = ['Validate', 'Challenge', 'Discover', 'Refine'];

export const RotatingHighlightWord: React.FC<RotatingHighlightWordProps> = ({
  words = DEFAULT_WORDS,
  holdDuration = 2500,
  transitionDuration = 400,
  shiftDistance = 12,
  suffix = '',
  highlightColor = '#1E65F6',
  className = '',
  wordClassName = '',
  align = 'center',
}) => {
  // Ensure we have a valid non-empty list of words
  const validWords = useMemo(
    () => (words && words.length > 0 ? words : DEFAULT_WORDS),
    [words]
  );

  // Reduced motion preference detection
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  // Animation cycle state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitingIndex, setExitingIndex] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Transition timer refs
  const holdTimerRef = useRef<number | null>(null);
  const animTimerRef = useRef<number | null>(null);

  // Clear pending timers safely
  const clearTimers = () => {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (animTimerRef.current !== null) {
      window.clearTimeout(animTimerRef.current);
      animTimerRef.current = null;
    }
  };

  useEffect(() => {
    // If reduced motion is preferred or we only have one word, remain static on word 0
    if (prefersReducedMotion || validWords.length <= 1) {
      clearTimers();
      setCurrentIndex(0);
      setExitingIndex(null);
      setIsTransitioning(false);
      return;
    }

    let isSubscribed = true;

    const scheduleNextWord = () => {
      clearTimers();

      holdTimerRef.current = window.setTimeout(() => {
        if (!isSubscribed) return;

        // Determine next word in sequence
        const nextIndex = (currentIndex + 1) % validWords.length;
        setExitingIndex(currentIndex);
        setCurrentIndex(nextIndex);
        setIsTransitioning(true);

        // Schedule transition completion
        animTimerRef.current = window.setTimeout(() => {
          if (!isSubscribed) return;
          setExitingIndex(null);
          setIsTransitioning(false);
        }, transitionDuration);
      }, holdDuration);
    };

    // Pause when tab is not visible to prevent abrupt skips
    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearTimers();
      } else {
        scheduleNextWord();
      }
    };

    scheduleNextWord();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isSubscribed = false;
      clearTimers();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentIndex, validWords, holdDuration, transitionDuration, prefersReducedMotion]);

  // Alignment classes for the grid cell
  const justifyClass = 
    align === 'left' 
      ? 'justify-items-start text-left' 
      : align === 'right' 
      ? 'justify-items-end text-right' 
      : 'justify-items-center text-center';

  // Current display items
  const currentWord = validWords[currentIndex];
  const exitingWord = exitingIndex !== null ? validWords[exitingIndex] : null;

  return (
    <span
      className={`inline-grid [grid-template-areas:'rotating-slot'] relative overflow-hidden align-baseline ${justifyClass} ${className}`}
      style={{
        verticalAlign: 'baseline',
        // Inject dynamic shift distance & transition timing into CSS variables
        ['--probe-shift-y' as any]: `${shiftDistance}px`,
        ['--probe-anim-duration' as any]: `${transitionDuration}ms`,
      }}
    >
      {/* 1. ACCESSIBLE SCREEN-READER ONLY ANNOUNCEMENT (No 2.5s updates to avoid screen-reader spam) */}
      <span className="sr-only">
        {validWords.join(', ')}
      </span>

      {/* 2. INVISIBLE SIZER: Stack all words into the same grid cell.
          Because all words are in grid-area: rotating-slot without display:none,
          the grid column automatically resolves to max-content (the exact width of the widest word).
          This completely eliminates any layout shift or jumps across all breakpoints and font renderings. */}
      {validWords.map((word, idx) => (
        <span
          key={`probe-sizer-${word}-${idx}`}
          className="[grid-area:rotating-slot] invisible select-none pointer-events-none whitespace-nowrap block"
          aria-hidden="true"
        >
          {word}
          {suffix}
        </span>
      ))}

      {/* 3. OUTGOING WORD (moves UP by shiftDistance while fading to 0) */}
      {!prefersReducedMotion && exitingWord !== null && (
        <span
          key={`probe-exit-${exitingIndex}`}
          className={`[grid-area:rotating-slot] whitespace-nowrap block will-change-transform ${wordClassName}`}
          style={{
            color: highlightColor,
            animation: `probeHighlightWordExit var(--probe-anim-duration, 400ms) cubic-bezier(0.22, 1, 0.36, 1) forwards`,
          }}
          aria-hidden="true"
        >
          {exitingWord}
          {suffix}
        </span>
      )}

      {/* 4. INCOMING / STEADY WORD (moves UP from +shiftDistance into place while fading to 1, or static) */}
      <span
        key={`probe-current-${currentIndex}`}
        className={`[grid-area:rotating-slot] whitespace-nowrap block will-change-transform ${wordClassName}`}
        style={{
          color: highlightColor,
          animation: !prefersReducedMotion && isTransitioning
            ? `probeHighlightWordEnter var(--probe-anim-duration, 400ms) cubic-bezier(0.22, 1, 0.36, 1) forwards`
            : undefined,
        }}
        aria-hidden="true"
      >
        {currentWord}
        {suffix}
      </span>

      {/* Embedded pristine scoped keyframes */}
      <style>{`
        @keyframes probeHighlightWordExit {
          0% {
            transform: translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateY(calc(-1 * var(--probe-shift-y, 12px)));
            opacity: 0;
          }
        }

        @keyframes probeHighlightWordEnter {
          0% {
            transform: translateY(var(--probe-shift-y, 12px));
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .probe-highlight-word-anim {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </span>
  );
};

export default RotatingHighlightWord;
