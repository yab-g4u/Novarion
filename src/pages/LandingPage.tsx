import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProbeHero } from '../components/ui/probe-hero';
import { LiveInvestigationExperience } from '../components/landing/LiveInvestigationExperience';
import { EvidenceGraph } from '../components/EvidenceGraph';
import { ProductTestingSection } from '../components/ProductTestingSection';
import { EvidenceTimeline } from '../components/EvidenceTimeline';
import { FinalCTARefined } from '../components/landing/FinalCTARefined';
import { ShapeWavesFooter } from '../components/landing/ShapeWavesFooter';
import { safeRefreshScrollTrigger } from '../motion/gsapConfig';
import { InvestigationResultData, generateDynamicInvestigation } from '../lib/research/dynamicInvestigationResolver';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentInvestigation, setCurrentInvestigation] = useState<InvestigationResultData>(() =>
    generateDynamicInvestigation('AI tools will replace most productivity software')
  );

  useEffect(() => {
    // Refresh ScrollTrigger calculations after initial layout stabilizes
    safeRefreshScrollTrigger(200);
    const timer = setTimeout(() => {
      safeRefreshScrollTrigger(500);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleInvestigationComplete = (data: InvestigationResultData) => {
    setCurrentInvestigation(data);
    safeRefreshScrollTrigger(150);
  };

  const handleStartInvestigating = (idea?: string) => {
    const targetIdea = idea || currentInvestigation.query;
    if (targetIdea) {
      navigate(`/signin?idea=${encodeURIComponent(targetIdea)}`);
    } else {
      navigate('/signin');
    }
  };

  const handleExploreProduct = () => {
    navigate('/app/research');
  };

  return (
    <div className="probe-app min-h-screen flex flex-col bg-white text-[#0A0D14] font-['Geist','Inter',-apple-system,sans-serif] selection:bg-[#0F52BA]/15 selection:text-[#0A0D14]">
      
      {/* EXPERIENCE A: HERO SECTION (CINEMATIC VIDEO BACKGROUND, REFINED PROBE BRANDING) */}
      <ProbeHero
        onTryProbe={() => {
          const el = document.getElementById('live-investigation');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onExploreDemo={() => {
          const el = document.getElementById('section-graph');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* EXPERIENCE B: LIVE INVESTIGATION (EXACT CLONE OF home-page.png) */}
      <LiveInvestigationExperience
        initialQuery={currentInvestigation.query}
        onInvestigationComplete={handleInvestigationComplete}
        onRequireAuth={(idea) => handleStartInvestigating(idea)}
      />

      {/* EXPERIENCE C: LIVING EVIDENCE GRAPH (MATCHES evidence-graph.png WITH ELK.JS & REACT FLOW) */}
      <div id="section-evidence-graph" className="w-full bg-white py-12 sm:py-16">
        <EvidenceGraph externalGraphData={currentInvestigation.graphData} />
      </div>

      {/* EXPERIENCE D: PRODUCT TESTING (SIMULATED USER ENGINE WITH LIVE SESSIONS & FRICTION EXTRACTION) */}
      <div id="section-testing" className="w-full bg-white">
        <ProductTestingSection />
      </div>

      {/* EXPERIENCE E: 12-MONTH SIGNAL CALENDAR (MATCHES signal.png WITH DRIFT & ACCESSIBLE ARTIFACTS) */}
      <div id="section-timeline" className="w-full bg-white">
        <EvidenceTimeline />
      </div>

      {/* EXPERIENCE F: FINAL CTA & SIGN IN */}
      <FinalCTARefined
        onStartInvestigating={(idea) => handleStartInvestigating(idea)}
        onExploreProduct={handleExploreProduct}
      />

      {/* SHAPEWAVES FOOTER WITH PROBE TYPOGRAPHY */}
      <ShapeWavesFooter />

    </div>
  );
};

export default LandingPage;
