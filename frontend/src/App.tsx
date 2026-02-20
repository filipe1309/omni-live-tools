import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header, ToastContainer, ErrorBoundary } from './components';
import { ToastProvider } from './hooks';
import { LanguageProvider } from './i18n';
import { HomePage, ChatPage, PollPage, PollResultsPage, OverlayPage, ObsOverlayPage } from './pages';

function App () {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* OBS Overlay - No header */}
              <Route path="/obs" element={<ObsOverlayPage />} />

              {/* Poll Results Popup - No header */}
              <Route path="/poll-results" element={<PollResultsPage />} />

              {/* Main routes with header */}
              <Route
                path="*"
                element={
                  <div className="min-h-screen flex flex-col">
                    <Header />
                    <main className="flex-1">
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
          </BrowserRouter>
        </ToastProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
