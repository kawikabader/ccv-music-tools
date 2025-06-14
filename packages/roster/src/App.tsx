import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider } from './utils/authSupabase';
import { Layout } from './components/Layout/Layout';
import { Login } from './components/Auth/Login';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { MusicianListWithMultiSelect } from './components/MusicianList/MusicianListWithMultiSelect';
import { OfflineDetector } from './components/Common/OfflineDetector';
import { LogViewer } from './components/Debug/LogViewer';
import { DebugSupabase } from './components/DebugSupabase';

// Router configuration with future flags to eliminate warnings
const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/debug",
    element: <DebugSupabase />
  },
  {
    path: "/musicians",
    element: (
      <ProtectedRoute>
        <MusicianListWithMultiSelect />
      </ProtectedRoute>
    )
  },
  {
    path: "/",
    element: <Navigate to="/musicians" replace />
  },
  {
    path: "/unauthorized",
    element: (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Unauthorized</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }
], {
  basename: '/roster',
  future: {
    v7_normalizeFormMethod: true
  }
});

export function App(): JSX.Element {
  return (
    <AuthProvider>
      <NotificationProvider>
        <OfflineDetector />
        <RouterProvider router={router} />
        {/* Development-only log viewer */}
        {/* <LogViewer /> */}
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
