import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import WorkspacePage from './pages/WorkspacePage';
import ChannelPage from './pages/ChannelPage';

function App() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Router>
        <Routes>
          <Route
            path="/login"
            element={!user ? <LoginPage /> : <Navigate to="/workspace" />}
          />
          <Route
            path="/register"
            element={!user ? <RegisterPage /> : <Navigate to="/workspace" />}
          />
          <Route
            path="/workspace"
            element={user ? <WorkspacePage /> : <Navigate to="/login" />}
          />
          <Route
            path="/workspace/:workspaceId/channel/:channelId"
            element={user ? <ChannelPage /> : <Navigate to="/login" />}
          />
          <Route path="/" element={<Navigate to="/workspace" />} />
        </Routes>
      </Router>
      <Toaster position="top-right" />
    </>
  );
}

export default App;
