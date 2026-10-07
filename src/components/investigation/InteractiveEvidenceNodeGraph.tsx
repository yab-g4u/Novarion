import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  ChevronDown, 
  ExternalLink, 
  Star, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  HelpCircle, 
  TrendingUp, 
  Move,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  GripHorizontal,
  ChevronRight,
  ChevronLeft,
  AlertTriangle
} from 'lucide-react';
import { RadialEvidenceItem } from '../../lib/research/dynamicInvestigationResolver';
import { ScholarXivLogo } from '../ScholarXivLogo';

interface InteractiveEvidenceNodeGraphProps {
  ideaText: string;
  supportItems: RadialEvidenceItem[];
  contradictItems: RadialEvidenceItem[];
  unknownItem?: RadialEvidenceItem;
  isThinking?: boolean;
  thinkingStep?: number;
  onSelectSource?: (source: RadialEvidenceItem) => void;
  className?: string;
}

interface Point {
  x: number;
  y: number;
}

const DEFAULT_OFFSETS: Record<string, Point> = {
  idea: { x: 0, y: 0 },
  unknown: { x: 0, y: 0 },
  support_0: { x: 0, y: 0 },
  support_1: { x: 0, y: 0 },
  support_2: { x: 0, y: 0 },
  contradict_0: { x: 0, y: 0 },
  contradict_1: { x: 0, y: 0 },
  contradict_2: { x: 0, y: 0 },
};

// Canvas geometry constants (compact 880px coordinate system)
const CANVAS_WIDTH = 880;
const CANVAS_HEIGHT = 520;

