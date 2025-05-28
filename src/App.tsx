import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './utils/auth';
import { NotificationProvider } from './context/NotificationContext';
import { Layout } from './components/Layout/Layout';
import { Login } from './components/Auth/Login';
import { Musicians } from './pages/Musicians';
import { useAuth } from './utils/auth';

function PrivateRoute({ children }: { children: React.ReactNode }): JSX.Element {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" />;
}

export function App(): JSX.Element {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout>
                    <Musicians />
                  </Layout>
                </PrivateRoute>
              }
            />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}
