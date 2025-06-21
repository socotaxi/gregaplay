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

// Route Guard for authenticated routes with improved profile handling
const PrivateRoute = ({ children }) => {
  // Use the useAuth hook for authentication
  const { user, profile, loading, isRecovering } = useAuth();
  const [localTimeout, setLocalTimeout] = useState(false);
  
  // Set a timeout to prevent infinite loading
  useEffect(() => {
    if (loading || isRecovering) {
      const timer = setTimeout(() => {
        console.log('PrivateRoute timeout triggered - proceeding anyway');
        setLocalTimeout(true);
      }, 3000); // Give it 3 seconds max
      
      return () => clearTimeout(timer);
    }
  }, [loading, isRecovering]);
  
  // Show loading state only if within reasonable time
  if ((loading || isRecovering) && !localTimeout) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <Loading />
        <p className="mt-2 text-gray-600">Chargement de votre profil...</p>
      </div>
    );
  }
  
  // Important: If we have a user but profile is still loading, proceed anyway
  // The app will use fallback profile data until the real profile loads
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
              <Route path="/" element={
                <ErrorBoundary>
                  <HomePage />
                </ErrorBoundary>
              } />
              <Route path="/login" element={
                <ErrorBoundary>
                  <LoginPage />
                </ErrorBoundary>
              } />
              <Route path="/register" element={
                <ErrorBoundary>
                  <RegisterPage />
                </ErrorBoundary>
              } />
              <Route path="/invitation/:token" element={
                <ErrorBoundary>
                  <InvitationPage />
                </ErrorBoundary>
              } />
              <Route path="/submit/:eventId" element={
                <ErrorBoundary>
                  <SubmitVideoPage />
                </ErrorBoundary>
              } />
              <Route path="/final/:eventId" element={
                <ErrorBoundary>
                  <FinalVideoPage />
                </ErrorBoundary>
              } />
              
              {/* Protected routes */}
              <Route 
                path="/dashboard" 
                element={
                  <PrivateRoute>
                    <ErrorBoundary>
                      <DashboardPage />
                    </ErrorBoundary>
                  </PrivateRoute>
                } 
              />
              <Route
                path="/create-event"
                element={
                  <PrivateRoute>
                    <ErrorBoundary>
                      <CreateEventPage />
                    </ErrorBoundary>
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <ErrorBoundary>
                      <ProfilePage />
                    </ErrorBoundary>
                  </PrivateRoute>
                }
              />
              <Route
                path="/events/:eventId"
                element={
                  <PrivateRoute>
                    <ErrorBoundary>
                      <FinalVideoPage />
                    </ErrorBoundary>
                  </PrivateRoute>
                } 
              />
              
              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;