export const InteractiveEvidenceNodeGraph: React.FC<InteractiveEvidenceNodeGraphProps> = ({
  ideaText,
  supportItems,
  contradictItems,
  unknownItem,
  isThinking = false,
  thinkingStep = 5,
  onSelectSource,
  className = ''
}) => {
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [nodeOffsets, setNodeOffsets] = useState<Record<string, Point>>(DEFAULT_OFFSETS);
  const [containerWidth, setContainerWidth] = useState<number>(880);
  const [isFitMode, setIsFitMode] = useState<boolean>(true);
  const [manualScale, setManualScale] = useState<number | null>(null);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [activeDraggingNode, setActiveDraggingNode] = useState<string | null>(null);
  const [scrollPercentage, setScrollPercentage] = useState<number>(0);
  const [isScrollable, setIsScrollable] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const hasRecentlyDraggedRef = useRef<boolean>(false);

  const panStartRef = useRef<{ mouseX: number; mouseY: number; startPanX: number; startPanY: number }>({
    mouseX: 0,
    mouseY: 0,
    startPanX: 0,
    startPanY: 0,
  });

  const nodeDragStartRef = useRef<{
    nodeKey: string;
    startX: number;
    startY: number;
    startOffsetX: number;
    startOffsetY: number;
    hasMoved: boolean;
  } | null>(null);

  // Measure container width to auto-fit graph
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateWidth = () => {
      const w = el.clientWidth || 880;
      setContainerWidth(w);
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  // Compute scale: if fit mode, dynamically scale 880px canvas to fit container
  const effectiveScale = useMemo(() => {
    if (manualScale !== null) return manualScale;
    if (isFitMode && containerWidth > 0) {
      // 880px is base canvas width, allow 16px safe margin
      const fit = (containerWidth - 16) / CANVAS_WIDTH;
      // Allow scale from 0.45 up to 1.0 so even mobile screens fit all nodes without clipping
      return Math.min(1.0, Math.max(0.48, fit));
    }
    return 1.0;
  }, [containerWidth, isFitMode, manualScale]);

  // Track horizontal scroll position of the canvas container
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll > 10) {
      setIsScrollable(true);
      setScrollPercentage(Math.round((el.scrollLeft / maxScroll) * 100));
    } else {
      setIsScrollable(false);
      setScrollPercentage(0);
    }
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    handleScroll();
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll, effectiveScale, containerWidth]);

  // Smooth scroll to sections: 'support', 'center', or 'contradict'
  const scrollToSection = (section: 'support' | 'center' | 'contradict') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    
    // If in fit mode and scaled down, switch to 100% zoom first so scrolling can focus
    if (isFitMode && effectiveScale < 0.9) {
      setIsFitMode(false);
      setManualScale(1.0);
    }

    setTimeout(() => {
      if (!scrollContainerRef.current) return;
      const targetEl = scrollContainerRef.current;
      const maxScroll = targetEl.scrollWidth - targetEl.clientWidth;

      if (section === 'support') {
        targetEl.scrollTo({ left: 0, behavior: 'smooth' });
      } else if (section === 'center') {
        targetEl.scrollTo({ left: Math.max(0, maxScroll / 2), behavior: 'smooth' });
      } else if (section === 'contradict') {
        targetEl.scrollTo({ left: maxScroll, behavior: 'smooth' });
      }
    }, 50);
  };

  const handleSliderScroll = (val: number) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    el.scrollLeft = (val / 100) * maxScroll;
    setScrollPercentage(val);
  };

  const toggleCardExpand = (id?: string) => {
    if (!id) return;
    setExpandedCardId((prev) => (prev === id ? null : id));
  };

  const handleReset = () => {
    setNodeOffsets(DEFAULT_OFFSETS);
    setPan({ x: 0, y: 0 });
    setManualScale(null);
    setIsFitMode(true);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  const handleZoomIn = () => {
    setIsFitMode(false);
    setManualScale((prev) => Math.min(1.4, (prev ?? effectiveScale) + 0.1));
  };

  const handleZoomOut = () => {
    setIsFitMode(false);
    setManualScale((prev) => Math.max(0.5, (prev ?? effectiveScale) - 0.1));
  };

  const toggleFitMode = () => {
    if (isFitMode) {
      setIsFitMode(false);
      setManualScale(1.0);
    } else {
      setIsFitMode(true);
      setManualScale(null);
      setPan({ x: 0, y: 0 });
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      }
    }
  };

  // Canvas Pan Handlers
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.evidence-card-node') || target.closest('.graph-toolbar') || target.closest('button')) {
      return;
    }

    e.preventDefault();
    setIsPanning(true);
    panStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
    };
  };

  // Node Drag Handler (Works directly on the entire card + on grip handles)
  const handleNodeDragStart = (
    nodeKey: string,
    clientX: number,
    clientY: number,
    e?: React.MouseEvent | React.TouchEvent
  ) => {
    const target = (e?.target as HTMLElement) || null;
    // Don't drag if user clicked an explicit link or inspect button
    if (target && (target.closest('a') || target.closest('button') || target.closest('.no-drag'))) {
      return;
    }

    const current = nodeOffsets[nodeKey] || { x: 0, y: 0 };
    nodeDragStartRef.current = {
      nodeKey,
      startX: clientX,
      startY: clientY,
      startOffsetX: current.x,
      startOffsetY: current.y,
      hasMoved: false,
    };
    setActiveDraggingNode(nodeKey);
  };

  // Global mouse move & touch move for smooth dragging
  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    // 1. Handle node dragging
    if (nodeDragStartRef.current) {
      const { nodeKey, startX, startY, startOffsetX, startOffsetY } = nodeDragStartRef.current;
      const dx = (clientX - startX) / effectiveScale;
      const dy = (clientY - startY) / effectiveScale;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        nodeDragStartRef.current.hasMoved = true;
        hasRecentlyDraggedRef.current = true;
      }

      setNodeOffsets((prev) => ({
        ...prev,
        [nodeKey]: {
          x: Math.round(startOffsetX + dx),
          y: Math.round(startOffsetY + dy),
        },
      }));
      return;
    }

    // 2. Handle canvas panning
    if (isPanning) {
      const dx = clientX - panStartRef.current.mouseX;
      const dy = clientY - panStartRef.current.mouseY;
      setPan({
        x: panStartRef.current.startPanX + dx,
        y: panStartRef.current.startPanY + dy,
      });
    }
  }, [effectiveScale, isPanning]);

  const handlePointerUp = useCallback(() => {
    if (nodeDragStartRef.current) {
      if (nodeDragStartRef.current.hasMoved) {
        setTimeout(() => {
          hasRecentlyDraggedRef.current = false;
        }, 80);
      } else {
        hasRecentlyDraggedRef.current = false;
      }
      nodeDragStartRef.current = null;
      setActiveDraggingNode(null);
    }
    if (isPanning) {
      setIsPanning(false);
    }
  }, [isPanning]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handlePointerMove(e.clientX, e.clientY);
    const onMouseUp = () => handlePointerUp();

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onTouchEnd = () => handlePointerUp();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [handlePointerMove, handlePointerUp]);

  // Touch Panning on empty canvas
  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.evidence-card-node') || target.closest('button')) {
      return;
    }
    if (e.touches.length === 1) {
      const t = e.touches[0];
      panStartRef.current = {
        mouseX: t.clientX,
        mouseY: t.clientY,
        startPanX: pan.x,
        startPanY: pan.y,
      };
      setIsPanning(true);
    }
  };

  const renderIcon = (source: string) => {
    switch (source) {
      case 'reddit':
        return (
          <div className="relative w-7 h-7 rounded-full bg-[#FF4500] text-white flex items-center justify-center shrink-0 shadow-2xs">
            <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
              <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.703z"/>
            </svg>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#10B981] ring-2 ring-white" />
          </div>
        );
      case 'github':
        return (
          <div className="relative w-7 h-7 rounded-full bg-[#0A0D14] text-white flex items-center justify-center shrink-0 shadow-2xs">
            <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#10B981] ring-2 ring-white" />
          </div>
        );
      case 'google':
      case 'searxng':
        return (
          <div className="relative w-7 h-7 rounded-full bg-white border border-[#E5E7EB] text-[#EA4335] flex items-center justify-center shrink-0 shadow-2xs">
            <svg className="w-3 h-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#10B981] ring-2 ring-white" />
          </div>
        );
      case 'x':
        return (
          <div className="relative w-7 h-7 rounded-full bg-[#0A0D14] text-white flex items-center justify-center shrink-0 shadow-2xs">
            <svg className="w-3 h-3 fill-white" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-white" />
          </div>
        );
      case 'reviews':
        return (
          <div className="relative w-7 h-7 rounded-full bg-[#FFFBEB] border border-[#FDE68A] text-[#F59E0B] flex items-center justify-center shrink-0 shadow-2xs">
            <Star size={13} className="fill-[#F59E0B]" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-white" />
          </div>
        );
      case 'scholarxiv':
        return (
          <div className="relative w-7 h-7 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center shrink-0 shadow-2xs">
            <ScholarXivLogo className="w-3.5 h-3.5 text-[#2563EB]" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-white" />
          </div>
        );
      default:
        return (
          <div className="relative w-7 h-7 rounded-full bg-[#F3F4F6] text-[#6B7280] flex items-center justify-center shrink-0 shadow-2xs">
            <HelpCircle size={13} />
          </div>
        );
    }
  };

  const renderExpandedDetails = (item: RadialEvidenceItem) => {
    if (expandedCardId !== item.id) return null;

    return (
      <div className="mt-2.5 pt-2 border-t border-[#E5E7EB] text-left text-xs space-y-1.5 animate-in fade-in duration-200 no-drag">
        <div className="flex items-center justify-between text-[10px] font-mono text-[#64748B]">
          <span>{item.author ? `By ${item.author}` : item.subHeader}</span>
          {item.confidence && (
            <span className="font-semibold text-[#0A0D14] bg-[#F1F5F9] px-1.5 py-0.5 rounded">
              {item.confidence}% confidence
            </span>
          )}
        </div>

        {item.takeaway && (
          <p className="text-[11px] text-[#0A0D14] font-medium bg-[#F8FAFC] p-2 rounded-lg border border-[#E2E8F0]">
            {item.takeaway}
          </p>
        )}

        <div className="flex items-center justify-between pt-1 text-[11px]">
          {item.url && item.url !== '#' ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[#2563EB] hover:underline flex items-center gap-1 font-mono text-[10px]"
            >
              <span>Source URL</span>
              <ExternalLink size={10} />
            </a>
          ) : (
            <span className="text-[10px] font-mono text-[#94A3B8]">Verified Source</span>
          )}

          {onSelectSource && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectSource(item);
              }}
              className="text-[10px] font-mono text-[#0A0D14] hover:underline font-semibold cursor-pointer"
            >
              Inspect Source →
            </button>
          )}
        </div>
      </div>
    );
  };

  // Dynamic calculated coordinates for SVG lines (matching 880px compact canvas)
  const ideaOffset = nodeOffsets.idea || { x: 0, y: 0 };
  const ideaCenter = {
    x: 320 + ideaOffset.x,
    y: 180 + ideaOffset.y,
  };

  const ideaLeftAnchor = { x: ideaCenter.x, y: ideaCenter.y + 55 };
  const ideaRightAnchor = { x: ideaCenter.x + 220, y: ideaCenter.y + 55 };
  const ideaBottomAnchor = { x: ideaCenter.x + 110, y: ideaCenter.y + 115 };

  const getLeftNodeAnchor = (idx: number) => {
    const defaultY = [75, 240, 405][idx] || 240;
    const offset = nodeOffsets[`support_${idx}`] || { x: 0, y: 0 };
    return {
      x: 279 + offset.x,
      y: defaultY + offset.y,
    };
  };

  const getRightNodeAnchor = (idx: number) => {
    const defaultY = [75, 240, 405][idx] || 240;
    const offset = nodeOffsets[`contradict_${idx}`] || { x: 0, y: 0 };
    const leftBase = expandedCardId === contradictItems[idx]?.id ? 545 : 590;
    return {
      x: leftBase + offset.x,
      y: defaultY + offset.y,
    };
  };

  const unknownOffset = nodeOffsets.unknown || { x: 0, y: 0 };
  const unknownAnchor = {
    x: 430 + unknownOffset.x,
    y: 410 + unknownOffset.y,
  };

  return (
    <div ref={containerRef} className={`w-full select-none ${className}`}>
      {/* Top Embedded CSS for custom high-visibility scrollbar */}
      <style>{`
        .topology-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #94A3B8 #F1F5F9;
        }
        .topology-scrollbar::-webkit-scrollbar {
          height: 9px;
        }
        .topology-scrollbar::-webkit-scrollbar-track {
          background: #F1F5F9;
          border-radius: 6px;
        }
        .topology-scrollbar::-webkit-scrollbar-thumb {
          background: #94A3B8;
          border-radius: 6px;
          border: 2px solid #F1F5F9;
        }
        .topology-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748B;
        }
      `}</style>

      {/* TOOLBAR CONTROLS: Quick Section Jumpers + Zoom / Fit / Reset */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-[#F1F3F5] text-xs font-mono graph-toolbar">
        {/* Quick Branch Navigation Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <button
            type="button"
            onClick={() => scrollToSection('support')}
            className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-medium flex items-center gap-1.5 bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] hover:bg-[#D1FAE5] transition-colors cursor-pointer shrink-0 shadow-2xs"
            title="Focus on Supporting Evidence"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            <span>← Support ({supportItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => scrollToSection('center')}
            className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-medium flex items-center gap-1.5 bg-white text-[#0A0D14] border border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors cursor-pointer shrink-0 shadow-2xs"
            title="Center on Hypothesis Idea"
          >
            <span>• Hypothesis</span>
          </button>

          <button
            type="button"
            onClick={() => scrollToSection('contradict')}
            className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] hover:bg-[#FEE2E2] transition-colors cursor-pointer shrink-0 shadow-2xs"
            title="Focus on Contradicting Evidence"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-pulse" />
            <span>Contradictions ({contradictItems.length}) →</span>
          </button>
        </div>

        {/* Zoom & Fit Controls */}
        <div className="flex items-center gap-1 ml-auto shrink-0">
          <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-[#94A3B8] mr-1">
            <Move size={11} className="text-[#0091FF]" />
            <span>Drag nodes or canvas</span>
          </span>

          <button
            type="button"
            onClick={toggleFitMode}
            title={isFitMode ? 'Switch to 100% zoom' : 'Fit entire topology into scene'}
            className={`px-2 py-1 rounded-md text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              isFitMode
                ? 'bg-[#0A0D14] text-white shadow-2xs'
                : 'bg-white border border-[#E5E7EB] text-[#475569] hover:bg-[#F8FAFC]'
            }`}
          >
            {isFitMode ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
            <span>{isFitMode ? 'Fit Scene' : '100%'}</span>
          </button>

          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-1 rounded-md bg-white border border-[#E5E7EB] text-[#475569] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
          >
            <ZoomOut size={12} />
          </button>

          <span className="px-1 text-[10px] font-semibold text-[#64748B]">
            {Math.round(effectiveScale * 100)}%
          </span>

          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-1 rounded-md bg-white border border-[#E5E7EB] text-[#475569] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
          >
            <ZoomIn size={12} />
          </button>

          <button
            type="button"
            onClick={handleReset}
            title="Reset Graph Positions & Pan"
            className="p-1 rounded-md bg-white border border-[#E5E7EB] text-[#475569] hover:bg-[#F8FAFC] transition-colors cursor-pointer ml-1"
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>

      {/* SCROLLABLE & DRAGGABLE CANVAS CONTAINER WITH HIGH-CONTRAST SCROLLBAR */}
      <div 
        ref={scrollContainerRef}
        className={`w-full overflow-x-auto overflow-y-hidden rounded-xl bg-[#FAFAFA] border border-[#F1F3F5] transition-colors topology-scrollbar ${
          isPanning ? 'cursor-grabbing' : 'cursor-default'
        }`}
        style={{
          minHeight: `${Math.round(CANVAS_HEIGHT * effectiveScale + 20)}px`,
          maxHeight: '620px',
        }}
        onMouseDown={handleCanvasMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div
          ref={canvasRef}
          className="relative transition-transform duration-75 origin-top-left"
          style={{
            width: `${CANVAS_WIDTH}px`,
            height: `${CANVAS_HEIGHT}px`,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${effectiveScale})`,
            transformOrigin: 'top left',
          }}
        >
          {/* SVG Connecting Bezier Curves with Animated Moving Dots */}
          <svg
            viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Left Branch 1: Reddit */}
            {(() => {
              const a = getLeftNodeAnchor(0);
              const pathD = `M ${ideaLeftAnchor.x} ${ideaLeftAnchor.y} C ${(ideaLeftAnchor.x + a.x) / 2} ${ideaLeftAnchor.y}, ${(ideaLeftAnchor.x + a.x) / 2} ${a.y}, ${a.x} ${a.y}`;
              return (
                <g key="left-curve-0">
                  <path
                    id="node-path-left-0"
                    d={pathD}
                    fill="none"
                    stroke={isThinking && thinkingStep < 2 ? '#E2E8F0' : '#A7F3D0'}
                    strokeWidth="1.5"
                  />
                  {(!isThinking || thinkingStep >= 2) && (
                    <circle cx="0" cy="0" r="3" fill="#10B981">
                      <animateMotion dur="2.4s" repeatCount="indefinite">
                        <mpath href="#node-path-left-0" />
                      </animateMotion>
                    </circle>
                  )}
                </g>
              );
            })()}

            {/* Left Branch 2: GitHub */}
            {(() => {
              const a = getLeftNodeAnchor(1);
              const pathD = `M ${ideaLeftAnchor.x} ${ideaLeftAnchor.y} C ${(ideaLeftAnchor.x + a.x) / 2} ${ideaLeftAnchor.y}, ${(ideaLeftAnchor.x + a.x) / 2} ${a.y}, ${a.x} ${a.y}`;
              return (
                <g key="left-curve-1">
                  <path
                    id="node-path-left-1"
                    d={pathD}
                    fill="none"
                    stroke={isThinking && thinkingStep < 2 ? '#E2E8F0' : '#A7F3D0'}
                    strokeWidth="1.5"
                  />
                  {(!isThinking || thinkingStep >= 2) && (
                    <circle cx="0" cy="0" r="3" fill="#10B981">
                      <animateMotion dur="2.2s" repeatCount="indefinite">
                        <mpath href="#node-path-left-1" />
                      </animateMotion>
                    </circle>
                  )}
                </g>
              );
            })()}

            {/* Left Branch 3: Google / Web */}
            {(() => {
              const a = getLeftNodeAnchor(2);
              const pathD = `M ${ideaLeftAnchor.x} ${ideaLeftAnchor.y} C ${(ideaLeftAnchor.x + a.x) / 2} ${ideaLeftAnchor.y}, ${(ideaLeftAnchor.x + a.x) / 2} ${a.y}, ${a.x} ${a.y}`;
              return (
                <g key="left-curve-2">
                  <path
                    id="node-path-left-2"
                    d={pathD}
                    fill="none"
                    stroke={isThinking && thinkingStep < 2 ? '#E2E8F0' : '#A7F3D0'}
                    strokeWidth="1.5"
                  />
                  {(!isThinking || thinkingStep >= 2) && (
                    <circle cx="0" cy="0" r="3" fill="#10B981">
                      <animateMotion dur="2.6s" repeatCount="indefinite">
                        <mpath href="#node-path-left-2" />
                      </animateMotion>
                    </circle>
                  )}
                </g>
              );
            })()}

            {/* Right Branch 1: X */}
            {(() => {
              const a = getRightNodeAnchor(0);
              const pathD = `M ${ideaRightAnchor.x} ${ideaRightAnchor.y} C ${(ideaRightAnchor.x + a.x) / 2} ${ideaRightAnchor.y}, ${(ideaRightAnchor.x + a.x) / 2} ${a.y}, ${a.x} ${a.y}`;
              return (
                <g key="right-curve-0">
                  <path
                    id="node-path-right-0"
                    d={pathD}
                    fill="none"
                    stroke={isThinking && thinkingStep < 3 ? '#E2E8F0' : '#FECACA'}
                    strokeWidth="1.5"
                  />
                  {(!isThinking || thinkingStep >= 3) && (
                    <circle cx="0" cy="0" r="3" fill="#EF4444">
                      <animateMotion dur="2.4s" repeatCount="indefinite">
                        <mpath href="#node-path-right-0" />
                      </animateMotion>
                    </circle>
                  )}
                </g>
              );
            })()}

            {/* Right Branch 2: Reviews */}
            {(() => {
              const a = getRightNodeAnchor(1);
              const pathD = `M ${ideaRightAnchor.x} ${ideaRightAnchor.y} C ${(ideaRightAnchor.x + a.x) / 2} ${ideaRightAnchor.y}, ${(ideaRightAnchor.x + a.x) / 2} ${a.y}, ${a.x} ${a.y}`;
              return (
                <g key="right-curve-1">
                  <path
                    id="node-path-right-1"
                    d={pathD}
                    fill="none"
                    stroke={isThinking && thinkingStep < 3 ? '#E2E8F0' : '#FECACA'}
                    strokeWidth="1.5"
                  />
                  {(!isThinking || thinkingStep >= 3) && (
                    <circle cx="0" cy="0" r="3" fill="#EF4444">
                      <animateMotion dur="2.2s" repeatCount="indefinite">
                        <mpath href="#node-path-right-1" />
                      </animateMotion>
                    </circle>
                  )}
                </g>
              );
            })()}

            {/* Right Branch 3: ScholarXIV */}
            {(() => {
              const a = getRightNodeAnchor(2);
              const pathD = `M ${ideaRightAnchor.x} ${ideaRightAnchor.y} C ${(ideaRightAnchor.x + a.x) / 2} ${ideaRightAnchor.y}, ${(ideaRightAnchor.x + a.x) / 2} ${a.y}, ${a.x} ${a.y}`;
              return (
                <g key="right-curve-2">
                  <path
                    id="node-path-right-2"
                    d={pathD}
                    fill="none"
                    stroke={isThinking && thinkingStep < 3 ? '#E2E8F0' : '#FECACA'}
                    strokeWidth="1.5"
                  />
                  {(!isThinking || thinkingStep >= 3) && (
                    <circle cx="0" cy="0" r="3" fill="#EF4444">
                      <animateMotion dur="2.6s" repeatCount="indefinite">
                        <mpath href="#node-path-right-2" />
                      </animateMotion>
                    </circle>
                  )}
                </g>
              );
            })()}

            {/* Bottom Branch: Unknown */}
            <path
              id="node-path-unknown"
              d={`M ${ideaBottomAnchor.x} ${ideaBottomAnchor.y} L ${unknownAnchor.x} ${unknownAnchor.y}`}
              stroke="#CBD5E1"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            {(!isThinking || thinkingStep >= 4) && (
              <circle cx="0" cy="0" r="2.5" fill="#94A3B8">
                <animateMotion dur="2s" repeatCount="indefinite">
                  <mpath href="#node-path-unknown" />
                </animateMotion>
              </circle>
            )}
          </svg>

          {/* Support Header Pill */}
          <div className="absolute left-[110px] top-[10px] z-20 pointer-events-none">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-xs font-semibold shadow-2xs">
              <span>↑</span>
              <span>Support</span>
            </span>
          </div>

          {/* Contradict Header Pill */}
          <div className="absolute left-[670px] top-[10px] z-20 pointer-events-none">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF2F2] text-[#EF4444] border border-[#FECACA] text-xs font-bold shadow-2xs">
              <span>↓</span>
              <span>Contradict</span>
            </span>
          </div>

          {/* LEFT SUPPORT NODES (DRAGGABLE) */}
          {supportItems.slice(0, 3).map((item, idx) => {
            const nodeKey = `support_${idx}`;
            const offset = nodeOffsets[nodeKey] || { x: 0, y: 0 };
            const defaultTops = [40, 205, 370];
            const topPos = (defaultTops[idx] || 40) + offset.y;
            const leftPos = 24 + offset.x;

            const isCardExpanded = expandedCardId === item.id;
            const isNodeActive = !isThinking || thinkingStep >= 2;
            const isBeingDragged = activeDraggingNode === nodeKey;

            return (
              <div
                key={item.id || idx}
                onMouseDown={(e) => handleNodeDragStart(nodeKey, e.clientX, e.clientY, e)}
                onTouchStart={(e) => {
                  if (e.touches.length === 1) {
                    handleNodeDragStart(nodeKey, e.touches[0].clientX, e.touches[0].clientY, e);
                  }
                }}
                onClick={(e) => {
                  if (hasRecentlyDraggedRef.current) {
                    e.stopPropagation();
                    return;
                  }
                  toggleCardExpand(item.id);
                }}
                className={`evidence-card-node absolute flex flex-col p-2.5 rounded-2xl bg-white border transition-all cursor-grab active:cursor-grabbing ${
                  !isNodeActive
                    ? 'opacity-40 scale-95 border-[#E5E7EB]'
                    : isBeingDragged
                    ? 'z-50 border-[#10B981] shadow-2xl ring-4 ring-[#10B981]/25 scale-[1.03]'
                    : isCardExpanded
                    ? 'z-40 border-[#10B981] shadow-xl ring-4 ring-[#10B981]/15 -translate-y-0.5'
                    : 'z-20 border-[#E5E7EB] shadow-2xs hover:shadow-md hover:border-[#10B981]/60 hover:-translate-y-0.5'
                }`}
                style={{
                  left: `${leftPos}px`,
                  top: `${topPos}px`,
                  width: isCardExpanded ? '300px' : '255px',
                }}
              >
                {/* Node Drag Handle Bar */}
                <div
                  className="flex items-center justify-between pb-1 text-[#94A3B8] hover:text-[#0A0D14]"
                  title="Drag anywhere on card to reposition"
                >
                  <div className="flex items-center gap-1">
                    <GripHorizontal size={13} />
                    <span className="text-[9px] font-mono uppercase tracking-wider">Drag to Move</span>
                  </div>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                </div>

                <div className="flex flex-row-reverse items-center gap-2.5 text-right w-full">
                  {renderIcon(item.source)}
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-[#0A0D14]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                      <span className="truncate">{item.sourceName}</span>
                      <ChevronDown
                        size={12}
                        className={`text-[#64748B] transition-transform duration-200 ${
                          isCardExpanded ? 'rotate-180 text-[#0A0D14]' : ''
                        }`}
                      />
                    </div>
                    <p className="text-[10px] text-[#64748B] font-mono mb-0.5 truncate">
                      {item.subHeader}
                    </p>
                    <p className={`text-[11px] text-[#334155] leading-snug italic font-serif ${
                      isCardExpanded ? '' : 'line-clamp-2'
                    }`}>
                      &ldquo;{item.excerpt}&rdquo;
                    </p>
                  </div>
                </div>
                {renderExpandedDetails(item)}
              </div>
            );
          })}

          {/* CENTER IDEA NODE (DRAGGABLE) */}
          <div
            className={`evidence-card-node absolute w-[220px] z-30 cursor-grab active:cursor-grabbing ${
              activeDraggingNode === 'idea' ? 'z-50 scale-[1.03] ring-4 ring-[#0A0D14]/20 shadow-2xl' : ''
            }`}
            style={{
              left: `${320 + ideaOffset.x}px`,
              top: `${180 + ideaOffset.y}px`,
            }}
            onMouseDown={(e) => handleNodeDragStart('idea', e.clientX, e.clientY, e)}
            onTouchStart={(e) => {
              if (e.touches.length === 1) {
                handleNodeDragStart('idea', e.touches[0].clientX, e.touches[0].clientY, e);
              }
            }}
          >
            <div className="p-3.5 rounded-3xl bg-white border border-[#E5E7EB] shadow-md text-center transition-all ring-8 ring-[#F8FAFC]">
              <div
                className="flex items-center justify-center gap-1 text-[#94A3B8] hover:text-[#0A0D14] pb-1"
                title="Drag to reposition hypothesis"
              >
                <GripHorizontal size={14} />
                <span className="text-[9px] font-mono uppercase tracking-wider">Drag</span>
              </div>
              <div className="text-[10px] font-mono text-[#868C98] font-bold tracking-widest uppercase mb-1">
                {isThinking ? 'ANALYZING IDEA...' : 'HYPOTHESIS'}
              </div>
              <h3 className="text-xs sm:text-[13px] font-bold text-[#0A0D14] leading-snug line-clamp-3">
                {ideaText}
              </h3>
              <div className="mt-2.5 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full border border-[#CBD5E1] flex items-center justify-center bg-white shadow-2xs">
                  <span className={`w-1.5 h-1.5 rounded-full ${isThinking ? 'bg-[#4F46E5] animate-ping' : 'bg-[#0A0D14]'}`} />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT CONTRADICT NODES (DRAGGABLE & FULLY VISIBLE) */}
          {contradictItems.slice(0, 3).map((item, idx) => {
            const nodeKey = `contradict_${idx}`;
            const offset = nodeOffsets[nodeKey] || { x: 0, y: 0 };
            const defaultTops = [40, 205, 370];
            const topPos = (defaultTops[idx] || 40) + offset.y;
            const isCardExpanded = expandedCardId === item.id;
            const leftBase = isCardExpanded ? 545 : 590;
            const leftPos = leftBase + offset.x;

            const isNodeActive = !isThinking || thinkingStep >= 3;
            const isBeingDragged = activeDraggingNode === nodeKey;

            return (
              <div
                key={item.id || idx}
                onMouseDown={(e) => handleNodeDragStart(nodeKey, e.clientX, e.clientY, e)}
                onTouchStart={(e) => {
                  if (e.touches.length === 1) {
                    handleNodeDragStart(nodeKey, e.touches[0].clientX, e.touches[0].clientY, e);
                  }
                }}
                onClick={(e) => {
                  if (hasRecentlyDraggedRef.current) {
                    e.stopPropagation();
                    return;
                  }
                  toggleCardExpand(item.id);
                }}
                className={`evidence-card-node absolute flex flex-col p-2.5 rounded-2xl bg-white border transition-all cursor-grab active:cursor-grabbing ${
                  !isNodeActive
                    ? 'opacity-40 scale-95 border-[#E5E7EB]'
                    : isBeingDragged
                    ? 'z-50 border-[#EF4444] shadow-2xl ring-4 ring-[#EF4444]/30 scale-[1.03]'
                    : isCardExpanded
                    ? 'z-40 border-[#EF4444] shadow-xl ring-4 ring-[#EF4444]/15 -translate-y-0.5'
                    : 'z-20 border-[#E5E7EB] shadow-2xs hover:shadow-md hover:border-[#EF4444]/60 hover:-translate-y-0.5'
                }`}
                style={{
                  left: `${leftPos}px`,
                  top: `${topPos}px`,
                  width: isCardExpanded ? '300px' : '255px',
                }}
              >
                {/* Node Drag Handle Bar */}
                <div
                  className="flex items-center justify-between pb-1 text-[#94A3B8] hover:text-[#0A0D14]"
                  title="Drag anywhere on card to reposition"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-[#EF4444] font-semibold">Contradiction</span>
                    <GripHorizontal size={13} className="text-[#94A3B8]" />
                  </div>
                </div>

                <div className="flex flex-row items-center gap-2.5 text-left w-full">
                  {renderIcon(item.source)}
                  <div className="flex-1 min-w-0 pl-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A0D14]">
                      <span className="truncate">{item.sourceName}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                      <ChevronDown
                        size={12}
                        className={`ml-auto text-[#64748B] transition-transform duration-200 ${
                          isCardExpanded ? 'rotate-180 text-[#0A0D14]' : ''
                        }`}
                      />
                    </div>
                    <p className="text-[10px] text-[#64748B] font-mono mb-0.5 truncate">
                      {item.subHeader}
                    </p>
                    <p className={`text-[11px] text-[#334155] leading-snug ${
                      isCardExpanded ? '' : 'line-clamp-2'
                    }`}>
                      {item.excerpt}
                    </p>
                  </div>
                </div>
                {renderExpandedDetails(item)}
              </div>
            );
          })}

          {/* BOTTOM UNKNOWN NODE (DRAGGABLE) */}
          {unknownItem && (
            <div
              onMouseDown={(e) => handleNodeDragStart('unknown', e.clientX, e.clientY, e)}
              onTouchStart={(e) => {
                if (e.touches.length === 1) {
                  handleNodeDragStart('unknown', e.touches[0].clientX, e.touches[0].clientY, e);
                }
              }}
              onClick={(e) => {
                if (hasRecentlyDraggedRef.current) {
                  e.stopPropagation();
                  return;
                }
                toggleCardExpand(unknownItem.id);
              }}
              className={`evidence-card-node absolute w-[210px] flex flex-col p-2.5 rounded-2xl bg-white border transition-all cursor-grab active:cursor-grabbing ${
                activeDraggingNode === 'unknown'
                  ? 'z-50 shadow-xl ring-2 ring-[#94A3B8] scale-[1.02]'
                  : !isThinking || thinkingStep >= 4
                  ? 'z-20 border-[#E2E8F0] shadow-2xs hover:border-[#94A3B8]'
                  : 'opacity-40 border-[#E5E7EB]'
              }`}
              style={{
                left: `${330 + unknownOffset.x}px`,
                top: `${410 + unknownOffset.y}px`,
              }}
            >
              <div
                className="flex items-center justify-center pb-1 text-[#94A3B8] hover:text-[#0A0D14]"
                title="Drag to reposition unknown node"
              >
                <GripHorizontal size={12} />
              </div>
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-[#475569]">
                <span className="w-4 h-4 rounded-full bg-[#F1F5F9] text-[#64748B] text-[10px] font-mono flex items-center justify-center">?</span>
                <span>{unknownItem.sourceName || 'Unknown'}</span>
                <span className="text-[9px] font-mono text-[#94A3B8]">
                  {unknownItem.subHeader?.includes('•') ? unknownItem.subHeader.split('•')[1] : ''}
                </span>
              </div>
              <p className="text-[10px] text-[#64748B] text-center mt-1 line-clamp-2 leading-tight">
                {unknownItem.excerpt}
              </p>
              {renderExpandedDetails(unknownItem)}
            </div>
          )}
        </div>
      </div>

      {/* DEDICATED HORIZONTAL SCROLLBAR CONTROLLER & SLIDER INDICATOR */}
      <div className="mt-2 px-3 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#64748B]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#0091FF]" />
          <span className="font-semibold text-[#0A0D14] text-[11px]">Topology Viewport:</span>
          <span className="text-[11px] text-[#64748B]">
            {scrollPercentage <= 25 ? 'Focus: Supporting Evidence' : scrollPercentage >= 75 ? 'Focus: Contradicting Signals' : 'Focus: Central Hypothesis'}
          </span>
        </div>

        {/* Interactive Scrub Slider for rapid scrolling between Support & Contradict */}
        <div className="flex items-center gap-2 flex-1 max-w-xs min-w-[140px]">
          <span className="text-[10px] text-[#059669] font-bold shrink-0">Support</span>
          <input
            type="range"
            min={0}
            max={100}
            value={scrollPercentage}
            onChange={(e) => handleSliderScroll(Number(e.target.value))}
            className="w-full h-1.5 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0A0D14]"
            title="Drag slider to scrub view across topology"
          />
          <span className="text-[10px] text-[#DC2626] font-bold shrink-0">Contradict</span>
        </div>

        {/* Jump Directly to Contradictions Button */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <button
            type="button"
            onClick={() => scrollToSection('contradict')}
            className="px-2.5 py-1 rounded-md bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <AlertTriangle size={11} className="text-[#EF4444]" />
            <span>Reveal Contradictions</span>
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};
