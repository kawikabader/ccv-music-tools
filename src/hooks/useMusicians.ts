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
        fetchMusicians();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchMusicians() {
    try {
      const { data, error } = await supabase.from('musicians').select('*').order('name');

      if (error) throw error;

      setMusicians(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function addMusician(musician: Omit<Musician, 'id'>) {
    try {
      const { error } = await supabase.from('musicians').insert(musician);

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  }

  async function updateMusician(id: string, updates: Partial<Omit<Musician, 'id'>>) {
    try {
      const { error } = await supabase.from('musicians').update(updates).eq('id', id);

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  }

  async function deleteMusician(id: string) {
    try {
      const { error } = await supabase.from('musicians').delete().eq('id', id);

      if (error) throw error;
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
