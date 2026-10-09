"use client";
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { VoxideClient, VoxideWidget } from "@voxide/react";
import { resolveLiveUrl } from "@voxide/react/core";
import {
  VoiceState,
  getVoiceState,
  setVoiceState,
  subscribeVoiceState,
  canAcceptUserSpeech,
  registerAgentSpokenText,
  isAgentTtsEcho,
  getConciseProbeState,
  getProbeInternalState,
  updateProbeLiveState,
  ensureInvestigationLoaded,
  emitProbeBridgeEvent,
  findMatchingAssumption,
  cleanNaturalIdeaInput,
  inferAlternativesForIdea,
  executeFindEvidence,
  executeStartProductTest,
  executeShowProductTestResults,
  normalizeEvidenceStanceFilter,
  normalizeSourceTypeFilter,
} from "../lib/voxide/probeVoxideBridge";
import {
  resolveVoiceCapabilityCall,
  matchNonInvestigationCapability,
  formatCapabilityResultForSpeech,
} from "../lib/voxide/voxideCapabilityAgent";

export type { VoiceState };
export { getVoiceState, setVoiceState, subscribeVoiceState };

// Read Voxide publishable key from environment variables (never hardcode keys in source control)
const ENV_VOXIDE_PUBLIC_KEY =
  (typeof import.meta.env !== "undefined" &&
    (import.meta.env.VITE_VOXIDE_KEY || import.meta.env.VITE_VOXIDE_PUBLIC_KEY)) ||
  (typeof process !== "undefined" &&
    (process.env?.VITE_VOXIDE_KEY ||
      process.env?.VITE_VOXIDE_PUBLIC_KEY ||
      process.env?.VOXIDE_PUBLIC_KEY)) ||
  "";

const hasConfiguredVoxideKey = Boolean(
  ENV_VOXIDE_PUBLIC_KEY && ENV_VOXIDE_PUBLIC_KEY.startsWith("vox_pub_")
);

const FALLBACK_VOXIDE_PUBLIC_KEY =
  "vox_pub_44e83d3dbe9c6c9eee78c93f203dbadf1a8d144e8c9546d4";

const VOXIDE_PUBLIC_KEY = hasConfiguredVoxideKey
  ? ENV_VOXIDE_PUBLIC_KEY
  : FALLBACK_VOXIDE_PUBLIC_KEY;

const isBrowser = typeof window !== "undefined";
const isEphemeralPreviewOrigin =
  isBrowser && (window.location.hostname.endsWith(".run.app") || window.location.port === "3000");

export const ai = new VoxideClient({
  publicKey: VOXIDE_PUBLIC_KEY,
  ...(isEphemeralPreviewOrigin ? { baseUrl: window.location.origin } : {}),
});

// Keep a reference to React Router's navigate function so capabilities can navigate cleanly without page reload
let appNavigate: ((path: string) => void) | null = null;

function navigateTo(path: string) {
  if (path === "back") {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }
    path = "/app/research";
  }
  updateProbeLiveState({ currentRoute: path });
  ai.setActiveRoute(path);
  if (appNavigate) {
    appNavigate(path);
  } else if (typeof window !== "undefined") {
    window.location.assign(path);
  }
}

// 1. Register navigation with Probe's exact valid routes
ai.enableNavigation(
  {
    push: (route: string) => navigateTo(route),
  },
  [
    {
      path: "/",
      description: "Probe landing page with live investigation, evidence graph, and Playwright testing",
    },
    {
      path: "/signin",
      description: "Founder sign-in and account authentication page",
    },
    {
      path: "/app",
      description: "Main Probe founder workspace",
    },
    {
      path: "/app/research",
      description: "Idea pressure-testing, assumptions deconstruction, and multi-source research workspace",
    },
    {
      path: "/app/testing",
      description: "Real Playwright headless Chromium product testing workspace",
    },
    {
      path: "/app/evidence",
      description: "Living Evidence Graph showing supporting and challenging evidence nodes and validation tests",
    },
    {
      path: "/app/calendar",
      description: "Founder validation sprint calendar and scheduled validation experiments",
    },
  ]
);

