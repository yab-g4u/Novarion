import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { SignInPage } from './pages/SignInPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { SharedInvestigationPage } from './pages/SharedInvestigationPage';
import { Assistant } from './components/Assistant';
import { handleAuthRedirectCallback } from './lib/auth/authService';

const RootEntryRoute: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // If user returned to root URL from OAuth provider with tokens or code, process and redirect to workspace
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      if (hash.includes('access_token=') || search.includes('code=')) {
        void (async () => {
          const user = await handleAuthRedirectCallback();
          if (user) {
            navigate('/app', { replace: true });
          }
        })();
      }
    }
  }, [navigate]);

  if (searchParams.has('share')) {
    return <SharedInvestigationPage />;
  }

  if (searchParams.has('workspace')) {
    return <SharedInvestigationPage />;
  }

  return <LandingPage />;
};

export const App: React.FC = () => {
  return (
    <>
      <Routes>
        {/* 1. ROOT ENTRY: Landing Page or Shared Workspace via ?share=<opaque-share-id> */}
        <Route path="/" element={<RootEntryRoute />} />

        {/* 2. SIGN IN: Dedicated Authentication */}
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/auth/callback" element={<SignInPage />} />

        {/* 3. MAIN WORKSPACE PLATFORM: Research, Testing, Evidence Graph & Validation Calendar */}
        <Route path="/app" element={<WorkspacePage />} />
        <Route path="/app/research" element={<WorkspacePage />} />
        <Route path="/app/testing" element={<WorkspacePage />} />
        <Route path="/app/evidence" element={<WorkspacePage />} />
        <Route path="/app/calendar" element={<WorkspacePage />} />

        {/* Catch-all redirects to root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Assistant />
    </>
  );
};

export default App;
