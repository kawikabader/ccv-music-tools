import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  duration?: number;
}

export function DebugSupabase() {
  const [results, setResults] = useState<TestResult[]>([]);

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result]);
  };

  const updateResult = (testName: string, updates: Partial<TestResult>) => {
    setResults(prev => prev.map(r =>
      r.test === testName ? { ...r, ...updates } : r
    ));
  };

  useEffect(() => {
    const runTests = async () => {
      // Test 1: Environment Variables
      addResult({
        test: 'Environment Variables',
        status: import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY ? 'success' : 'error',
        message: `URL: ${import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing'}, Key: ${import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}`
      });

      // Test 2: Client Creation
      try {
        if (supabase) {
          addResult({
            test: 'Client Creation',
            status: 'success',
            message: 'Supabase client created successfully'
          });
        } else {
          throw new Error('Supabase client is null/undefined');
        }
      } catch (err) {
        addResult({
          test: 'Client Creation',
          status: 'error',
          message: `Failed: ${err instanceof Error ? err.message : 'Unknown error'}`
        });
        return; // Stop if client creation fails
      }

      // Test 2.5: Check client methods
      try {
        addResult({
          test: 'Client Methods Check',
          status: 'pending',
          message: 'Checking if client methods exist...'
        });

        const hasAuth = typeof supabase.auth === 'object';
        const hasGetSession = typeof supabase.auth?.getSession === 'function';
        const hasSignIn = typeof supabase.auth?.signInWithPassword === 'function';

        updateResult('Client Methods Check', {
          status: hasAuth && hasGetSession && hasSignIn ? 'success' : 'error',
          message: `Auth: ${hasAuth ? '✅' : '❌'}, getSession: ${hasGetSession ? '✅' : '❌'}, signIn: ${hasSignIn ? '✅' : '❌'}`
        });

        if (!hasAuth || !hasGetSession || !hasSignIn) {
          return; // Stop if methods don't exist
        }
      } catch (err) {
        updateResult('Client Methods Check', {
          status: 'error',
          message: `Error checking methods: ${err instanceof Error ? err.message : 'Unknown error'}`
        });
        return;
      }

      // Test 3: Direct fetch to Supabase
      addResult({
        test: 'Direct API Test',
        status: 'pending',
        message: 'Testing direct fetch to Supabase...'
      });

      const directStart = Date.now();
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/settings`, {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
          }
        });
        const duration = Date.now() - directStart;

        if (response.ok) {
          const data = await response.json();
          updateResult('Direct API Test', {
            status: 'success',
            message: `Direct API call succeeded after ${duration}ms. Status: ${response.status}`,
            duration
          });
        } else {
          updateResult('Direct API Test', {
            status: 'error',
            message: `Direct API call failed after ${duration}ms. Status: ${response.status}`,
            duration
          });
        }
      } catch (err) {
        const duration = Date.now() - directStart;
        updateResult('Direct API Test', {
          status: 'error',
          message: `Direct API call threw error after ${duration}ms: ${err instanceof Error ? err.message : 'Unknown error'}`,
          duration
        });
      }

      // Test 4: Get Session with timeout
      addResult({
        test: 'Get Session (with timeout)',
        status: 'pending',
        message: 'Testing getSession() with 10s timeout...'
      });

      const sessionStart = Date.now();
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Manual timeout after 10s')), 10000)
        );

        const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
        const duration = Date.now() - sessionStart;

        if (result.error) {
          updateResult('Get Session (with timeout)', {
            status: 'error',
            message: `Failed after ${duration}ms: ${result.error.message}`,
            duration
          });
        } else {
          updateResult('Get Session (with timeout)', {
            status: 'success',
            message: `Succeeded after ${duration}ms. Session: ${result.data?.session ? 'Active' : 'None'}`,
            duration
          });
        }
      } catch (err) {
        const duration = Date.now() - sessionStart;
        updateResult('Get Session (with timeout)', {
          status: 'error',
          message: `${err instanceof Error ? err.message : 'Unknown error'} after ${duration}ms`,
          duration
        });
      }

      // Test 5: Test Login (after a delay)
      setTimeout(async () => {
        addResult({
          test: 'Login Test (with timeout)',
          status: 'pending',
          message: 'Testing signInWithPassword() with 10s timeout...'
        });

        const loginStart = Date.now();
        try {
          const loginPromise = supabase.auth.signInWithPassword({
            email: 'md@test.com',
            password: 'password123'
          });
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Manual timeout after 10s')), 10000)
          );

          const result = await Promise.race([loginPromise, timeoutPromise]) as any;
          const duration = Date.now() - loginStart;

          if (result.error) {
            updateResult('Login Test (with timeout)', {
              status: 'error',
              message: `Failed after ${duration}ms: ${result.error.message}`,
              duration
            });
          } else {
            updateResult('Login Test (with timeout)', {
              status: 'success',
              message: `Succeeded after ${duration}ms. User: ${result.data?.user?.email || 'None'}`,
              duration
            });
          }
        } catch (err) {
          const duration = Date.now() - loginStart;
          updateResult('Login Test (with timeout)', {
            status: 'error',
            message: `${err instanceof Error ? err.message : 'Unknown error'} after ${duration}ms`,
            duration
          });
        }
      }, 2000);
    };

    runTests();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Supabase Connection Debug</h1>
      <div className="space-y-4">
        {results.map((result, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold">{result.test}</span>
              <span className={`px-2 py-1 rounded text-sm ${result.status === 'success' ? 'bg-green-100 text-green-800' :
                  result.status === 'error' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                }`}>
                {result.status}
              </span>
              {result.duration && (
                <span className="text-sm text-gray-500">({result.duration}ms)</span>
              )}
            </div>
            <p className="text-gray-700">{result.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
} 