import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';

// Loader while components load
const Loading = () => <div>Loading...</div>;

// Lazy-loaded pages
const SplashScreen = lazy(() => import('./src/ui/splash/SplashScreen'));
const LoginScreen = lazy(() => import('./src/ui/login/LoginScreen'));
const MainScreen = lazy(() => import('./src/ui/main/MainScreen'));
const SummaryScreenWeb = lazy(() => import('./src/ui/summary/SummaryScreenWeb'));

// Page mapping for catch-all
const pageMap: Record<string, any> = {
  summary: SummaryScreenWeb,
  splash: SplashScreen,
  login: LoginScreen,
  main: MainScreen,
};

// Dynamic page loader for URLs
function PageLoader() {
  const { pageName } = useParams<{ pageName: string }>();
  if (!pageName) return <Navigate to="/splash" replace />; // default to splash

  const PageComponent = pageMap[pageName.toLowerCase()];
  if (!PageComponent) return <div>Page not found</div>;

  return (
    <Suspense fallback={<Loading />}>
      <PageComponent />
    </Suspense>
  );
}

// App router
export default function AppRouter() {
  return (
    <Router>
      <Routes>
        {/* Default route → redirect to splash */}
        <Route path="/" element={<Navigate to="/splash" replace />} />

        {/* Catch-all dynamic pages */}
        <Route path="/:pageName/*" element={<PageLoader />} />

        {/* Redirect unknown routes to splash */}
        <Route path="*" element={<Navigate to="/splash" replace />} />
      </Routes>
    </Router>
  );
}
