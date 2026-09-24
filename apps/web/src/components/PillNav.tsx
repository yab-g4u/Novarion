import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { gsap } from 'gsap';
import './PillNav.css';

export interface PillNavItem {
  label: string;
  href: string;
  ariaLabel?: string;
}

export interface PillNavProps {
  logo?: string;
  logoAlt?: string;
  items: PillNavItem[];
  activeHref?: string;
  className?: string;
  ease?: string;
  baseColor?: string;
  pillColor?: string;
  hoveredPillTextColor?: string;
  pillTextColor?: string;
  onMobileMenuClick?: () => void;
  initialLoadAnimation?: boolean;
  onItemClick?: (item: PillNavItem) => void;
}

export const PillNav: React.FC<PillNavProps> = ({
  logo = '/probe-logo.svg',
  logoAlt = 'Probe',
  items,
  activeHref,
  className = '',
  ease = 'power3.easeOut',
  baseColor = '#0A0D14',
  pillColor = '#ffffff',
  hoveredPillTextColor = '#ffffff',
  pillTextColor,
  onMobileMenuClick,
  initialLoadAnimation = true,
  onItemClick
}) => {
  const resolvedPillTextColor = pillTextColor ?? baseColor;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const circleRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const tlRefs = useRef<(gsap.core.Timeline | null)[]>([]);
  const activeTweenRefs = useRef<(gsap.core.Tween | null)[]>([]);
  const logoImgRef = useRef<HTMLImageElement | null>(null);
  const logoTweenRef = useRef<gsap.core.Tween | null>(null);
  const hamburgerRef = useRef<HTMLButtonElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const navItemsRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const layout = () => {
      circleRefs.current.forEach(circle => {
        if (!circle?.parentElement) return;

        const pill = circle.parentElement;
        const rect = pill.getBoundingClientRect();
        const { width: w, height: h } = rect;
        const R = ((w * w) / 4 + h * h) / (2 * h);
        const D = Math.ceil(2 * R) + 2;
        const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
        const originY = D - delta;

        circle.style.width = `${D}px`;
        circle.style.height = `${D}px`;
        circle.style.bottom = `-${delta}px`;

        gsap.set(circle, {
          xPercent: -50,
          scale: 0,
          transformOrigin: `50% ${originY}px`
        });

        const label = pill.querySelector('.pill-label');
        const white = pill.querySelector('.pill-label-hover');

        if (label) gsap.set(label, { y: 0 });
        if (white) gsap.set(white, { y: h + 12, opacity: 0 });

        const index = circleRefs.current.indexOf(circle);
        if (index === -1) return;

        tlRefs.current[index]?.kill();
        const tl = gsap.timeline({ paused: true });

        tl.to(circle, { scale: 1.2, xPercent: -50, duration: 0.4, ease, overwrite: 'auto' }, 0);

        if (label) {
          tl.to(label, { y: -(h + 6), duration: 0.3, ease, overwrite: 'auto' }, 0);
        }

        if (white) {
          gsap.set(white, { y: Math.ceil(h + 20), opacity: 0 });
          tl.to(white, { y: 0, opacity: 1, duration: 0.3, ease, overwrite: 'auto' }, 0);
        }

        tlRefs.current[index] = tl;
      });
    };

    layout();

    const onResize = () => layout();
    window.addEventListener('resize', onResize);

    if (document.fonts?.ready) {
      document.fonts.ready.then(layout).catch(() => {});
    }

    const menu = mobileMenuRef.current;
    if (menu) {
      gsap.set(menu, { visibility: 'hidden', opacity: 0, scaleY: 1 });
    }

    if (initialLoadAnimation) {
      const logoEl = logoRef.current;
      const navItems = navItemsRef.current;

      if (logoEl) {
        gsap.set(logoEl, { scale: 0.8, opacity: 0 });
        gsap.to(logoEl, {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          ease
        });
      }

      if (navItems) {
        gsap.fromTo(
          navItems,
          { y: -10, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease }
        );
      }
    }

    return () => window.removeEventListener('resize', onResize);
  }, [items, ease, initialLoadAnimation]);

  const handleEnter = (i: number) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(tl.duration(), {
      duration: 0.3,
      ease,
      overwrite: 'auto'
    });
  };

  const handleLeave = (i: number) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(0, {
      duration: 0.2,
      ease,
      overwrite: 'auto'
    });
  };

  const handleLogoEnter = () => {
    const img = logoImgRef.current;
    if (!img) return;
    logoTweenRef.current?.kill();
    gsap.set(img, { rotate: 0 });
    logoTweenRef.current = gsap.to(img, {
      rotate: 360,
      duration: 0.5,
      ease: 'power2.out',
      overwrite: 'auto'
    });
  };

  const toggleMobileMenu = () => {
    const newState = !isMobileMenuOpen;
    setIsMobileMenuOpen(newState);

    const hamburger = hamburgerRef.current;
    const menu = mobileMenuRef.current;

    if (hamburger) {
      const lines = hamburger.querySelectorAll('.hamburger-line');
      if (lines.length >= 2) {
        if (newState) {
          gsap.to(lines[0], { rotation: 45, y: 3, duration: 0.3, ease });
          gsap.to(lines[1], { rotation: -45, y: -3, duration: 0.3, ease });
        } else {
          gsap.to(lines[0], { rotation: 0, y: 0, duration: 0.3, ease });
          gsap.to(lines[1], { rotation: 0, y: 0, duration: 0.3, ease });
        }
      }
    }

    if (menu) {
      if (newState) {
        gsap.set(menu, { visibility: 'visible' });
        gsap.fromTo(
          menu,
          { opacity: 0, y: 10, scaleY: 1 },
          {
            opacity: 1,
            y: 0,
            scaleY: 1,
            duration: 0.3,
            ease,
            transformOrigin: 'top center'
          }
        );
      } else {
        gsap.to(menu, {
          opacity: 0,
          y: 10,
          scaleY: 1,
          duration: 0.2,
          ease,
          transformOrigin: 'top center',
          onComplete: () => {
            gsap.set(menu, { visibility: 'hidden' });
          }
        });
      }
    }

    onMobileMenuClick?.();
  };

  const isExternalLink = (href: string) =>
    !href ||
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('//') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('#');

  const isRouterLink = (href: string) => !isExternalLink(href);

  const handleClick = (e: React.MouseEvent, item: PillNavItem) => {
    if (onItemClick) {
      onItemClick(item);
    }
    if (item.href.startsWith('#')) {
      e.preventDefault();
      const targetId = item.href.slice(1);
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      } else if (item.href === '#' || targetId === '') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const cssVars = {
    ['--base' as any]: baseColor,
    ['--pill-bg' as any]: pillColor,
    ['--hover-text' as any]: hoveredPillTextColor,
    ['--pill-text' as any]: resolvedPillTextColor
  };

  return (
    <div className={`pill-nav-container ${className}`} style={cssVars}>
      {/* 1. FAR LEFT: PROBE LOGO */}
      <div className="pill-logo-wrapper">
        <a
          className="pill-logo"
          href="#"
          aria-label={logoAlt}
          onMouseEnter={handleLogoEnter}
          onClick={(e) => handleClick(e, { label: 'Home', href: '#' })}
          ref={el => {
            logoRef.current = el;
          }}
        >
          <img src={logo} alt={logoAlt} ref={logoImgRef} />
          <span className="pill-logo-text">PROBE</span>
        </a>
      </div>

      {/* 2. EXACT CENTER: MENU ITEMS WITH VISIBLE GAP */}
      <div className="pill-nav-center desktop-only">
        <div className="pill-nav-items" ref={navItemsRef}>
          <ul className="pill-list" role="menubar">
            {items.map((item, i) => {
              const isActive = activeHref === item.href;
              return (
                <li key={item.href || `item-${i}`} role="none">
                  {isRouterLink(item.href) ? (
                    <Link
                      role="menuitem"
                      to={item.href}
                      className={`pill${isActive ? ' is-active' : ''}`}
                      aria-label={item.ariaLabel || item.label}
                      onMouseEnter={() => handleEnter(i)}
                      onMouseLeave={() => handleLeave(i)}
                      onClick={(e) => handleClick(e, item)}
                    >
                      <span
                        className="hover-circle"
                        aria-hidden="true"
                        ref={el => {
                          circleRefs.current[i] = el;
                        }}
                      />
                      <span className="label-stack">
                        <span className="pill-label">{item.label}</span>
                        <span className="pill-label-hover" aria-hidden="true">
                          {item.label}
                        </span>
                      </span>
                    </Link>
                  ) : (
                    <a
                      role="menuitem"
                      href={item.href}
                      className={`pill${isActive ? ' is-active' : ''}`}
                      aria-label={item.ariaLabel || item.label}
                      onMouseEnter={() => handleEnter(i)}
                      onMouseLeave={() => handleLeave(i)}
                      onClick={(e) => handleClick(e, item)}
                    >
                      <span
                        className="hover-circle"
                        aria-hidden="true"
                        ref={el => {
                          circleRefs.current[i] = el;
                        }}
                      />
                      <span className="label-stack">
                        <span className="pill-label">{item.label}</span>
                        <span className="pill-label-hover" aria-hidden="true">
                          {item.label}
                        </span>
                      </span>
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* 3. FAR RIGHT: GITHUB LINK & MOBILE HAMBURGER */}
      <div className="pill-right-wrapper">
        <a
          href="https://github.com/yab-g4u/Novarion.git"
          target="_blank"
          rel="noreferrer"
          className="github-nav-link desktop-only"
        >
          <span>GitHub</span>
          <ExternalLink size={12} className="opacity-70" />
        </a>

        <button
          className="mobile-menu-button mobile-only"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
          ref={hamburgerRef}
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>
      </div>

      {/* MOBILE POPOVER MENU */}
      <div className="mobile-menu-popover mobile-only" ref={mobileMenuRef}>
        <ul className="mobile-menu-list">
          {items.map((item, i) => (
            <li key={item.href || `mobile-item-${i}`}>
              <a
                href={item.href}
                className={`mobile-menu-link${activeHref === item.href ? ' is-active' : ''}`}
                onClick={(e) => {
                  setIsMobileMenuOpen(false);
                  handleClick(e, item);
                }}
              >
                <span>{item.label}</span>
                <span className="text-[10px] text-zinc-400">→</span>
              </a>
            </li>
          ))}
          <li className="pt-2 border-t border-white/10 mt-1">
            <a
              href="https://github.com/yab-g4u/Novarion.git"
              target="_blank"
              rel="noreferrer"
              className="mobile-menu-link text-[#E5E7EB]"
            >
              <span>GitHub Repository</span>
              <ExternalLink size={13} />
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default PillNav;
