import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Musician } from '../types/supabase';

export function useMusicians() {
  const [musicians, setMusicians] = useState<Musician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMusicians();

    // Only subscribe to real-time changes in production or when explicitly enabled
    let channel: any = null;

    if (
      import.meta.env.PROD ||
      import.meta.env.VITE_ENABLE_REALTIME === 'true'
    ) {
      try {
        channel = supabase
          .channel('musicians_changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'musicians' },
            payload => {
              console.log('Change received!', payload);
              // Refetch on any change - let the loading state handle conflicts
              fetchMusicians();
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('Real-time subscription failed:', err);
      }
    }

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (err) {
          console.warn('Error removing channel:', err);
        }
      }
    };
  }, []); // Empty dependency array is correct here since we only want this to run once

  async function fetchMusicians() {
    try {
      console.log('🔄 Fetching musicians...');

      // Add timeout to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const { data, error } = await supabase
        .from('musicians')
        .select('*')
        .order('name')
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      console.log('✅ Musicians loaded:', data?.length || 0);
      setMusicians(data || []);
      setError(null);
    } catch (err) {
      console.error('❌ Fetch error:', err);
      let errorMessage = 'An error occurred loading musicians';

      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          errorMessage =
            'Loading timed out. Please check your connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);

      // For development: provide sample data when Supabase connection fails
      if (import.meta.env.DEV) {
        console.log(
          '🔧 Development mode: Using sample data due to connection error'
        );
        const sampleMusicians: Musician[] = [
          {
            id: '1',
            name: 'John Doe',
            instrument: 'Guitar',
            phone: '(555) 123-4567',
          },
          {
            id: '2',
            name: 'Jane Smith',
            instrument: 'Piano',
            phone: '(555) 987-6543',
          },
          {
            id: '3',
            name: 'Bob Johnson',
            instrument: 'Drums',
            phone: '(555) 456-7890',
          },
          { id: '4', name: 'Alice Brown', instrument: 'Violin', phone: null },
        ];
        setMusicians(sampleMusicians);
      } else {
        // Set empty array on error to prevent stuck loading state
        setMusicians([]);
      }
    } finally {
      setLoading(false);
    }
  }

  async function addMusician(musician: Omit<Musician, 'id'>) {
    try {
      // Insert into database and get the returned data with ID
      const { data, error } = await supabase
        .from('musicians')
        .insert(musician)
        .select()
        .single();

      if (error) throw error;

      // Optimistically update local state immediately
      setMusicians(prev =>
        [...prev, data].sort((a, b) => a.name.localeCompare(b.name))
      );

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  }

  async function updateMusician(
    id: string,
    updates: Partial<Omit<Musician, 'id'>>
  ) {
    try {
      const { data, error } = await supabase
        .from('musicians')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Optimistically update local state
      setMusicians(prev =>
        prev
          .map(musician =>
            musician.id === id ? { ...musician, ...data } : musician
          )
          .sort((a, b) => a.name.localeCompare(b.name))
      );

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  }

  async function deleteMusician(id: string) {
    try {
      const { error } = await supabase.from('musicians').delete().eq('id', id);

      if (error) throw error;

      // Optimistically update local state
      setMusicians(prev => prev.filter(musician => musician.id !== id));

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  }

  return {
    musicians,
    loading,
    error,
    addMusician,
    updateMusician,
    deleteMusician,
    refreshMusicians: fetchMusicians,
  };
}
