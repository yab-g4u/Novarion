import React from 'react';
import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { SignInPage } from './pages/SignInPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { SharedInvestigationPage } from './pages/SharedInvestigationPage';

const RootEntryRoute: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sharedId =
    searchParams.get('workspace') ||
    searchParams.get('room') ||
    searchParams.get('share') ||
    searchParams.get('investigation');

  // Render SharedInvestigationPage directly when opened via root query parameter
  // so refreshing never depends on subpath rewrite rules on static servers.
  if (sharedId) {
    return <SharedInvestigationPage />;
  }

  return <LandingPage />;
};

export const App: React.FC = () => {
  return (
    <Routes>
      {/* 1. LANDING PAGE OR ROOT-QUERY SHARED WORKSPACE */}
      <Route path="/" element={<RootEntryRoute />} />

      {/* 2. SIGN IN: Dedicated Authentication */}
      <Route path="/signin" element={<SignInPage />} />

      {/* 3. SHARED INVESTIGATION WORKSPACE ROUTES (All canonical & legacy formats supported) */}
      <Route path="/r/:roomId" element={<SharedInvestigationPage />} />
      <Route path="/workspace/:roomId" element={<SharedInvestigationPage />} />
      <Route path="/investigation/:roomId" element={<SharedInvestigationPage />} />
      <Route path="/share/:roomId" element={<SharedInvestigationPage />} />

      {/* 4. MAIN WORKSPACE PLATFORM: Authenticated Research, Testing, Evidence Graph & Validation Calendar */}
      <Route path="/app" element={<WorkspacePage />} />
      <Route path="/app/research" element={<WorkspacePage />} />
      <Route path="/app/testing" element={<WorkspacePage />} />
      <Route path="/app/evidence" element={<WorkspacePage />} />
      <Route path="/app/calendar" element={<WorkspacePage />} />

      {/* Catch-all redirects to landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
