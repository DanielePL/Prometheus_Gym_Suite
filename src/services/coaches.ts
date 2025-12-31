import { supabase } from '@/lib/supabase';
import type { Coach, InsertTables, UpdateTables } from '@/types/database';

export type CoachInsert = InsertTables<'coaches'>;
export type CoachUpdate = UpdateTables<'coaches'>;

export const coachesService = {
  async getAll(gymId: string) {
    const { data, error } = await supabase
      .from('coaches')
      .select('*')
      .eq('gym_id', gymId)
      .order('name');

    if (error) throw error;
    return data;
  },

  async getActive(gymId: string) {
    const { data, error } = await supabase
      .from('coaches')
      .select('*')
      .eq('gym_id', gymId)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('coaches')
      .select(`
        *,
        members(id, name, avatar_url, activity_status),
        sessions(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(coach: CoachInsert) {
    const { data, error } = await supabase
      .from('coaches')
      .insert(coach)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: CoachUpdate) {
    const { data, error } = await supabase
      .from('coaches')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase.from('coaches').delete().eq('id', id);
    if (error) throw error;
  },

  async toggleActive(id: string, isActive: boolean) {
    const { data, error } = await supabase
      .from('coaches')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getPerformanceMetrics(coachId: string) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('coach_id', coachId)
      .gte('start_time', startOfMonth.toISOString())
      .eq('status', 'completed');

    if (sessionsError) throw sessionsError;

    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id')
      .eq('coach_id', coachId);

    if (membersError) throw membersError;

    const totalRevenue = sessions?.reduce((sum, s) => sum + (s.price || 0), 0) || 0;
    const totalSessions = sessions?.length || 0;

    return {
      sessionsThisMonth: totalSessions,
      revenueThisMonth: totalRevenue,
      clientCount: members?.length || 0,
      avgRevenuePerSession: totalSessions > 0 ? totalRevenue / totalSessions : 0,
    };
  },

  async getStats(gymId: string) {
    const { data, error } = await supabase
      .from('coaches')
      .select('is_active, client_count, revenue_this_month')
      .eq('gym_id', gymId);

    if (error) throw error;

    return {
      total: data.length,
      active: data.filter((c) => c.is_active).length,
      totalClients: data.reduce((sum, c) => sum + (c.client_count || 0), 0),
      totalRevenue: data.reduce((sum, c) => sum + (c.revenue_this_month || 0), 0),
    };
  },
};
