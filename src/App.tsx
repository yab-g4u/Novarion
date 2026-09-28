import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { SignInPage } from './pages/SignInPage';
import { WorkspacePage } from './pages/WorkspacePage';

export const App: React.FC = () => {
  return (
    <Routes>
      {/* 1. LANDING PAGE: Marketing & Product Introduction with Video */}
      <Route path="/" element={<LandingPage />} />

      {/* 2. SIGN IN: Dedicated Authentication */}
      <Route path="/signin" element={<SignInPage />} />

      {/* 3. MAIN WORKSPACE PLATFORM: Authenticated Research, Testing, Graph & Calendar */}
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
