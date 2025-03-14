import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import React from 'react';
import { useAuth } from './context/AuthProvider';
import Header from './components/Header';
import VideoFeed from './pages/VideoFeed';
import VideoPage from './pages/VideoPage';
import VideoUpload from './pages/VideoUpload';
import AnalyticsPage from './pages/AnalyticsPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { user } = useAuth();

  return (
    <Router>
      <div className="bg-black min-h-screen">
        <Header />
        <main>
          <Routes>
            {/* Home Page ("/") */}
            <Route path="/" element={<VideoFeed />} />

            {/* Example route for a single video player page */}
            <Route path="/video/:videoId" element={<VideoPage />} />

            <Route
              path="/upload-video"
              element={
                <ProtectedRoute user={user}>
                  <VideoUpload />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute user={user}>
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
