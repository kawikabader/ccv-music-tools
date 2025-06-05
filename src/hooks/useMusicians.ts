import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Musician } from '../types/supabase';

export function useMusicians() {
  const [musicians, setMusicians] = useState<Musician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMusicians();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('musicians_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'musicians' }, payload => {
        console.log('Change received!', payload);
        // Refetch on any change - let the loading state handle conflicts
        fetchMusicians();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // Empty dependency array is correct here since we only want this to run once

  async function fetchMusicians() {
    try {
      console.log('🔄 Fetching musicians...');

      const { data, error } = await supabase.from('musicians').select('*').order('name');

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      console.log('✅ Musicians loaded:', data?.length || 0);
      setMusicians(data);
      setError(null);
    } catch (err) {
      console.error('❌ Fetch error:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred loading musicians';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function addMusician(musician: Omit<Musician, 'id'>) {
    try {
      // Insert into database and get the returned data with ID
      const { data, error } = await supabase.from('musicians').insert(musician).select().single();

      if (error) throw error;

      // Optimistically update local state immediately
      setMusicians(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  }

  async function updateMusician(id: string, updates: Partial<Omit<Musician, 'id'>>) {
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
          .map(musician => (musician.id === id ? { ...musician, ...data } : musician))
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
