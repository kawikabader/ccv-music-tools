import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './utils/auth';
import { NotificationProvider } from './context/NotificationContext';
import { Layout } from './components/Layout/Layout';
import { Login } from './components/Auth/Login';
import { Unauthorized } from './components/Auth/Unauthorized';
import { Dashboard } from './pages/Dashboard';
import { Musicians } from './pages/Musicians';
import { Notification } from './components/Common/Notification';
import { useAuth } from './utils/auth';

function PrivateRoute({ children }: { children: React.ReactNode }): JSX.Element {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function AppRoutes(): JSX.Element {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route index element={<Dashboard />} />
                <Route path="musicians" element={<Musicians />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export function App(): JSX.Element {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <Notification />
          <AppRoutes />
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}
