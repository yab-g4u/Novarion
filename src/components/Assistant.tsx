"use client";
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { VoxideClient, VoxideWidget } from "@voxide/react";
import { ALLOWED_GOOGLE_TEST_EMAIL } from "../lib/testing/testing.types";

const VOXIDE_PUBLIC_KEY =
  (typeof import.meta !== "undefined" &&
    ((import.meta as any).env?.VITE_VOXIDE_KEY ||
      (import.meta as any).env?.VITE_VOXIDE_PUBLIC_KEY)) ||
  "vox_pub_XXXXXXXXXXXX";

// Publishable key — safe to ship in the browser
export const ai = new VoxideClient({
  publicKey: VOXIDE_PUBLIC_KEY,
});

// Keep a reference to React Router's navigate function so global capabilities can navigate cleanly
let appNavigate: ((path: string) => void) | null = null;

function navigateTo(path: string) {
  if (appNavigate) {
    appNavigate(path);
  } else if (typeof window !== "undefined") {
    window.location.assign(path);
  }
}

// Register navigation with Probe's real application routes
ai.enableNavigation(
  {
    push: (route: string) => navigateTo(route),
  },
  [
    { path: "/", description: "Probe landing page with live investigation, evidence graph, and Playwright testing" },
    { path: "/signin", description: "Founder sign-in and account authentication page" },
    { path: "/app", description: "Main Probe founder workspace" },
    { path: "/app/research", description: "Idea pressure-testing and multi-source research workspace" },
    { path: "/app/testing", description: "Real Playwright headless browser product testing workspace" },
    { path: "/app/evidence", description: "Living Evidence Graph showing supporting and challenging evidence nodes" },
    { path: "/app/calendar", description: "Founder validation sprint calendar and milestone schedule" },
  ]
);

