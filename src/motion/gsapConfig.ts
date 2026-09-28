import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

// Register core plugins once
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);
  (window as any).gsap = gsap;
}

export const EASE = {
  smooth: 'power3.out',
  smoothInOut: 'power3.inOut',
  expo: 'expo.out',
  sine: 'sine.inOut',
  bounceSoft: 'back.out(1.2)',
};

export const DURATION = {
  micro: 0.35,
  standard: 0.7,
  reveal: 1.0,
  narrative: 2.5,
};

export const isReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

let refreshTimeout: number | undefined;
export const safeRefreshScrollTrigger = (delayMs = 150) => {
  if (typeof window === 'undefined') return;
  if (refreshTimeout) window.clearTimeout(refreshTimeout);
  refreshTimeout = window.setTimeout(() => {
    ScrollTrigger.refresh();
  }, delayMs);
};

export { gsap, ScrollTrigger, MotionPathPlugin };
