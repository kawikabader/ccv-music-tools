import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Musician } from '../types/supabase';
import { logger, LogCategory } from '../utils/logger';

export function useMusicians() {
  const [musicians, setMusicians] = useState<Musician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(true);

  logger.info(LogCategory.HOOK, 'useMusicians hook initialized', {
    loading,
    musiciansCount: musicians.length,
  });

  useEffect(() => {
    setLoading(true);
    logger.info(LogCategory.HOOK, 'useMusicians useEffect triggered', {
      isMounted,
    });
    fetchMusicians();

    // Subscribe to real-time changes (disabled by default to prevent WebSocket errors)
    let channel: any = null;

    if (import.meta.env.VITE_ENABLE_REALTIME === 'true') {
      try {
        channel = supabase
          .channel('musicians_changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'musicians' },
            payload => {
              // Real-time change received
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
      setIsMounted(false);
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (err) {
          console.warn('Error removing channel:', err);
        }
      }
    };
  }, []);

  async function fetchMusicians() {
    setLoading(true);
    logger.info(LogCategory.DATA, 'fetchMusicians started');

    // Check current auth session for debugging
    const { data: sessionData } = await supabase.auth.getSession();
    logger.info(LogCategory.DATA, 'Current auth session', {
      hasSession: !!sessionData.session,
      userId: sessionData.session?.user?.id,
      userEmail: sessionData.session?.user?.email,
    });

    try {
      // Reasonable timeout to prevent hanging while allowing for slower connections
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        logger.warn(
          LogCategory.DATA,
          'Supabase request timeout (10s) - aborting'
        );
        controller.abort();
      }, 10000); // 10 second timeout - more reasonable

      logger.info(
        LogCategory.DATA,
        'Executing Supabase query: musicians.select(*)'
      );

      const { data, error } = await supabase
        .from('musicians')
        .select('*')
        .order('name')
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);
      logger.info(LogCategory.DATA, 'Supabase query completed', {
        hasData: !!data,
        dataLength: data?.length,
        hasError: !!error,
      });

      if (error) {
        logger.error(LogCategory.DATA, 'Supabase query error', { error });
        throw error;
      }

      logger.info(LogCategory.DATA, 'fetchMusicians success', {
        dataCount: data?.length || 0,
        isMounted,
      });

      // Only update state if component is still mounted
      if (isMounted) {
        setMusicians(data || []);
        setError(null);
        setLoading(false);
      } else {
        logger.warn(
          LogCategory.DATA,
          'Component unmounted - skipping state update'
        );
      }
    } catch (err) {
      let errorMessage = 'An error occurred loading musicians';

      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          errorMessage =
            'Loading timed out. Please check your connection and try again.';
        } else if (
          err.message.includes('Missing Supabase environment variables')
        ) {
          errorMessage =
            'Database connection not configured. Please check your environment variables.';
        } else {
          errorMessage = err.message;
        }
      }

      logger.error(LogCategory.DATA, 'fetchMusicians error', {
        errorMessage,
        errorType: err instanceof Error ? err.name : 'Unknown',
        isMounted,
      });

      // Only update state if component is still mounted
      if (isMounted) {
        setError(errorMessage);
        setMusicians([]); // Set empty array on error
        setLoading(false);
      }
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
