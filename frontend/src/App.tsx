import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header, ToastContainer, ErrorBoundary, ConnectionModal } from './components';
import { ToastProvider, ConnectionProvider, useConnectionContext, PollProvider } from './hooks';
import { LanguageProvider } from './i18n';
import { HomePage, ChatPage, PollPage, PollResultsPage, OverlayPage, ObsOverlayPage, ObsFeaturedMessagePage, ObsChatPage, ObsGiftPage, ObsQueuePage } from './pages';

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

function App () {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ToastProvider>
          <ConnectionProvider>
            <PollProvider>
              <BrowserRouter>
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
              <ToastContainer />
              <ConnectionModalWrapper />
            </BrowserRouter>
            </PollProvider>
          </ConnectionProvider>
        </ToastProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
