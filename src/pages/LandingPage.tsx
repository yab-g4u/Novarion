import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { ProbeHero } from '../components/ui/probe-hero';
import { ProbeProtocolSection } from '../components/landing/ProbeProtocolSection';
import { LiveInvestigationExperience } from '../components/landing/LiveInvestigationExperience';
import { EvidenceGraph } from '../components/EvidenceGraph';
import { ProductTestingSection } from '../components/ProductTestingSection';
import { WhyProbeMattersSection } from '../components/landing/WhyProbeMattersSection';
import { FinalCTARefined } from '../components/landing/FinalCTARefined';
import { ShapeWavesFooter } from '../components/landing/ShapeWavesFooter';

import { safeRefreshScrollTrigger } from '../motion/gsapConfig';

import {
  InvestigationResultData,
  generateDynamicInvestigation,
} from '../lib/research/dynamicInvestigationResolver';

import { updateProbeLiveState } from '../lib/voxide/probeVoxideBridge';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const [currentInvestigation, setCurrentInvestigation] =
    useState<InvestigationResultData>(() => {
      const stored =
        typeof window !== 'undefined'
          ? window.localStorage.getItem('probe_active_idea')
          : null;

      return generateDynamicInvestigation(
        stored || 'AI tools will replace most productivity software'
      );
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
        setCurrentInvestigation(
          generateDynamicInvestigation(detail.idea)
        );
      }
    };

    window.addEventListener(
      'probe:voxide-investigate-start',
      onVoxideInvestigate
    );

    window.addEventListener(
      'probe:voxide-investigate',
      onVoxideInvestigate
    );

    return () => {
      window.removeEventListener(
        'probe:voxide-investigate-start',
        onVoxideInvestigate
      );

      window.removeEventListener(
        'probe:voxide-investigate',
        onVoxideInvestigate
      );
    };
  }, []);

  const handleInvestigationComplete = (
    data: InvestigationResultData
  ) => {
    setCurrentInvestigation(data);

    updateProbeLiveState({
      currentIdea: data.query,
      latestDynamicData: data,
    });

    safeRefreshScrollTrigger(150);
  };

  const handleStartInvestigating = (idea?: string) => {
    const raw =
      typeof window !== 'undefined'
        ? localStorage.getItem('probe_auth_user')
        : null;

    const targetIdea =
      idea || currentInvestigation.query;

    if (raw) {
      if (targetIdea) {
        localStorage.setItem(
          'probe_active_idea',
          targetIdea
        );
      }

      navigate('/app');
      return;
    }

    if (targetIdea) {
      navigate(
        `/signin?idea=${encodeURIComponent(targetIdea)}`
      );
    } else {
      navigate('/signin');
    }
  };

  const handleExploreProduct = () => {
    navigate('/app');
  };

  return (
    <div className="probe-app min-h-screen flex flex-col bg-white text-[#0A0D14] font-['Geist','Inter',-apple-system,sans-serif] selection:bg-[#0F52BA]/15 selection:text-[#0A0D14]">

      {/* =====================================================
          EXPERIENCE A: HERO SECTION
      ====================================================== */}
      <ProbeHero
        onTryProbe={() => {
          const raw =
            typeof window !== 'undefined'
              ? localStorage.getItem('probe_auth_user')
              : null;

          if (raw) {
            navigate('/app');
          } else {
            navigate('/signin');
          }
        }}
        onExploreDemo={() => {
          const el = document.getElementById(
            'section-evidence-graph'
          );

          if (el) {
            el.scrollIntoView({
              behavior: 'smooth',
            });
          }
        }}
      />

      {/* =====================================================
          NEW SECTION 2: THE PROBE PROTOCOL
          Added only. Nothing else changed.
      ====================================================== */}
      <ProbeProtocolSection
        onStartInvestigating={() =>
          handleStartInvestigating()
        }
      />

      {/* =====================================================
          EXPERIENCE B: LIVE INVESTIGATION
      ====================================================== */}
      <LiveInvestigationExperience
        initialQuery={currentInvestigation.query}
        onInvestigationComplete={
          handleInvestigationComplete
        }
        onRequireAuth={(idea) =>
          handleStartInvestigating(idea)
        }
      />

      {/* =====================================================
          EXPERIENCE C: LIVING EVIDENCE GRAPH
      ====================================================== */}
      <div
        id="section-evidence-graph"
        className="w-full bg-white py-12 sm:py-16"
      >
        <EvidenceGraph
          externalGraphData={
            currentInvestigation.graphData
          }
        />
      </div>

      {/* =====================================================
          EXPERIENCE D: PRODUCT TESTING
      ====================================================== */}
      <div
        id="section-testing"
        className="w-full bg-white"
      >
        <ProductTestingSection />
      </div>

      {/* =====================================================
          NEW SECTION: WHY PROBE MATTERS
          Positioned near the end, before the final CTA.
      ====================================================== */}
      <WhyProbeMattersSection />

      {/* =====================================================
          EXPERIENCE E: FINAL CTA & SIGN IN
      ====================================================== */}
      <FinalCTARefined
        onStartInvestigating={(idea) =>
          handleStartInvestigating(idea)
        }
        onExploreProduct={
          handleExploreProduct
        }
      />

      {/* =====================================================
          FOOTER
      ====================================================== */}
      <ShapeWavesFooter />

    </div>
  );
};

export default LandingPage;