// 2. Register REAL Probe capabilities
ai.register({
  startInvestigation: {
    description:
      "Starts a complete Probe investigation ONLY when the user explicitly asks to investigate, research, or pressure-test a product idea or market hypothesis. Populates the investigation search input and returns the actual investigation results.",
    params: {
      idea: {
        type: "string",
        required: true,
        description:
          "The user's natural-language product idea, concept, or hypothesis to investigate.",
      },
    },
    handler: async ({ idea }) => {
      const rawIdea = String(idea || "").trim();

      // Guard 1: Never allow Voxide's own spoken TTS output to trigger an investigation or enter the search field
      if (!rawIdea || isAgentTtsEcho(rawIdea)) {
        return {
          status: "ignored",
          message: "Ignored non-user or echoed TTS transcript.",
        };
      }

      // Guard 2: If a non-investigation command/question was mistakenly routed here, delegate to the proper capability without touching the search field
      const nonInv = matchNonInvestigationCapability(rawIdea, getConciseProbeState());
      if (nonInv && nonInv.name !== "startInvestigation") {
        if (nonInv.name === "noop") {
          return { status: "ignored", message: "Ignored TTS echo." };
        }
        const delegated = await (ai as any)._executeAction(nonInv.name, nonInv.args);
        return delegated?.result ?? delegated;
      }

      const cleanIdea = cleanNaturalIdeaInput(rawIdea) || rawIdea;
      if (!cleanIdea || cleanIdea.length < 3) {
        updateProbeLiveState({ investigationStatus: "ERROR" });
        return {
          status: "error",
          message:
            "Please provide a clear product idea or hypothesis (at least 3 characters) to investigate.",
          recovery: "Ask the user what product idea or problem they want Probe to research.",
        };
      }

      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname || "/";
        if (currentPath === "/") {
          const el = document.getElementById("live-investigation");
          el?.scrollIntoView({ behavior: "smooth" });
        } else if (currentPath !== "/app/research") {
          navigateTo("/app/research");
        }
      }

      try {
        const data = await ensureInvestigationLoaded(cleanIdea, true);
        const analyses = data.analysis || [];
        const contradictions = analyses
          .filter((a) => a.status === "CHALLENGED" || a.contradiction || a.challengingCount > 0)
          .map((a) => ({
            assumptionId: a.assumption.id,
            assumption: a.assumption.text,
            contradiction:
              a.contradiction || `${a.challengingCount} challenging practitioner signals found`,
          }));
        const alternatives = inferAlternativesForIdea(data.idea || cleanIdea);

        return {
          status: "success",
          investigationId: getConciseProbeState().currentInvestigationId,
          idea: data.idea,
          assumptionsFound: analyses.map((a) => ({
            id: a.assumption.id,
            category: a.assumption.category,
            text: a.assumption.text,
            status: a.status,
            supportingSignals: a.supportingCount,
            challengingSignals: a.challengingCount,
          })),
          assumptionsCount: analyses.length,
          assumptions: analyses.map((a) => ({
            id: a.assumption.id,
            text: a.assumption.text,
            status: a.status,
          })),
          evidenceFound: {
            total: data.allEvidence?.length || 0,
            supporting: (data.allEvidence || []).filter((e) => e.stance === "SUPPORTS").length,
            challenging: (data.allEvidence || []).filter((e) => e.stance === "CHALLENGES").length,
            topSignals: (data.allEvidence || []).slice(0, 4).map((e) => ({
              id: e.id,
              sourceType: e.sourceType,
              stance: e.stance,
              title: e.title,
              excerpt: e.excerpt,
            })),
          },
          evidenceCount: data.allEvidence?.length || 0,
          contradictionsFound: contradictions,
          alternativesFound: alternatives,
          strongestSignal: data.summary?.strongestSignal,
          biggestContradiction: data.summary?.biggestContradiction,
          recommendedNextStep: data.summary?.recommendedNextTest?.description,
        };
      } catch (err: any) {
        updateProbeLiveState({ investigationStatus: "ERROR" });
        return {
          status: "error",
          message: err?.message || "Failed to execute Probe investigation pipeline.",
          recovery: "Check network connectivity or retry the investigation with a specific product idea.",
        };
      }
    },
  },

  showAssumptions: {
    description:
      "Display and optionally focus a specific deconstructed assumption generated by Probe for the active investigation without modifying the search input.",
    params: {
      focusAssumption: {
        type: "string",
        description:
          "Optional assumption selector such as 'first', 'second', 'third', 'A1', 'A2', 'this', or a keyword to focus a specific assumption in the UI.",
      },
    },
    handler: async ({ focusAssumption }) => {
      // Never pass an ideaOverride here; showAssumptions only inspects the current investigation
      const data = await ensureInvestigationLoaded();
      const analyses = data.analysis || [];
      const focused = focusAssumption
        ? findMatchingAssumption(analyses, String(focusAssumption))
        : undefined;

      if (focused) {
        updateProbeLiveState({
          selectedNode: focused.assumption.id,
          activeEvidenceFilters: {
            ...getProbeInternalState().activeEvidenceFilters,
            assumptionId: focused.assumption.id,
          },
        });
      }

      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname || "/";
        if (currentPath === "/app/evidence" && focused) {
          emitProbeBridgeEvent("probe:voxide-open-graph", {
            focusNodeId: focused.assumption.id,
          });
        } else {
          if (!currentPath.startsWith("/app") || (currentPath !== "/app/research" && currentPath !== "/app")) {
            navigateTo("/app/research");
          }
          setTimeout(() => {
            emitProbeBridgeEvent("probe:voxide-show-assumptions", {
              idea: data.idea,
              assumptionId: focused?.assumption.id || "all",
              assumptions: analyses,
            });
          }, 60);
        }
      }

      const assumptions = analyses.map((a, idx) => ({
        id: a.assumption.id,
        index: idx + 1,
        category: a.assumption.category,
        text: a.assumption.text,
        status: a.status,
        testability: a.assumption.testability,
        supportingSignals: a.supportingCount,
        challengingSignals: a.challengingCount,
        contradiction: a.contradiction || null,
      }));

      return {
        status: "success",
        idea: data.idea,
        focusedAssumption: focused
          ? {
              id: focused.assumption.id,
              text: focused.assumption.text,
              status: focused.status,
              contradiction: focused.contradiction || null,
            }
          : null,
        assumptionsCount: assumptions.length,
        assumptions,
      };
    },
  },

  challengeAssumption: {
    description:
      "Challenge a real assumption in the active Probe investigation, mark it as CHALLENGED in the workspace and Living Evidence Graph, and surface empirical counter-evidence against it. Supports natural references like 'this assumption', 'the second assumption', or assumption IDs (A1, A2).",
    params: {
      assumptionIdOrQuery: {
        type: "string",
        description:
          "Optional assumption reference ('this', 'first', 'second', 'A1', 'A2', or topic keyword). If omitted, challenges the currently selected assumption in visible UI state.",
      },
      reason: {
        type: "string",
        description: "Optional reason or counter-argument explaining why this assumption is challenged.",
      },
    },
    handler: async ({ assumptionIdOrQuery, reason }) => {
      const data = await ensureInvestigationLoaded();
      const matched = findMatchingAssumption(
        data.analysis || [],
        assumptionIdOrQuery ? String(assumptionIdOrQuery) : undefined
      );

      if (!matched) {
        return {
          status: "error",
          message: "No assumptions are available in the current investigation to challenge.",
          recovery: "Start an investigation first using startInvestigation.",
        };
      }

      const challengeReason =
        String(
          reason ||
            matched.contradiction ||
            "Challenged via empirical stress-test: requires independent practitioner verification"
        ).trim();

      updateProbeLiveState({
        selectedNode: matched.assumption.id,
        challengedAssumptions: {
          ...getProbeInternalState().challengedAssumptions,
          [matched.assumption.id]: {
            nodeId: matched.assumption.id,
            challenged: true,
            reason: challengeReason,
            author: "Founder",
            timestamp: "Just now",
          },
        },
      });

      emitProbeBridgeEvent("probe:voxide-challenge-assumption", {
        assumptionId: matched.assumption.id,
        assumptionText: matched.assumption.text,
        reason: challengeReason,
      });

      const counterEvidence = (data.allEvidence || [])
        .filter(
          (ev) =>
            ev.relatedAssumptionIds.includes(matched.assumption.id) &&
            ev.stance === "CHALLENGES"
        )
        .slice(0, 3)
        .map((ev) => ({
          title: ev.title,
          sourceType: ev.sourceType,
          excerpt: ev.excerpt,
          url: ev.url,
        }));

      return {
        status: "success",
        challengedAssumptionId: matched.assumption.id,
        assumptionText: matched.assumption.text,
        previousStatus: matched.status,
        newStatus: "CHALLENGED",
        challengeReason,
        challengingSignalsCount: matched.challengingCount,
        counterEvidence,
      };
    },
  },

  findEvidence: {
    description:
      "Retrieve real empirical evidence for an existing investigation or arbitrary search query through Probe's research pipeline across Reddit, X, LinkedIn, and ScholarXIV without overwriting the main investigation search input.",
    params: {
      query: {
        type: "string",
        description:
          "Arbitrary search query, problem statement, or topic to find evidence for. Defaults to the current active investigation idea if omitted.",
      },
      evidenceType: {
        type: "string",
        description:
          "Optional evidence stance/type to retrieve ('all', 'supporting', 'contradictory', 'SUPPORTS', 'CHALLENGES', 'NEUTRAL').",
      },
      sourceType: {
        type: "string",
        description:
          "Optional source platform ('all', 'reddit', 'scholarxiv', 'academic', 'x', 'linkedin').",
      },
      source: {
        type: "string",
        description: "Optional alias for sourceType ('all', 'reddit', 'x', 'linkedin', 'scholarxiv').",
      },
      stance: {
        type: "string",
        description: "Optional alias for evidenceType ('all', 'SUPPORTS', 'CHALLENGES', 'NEUTRAL').",
      },
    },
    handler: async ({ query, evidenceType, sourceType, source, stance }) => {
      if (typeof window !== "undefined") {
        const path = window.location.pathname || "/";
        if (path === "/signin" || path === "/app/testing" || path === "/app/calendar") {
          navigateTo("/app/research");
        }
      }

      const result = await executeFindEvidence({
        query: query ? String(query) : undefined,
        evidenceType: String(evidenceType || stance || "all"),
        sourceType: String(sourceType || source || "all"),
      });

      return {
        ...result,
        totalVerifiedEvidence: result.evidenceCount,
        topEvidence: result.evidence,
      };
    },
  },

  addEvidence: {
    description:
      "Add a new supporting or challenging empirical evidence item directly into the active investigation and Living Evidence Graph.",
    params: {
      excerpt: {
        type: "string",
        required: true,
        description: "The quote, observation, or empirical finding to add as evidence.",
      },
      stance: {
        type: "string",
        description: "Whether this evidence supports or challenges the core hypothesis.",
        enum: ["Supports", "Challenges"],
      },
      sourceType: {
        type: "string",
        description: "Source platform of the evidence.",
        enum: ["reddit", "x", "linkedin", "scholarxiv", "docs"],
      },
      sourceName: {
        type: "string",
        description: "Name or author of the evidence source.",
      },
      url: {
        type: "string",
        description: "Optional URL link for the evidence source.",
      },
    },
    handler: async ({ excerpt, stance, sourceType, sourceName, url }) => {
      const cleanExcerpt = String(excerpt || "").trim();
      if (!cleanExcerpt) {
        return { status: "error", message: "Evidence excerpt is required." };
      }

      const relationship: "Supports" | "Challenges" =
        String(stance || "Supports").toLowerCase().includes("challeng")
          ? "Challenges"
          : "Supports";

      const newSource = {
        id: `ev_custom_${Date.now()}`,
        sourceType: (sourceType || "reddit") as any,
        sourceName: String(sourceName || "Founder Field Evidence"),
        sourceIdentifier: `${sourceName || "Founder"} · Empirical Signal`,
        date: "Just now",
        excerpt: cleanExcerpt,
        relationship,
        url: String(url || "https://novarion.ethiodeploy.com"),
        topic: "founder_empirical_evidence",
        confidence: 90,
      };

      const internal = getProbeInternalState();
      updateProbeLiveState({
        customEvidence: [newSource, ...internal.customEvidence],
        selectedNode: newSource.id,
      });

      emitProbeBridgeEvent("probe:voxide-add-evidence", {
        evidence: newSource,
      });

      return {
        status: "success",
        addedEvidence: {
          id: newSource.id,
          excerpt: newSource.excerpt,
          relationship: newSource.relationship,
          sourceName: newSource.sourceName,
        },
      };
    },
  },

  createValidationTest: {
    description:
      "Create and schedule a real-world validation experiment to test an assumption in the Probe Validation Calendar and Living Evidence Graph.",
    params: {
      question: {
        type: "string",
        description:
          "The validation question or hypothesis to test. If omitted, generates an experiment for the selected or highest-risk assumption.",
      },
      method: {
        type: "string",
        description: "Validation experiment method.",
        enum: [
          "user_interviews",
          "landing_page_smoke",
          "prototype_test",
          "preorder_test",
          "data_scrape",
          "live_telemetry",
        ],
      },
      target: {
        type: "string",
        description: "Target audience or sample size for the validation test.",
      },
      successSignal: {
        type: "string",
        description: "Measurable success threshold that validates the assumption.",
      },
    },
    handler: async ({ question, method, target, successSignal }) => {
      const data = await ensureInvestigationLoaded();
      const targetAssumption = findMatchingAssumption(data.analysis || []);

      const testQuestion = String(
        question ||
          data.summary?.recommendedNextTest?.description ||
          (targetAssumption
            ? `Validate whether users experience "${targetAssumption.assumption.text}" in real workflows`
            : `Validate core demand for "${data.idea}"`)
      ).trim();

      const rawMethod = String(method || "prototype_test");
      const methodMap: Record<
        string,
        | "landing_page_smoke"
        | "user_interviews"
        | "preorder_test"
        | "prototype_test"
        | "data_scrape"
        | "live_telemetry"
      > = {
        interviews: "user_interviews",
        user_interviews: "user_interviews",
        landing_page: "landing_page_smoke",
        landing_page_smoke: "landing_page_smoke",
        prototype: "prototype_test",
        prototype_test: "prototype_test",
        preorder_test: "preorder_test",
        data_scrape: "data_scrape",
        live_telemetry: "live_telemetry",
      };
      const methodKey = methodMap[rawMethod] || "prototype_test";

      const methodLabels: Record<string, string> = {
        user_interviews: "Customer Discovery Interviews",
        landing_page_smoke: "Fake Door / Smoke Test",
        prototype_test: "Interactive Prototype Usability Test",
        preorder_test: "Pre-order Willingness-to-Pay Test",
        data_scrape: "Practitioner Cohort Data Scrape",
        live_telemetry: "Live Product Telemetry Test",
      };

      const newTest = {
        id: `test_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        originatingNodeId: targetAssumption?.assumption.id || "central-idea",
        originatingNodeLabel: targetAssumption?.assumption.text || data.idea,
        question: testQuestion,
        method: methodKey,
        methodLabel: methodLabels[methodKey] || "Validation Experiment",
        target: String(target || "15 target practitioners in active workflow"),
        successSignal: String(
          successSignal || "At least 40% complete the workflow and request follow-up access"
        ),
        scheduledDate: "Sep 18, 2025",
        monthIndex: 8,
        day: 18,
        status: "PLANNED" as const,
        author: "Founder",
        createdAt: new Date().toISOString(),
      };

      const internal = getProbeInternalState();
      updateProbeLiveState({
        validationTests: [newTest, ...internal.validationTests],
        selectedNode: newTest.id,
      });

      emitProbeBridgeEvent("probe:voxide-create-validation-test", {
        test: newTest,
      });

      return {
        status: "success",
        validationTest: {
          id: newTest.id,
          question: newTest.question,
          method: newTest.methodLabel,
          target: newTest.target,
          successSignal: newTest.successSignal,
          scheduledDate: newTest.scheduledDate,
          originatingAssumption: newTest.originatingNodeId,
        },
      };
    },
  },

  openEvidenceGraph: {
    description:
      "Open the visual Living Evidence Graph (/app/evidence) to inspect supporting and challenging evidence nodes, focus on a specific assumption or node, and filter graph relationships without modifying the search input.",
    params: {
      focusNodeId: {
        type: "string",
        description:
          "Optional node ID, assumption ID ('A1', 'A2'), or natural reference ('first assumption', 'second assumption', 'this') to focus in the graph.",
      },
      filter: {
        type: "string",
        description:
          "Optional graph filter ('all', 'Supports', 'Challenges', 'Tests', 'Decisions', 'supporting', 'contradictory').",
      },
    },
    handler: async ({ focusNodeId, filter }) => {
      const data = await ensureInvestigationLoaded();
      let resolvedNodeId: string | null = focusNodeId ? String(focusNodeId) : null;

      if (resolvedNodeId) {
        const matchedAssump = findMatchingAssumption(data.analysis || [], resolvedNodeId);
        if (matchedAssump) {
          resolvedNodeId = matchedAssump.assumption.id;
        }
      }

      const rawFilter = String(filter || "all");
      const stanceNorm = normalizeEvidenceStanceFilter(rawFilter);
      let graphFilter = "all";
      if (stanceNorm === "SUPPORTS" || rawFilter === "Supports") graphFilter = "Supports";
      else if (stanceNorm === "CHALLENGES" || rawFilter === "Challenges") graphFilter = "Challenges";
      else if (/test/i.test(rawFilter)) graphFilter = "Tests";
      else if (/decision/i.test(rawFilter)) graphFilter = "Decisions";

      updateProbeLiveState({
        ...(resolvedNodeId ? { selectedNode: resolvedNodeId } : {}),
        evidenceGraphFilter: graphFilter,
      });

      navigateTo("/app/evidence");

      setTimeout(() => {
        emitProbeBridgeEvent("probe:voxide-open-graph", {
          focusNodeId: resolvedNodeId,
          filter: graphFilter,
        });
      }, 80);

      const concise = getConciseProbeState();
      return {
        status: "success",
        route: "/app/evidence",
        focusedNode: resolvedNodeId || concise.selectedNode || "central-idea",
        filter: graphFilter,
        evidenceGraphState: concise.evidenceGraphState,
      };
    },
  },

  filterEvidence: {
    description:
      "Filter existing evidence in the current Probe workspace and Living Evidence Graph by stance (supporting vs contradictory/against), source platform (Reddit, ScholarXIV, X, LinkedIn), or assumption without modifying the search input.",
    params: {
      stance: {
        type: "string",
        description:
          "Filter evidence by stance toward the hypothesis ('all', 'SUPPORTS', 'CHALLENGES', 'NEUTRAL', 'supporting', 'contradictory', 'against').",
      },
      sourceType: {
        type: "string",
        description:
          "Filter evidence by source platform ('all', 'reddit', 'x', 'linkedin', 'scholarxiv', 'academic').",
      },
      assumptionId: {
        type: "string",
        description:
          "Optional assumption selector ('all', 'A1', 'A2', 'first', 'second', 'third', 'this', or keyword) to focus and filter evidence for.",
      },
      tab: {
        type: "string",
        description: "Switch between verified, unverified, or rejected evidence repositories.",
        enum: ["verified", "unverified", "rejected"],
      },
    },
    handler: async ({ stance, sourceType, assumptionId, tab }) => {
      const data = await ensureInvestigationLoaded();
      const normalizedStance = normalizeEvidenceStanceFilter(stance ? String(stance) : undefined);
      const normalizedSource = normalizeSourceTypeFilter(
        sourceType ? String(sourceType) : undefined
      );

      let resolvedAssumptionId = "all";
      if (assumptionId && String(assumptionId).toLowerCase() !== "all") {
        const matched = findMatchingAssumption(data.analysis || [], String(assumptionId));
        if (matched) {
          resolvedAssumptionId = matched.assumption.id;
          updateProbeLiveState({ selectedNode: matched.assumption.id });
        }
      }

      const graphFilter =
        normalizedStance === "CHALLENGES"
          ? "Challenges"
          : normalizedStance === "SUPPORTS"
          ? "Supports"
          : "all";

      updateProbeLiveState({
        activeEvidenceFilters: {
          stance: normalizedStance,
          sourceType: normalizedSource,
          assumptionId: resolvedAssumptionId,
          tab: String(tab || "verified"),
        },
        evidenceGraphFilter: graphFilter,
      });

      emitProbeBridgeEvent("probe:voxide-filter", {
        stance: normalizedStance,
        sourceType: normalizedSource,
        assumptionId: resolvedAssumptionId,
        tab: tab || "verified",
        scrollToEvidence: true,
      });

      emitProbeBridgeEvent("probe:voxide-open-graph", {
        focusNodeId: resolvedAssumptionId !== "all" ? resolvedAssumptionId : undefined,
        filter: graphFilter,
      });

      const matchingItems = (data.allEvidence || []).filter((ev) => {
        if (normalizedStance !== "all" && ev.stance !== normalizedStance) return false;
        if (normalizedSource !== "all" && ev.sourceType !== normalizedSource) return false;
        if (
          resolvedAssumptionId !== "all" &&
          !ev.relatedAssumptionIds.includes(resolvedAssumptionId)
        ) {
          return false;
        }
        return true;
      });

      return {
        status: "success",
        appliedFilters: {
          stance: normalizedStance,
          sourceType: normalizedSource,
          assumptionId: resolvedAssumptionId,
          tab: tab || "verified",
        },
        matchingEvidenceCount: matchingItems.length,
        matchingEvidence: matchingItems.slice(0, 4).map((e) => ({
          id: e.id,
          sourceType: e.sourceType,
          stance: e.stance,
          title: e.title,
          excerpt: e.excerpt,
        })),
      };
    },
  },

  startProductTest: {
    description:
      "Execute a real headless Chromium Playwright test with a simulated user against a live external product URL. Resolves the target URL from the request or active state, executes the user's testing objective/persona, updates the Probe Product Testing UI, and returns actual Playwright observations and friction.",
    params: {
      productUrl: {
        type: "string",
        description:
          "Target website URL to test in Playwright. If omitted, uses the active product URL from current Probe state.",
      },
      task: {
        type: "string",
        description:
          "Concrete user task or testing objective for the simulated user to perform (e.g. 'Try to sign up', 'See if a first-time user can complete the main task and look for friction').",
      },
      persona: {
        type: "string",
        description:
          "Optional simulated user persona (e.g. 'student', 'first-time user', 'skeptical buyer').",
      },
      useGoogleAuth: {
        type: "boolean",
        description:
          "Enable Google/Gmail Sign-In authentication testing where the site supports Google OAuth.",
      },
    },
    handler: async ({ productUrl, task, persona, useGoogleAuth }) => {
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname || "/";
        if (currentPath.startsWith("/app") && currentPath !== "/app/testing") {
          navigateTo("/app/testing");
        } else if (currentPath === "/") {
          const section = document.getElementById("section-testing");
          section?.scrollIntoView({ behavior: "smooth" });
        } else if (currentPath === "/signin") {
          navigateTo("/app/testing");
        }
      }

      return executeStartProductTest({
        productUrl: productUrl ? String(productUrl) : undefined,
        task: task ? String(task) : undefined,
        persona: persona ? String(persona) : undefined,
        useGoogleAuth: Boolean(useGoogleAuth),
      });
    },
  },

  showProductTestResults: {
    description:
      "Inspect and return the actual Playwright observations, simulated user steps, failure points, load timing, and biggest UX friction from the current or most recent product testing session.",
    params: {
      sessionId: {
        type: "string",
        description:
          "Optional specific Playwright sessionId. If omitted, inspects the active or most recent Playwright test session.",
      },
    },
    handler: async ({ sessionId }) => {
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname || "/";
        if (currentPath.startsWith("/app") && currentPath !== "/app/testing") {
          navigateTo("/app/testing");
        } else if (currentPath === "/") {
          const section = document.getElementById("section-testing");
          section?.scrollIntoView({ behavior: "smooth" });
        }
      }

      return executeShowProductTestResults(sessionId ? String(sessionId) : undefined);
    },
  },

  summarizeInvestigation: {
    description:
      "Summarize the real current Probe investigation state based on actual deconstructed assumptions, supporting and challenging evidence, contradictions, existing alternatives, unresolved unknowns, and scheduled validation experiments.",
    params: {},
    handler: async () => {
      const data = await ensureInvestigationLoaded();
      const internal = getProbeInternalState();
      const analyses = data.analysis || [];
      const supported = analyses.filter((a) => a.status === "SUPPORTED").length;
      const challenged = analyses.filter(
        (a) =>
          a.status === "CHALLENGED" ||
          Boolean(internal.challengedAssumptions[a.assumption.id]?.challenged)
      ).length;
      const mixed = analyses.filter((a) => a.status === "MIXED").length;

      const contradictions = analyses
        .filter(
          (a) =>
            a.status === "CHALLENGED" ||
            a.contradiction ||
            Boolean(internal.challengedAssumptions[a.assumption.id]?.challenged)
        )
        .map((a) => ({
          assumptionId: a.assumption.id,
          assumption: a.assumption.text,
          contradiction:
            internal.challengedAssumptions[a.assumption.id]?.reason ||
            a.contradiction ||
            `${a.challengingCount} challenging signals`,
        }));

      const unknowns = [
        ...(data.summary?.biggestUnknown ? [data.summary.biggestUnknown] : []),
        ...analyses
          .filter((a) => a.status === "MIXED" || a.status === "UNKNOWN")
          .map((a) => `Unresolved validation for ${a.assumption.id}: ${a.assumption.text}`),
      ];

      const alternatives = inferAlternativesForIdea(data.idea);

      const validationExperiments = [
        ...internal.validationTests.map((t) => ({
          id: t.id,
          question: t.question,
          method: t.methodLabel,
          status: t.status,
          successSignal: t.successSignal,
        })),
        ...(data.summary?.recommendedNextTest
          ? [
              {
                id: "recommended-next-test",
                question: data.summary.recommendedNextTest.description,
                method: data.summary.recommendedNextTest.actionType,
                status: "RECOMMENDED",
                successSignal: data.summary.recommendedNextTest.title,
              },
            ]
          : []),
      ];

      return {
        status: "success",
        investigationId: getConciseProbeState().currentInvestigationId,
        idea: data.idea,
        strongestSignal: data.summary?.strongestSignal,
        biggestContradiction: data.summary?.biggestContradiction,
        biggestUnknown: data.summary?.biggestUnknown,
        highestRiskAssumption: data.summary?.highestRiskAssumption,
        assumptions: analyses.map((a) => ({
          id: a.assumption.id,
          text: a.assumption.text,
          status: internal.challengedAssumptions[a.assumption.id]?.challenged
            ? "CHALLENGED"
            : a.status,
          supportingCount: a.supportingCount,
          challengingCount: a.challengingCount,
        })),
        assumptionsBreakdown: {
          total: analyses.length,
          supported,
          challenged,
          mixed,
        },
        evidenceBreakdown: {
          totalVerified: data.allEvidence?.length || 0,
          supporting: (data.allEvidence || []).filter((e) => e.stance === "SUPPORTS").length,
          challenging: (data.allEvidence || []).filter((e) => e.stance === "CHALLENGES").length,
        },
        contradictions,
        alternatives,
        unknowns,
        validationExperiments,
        recommendedNextStep: data.summary?.recommendedNextTest?.description,
      };
    },
  },
});

// 3. Expose compact, live Probe state via ai.bindState() and ai.registerState()
ai.bindState(() => {
  return getConciseProbeState();
});

ai.registerState({
  currentRoute: () => getConciseProbeState().currentRoute,
  currentInvestigationId: () => getConciseProbeState().currentInvestigationId,
  currentIdea: () => getConciseProbeState().currentIdea,
  investigationStatus: () => getConciseProbeState().investigationStatus,
  visibleAssumptions: () => getConciseProbeState().visibleAssumptions,
  selectedAssumption: () => getConciseProbeState().selectedAssumption,
  visibleEvidence: () => getConciseProbeState().visibleEvidence,
  selectedEvidence: () => getConciseProbeState().selectedEvidence,
  evidenceGraphState: () => getConciseProbeState().evidenceGraphState,
  currentGraphNode: () => getConciseProbeState().currentGraphNode,
  activeEvidenceFilters: () => getConciseProbeState().activeEvidenceFilters,
  currentProductUrl: () => getConciseProbeState().currentProductUrl,
  productTestingStatus: () => getConciseProbeState().productTestingStatus,
  currentProductTestId: () => getConciseProbeState().currentProductTestId,
  currentTestingResultsSummary: () => getConciseProbeState().currentTestingResultsSummary,
  currentlySelectedProduct: () => getConciseProbeState().currentlySelectedProduct,
  selectedNode: () => getConciseProbeState().selectedNode,
  activeTestingStatus: () => getConciseProbeState().activeTestingStatus,
});

// Ensure post-action state snapshots sent in tool_result reflect the newly updated Probe state
let lastSnapshotRef: Record<string, any> | null = null;
const origGetSnapshot = (ai as any)._getCurrentStateSnapshot.bind(ai);
(ai as any)._getCurrentStateSnapshot = function () {
  const snap = origGetSnapshot();
  lastSnapshotRef = snap;
  return snap;
};

const origExecuteAction = (ai as any)._executeAction.bind(ai);
(ai as any)._executeAction = async function (actionName: string, args: Record<string, any> = {}) {
  const res = await origExecuteAction(actionName, args);
  if (lastSnapshotRef && typeof lastSnapshotRef === "object") {
    Object.assign(lastSnapshotRef, getConciseProbeState());
  }
  return res;
};

// 4. Voice Session State Machine (idle -> listening -> processing -> speaking -> idle)
// Prevents Voxide TTS output from ever entering STT or triggering search/commands.
function upsertPartialMsg(
  messages: Array<{ role: string; text: string; partial?: boolean }>,
  role: string,
  text: string
) {
  const last = messages[messages.length - 1];
  if (last && last.role === role && last.partial) {
    return [...messages.slice(0, -1), { ...last, text }];
  }
  return [...messages, { role, text, partial: true }];
}

function finalizePartialMsg(
  messages: Array<{ role: string; text: string; partial?: boolean }>,
  role: string
) {
  const last = messages[messages.length - 1];
  if (last && last.role === role && last.partial) {
    return [...messages.slice(0, -1), { ...last, partial: false }];
  }
  return messages;
}

function finalizeAllPartialMsgs(
  messages: Array<{ role: string; text: string; partial?: boolean }>
) {
  if (!messages.some((m) => m.partial)) return messages;
  return messages.map((m) => (m.partial ? { ...m, partial: false } : m));
}

let localSpeechRec: any = null;
let localSpeakingTimer: ReturnType<typeof setTimeout> | null = null;
let isExecutingLocalTurn = false;

function syncMicTrackEnabledState(client: any, state: VoiceState) {
  const shouldEnableMic = state === "listening";
  if (client?._voiceMic && typeof client._voiceMic.getAudioTracks === "function") {
    try {
      for (const track of client._voiceMic.getAudioTracks()) {
        track.enabled = shouldEnableMic;
      }
    } catch {
      // Ignore
    }
  }
}

function pauseLocalSpeechRecognition() {
  if (localSpeechRec) {
    const rec = localSpeechRec;
    localSpeechRec = null;
    try {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      rec.abort();
    } catch {
      // Ignore
    }
  }
}

function stopLocalSpeechRecognition() {
  pauseLocalSpeechRecognition();
  if (localSpeakingTimer) {
    clearTimeout(localSpeakingTimer);
    localSpeakingTimer = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }
  }
}

subscribeVoiceState((nextState) => {
  syncMicTrackEnabledState(ai, nextState);
  if (nextState !== "listening") {
    // Immediately stop/pause browser STT whenever Voxide is idle, processing, or speaking
    pauseLocalSpeechRecognition();
  }
});

/**
 * Processes a user voice transcript through the strict VoiceState lifecycle:
 * listening -> processing -> speaking -> idle (and back to listening if session remains open).
 * Ignores any input when not in `listening` state or when input matches Voxide TTS output.
 */
export async function processUserVoiceTranscript(
  rawTranscript: string,
  options: { speakResponse?: boolean; resumeListeningAfter?: boolean } = {}
): Promise<{ executed: boolean; capability?: string; result?: any; reason?: string }> {
  const cleanText = String(rawTranscript || "").trim();
  if (!cleanText) {
    return { executed: false, reason: "empty" };
  }

  // Only microphone input while `listening` can become a new user command
  if (!canAcceptUserSpeech()) {
    return { executed: false, reason: `ignored_in_state_${getVoiceState()}` };
  }

  // Never allow Voxide's spoken output to enter STT -> Voxide
  if (isAgentTtsEcho(cleanText)) {
    return { executed: false, reason: "tts_echo" };
  }

  const client: any = ai;
  const speakResponse = options.speakResponse ?? false;
  const resumeListeningAfter = options.resumeListeningAfter ?? Boolean(client._localVoiceActive);

  // Transition: listening -> processing (automatically pauses STT)
  setVoiceState("processing");
  client._setVoiceStatus("executing");

  try {
    const state = getConciseProbeState();
    const { name, args } = resolveVoiceCapabilityCall(cleanText, state);

    if (name === "noop") {
      setVoiceState("idle");
      if (resumeListeningAfter) {
        setVoiceState("listening");
        startLocalSpeechRecognition(client);
      }
      return { executed: false, reason: "noop" };
    }

    client._setVoiceSnapshot({ currentAction: name });
    const wrapped = await client._executeAction(name, args);
    const resultObj = wrapped?.result ?? wrapped;
    const replyText = formatCapabilityResultForSpeech(name, resultObj);

    if (replyText) {
      registerAgentSpokenText(replyText);
      client._setVoiceSnapshot({
        currentAction: null,
        messages: [
          ...finalizeAllPartialMsgs(client._voiceSnapshot.messages),
          { role: "ai", text: replyText },
        ],
      });
      client._emit("message", { role: "ai", text: replyText });
    } else {
      client._setVoiceSnapshot({ currentAction: null });
    }

    // Transition: processing -> speaking
    setVoiceState("speaking");
    client._setVoiceStatus("speaking");

    if (
      speakResponse &&
      replyText &&
      typeof window !== "undefined" &&
      "speechSynthesis" in window &&
      typeof SpeechSynthesisUtterance !== "undefined"
    ) {
      await new Promise<void>((resolve) => {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(replyText);
          utterance.lang = client.language || "en-US";
          utterance.rate = 1.03;
          let settled = false;
          const finish = () => {
            if (settled) return;
            settled = true;
            if (localSpeakingTimer) {
              clearTimeout(localSpeakingTimer);
              localSpeakingTimer = null;
            }
            resolve();
          };
          utterance.onend = finish;
          utterance.onerror = finish;
          localSpeakingTimer = setTimeout(
            finish,
            Math.min(12000, Math.max(2500, replyText.length * 70))
          );
          window.speechSynthesis.speak(utterance);
        } catch {
          resolve();
        }
      });
    }

    // Transition: speaking -> idle
    setVoiceState("idle");
    if (resumeListeningAfter) {
      setVoiceState("listening");
      client._setVoiceStatus("listening");
      startLocalSpeechRecognition(client);
    } else {
      client._setVoiceStatus("idle");
    }

    return { executed: true, capability: name, result: resultObj };
  } catch (err: any) {
    client._setVoiceSnapshot({ currentAction: null });
    setVoiceState("idle");
    if (resumeListeningAfter) {
      setVoiceState("listening");
      client._setVoiceStatus("listening");
      startLocalSpeechRecognition(client);
    } else {
      client._setVoiceStatus("idle");
    }
    return { executed: false, reason: err?.message || "execution_error" };
  }
}

async function executeLocalCapabilityTurn(client: any, userText: string, speakResponse: boolean) {
  const cleanText = String(userText || "").trim();
  if (!cleanText || isExecutingLocalTurn) return;
  if (isAgentTtsEcho(cleanText)) return;

  isExecutingLocalTurn = true;
  try {
    // Ensure we are in listening state before accepting the turn if triggered from text input
    if (getVoiceState() === "idle") {
      setVoiceState("listening");
    }
    await processUserVoiceTranscript(cleanText, {
      speakResponse,
      resumeListeningAfter: Boolean(client._localVoiceActive),
    });
  } finally {
    isExecutingLocalTurn = false;
  }
}

function startLocalSpeechRecognition(client: any) {
  if (typeof window === "undefined") return;
  if (!client._localVoiceActive || getVoiceState() !== "listening") return;
  const SpeechRecCtor =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecCtor || localSpeechRec) return;

  try {
    const rec = new SpeechRecCtor();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = client.language || "en-US";
    rec.maxAlternatives = 1;

    rec.onresult = (event: any) => {
      // Strictly ignore recognition events unless voiceState is "listening"
      if (!client._localVoiceActive || !canAcceptUserSpeech()) {
        return;
      }

      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const t = res?.[0]?.transcript || "";
        if (!t) continue;
        if (res.isFinal) {
          finalTranscript += t;
        } else {
          interimTranscript += t;
        }
      }

      if (interimTranscript.trim()) {
        const cleanInterim = interimTranscript.trim();
        if (!isAgentTtsEcho(cleanInterim)) {
          client._setVoiceSnapshot({
            messages: upsertPartialMsg(client._voiceSnapshot.messages, "user", cleanInterim),
          });
        }
      }

      if (finalTranscript.trim()) {
        const cleanFinal = finalTranscript.trim();
        if (isAgentTtsEcho(cleanFinal)) {
          return;
        }
        client._setVoiceSnapshot({
          messages: finalizePartialMsg(
            upsertPartialMsg(client._voiceSnapshot.messages, "user", cleanFinal),
            "user"
          ),
        });
        client._emit("message", { role: "user", text: cleanFinal });
        void executeLocalCapabilityTurn(client, cleanFinal, true);
      }
    };

    rec.onerror = () => {
      // Keep session alive for text or retry
    };

    rec.onend = () => {
      if (localSpeechRec === rec) {
        localSpeechRec = null;
      }
      if (client._localVoiceActive && getVoiceState() === "listening") {
        setTimeout(() => {
          if (client._localVoiceActive && getVoiceState() === "listening" && !localSpeechRec) {
            startLocalSpeechRecognition(client);
          }
        }, 200);
      }
    };

    localSpeechRec = rec;
    rec.start();
  } catch {
    // Browser speech recognition unavailable; text input still works
  }
}

(ai as any)._voiceStartMic = async function () {
  try {
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== "function") {
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 },
    });
    if (!this._localVoiceActive && this._voiceWs?.readyState !== WebSocket.OPEN) {
      stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
      return;
    }
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!this._voiceAudioOut && AudioCtx) {
      this._voiceAudioOut = new AudioCtx({ sampleRate: 24000 });
    }
    if (this._voiceAudioOut?.state === "suspended") {
      await this._voiceAudioOut.resume().catch(() => {});
    }
    const audioCtx = new AudioCtx({ sampleRate: 16000 });
    if (audioCtx.state === "suspended") {
      await audioCtx.resume().catch(() => {});
    }
    this._voiceAudioIn = audioCtx;
    this._voiceMic = stream;
    syncMicTrackEnabledState(this, getVoiceState());
    const source = audioCtx.createMediaStreamSource(stream);
    const processor = audioCtx.createScriptProcessor(2048, 1, 1);
    this._voiceProcessor = processor;
    processor.onaudioprocess = (e: AudioProcessingEvent) => {
      // Never stream microphone audio to Voxide while processing or speaking
      if (
        this._voiceWs?.readyState !== WebSocket.OPEN ||
        !canAcceptUserSpeech() ||
        this._voiceSnapshot?.status !== "listening" ||
        (Array.isArray(this._voiceActiveSources) && this._voiceActiveSources.length > 0)
      ) {
        return;
      }
      const float32 = e.inputBuffer.getChannelData(0);
      const buffer = new ArrayBuffer(float32.length * 2);
      const view = new DataView(buffer);
      for (let i = 0; i < float32.length; i++) {
        const s = Math.max(-1, Math.min(1, float32[i]));
        view.setInt16(i * 2, s < 0 ? s * 32768 : s * 32767, true);
      }
      let binary = "";
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      this._voiceWs.send(JSON.stringify({ type: "audio_input", data: window.btoa(binary) }));
    };
    source.connect(processor);
    processor.connect(audioCtx.destination);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    this._voiceInputAnalyser = analyser;
    this._voiceInputBuf = new Uint8Array(analyser.fftSize);
  } catch {
    // Microphone permission denied or unavailable; keep session active for text commands and voice output
    const AudioCtx =
      typeof window !== "undefined" &&
      (window.AudioContext || (window as any).webkitAudioContext);
    if (!this._voiceAudioOut && AudioCtx) {
      try {
        this._voiceAudioOut = new AudioCtx({ sampleRate: 24000 });
      } catch {
        // Ignore
      }
    }
  }
};

const origPlayAudioChunk = (ai as any)._voicePlayAudioChunk.bind(ai);
(ai as any)._voicePlayAudioChunk = function (base64Data: string) {
  setVoiceState("speaking");
  origPlayAudioChunk(base64Data);
  // Hook into active sources to transition speaking -> idle -> listening when playback completes
  if (Array.isArray(this._voiceActiveSources) && this._voiceActiveSources.length > 0) {
    const latestSource = this._voiceActiveSources[this._voiceActiveSources.length - 1];
    const origOnEnded = latestSource.onended;
    latestSource.onended = (ev: Event) => {
      if (typeof origOnEnded === "function") {
        origOnEnded.call(latestSource, ev);
      }
      if (!this._voiceActiveSources || this._voiceActiveSources.length === 0) {
        setVoiceState("idle");
        if (this._voiceWs?.readyState === WebSocket.OPEN || this._localVoiceActive) {
          setVoiceState("listening");
          this._setVoiceStatus("listening");
        }
      }
    };
  }
};

const origVoiceDisconnect = (ai as any)._voiceDisconnect.bind(ai);
(ai as any)._voiceDisconnect = function () {
  this._localVoiceActive = false;
  setVoiceState("idle");
  stopLocalSpeechRecognition();
  return origVoiceDisconnect();
};

const origVoiceInterrupt = (ai as any)._voiceInterrupt.bind(ai);
(ai as any)._voiceInterrupt = function () {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }
  }
  setVoiceState("idle");
  if (this._localVoiceActive || this._voiceWs?.readyState === WebSocket.OPEN) {
    setVoiceState("listening");
  }
  return origVoiceInterrupt();
};

const origOutputLevel = (ai as any)._voiceOutputLevel.bind(ai);
(ai as any)._voiceOutputLevel = function () {
  if (this._localVoiceActive && this._voiceSnapshot?.status === "speaking") {
    return 0.35 + Math.abs(Math.sin(Date.now() / 110)) * 0.45;
  }
  return origOutputLevel();
};

(ai as any)._voiceConnect = async function () {
  if (!this.isInitialized) {
    try {
      await this.init();
    } catch {
      // Continue with local capability agent if init cannot reach remote server
      this.isInitialized = true;
    }
  }
  if (
    (this._voiceWs && this._voiceWs.readyState !== WebSocket.CLOSED) ||
    this._localVoiceActive
  ) {
    return;
  }

  this._setVoiceSnapshot({ errorCode: undefined });
  this._setVoiceStatus("connecting");

  const activateLocalFallback = () => {
    this._localVoiceActive = true;
    if (this._voiceWs) {
      try {
        this._voiceWs.onclose = null;
        this._voiceWs.onerror = null;
        this._voiceWs.onmessage = null;
        this._voiceWs.close();
      } catch {
        // Ignore
      }
      this._voiceWs = null;
    }
    this._setVoiceSnapshot({
      sessionId: this._voiceSnapshot.sessionId || `vox_local_${Date.now()}`,
      errorCode: undefined,
    });
    setVoiceState("listening");
    this._setVoiceStatus("listening");
    if (!this._voiceMic) {
      void this._voiceStartMic();
    }
    startLocalSpeechRecognition(this);
    if (this._pendingFallbackText) {
      const pending = this._pendingFallbackText;
      this._pendingFallbackText = null;
      void executeLocalCapabilityTurn(this, pending, false);
    }
  };

  if (!hasConfiguredVoxideKey) {
    activateLocalFallback();
    return;
  }

  let ws: WebSocket;
  try {
    const visitorId =
      typeof window !== "undefined" && window.sessionStorage
        ? window.sessionStorage.getItem("__voxide_visitor_id") || "probe_visitor"
        : "probe_visitor";
    const wsUrl = resolveLiveUrl(this.baseUrl, this.publicKey, visitorId);
    ws = new WebSocket(wsUrl);
    this._voiceWs = ws;
  } catch {
    activateLocalFallback();
    return;
  }

  ws.onopen = () => {
    setVoiceState("listening");
    this._setVoiceStatus("listening");
    void this._voiceStartMic();
  };

  ws.onmessage = async (event: MessageEvent) => {
    let msg: any;
    try {
      msg = JSON.parse(event.data);
    } catch {
      return;
    }

    try {
      switch (msg.type) {
        case "ready":
          if (typeof msg.sessionId === "string" && msg.sessionId) {
            this._setVoiceSnapshot({ sessionId: msg.sessionId, errorCode: undefined });
          }
          break;

        case "text": {
          this._pendingFallbackText = null;
          pauseLocalSpeechRecognition();
          const piece = msg.text || "";
          this._voicePendingAiText += piece;
          const aggregated = this._voicePendingAiText;
          registerAgentSpokenText(aggregated);
          this._emit("transcript", { role: "ai", text: aggregated, partial: true });
          this._setVoiceSnapshot({
            messages: upsertPartialMsg(this._voiceSnapshot.messages, "ai", aggregated),
          });
          if (msg.turnComplete) {
            this._voicePendingAiText = "";
            registerAgentSpokenText(aggregated);
            this._emit("message", { role: "ai", text: aggregated });
            this._setVoiceSnapshot({
              messages: finalizePartialMsg(this._voiceSnapshot.messages, "ai"),
            });
          }
          break;
        }

        case "text_user": {
          // Ignore echoed user transcripts when Voxide is speaking or processing
          if (!canAcceptUserSpeech()) {
            break;
          }
          const piece = msg.text || "";
          if (isAgentTtsEcho(piece)) {
            break;
          }
          this._pendingFallbackText = null;
          pauseLocalSpeechRecognition();
          this._voicePendingUserText += piece;
          const aggregated = this._voicePendingUserText;
          if (isAgentTtsEcho(aggregated)) {
            this._voicePendingUserText = "";
            break;
          }
          this._setVoiceSnapshot({
            messages: upsertPartialMsg(this._voiceSnapshot.messages, "user", aggregated),
          });
          if (msg.turnComplete) {
            this._voicePendingUserText = "";
            this._emit("message", { role: "user", text: aggregated });
            this._setVoiceSnapshot({
              messages: finalizePartialMsg(this._voiceSnapshot.messages, "user"),
            });
          }
          break;
        }

        case "turn_complete": {
          if (this._voicePendingUserText) {
            if (!isAgentTtsEcho(this._voicePendingUserText)) {
              this._emit("message", { role: "user", text: this._voicePendingUserText });
            }
            this._voicePendingUserText = "";
          }
          this._flushPendingAiText();
          this._setVoiceSnapshot({
            messages: finalizeAllPartialMsgs(this._voiceSnapshot.messages),
          });
          if (!this._voiceActiveSources || this._voiceActiveSources.length === 0) {
            setVoiceState("idle");
            if (ws.readyState === WebSocket.OPEN) {
              setVoiceState("listening");
              this._setVoiceStatus("listening");
            }
          }
          break;
        }

        case "audio":
          this._pendingFallbackText = null;
          pauseLocalSpeechRecognition();
          setVoiceState("speaking");
          this._setVoiceStatus("speaking");
          this._voicePlayAudioChunk(msg.data);
          break;

        case "tool_call": {
          this._pendingFallbackText = null;
          pauseLocalSpeechRecognition();
          this._flushPendingAiText();
          setVoiceState("processing");
          this._setVoiceStatus("executing");
          this._setVoiceSnapshot({ currentAction: msg.name });
          const currentState = this._getCurrentStateSnapshot();
          const result = await this._executeAction(msg.name, msg.args);
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: "tool_result",
                id: msg.id,
                name: msg.name,
                result,
                state: currentState,
              })
            );
          }
          this._setVoiceSnapshot({ currentAction: null });
          this._setVoiceStatus("thinking");
          break;
        }

        case "interrupted":
          this._voiceStopPlayback();
          setVoiceState("idle");
          setVoiceState("listening");
          this._setVoiceStatus("listening");
          break;

        case "error":
          // Seamlessly switch to local browser speech + capability agent when upstream hits usage_limit or errors
          activateLocalFallback();
          break;
      }
    } catch {
      // Ignore message handling errors
    }
  };

  ws.onerror = () => {
    activateLocalFallback();
  };

  ws.onclose = () => {
    if (!this._localVoiceActive) {
      this._voiceDisconnect();
    }
  };
};

(ai as any)._voiceSendText = async function (text: string) {
  const clean = String(text || "").trim();
  if (!clean || isAgentTtsEcho(clean)) return;
  this._flushPendingAiText();
  this._setVoiceSnapshot({
    messages: [...finalizeAllPartialMsgs(this._voiceSnapshot.messages), { role: "user", text: clean }],
  });
  this._emit("message", { role: "user", text: clean });

  if (this._localVoiceActive) {
    await executeLocalCapabilityTurn(this, clean, false);
    return;
  }

  this._pendingFallbackText = clean;

  if (this._voiceWs?.readyState === WebSocket.OPEN) {
    const state = this._getCurrentStateSnapshot();
    setVoiceState("processing");
    this._setVoiceStatus("thinking");
    this._voiceWs.send(JSON.stringify({ type: "text_input", text: clean, state }));
    return;
  }

  await this._voiceConnect();
  if (this._localVoiceActive) {
    this._pendingFallbackText = null;
    await executeLocalCapabilityTurn(this, clean, false);
    return;
  }

  const ws: WebSocket | null = this._voiceWs;
  if (!ws) {
    this._localVoiceActive = true;
    this._pendingFallbackText = null;
    await executeLocalCapabilityTurn(this, clean, false);
    return;
  }

  const flush = () => {
    if (this._localVoiceActive) {
      this._pendingFallbackText = null;
      void executeLocalCapabilityTurn(this, clean, false);
      return;
    }
    const state = this._getCurrentStateSnapshot();
    setVoiceState("processing");
    this._setVoiceStatus("thinking");
    ws.send(JSON.stringify({ type: "text_input", text: clean, state }));
  };

  if (ws.readyState === WebSocket.OPEN) {
    flush();
  } else {
    ws.addEventListener(
      "open",
      () => {
        // Wait 250ms in case upstream immediately sends usage_limit on open
        setTimeout(() => {
          if (this._localVoiceActive) {
            void executeLocalCapabilityTurn(this, clean, false);
          } else if (ws.readyState === WebSocket.OPEN) {
            flush();
          }
        }, 250);
      },
      { once: true }
    );
  }
};

// 5. Deduplicate and run ai.init() to sync the registered capability manifest with the Voxide dashboard
const originalInit = ai.init.bind(ai);
let inflightInitPromise: Promise<typeof ai> | null = null;
ai.init = () => {
  if (ai.isInitialized) {
    return Promise.resolve(ai);
  }
  if (!hasConfiguredVoxideKey) {
    ai.isInitialized = true;
    (ai as any).uiHydrated = true;
    return Promise.resolve(ai);
  }
  if (!inflightInitPromise) {
    inflightInitPromise = originalInit().catch(() => {
      inflightInitPromise = null;
      ai.isInitialized = true;
      (ai as any).uiHydrated = true;
      return ai;
    });
  }
  return inflightInitPromise;
};

// Trigger manifest sync on load when running in the browser
if (typeof window !== "undefined") {
  void ai.init().catch(() => {
    // Handled gracefully by VoxideWidget state
  });
}

export function Assistant() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    appNavigate = (path: string) => navigate(path);
    return () => {
      appNavigate = null;
    };
  }, [navigate]);

  useEffect(() => {
    updateProbeLiveState({ currentRoute: location.pathname });
    ai.setActiveRoute(location.pathname);
  }, [location.pathname]);

  // Pass nothing but the client so Voxide dashboard Appearance controls work without being overridden
  return <VoxideWidget client={ai} />;
}

export default Assistant;
