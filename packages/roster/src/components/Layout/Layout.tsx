import React from 'react';
import { useAuth } from '../../utils/authSupabase';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps): JSX.Element {
  const { user, profile, signOut, isSessionValid, connectionError, refreshSession } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="text-xl font-bold text-indigo-600">Band Contacts</div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Session Status Indicator */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${connectionError ? 'bg-red-500' :
                    isSessionValid ? 'bg-green-500' :
                      'bg-yellow-500'
                  }`} />
                <span className="text-xs text-gray-500">
                  {connectionError ? 'Connection Issues' :
                    isSessionValid ? 'Session Active' :
                      'Session Validating'}
                </span>
                {connectionError && (
                  <button
                    onClick={refreshSession}
                    className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                  >
                    Retry
                  </button>
                )}
              </div>

              <div className="text-sm text-gray-500">{profile?.name || user?.email}</div>
              <button
                onClick={signOut}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
} 