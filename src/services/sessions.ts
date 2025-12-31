import { supabase } from '@/lib/supabase';
import type { Session, InsertTables, UpdateTables } from '@/types/database';

export type SessionInsert = InsertTables<'sessions'>;
export type SessionUpdate = UpdateTables<'sessions'>;

export const sessionsService = {
  async getAll(gymId: string) {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        coach:coaches(id, name, avatar_url),
        member:members(id, name, avatar_url)
      `)
      .eq('gym_id', gymId)
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getByDateRange(gymId: string, startDate: Date, endDate: Date) {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        coach:coaches(id, name, avatar_url),
        member:members(id, name, avatar_url)
      `)
      .eq('gym_id', gymId)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString())
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getByCoach(coachId: string) {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        member:members(id, name, avatar_url)
      `)
      .eq('coach_id', coachId)
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        coach:coaches(*),
        member:members(*),
        participants:session_participants(
          member:members(id, name, avatar_url, email)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(session: SessionInsert) {
    const { data, error } = await supabase
      .from('sessions')
      .insert(session)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: SessionUpdate) {
    const { data, error } = await supabase
      .from('sessions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase.from('sessions').delete().eq('id', id);
    if (error) throw error;
  },

  async updateStatus(id: string, status: string) {
    const { data, error } = await supabase
      .from('sessions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async addParticipant(sessionId: string, memberId: string) {
    const { data, error } = await supabase
      .from('session_participants')
      .insert({ session_id: sessionId, member_id: memberId })
      .select()
      .single();

    if (error) throw error;

    // Increment participant count
    await supabase.rpc('increment_session_participants', { session_id: sessionId });

    return data;
  },

  async removeParticipant(sessionId: string, memberId: string) {
    const { error } = await supabase
      .from('session_participants')
      .delete()
      .eq('session_id', sessionId)
      .eq('member_id', memberId);

    if (error) throw error;

    // Decrement participant count
    await supabase.rpc('decrement_session_participants', { session_id: sessionId });
  },

  async markAttendance(sessionId: string, memberId: string, attended: boolean) {
    const { data, error } = await supabase
      .from('session_participants')
      .update({ attended })
      .eq('session_id', sessionId)
      .eq('member_id', memberId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getUpcoming(gymId: string, limit = 10) {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        coach:coaches(id, name, avatar_url)
      `)
      .eq('gym_id', gymId)
      .eq('status', 'scheduled')
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async getTodaySessions(gymId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        coach:coaches(id, name, avatar_url)
      `)
      .eq('gym_id', gymId)
      .gte('start_time', today.toISOString())
      .lt('start_time', tomorrow.toISOString())
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data;
  },
};