// Register real capabilities for Probe
ai.register({
  investigateIdea: {
    description:
      "Pressure-test and investigate a startup idea, product concept, or market hypothesis across Reddit, X, LinkedIn, and ScholarXIV.",
    params: {
      idea: {
        type: "string",
        required: true,
        description: "The startup idea, product hypothesis, or market claim to investigate",
      },
      openWorkspace: {
        type: "boolean",
        description: "If true, navigate to the full Research Workspace (/app/research) to display the investigation",
      },
    },
    handler: async ({ idea, openWorkspace }) => {
      const cleanIdea = String(idea || "").trim();
      if (!cleanIdea) {
        return { status: "error", message: "Please provide a startup idea or hypothesis to investigate." };
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("probe_active_idea", cleanIdea);
        window.dispatchEvent(
          new CustomEvent("probe:voxide-investigate", {
            detail: { idea: cleanIdea },
          })
        );
      }

      if (openWorkspace) {
        navigateTo("/app/research");
      }

      const res = await fetch("/api/pressure-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: cleanIdea }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return {
          status: "error",
          message: err.message || err.error || `Pressure-test request failed (HTTP ${res.status})`,
        };
      }

      const data = await res.json();
      return {
        status: "ok",
        idea: data.idea,
        verdict: data.verdict?.overallAssessment || "Analyzed",
        confidenceScore: data.verdict?.confidenceScore,
        assumptionsCount: Array.isArray(data.assumptions) ? data.assumptions.length : 0,
        evidenceCount: Array.isArray(data.allEvidence) ? data.allEvidence.length : 0,
        topRecommendation: data.verdict?.recommendedNextStep,
      };
    },
  },

  searchEvidence: {
    description:
      "Search real-world practitioner discussions and academic papers across Reddit, X, LinkedIn, and ScholarXIV.",
    params: {
      query: {
        type: "string",
        required: true,
        description: "Search query or topic to look up across evidence sources",
      },
      source: {
        type: "string",
        description: "Optional specific source filter",
        enum: ["all", "reddit", "x", "linkedin", "scholarxiv"],
      },
      limit: {
        type: "number",
        description: "Maximum number of evidence items to return (1 to 25)",
      },
    },
    handler: async ({ query, source, limit }) => {
      const cleanQuery = String(query || "").trim();
      const sources =
        source && source !== "all" ? [String(source)] : ["reddit", "x", "linkedin", "scholarxiv"];

      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: cleanQuery,
          sources,
          limit: typeof limit === "number" ? Math.min(Math.max(limit, 1), 25) : 10,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return {
          status: "error",
          message: err.message || err.error || `Evidence search failed (HTTP ${res.status})`,
        };
      }

      const data = await res.json();
      return {
        status: "ok",
        query: cleanQuery,
        totalResults: data.results?.length || 0,
        topResults: (data.results || []).slice(0, 5).map((r: any) => ({
          title: r.title,
          sourceType: r.sourceType,
          stance: r.stance,
          url: r.url,
        })),
      };
    },
  },

  runProductTest: {
    description:
      "Launch a real headless Playwright Chromium browser session to open a live website URL, execute a concrete user task, measure load time, and detect UX friction.",
    params: {
      productUrl: {
        type: "string",
        required: true,
        description: "The live website URL to open in Playwright (e.g. https://links.et or https://example.com)",
      },
      task: {
        type: "string",
        description: "Concrete user task for the Playwright browser agent to execute on the target site",
      },
      useGoogleAuth: {
        type: "boolean",
        description: "Enable Google Sign-In authentication testing where the site supports Google OAuth",
      },
    },
    handler: async ({ productUrl, task, useGoogleAuth }) => {
      const targetUrl = String(productUrl || "").trim();
      const targetTask =
        String(
          task || "Explore landing page, test primary navigation, and evaluate UX friction"
        ).trim();

      const res = await fetch("/api/testing/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productUrl: targetUrl,
          task: targetTask,
          authEmail: useGoogleAuth ? ALLOWED_GOOGLE_TEST_EMAIL : undefined,
          maxSteps: 8,
          timeoutMs: 45000,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          status: "error",
          message:
            payload?.message ||
            payload?.error ||
            `Failed to launch Playwright session (HTTP ${res.status})`,
        };
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("probe:voxide-product-test", {
            detail: {
              sessionId: payload.sessionId,
              productUrl: payload.productUrl || targetUrl,
              task: payload.task || targetTask,
              useGoogleAuth: Boolean(useGoogleAuth),
            },
          })
        );
      }

      return {
        status: "ok",
        sessionId: payload.sessionId,
        sessionStatus: payload.status,
        productUrl: payload.productUrl,
        task: payload.task,
      };
    },
  },

  getProductTestStatus: {
    description:
      "Check the status, page load timing, actions, and UX findings of a Playwright product testing session.",
    params: {
      sessionId: {
        type: "string",
        description: "Optional specific Playwright sessionId. If omitted, returns the most recent session.",
      },
    },
    handler: async ({ sessionId }) => {
      if (sessionId) {
        const res = await fetch(`/api/testing/session/${encodeURIComponent(String(sessionId))}`);
        if (!res.ok) {
          return { status: "error", message: `Session ${sessionId} not found (HTTP ${res.status})` };
        }
        const sess = await res.json();
        return {
          status: "ok",
          sessionId: sess.sessionId,
          sessionStatus: sess.status,
          currentUrl: sess.currentUrl,
          loadTimeMs: sess.navigationTiming?.loadTimeMs,
          stepCount: sess.stepCount,
          errors: sess.errors,
          findingsCount: sess.findings?.length || 0,
        };
      }

      const listRes = await fetch("/api/testing/sessions");
      if (!listRes.ok) {
        return { status: "error", message: "Unable to retrieve active testing sessions." };
      }
      const { sessions } = await listRes.json();
      const latest = Array.isArray(sessions) && sessions.length > 0 ? sessions[0] : null;
      if (!latest) {
        return { status: "ok", message: "No product testing sessions have been run yet." };
      }
      return {
        status: "ok",
        sessionId: latest.sessionId,
        sessionStatus: latest.status,
        currentUrl: latest.currentUrl,
        loadTimeMs: latest.navigationTiming?.loadTimeMs,
        stepCount: latest.stepCount,
        errors: latest.errors,
      };
    },
  },

  stopProductTest: {
    description: "Stop and abort a running Playwright browser product testing session.",
    dangerous: true,
    params: {
      sessionId: {
        type: "string",
        required: true,
        description: "The sessionId of the running Playwright test to abort",
      },
    },
    handler: async ({ sessionId }) => {
      const res = await fetch(
        `/api/testing/session/${encodeURIComponent(String(sessionId))}/stop`,
        { method: "POST" }
      );
      if (!res.ok) {
        return { status: "error", message: "Session not found or already finished." };
      }
      return { status: "ok", sessionId, sessionStatus: "STOPPED" };
    },
  },

  filterWorkspaceEvidence: {
    description:
      "Filter the evidence items in the Probe Research Workspace by stance (supporting vs challenging) or by source platform.",
    scope: "/app/*",
    params: {
      stance: {
        type: "string",
        description: "Filter evidence by stance toward the hypothesis",
        enum: ["all", "SUPPORTS", "CHALLENGES", "NEUTRAL"],
      },
      sourceType: {
        type: "string",
        description: "Filter evidence by source platform",
        enum: ["all", "reddit", "x", "linkedin", "scholarxiv"],
      },
      tab: {
        type: "string",
        description: "Switch between verified, unverified, or rejected evidence repositories",
        enum: ["verified", "unverified", "rejected"],
      },
    },
    handler: async ({ stance, sourceType, tab }) => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("probe:voxide-filter", {
            detail: { stance, sourceType, tab },
          })
        );
      }
      return {
        status: "ok",
        appliedFilters: {
          stance: stance || "unchanged",
          sourceType: sourceType || "unchanged",
          tab: tab || "unchanged",
        },
      };
    },
  },

  scrollToLandingSection: {
    description:
      "Scroll smoothly to a specific section on the Probe landing page (live investigation, evidence graph, or product testing).",
    scope: "/",
    params: {
      section: {
        type: "string",
        required: true,
        description: "Section identifier on the landing page",
        enum: ["live-investigation", "section-evidence-graph", "section-testing"],
      },
    },
    handler: async ({ section }) => {
      if (typeof document !== "undefined") {
        const el = document.getElementById(String(section));
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
          return { status: "ok", scrolledTo: section };
        }
      }
      return { status: "error", message: `Section ${section} is not visible on the current page.` };
    },
  },

  signInFounder: {
    description: "Sign in to the Probe Founder Workspace using an email address.",
    params: {
      email: {
        type: "string",
        required: true,
        sensitive: true,
        description: "Founder email address to sign in with",
      },
    },
    handler: async ({ email }) => {
      const userEmail = String(email || "founder@probe.dev").trim();
      const userName = userEmail.split("@")[0] || "Founder";
      const profile = {
        name: userName.charAt(0).toUpperCase() + userName.slice(1),
        email: userEmail,
        signedInAt: new Date().toISOString(),
      };
      if (typeof window !== "undefined") {
        localStorage.setItem("probe_auth_user", JSON.stringify(profile));
      }
      ai.setUser({ userId: userEmail, email: userEmail, name: profile.name });
      navigateTo("/app/research");
      return { status: "ok", signedInAs: profile.name };
    },
  },

  signOutFounder: {
    description: "Sign out of the Probe Founder Workspace and return to the home page.",
    dangerous: true,
    scope: "/app/*",
    handler: async () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("probe_auth_user");
      }
      ai.setUser(null);
      navigateTo("/");
      return { status: "ok", signedOut: true };
    },
  },
});

// Let the Voxide agent see live Probe UI state every turn
ai.bindState(() => {
  if (typeof window === "undefined") {
    return { currentPage: "/" };
  }

  const pathname = window.location.pathname || "/";
  const activeIdea =
    localStorage.getItem("probe_active_idea") ||
    "AI tools will replace most productivity software";

  let user: { name?: string; email?: string } | null = null;
  try {
    const rawUser = localStorage.getItem("probe_auth_user");
    if (rawUser) user = JSON.parse(rawUser);
  } catch {
    user = null;
  }

  return {
    currentPage: pathname,
    activeIdea,
    isAuthenticated: Boolean(user),
    founderName: user?.name || null,
    trialQueriesUsed: Number(localStorage.getItem("probe_trial_queries") || "0"),
  };
});

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
    ai.setActiveRoute(location.pathname);
  }, [location.pathname]);

  // Pass nothing but the client. Every other prop outranks the dashboard, so
  // hardcoding one makes the matching Appearance control silently do nothing.
  return <VoxideWidget client={ai} />;
}

export default Assistant;
