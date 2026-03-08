import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Header, ToastContainer, ErrorBoundary, ConnectionModal } from './components';
import { ToastProvider, ConnectionProvider, useConnectionContext, PollProvider } from './hooks';
import { LanguageProvider, useLanguage } from './i18n';

// Eager load only the most commonly accessed pages
import { HomePage, ChatPage, PollPage } from './pages';

// Lazy load overlay pages and less frequently accessed pages
const PollResultsPage = lazy(() => import('./pages/PollResultsPage'));
const OverlayPage = lazy(() => import('./pages/OverlayPage'));
const ObsOverlayPage = lazy(() => import('./pages/ObsOverlayPage'));
const ObsFeaturedMessagePage = lazy(() => import('./pages/ObsFeaturedMessagePage'));
const ObsChatPage = lazy(() => import('./pages/ObsChatPage'));
const ObsGiftPage = lazy(() => import('./pages/ObsGiftPage'));
const ObsQueuePage = lazy(() => import('./pages/ObsQueuePage'));

// Separate component to access connection context
function ConnectionModalWrapper () {
  const { showConnectionModal, setShowConnectionModal } = useConnectionContext();
  return (
    <ConnectionModal
      isOpen={showConnectionModal}
      onClose={() => setShowConnectionModal(false)}
    />
  );
}

// App content with routes - rendered after translations load
function AppContent () {
  return (
    <>
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-900"><div className="text-white">Loading...</div></div>}>
          <Routes>
            {/* OBS Overlay - No header */}
            <Route path="/obs" element={<ObsOverlayPage />} />

            {/* OBS Featured Message Overlay - No header */}
            <Route path="/obs-featured" element={<ObsFeaturedMessagePage />} />

            {/* OBS Chat Pop-out - No header */}
            <Route path="/obs-chat" element={<ObsChatPage />} />

            {/* OBS Gift Pop-out - No header */}
            <Route path="/obs-gift" element={<ObsGiftPage />} />

            {/* OBS Queue Pop-out - No header */}
            <Route path="/obs-queue" element={<ObsQueuePage />} />

            {/* Poll Results Popup - No header */}
            <Route path="/poll-results" element={<PollResultsPage />} />

            {/* Main routes with header */}
            <Route
              path="*"
              element={
                <div className="min-h-screen flex flex-col">
                  <Header />
                  <main className="flex-1 flex flex-col">
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/chat" element={<ChatPage />} />
                      <Route path="/poll" element={<PollPage />} />
                      <Route path="/overlay" element={<OverlayPage />} />
                    </Routes>
                  </main>
                </div>
              }
            />
          </Routes>
        </Suspense>
        <ToastContainer />
        <ConnectionModalWrapper />
      </BrowserRouter>
    </>
  );
}

// Wrapper that waits for translations to load
function AppWithLanguage () {
  const { isLoading } = useLanguage();
  
  // Show minimal loading screen while translations load (usually very fast)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }
  
  return <AppContent />;
}

function App () {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ToastProvider>
          <ConnectionProvider>
            <PollProvider>
              <AppWithLanguage />
            </PollProvider>
          </ConnectionProvider>
        </ToastProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
