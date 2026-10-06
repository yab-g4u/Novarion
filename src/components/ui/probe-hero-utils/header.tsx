import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight, Compass, User, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ProbeLogo } from '@/components/ProbeLogo';
import { AuthUser, getCurrentUser, subscribeToAuthState } from '@/lib/auth/authService';

export interface NavigationItem {
  title: string;
  href: string;
  isActive?: boolean;
}

interface HeaderProps {
  navigationData?: NavigationItem[];
  onTryProbe?: () => void;
  onNavigate?: (href: string) => void;
}

const DEFAULT_NAV: NavigationItem[] = [
  { title: 'Investigation', href: '#live-investigation' },
  { title: 'Evidence Graph', href: '#section-evidence-graph' },
  { title: 'Product Testing', href: '#section-testing' },
];

export const Header: React.FC<HeaderProps> = ({
  navigationData = DEFAULT_NAV,
  onTryProbe,
  onNavigate,
}) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('probe_auth_user');
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    void getCurrentUser().then((currentUser) => {
      if (currentUser) setUser(currentUser);
    });

    const unsubscribe = subscribeToAuthState((updatedUser) => {
      setUser(updatedUser);
    });

    return () => unsubscribe();
  }, []);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    if (onNavigate) {
      onNavigate(href);
      return;
    }

    if (href.startsWith('#')) {
      const targetId = href.replace('#', '');
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleTryClick = () => {
    setMobileMenuOpen(false);
    if (onTryProbe) {
      onTryProbe();
      return;
    }
    const el = document.getElementById('section-search');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full px-4 pt-4 sm:px-6 lg:px-8 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Probe Logo & Wordmark */}
        <a
          href="#"
          className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F52BA] rounded-lg"
          aria-label="Probe Home"
        >
          <div className="w-8 h-8 rounded-lg bg-[#0A0D14] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform p-1">
            <ProbeLogo className="w-5 h-5" inverted />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-extrabold tracking-tight text-base text-[#0A0D14] font-['Geist',sans-serif]">
              PROBE
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono uppercase tracking-widest text-[#868C98] font-semibold">
              Research
            </span>
          </div>
        </a>

        {/* Desktop Navigation */}
        <nav
          className="hidden md:flex items-center gap-1 bg-[#F1F3F5]/80 p-1 rounded-full border border-[#E5E7EB]"
          aria-label="Main Navigation"
        >
          {navigationData.map((item) => (
            <a
              key={item.title}
              href={item.href}
              onClick={(e) => handleLinkClick(e, item.href)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium font-['Geist',sans-serif] transition-all ${
                item.isActive
                  ? 'bg-white text-[#0A0D14] font-semibold shadow-xs'
                  : 'text-[#525866] hover:text-[#0A0D14] hover:bg-white/60'
              }`}
            >
              {item.title}
            </a>
          ))}
        </nav>

        {/* CTA & Mobile Trigger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <Link
              to="/app"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] text-xs font-semibold text-[#0A0D14] shadow-2xs transition-all"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name || 'User'}
                  className="w-5 h-5 rounded-full object-cover border border-[#E5E7EB]"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-[#0A0D14] text-white flex items-center justify-center text-[10px]">
                  {user.name ? user.name.charAt(0).toUpperCase() : <User size={10} />}
                </div>
              )}
              <span className="hidden sm:inline">Workspace</span>
            </Link>
          ) : (
            <Link
              to="/signin"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#525866] hover:text-[#0A0D14] hover:bg-[#F1F3F5] transition-colors"
            >
              <LogIn size={13} />
              <span>Sign in</span>
            </Link>
          )}

          <Button
            onClick={handleTryClick}
            className="hidden sm:inline-flex bg-[#0A0D14] hover:bg-[#1E293B] text-white text-xs font-semibold px-4 h-9 rounded-xl shadow-xs transition-all cursor-pointer items-center gap-1.5"
          >
            <span>Start investigating</span>
            <ArrowRight size={13} className="text-[#94A3B8]" />
          </Button>

          {/* Mobile Navigation Drawer via shadcn Sheet */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="md:hidden h-9 w-9 rounded-xl border-[#E5E7EB] bg-white text-[#0A0D14]"
                aria-label="Open Navigation Menu"
              >
                <Menu size={18} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px] bg-white p-6">
              <SheetHeader className="text-left border-b border-[#F1F3F5] pb-4 mb-4">
                <SheetTitle className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#0A0D14] flex items-center justify-center text-white p-1">
                    <ProbeLogo className="w-4 h-4" inverted />
                  </div>
                  <span className="font-extrabold text-sm tracking-tight text-[#0A0D14]">
                    PROBE
                  </span>
                </SheetTitle>
              </SheetHeader>

              <div className="flex flex-col gap-2 py-2">
                {navigationData.map((item) => (
                  <a
                    key={item.title}
                    href={item.href}
                    onClick={(e) => handleLinkClick(e, item.href)}
                    className="px-3 py-2.5 rounded-xl text-sm font-medium text-[#334155] hover:text-[#0A0D14] hover:bg-[#F8FAFC] transition-colors"
                  >
                    {item.title}
                  </a>
                ))}

                <div className="pt-4 border-t border-[#F1F3F5] mt-2 space-y-2">
                  {user ? (
                    <Link
                      to="/app"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full flex items-center justify-center gap-2 border border-[#E5E7EB] bg-white text-[#0A0D14] text-xs font-semibold h-10 rounded-xl"
                    >
                      <User size={13} />
                      <span>Open Workspace ({user.name || 'Founder'})</span>
                    </Link>
                  ) : (
                    <Link
                      to="/signin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full flex items-center justify-center gap-2 border border-[#E5E7EB] bg-white text-[#0A0D14] text-xs font-semibold h-10 rounded-xl"
                    >
                      <LogIn size={13} />
                      <span>Sign In</span>
                    </Link>
                  )}
                  <Button
                    onClick={handleTryClick}
                    className="w-full bg-[#0A0D14] hover:bg-[#1E293B] text-white text-xs font-semibold h-10 rounded-xl"
                  >
                    <span>Start investigating</span>
                    <ArrowRight size={13} className="ml-1 text-[#94A3B8]" />
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
