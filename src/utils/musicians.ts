import { supabase } from '../lib/supabase';
import type { Musician } from '../types/supabase';

export async function getMusicians() {
  const { data, error } = await supabase.from('musicians').select('*').order('name');

  if (error) throw error;
  return data || [];
}

export async function addMusician(musician: Omit<Musician, 'id'>) {
  const { data, error } = await supabase.from('musicians').insert(musician).select().single();

  if (error) throw error;
  return data;
}

export async function updateMusician(id: string, updates: Partial<Omit<Musician, 'id'>>) {
  const { data, error } = await supabase
    .from('musicians')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMusician(id: string) {
  const { error } = await supabase.from('musicians').delete().eq('id', id);

  if (error) throw error;
}

export async function searchMusicians(query: string) {
  const { data, error } = await supabase
    .from('musicians')
    .select('*')
    .ilike('name', `%${query}%`)
    .order('name');

  if (error) throw error;
  return data || [];
}
