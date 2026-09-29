import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { SignInPage } from './pages/SignInPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { SharedInvestigationPage } from './pages/SharedInvestigationPage';

const LandingOrRoomRedirect: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomParam = searchParams.get('room');
  const ideaParam = searchParams.get('idea') || searchParams.get('q');

  useEffect(() => {
    if (roomParam) {
      const target = ideaParam
        ? `/r/${roomParam}?idea=${encodeURIComponent(ideaParam)}`
        : `/r/${roomParam}`;
      navigate(target, { replace: true });
    }
  }, [roomParam, ideaParam, navigate]);

  if (roomParam) {
    return null;
  }

  return <LandingPage />;
};

export const App: React.FC = () => {
  return (
    <Routes>
      {/* 1. LANDING PAGE: Marketing & Product Introduction with Video */}
      <Route path="/" element={<LandingOrRoomRedirect />} />

      {/* 2. SIGN IN: Dedicated Authentication */}
      <Route path="/signin" element={<SignInPage />} />

      {/* 3. SHARED INVESTIGATION ROOM WORKSPACE (Realtime Collaboration) */}
      <Route path="/r/:roomId" element={<SharedInvestigationPage />} />

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
