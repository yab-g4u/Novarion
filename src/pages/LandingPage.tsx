import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProbeNavbar } from '../components/ui/ProbeNavbar';
import { ProbeHero } from '../components/ui/probe-hero';
import { ProbeSignalStrip } from '../components/landing/ProbeSignalStrip';
import { LiveInvestigationExperience } from '../components/landing/LiveInvestigationExperience';
import { EvidenceGraph } from '../components/EvidenceGraph';
import { ProductTestingSection } from '../components/ProductTestingSection';
import { ProbeFAQ } from '../components/landing/ProbeFAQ';
import { ShapeWavesFooter } from '../components/landing/ShapeWavesFooter';
import { safeRefreshScrollTrigger } from '../motion/gsapConfig';
import { InvestigationResultData, generateDynamicInvestigation } from '../lib/research/dynamicInvestigationResolver';
import { updateProbeLiveState } from '../lib/voxide/probeVoxideBridge';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentInvestigation, setCurrentInvestigation] = useState<InvestigationResultData>(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('probe_active_idea') : null;
    return generateDynamicInvestigation(stored || 'AI tools will replace most productivity software');
  });

  useEffect(() => {
    // Refresh ScrollTrigger calculations after initial layout stabilizes
    safeRefreshScrollTrigger(200);
    const timer = setTimeout(() => {
      safeRefreshScrollTrigger(500);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onVoxideInvestigate = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (!detail) return;
      if (detail.dynamicData) {
        setCurrentInvestigation(detail.dynamicData);
      } else if (detail.idea) {
        setCurrentInvestigation(generateDynamicInvestigation(detail.idea));
      }
    };

    window.addEventListener('probe:voxide-investigate-start', onVoxideInvestigate);
    window.addEventListener('probe:voxide-investigate', onVoxideInvestigate);
    return () => {
      window.removeEventListener('probe:voxide-investigate-start', onVoxideInvestigate);
      window.removeEventListener('probe:voxide-investigate', onVoxideInvestigate);
    };
  }, []);

  const handleInvestigationComplete = (data: InvestigationResultData) => {
    setCurrentInvestigation(data);
    updateProbeLiveState({
      currentIdea: data.query,
      latestDynamicData: data
    });
    safeRefreshScrollTrigger(150);
  };

  const handleStartInvestigating = (idea?: string) => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('probe_auth_user') : null;
    const targetIdea = idea || currentInvestigation.query;
    if (raw) {
      if (targetIdea) {
        localStorage.setItem('probe_active_idea', targetIdea);
      }
      navigate('/app');
      return;
    }
    if (targetIdea) {
      navigate(`/signin?idea=${encodeURIComponent(targetIdea)}`);
    } else {
      navigate('/signin');
    }
  };

  const handleExploreProduct = () => {
    navigate('/app');
  };

  return (
    <div 
      className="probe-app min-h-screen flex flex-col bg-[#FAF9F5] text-[#0A0D14] font-['Geist','Inter',-apple-system,sans-serif] selection:bg-[#0F52BA]/15 selection:text-[#0A0D14]"
      style={{
        backgroundImage: 'radial-gradient(#CBD5E1 0.75px, transparent 0.75px)',
        backgroundSize: '24px 24px',
      }}
    >
      
      {/* ── PERSISTENT SUSPENDED DOCK NAVBAR (STICKS PERMANENTLY AS USERS SCROLL) ── */}
      <ProbeNavbar
        onGetStarted={() => handleStartInvestigating()}
        onLogin={() => navigate('/signin')}
        onScrollToInvestigation={(e) => {
          e?.preventDefault();
          const el = document.getElementById('live-investigation');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onScrollToEvidenceGraph={() => {
          const el = document.getElementById('section-evidence-graph');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onScrollToTesting={(e) => {
          e?.preventDefault();
          const el = document.getElementById('section-testing');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onScrollToFAQ={(e) => {
          e?.preventDefault();
          const el = document.getElementById('section-faq');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* EXPERIENCE A: HERO SECTION (CINEMATIC VIDEO BACKGROUND, REFINED PROBE BRANDING) */}
      <ProbeHero
        onTryProbe={() => {
          const raw = typeof window !== 'undefined' ? localStorage.getItem('probe_auth_user') : null;
          if (raw) {
            navigate('/app');
          } else {
            navigate('/signin');
          }
        }}
        onExploreDemo={() => {
          const el = document.getElementById('section-evidence-graph');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* SUBTLE FULL-WIDTH SIGNAL STRIP (QUIET INFRASTRUCTURE LAYER) */}
      <ProbeSignalStrip />

      {/* EXPERIENCE B: LIVE INVESTIGATION (EXACT CLONE OF home-page.png) */}
      <LiveInvestigationExperience
        initialQuery={currentInvestigation.query}
        onInvestigationComplete={handleInvestigationComplete}
        onRequireAuth={(idea) => handleStartInvestigating(idea)}
      />

      {/* EXPERIENCE C: LIVING EVIDENCE GRAPH (MATCHES evidence-graph.png WITH ELK.JS & REACT FLOW) */}
      <div 
        id="section-evidence-graph" 
        className="w-full bg-[#FAF9F5] border-t border-[#E5E7EB] py-12 sm:py-16"
        style={{
          backgroundImage: 'radial-gradient(#CBD5E1 0.75px, transparent 0.75px)',
          backgroundSize: '24px 24px',
        }}
      >
        <EvidenceGraph
          externalGraphData={currentInvestigation.graphData}
        />
      </div>

      {/* EXPERIENCE D: PRODUCT TESTING (SIMULATED USER ENGINE WITH LIVE SESSIONS & FRICTION EXTRACTION) */}
      <div 
        id="section-testing" 
        className="w-full bg-[#FAF9F5] border-t border-[#E5E7EB]"
        style={{
          backgroundImage: 'radial-gradient(#CBD5E1 0.75px, transparent 0.75px)',
          backgroundSize: '24px 24px',
        }}
      >
        <ProductTestingSection />
      </div>

      {/* EXPERIENCE E: COMPREHENSIVE VALIDATION INTELLIGENCE FAQ */}
      <ProbeFAQ
        onStartInvestigating={() => handleStartInvestigating()}
      />

      {/* FOOTER SECTION: MINIMALIST RECONNECT HERO WITH PROBE WATERMARK (image.png) */}
      <ShapeWavesFooter 
        onStartInvestigating={() => handleStartInvestigating()}
        onExploreProduct={handleExploreProduct}
      />

    </div>
  );
};

export default LandingPage;
