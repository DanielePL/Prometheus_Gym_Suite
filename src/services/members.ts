import { supabase } from '@/lib/supabase';
import type { Member, InsertTables, UpdateTables } from '@/types/database';

export type MemberInsert = InsertTables<'members'>;
export type MemberUpdate = UpdateTables<'members'>;

export const membersService = {
  async getAll(gymId: string) {
    const { data, error } = await supabase
      .from('members')
      .select(`
        *,
        coach:coaches(id, name, avatar_url)
      `)
      .eq('gym_id', gymId)
      .order('name');

    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('members')
      .select(`
        *,
        coach:coaches(id, name, avatar_url, email),
        payments(*),
        sessions:session_participants(
          session:sessions(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(member: MemberInsert) {
    const { data, error } = await supabase
      .from('members')
      .insert(member)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: MemberUpdate) {
    const { data, error } = await supabase
      .from('members')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase.from('members').delete().eq('id', id);
    if (error) throw error;
  },

  async search(gymId: string, query: string) {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('gym_id', gymId)
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      .order('name')
      .limit(20);

    if (error) throw error;
    return data;
  },

  async getByStatus(gymId: string, status: string) {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('gym_id', gymId)
      .eq('activity_status', status)
      .order('name');

    if (error) throw error;
    return data;
  },

  async checkIn(memberId: string, gymId: string) {
    const { data, error } = await supabase
      .from('member_visits')
      .insert({
        member_id: memberId,
        gym_id: gymId,
        check_in: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Update member's last_visit and total_visits
    await supabase
      .from('members')
      .update({
        last_visit: new Date().toISOString(),
        total_visits: supabase.rpc('increment_visits', { member_id: memberId }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', memberId);

    return data;
  },

  async getVisitHistory(memberId: string, limit = 30) {
    const { data, error } = await supabase
      .from('member_visits')
      .select('*')
      .eq('member_id', memberId)
      .order('check_in', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async getStats(gymId: string) {
    const { data, error } = await supabase
      .from('members')
      .select('activity_status, membership_type')
      .eq('gym_id', gymId);

    if (error) throw error;

    const stats = {
      total: data.length,
      active: data.filter((m) => m.activity_status === 'active').length,
      moderate: data.filter((m) => m.activity_status === 'moderate').length,
      inactive: data.filter((m) => m.activity_status === 'inactive').length,
      byMembership: {
        basic: data.filter((m) => m.membership_type === 'basic').length,
        premium: data.filter((m) => m.membership_type === 'premium').length,
        vip: data.filter((m) => m.membership_type === 'vip').length,
        trial: data.filter((m) => m.membership_type === 'trial').length,
      },
    };

    return stats;
  },
};
