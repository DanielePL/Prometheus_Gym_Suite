import { supabase } from '@/lib/supabase';
import type { Message, InsertTables, UpdateTables } from '@/types/database';

export type MessageInsert = InsertTables<'messages'>;
export type MessageUpdate = UpdateTables<'messages'>;

export const messagesService = {
  // Get all messages for a gym (inbox)
  async getInbox(gymId: string, userId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id(id, full_name, avatar_url, email)
      `)
      .eq('gym_id', gymId)
      .or(`recipient_id.eq.${userId},is_broadcast.eq.true`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get sent messages
  async getSent(gymId: string, userId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        recipient:profiles!recipient_id(id, full_name, avatar_url, email)
      `)
      .eq('gym_id', gymId)
      .eq('sender_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get a single message by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id(id, full_name, avatar_url, email),
        recipient:profiles!recipient_id(id, full_name, avatar_url, email)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Send a message
  async send(message: MessageInsert) {
    const { data, error } = await supabase
      .from('messages')
      .insert(message)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Send a broadcast message to all team members
  async sendBroadcast(gymId: string, senderId: string, subject: string, content: string) {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        gym_id: gymId,
        sender_id: senderId,
        subject,
        content,
        is_broadcast: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Mark message as read
  async markAsRead(id: string) {
    const { data, error } = await supabase
      .from('messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Mark all messages as read
  async markAllAsRead(gymId: string, userId: string) {
    const { error } = await supabase
      .from('messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('gym_id', gymId)
      .or(`recipient_id.eq.${userId},is_broadcast.eq.true`)
      .eq('is_read', false);

    if (error) throw error;
  },

  // Delete a message
  async delete(id: string) {
    const { error } = await supabase.from('messages').delete().eq('id', id);
    if (error) throw error;
  },

  // Get unread count
  async getUnreadCount(gymId: string, userId: string) {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', gymId)
      .or(`recipient_id.eq.${userId},is_broadcast.eq.true`)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  },

  // Get staff members for recipient selection
  async getStaffMembers(gymId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, email, role')
      .eq('gym_id', gymId);

    if (error) throw error;
    return data;
  },
};
