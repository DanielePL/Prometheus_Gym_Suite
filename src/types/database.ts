export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MembershipType = 'basic' | 'premium' | 'vip' | 'trial';
export type ActivityStatus = 'active' | 'moderate' | 'inactive';
export type PaymentStatus = 'paid' | 'pending' | 'overdue';
export type SessionStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show';
export type StaffRole = 'owner' | 'admin' | 'manager' | 'coach' | 'receptionist';

export interface Database {
  public: {
    Tables: {
      gyms: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          phone: string | null;
          address: string | null;
          logo_url: string | null;
          timezone: string;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          logo_url?: string | null;
          timezone?: string;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          logo_url?: string | null;
          timezone?: string;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          gym_id: string | null;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: StaffRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          gym_id?: string | null;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: StaffRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          gym_id?: string | null;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: StaffRole;
          created_at?: string;
          updated_at?: string;
        };
      };
      staff: {
        Row: {
          id: string;
          gym_id: string;
          profile_id: string;
          role: StaffRole;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          gym_id: string;
          profile_id: string;
          role?: StaffRole;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          gym_id?: string;
          profile_id?: string;
          role?: StaffRole;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      coaches: {
        Row: {
          id: string;
          gym_id: string;
          profile_id: string | null;
          name: string;
          email: string;
          phone: string | null;
          avatar_url: string | null;
          specializations: string[];
          bio: string | null;
          hourly_rate: number;
          is_active: boolean;
          client_count: number;
          sessions_this_month: number;
          revenue_this_month: number;
          rating: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          gym_id: string;
          profile_id?: string | null;
          name: string;
          email: string;
          phone?: string | null;
          avatar_url?: string | null;
          specializations?: string[];
          bio?: string | null;
          hourly_rate?: number;
          is_active?: boolean;
          client_count?: number;
          sessions_this_month?: number;
          revenue_this_month?: number;
          rating?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          gym_id?: string;
          profile_id?: string | null;
          name?: string;
          email?: string;
          phone?: string | null;
          avatar_url?: string | null;
          specializations?: string[];
          bio?: string | null;
          hourly_rate?: number;
          is_active?: boolean;
          client_count?: number;
          sessions_this_month?: number;
          revenue_this_month?: number;
          rating?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      members: {
        Row: {
          id: string;
          gym_id: string;
          coach_id: string | null;
          name: string;
          email: string;
          phone: string | null;
          avatar_url: string | null;
          membership_type: MembershipType;
          membership_start: string;
          membership_end: string | null;
          monthly_fee: number;
          activity_status: ActivityStatus;
          last_visit: string | null;
          total_visits: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          gym_id: string;
          coach_id?: string | null;
          name: string;
          email: string;
          phone?: string | null;
          avatar_url?: string | null;
          membership_type?: MembershipType;
          membership_start?: string;
          membership_end?: string | null;
          monthly_fee?: number;
          activity_status?: ActivityStatus;
          last_visit?: string | null;
          total_visits?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          gym_id?: string;
          coach_id?: string | null;
          name?: string;
          email?: string;
          phone?: string | null;
          avatar_url?: string | null;
          membership_type?: MembershipType;
          membership_start?: string;
          membership_end?: string | null;
          monthly_fee?: number;
          activity_status?: ActivityStatus;
          last_visit?: string | null;
          total_visits?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          gym_id: string;
          coach_id: string;
          member_id: string | null;
          title: string;
          description: string | null;
          session_type: string;
          start_time: string;
          end_time: string;
          status: SessionStatus;
          price: number;
          max_participants: number;
          current_participants: number;
          location: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          gym_id: string;
          coach_id: string;
          member_id?: string | null;
          title: string;
          description?: string | null;
          session_type?: string;
          start_time: string;
          end_time: string;
          status?: SessionStatus;
          price?: number;
          max_participants?: number;
          current_participants?: number;
          location?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          gym_id?: string;
          coach_id?: string;
          member_id?: string | null;
          title?: string;
          description?: string | null;
          session_type?: string;
          start_time?: string;
          end_time?: string;
          status?: SessionStatus;
          price?: number;
          max_participants?: number;
          current_participants?: number;
          location?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      session_participants: {
        Row: {
          id: string;
          session_id: string;
          member_id: string;
          attended: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          member_id: string;
          attended?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          member_id?: string;
          attended?: boolean;
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          gym_id: string;
          member_id: string;
          amount: number;
          description: string | null;
          payment_type: string;
          status: PaymentStatus;
          due_date: string;
          paid_date: string | null;
          payment_method: string | null;
          invoice_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          gym_id: string;
          member_id: string;
          amount: number;
          description?: string | null;
          payment_type?: string;
          status?: PaymentStatus;
          due_date: string;
          paid_date?: string | null;
          payment_method?: string | null;
          invoice_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          gym_id?: string;
          member_id?: string;
          amount?: number;
          description?: string | null;
          payment_type?: string;
          status?: PaymentStatus;
          due_date?: string;
          paid_date?: string | null;
          payment_method?: string | null;
          invoice_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          gym_id: string;
          sender_id: string;
          recipient_id: string | null;
          subject: string;
          content: string;
          is_broadcast: boolean;
          is_read: boolean;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          gym_id: string;
          sender_id: string;
          recipient_id?: string | null;
          subject: string;
          content: string;
          is_broadcast?: boolean;
          is_read?: boolean;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          gym_id?: string;
          sender_id?: string;
          recipient_id?: string | null;
          subject?: string;
          content?: string;
          is_broadcast?: boolean;
          is_read?: boolean;
          read_at?: string | null;
          created_at?: string;
        };
      };
      alerts: {
        Row: {
          id: string;
          gym_id: string;
          type: string;
          title: string;
          message: string;
          severity: string;
          is_read: boolean;
          related_id: string | null;
          related_type: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          gym_id: string;
          type: string;
          title: string;
          message: string;
          severity?: string;
          is_read?: boolean;
          related_id?: string | null;
          related_type?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          gym_id?: string;
          type?: string;
          title?: string;
          message?: string;
          severity?: string;
          is_read?: boolean;
          related_id?: string | null;
          related_type?: string | null;
          created_at?: string;
        };
      };
      settings: {
        Row: {
          id: string;
          gym_id: string;
          key: string;
          value: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          gym_id: string;
          key: string;
          value: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          gym_id?: string;
          key?: string;
          value?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      member_visits: {
        Row: {
          id: string;
          member_id: string;
          gym_id: string;
          check_in: string;
          check_out: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          gym_id: string;
          check_in?: string;
          check_out?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          gym_id?: string;
          check_in?: string;
          check_out?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      membership_type: MembershipType;
      activity_status: ActivityStatus;
      payment_status: PaymentStatus;
      session_status: SessionStatus;
      staff_role: StaffRole;
    };
  };
}

// Helper types for easier use
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Convenience exports
export type Gym = Tables<'gyms'>;
export type Profile = Tables<'profiles'>;
export type Staff = Tables<'staff'>;
export type Coach = Tables<'coaches'>;
export type Member = Tables<'members'>;
export type Session = Tables<'sessions'>;
export type SessionParticipant = Tables<'session_participants'>;
export type Payment = Tables<'payments'>;
export type Message = Tables<'messages'>;
export type Alert = Tables<'alerts'>;
export type Setting = Tables<'settings'>;
export type MemberVisit = Tables<'member_visits'>;
