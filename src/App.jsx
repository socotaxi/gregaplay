import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ui/ErrorBoundary';
import Loading from './components/ui/Loading';

// Lazy loaded pages
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CreateEventPage = lazy(() => import('./pages/CreateEventPage'));
const SubmitVideoPage = lazy(() => import('./pages/SubmitVideoPage'));
const FinalVideoPage = lazy(() => import('./pages/FinalVideoPage'));
const InvitationPage = lazy(() => import('./pages/InvitationPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

// Route Guard
const PrivateRoute = ({ children }) => {
  const { user, profile, loading, isRecovering } = useAuth();
  const [localTimeout, setLocalTimeout] = useState(false);

  useEffect(() => {
    if (loading || isRecovering) {
      const timer = setTimeout(() => {
        console.log('PrivateRoute timeout triggered - proceeding anyway');
        setLocalTimeout(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [loading, isRecovering]);

  if ((loading || isRecovering) && !localTimeout) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <Loading />
        <p className="mt-2 text-gray-600">Chargement de votre profil...</p>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastContainer position="top-right" autoClose={3000} limit={3} />
        <Router>
          <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loading /></div>}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<ErrorBoundary><HomePage /></ErrorBoundary>} />
              <Route path="/login" element={<ErrorBoundary><LoginPage /></ErrorBoundary>} />
              <Route path="/register" element={<ErrorBoundary><RegisterPage /></ErrorBoundary>} />
              <Route path="/invitation/:token" element={<ErrorBoundary><InvitationPage /></ErrorBoundary>} />
              <Route path="/submit/:eventId" element={<ErrorBoundary><SubmitVideoPage /></ErrorBoundary>} />
              <Route path="/final/:eventId" element={<ErrorBoundary><FinalVideoPage /></ErrorBoundary>} />

              {/* Protected routes */}
              <Route path="/dashboard" element={
                <PrivateRoute><ErrorBoundary><DashboardPage /></ErrorBoundary></PrivateRoute>
              } />
              <Route path="/create-event" element={
                <PrivateRoute><ErrorBoundary><CreateEventPage /></ErrorBoundary></PrivateRoute>
              } />
              <Route path="/profile" element={
                <PrivateRoute><ErrorBoundary><ProfilePage /></ErrorBoundary></PrivateRoute>
              } />
              <Route path="/events/:eventId" element={
                <PrivateRoute><ErrorBoundary><FinalVideoPage /></ErrorBoundary></PrivateRoute>
              } />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
