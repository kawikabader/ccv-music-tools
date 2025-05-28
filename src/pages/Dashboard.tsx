import React from 'react';
import { useAuth } from '../utils/auth';

export function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">
          Welcome, {user?.name}!
        </h1>
        <p className="text-gray-600">
          This is your dashboard. You can manage your musician roster here.
        </p>
      </div>
    </div>
  );
} 