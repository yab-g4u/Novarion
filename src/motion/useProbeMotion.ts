import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger, isReducedMotion } from './gsapConfig';

interface ProbeMotionOptions {
  scope?: React.RefObject<HTMLElement | null>;
  dependencies?: any[];
  revertOnUnmount?: boolean;
}

export function useProbeMotion(
  animationCallback: (context: {
    isReduced: boolean;
    mm: gsap.MatchMedia;
  }) => void | (() => void),
  { scope, dependencies = [], revertOnUnmount = true }: ProbeMotionOptions = {}
) {
  const cleanupCallbackRef = useRef<(() => void) | void>(undefined);

  useEffect(() => {
    const isReduced = isReducedMotion();
    const mm = gsap.matchMedia(scope?.current ? { scope: scope.current } : undefined);

    const ctx = gsap.context(() => {
      cleanupCallbackRef.current = animationCallback({ isReduced, mm });
    }, scope?.current || undefined);

    return () => {
      if (typeof cleanupCallbackRef.current === 'function') {
        cleanupCallbackRef.current();
      }
      if (revertOnUnmount) {
        ctx.revert();
        mm.revert();
      }
    };
  }, dependencies);
}

export default useProbeMotion;
