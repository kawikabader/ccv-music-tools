import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './utils/authSupabase';
import { NotificationProvider } from './context/NotificationContext';
import { Layout } from './components/Layout/Layout';
import { Login } from './components/Auth/Login';
import { useAuth } from './utils/authSupabase';
import { MusicianListWithMultiSelect } from './components/MusicianList/MusicianListWithMultiSelect';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { OfflineDetector } from './components/Common/OfflineDetector';

function PrivateRoute({ children }: { children: React.ReactNode }): JSX.Element {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" />;
}

export function App(): JSX.Element {
  // Use basename in both dev and production
  const basename = '/roster';

  return (
    <Router basename={basename}>
      <AuthProvider>
        <NotificationProvider>
          <OfflineDetector />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/musicians"
              element={
                <ProtectedRoute>
                  <MusicianListWithMultiSelect />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/musicians" replace />} />
            <Route
              path="/unauthorized"
              element={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Unauthorized</h1>
                    <p className="text-gray-600">You don't have permission to access this page.</p>
                  </div>
                </div>
              }
            />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}
