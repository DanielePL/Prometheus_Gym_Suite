import { supabase } from '@/lib/supabase';
import type { Gym, Profile, InsertTables, UpdateTables, StaffRole } from '@/types/database';

export type GymUpdate = UpdateTables<'gyms'>;
export type ProfileUpdate = UpdateTables<'profiles'>;

export const settingsService = {
  // Get gym profile
  async getGym(gymId: string) {
    const { data, error } = await supabase
      .from('gyms')
      .select('*')
      .eq('id', gymId)
      .single();

    if (error) throw error;
    return data as Gym;
  },

  // Update gym profile
  async updateGym(gymId: string, updates: GymUpdate) {
    const { data, error } = await supabase
      .from('gyms')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', gymId)
      .select()
      .single();

    if (error) throw error;
    return data as Gym;
  },

  // Upload gym logo
  async uploadLogo(gymId: string, file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${gymId}/logo.${fileExt}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('gym-logos')
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('gym-logos')
      .getPublicUrl(fileName);

    // Update gym with logo URL
    await settingsService.updateGym(gymId, { logo_url: publicUrl });

    return publicUrl;
  },

  // Get all staff members for a gym
  async getStaff(gymId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('gym_id', gymId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as Profile[];
  },

  // Update staff member role
  async updateStaffRole(profileId: string, role: StaffRole) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        role,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId)
      .select()
      .single();

    if (error) throw error;
    return data as Profile;
  },

  // Update staff member profile
  async updateStaff(profileId: string, updates: ProfileUpdate) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId)
      .select()
      .single();

    if (error) throw error;
    return data as Profile;
  },

  // Remove staff from gym (set gym_id to null)
  async removeStaff(profileId: string) {
    const { error } = await supabase
      .from('profiles')
      .update({
        gym_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId);

    if (error) throw error;
  },

  // Get gym settings (notification preferences, etc.)
  async getSettings(gymId: string) {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('gym_id', gymId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data;
  },

  // Update gym settings
  async updateSettings(gymId: string, settings: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('settings')
      .upsert({
        gym_id: gymId,
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
