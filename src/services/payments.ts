import { supabase } from '@/lib/supabase';
import type { Payment, InsertTables, UpdateTables } from '@/types/database';

export type PaymentInsert = InsertTables<'payments'>;
export type PaymentUpdate = UpdateTables<'payments'>;

export const paymentsService = {
  async getAll(gymId: string) {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        member:members(id, name, avatar_url, email)
      `)
      .eq('gym_id', gymId)
      .order('due_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getByStatus(gymId: string, status: string) {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        member:members(id, name, avatar_url, email)
      `)
      .eq('gym_id', gymId)
      .eq('status', status)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getByMember(memberId: string) {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('member_id', memberId)
      .order('due_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        member:members(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(payment: PaymentInsert) {
    const { data, error } = await supabase
      .from('payments')
      .insert(payment)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: PaymentUpdate) {
    const { data, error } = await supabase
      .from('payments')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase.from('payments').delete().eq('id', id);
    if (error) throw error;
  },

  async markAsPaid(id: string, paymentMethod?: string) {
    const { data, error } = await supabase
      .from('payments')
      .update({
        status: 'paid',
        paid_date: new Date().toISOString(),
        payment_method: paymentMethod,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getOverdue(gymId: string) {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        member:members(id, name, avatar_url, email, phone)
      `)
      .eq('gym_id', gymId)
      .eq('status', 'overdue')
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getStats(gymId: string) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: allPayments, error } = await supabase
      .from('payments')
      .select('amount, status, paid_date')
      .eq('gym_id', gymId);

    if (error) throw error;

    const thisMonthPaid = allPayments
      .filter(
        (p) =>
          p.status === 'paid' &&
          p.paid_date &&
          new Date(p.paid_date) >= startOfMonth
      )
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const pending = allPayments
      .filter((p) => p.status === 'pending')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const overdue = allPayments
      .filter((p) => p.status === 'overdue')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    return {
      revenueThisMonth: thisMonthPaid,
      pendingAmount: pending,
      overdueAmount: overdue,
      totalPaid: allPayments
        .filter((p) => p.status === 'paid')
        .reduce((sum, p) => sum + (p.amount || 0), 0),
    };
  },

  async getRevenueByMonth(gymId: string, months = 12) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('payments')
      .select('amount, paid_date')
      .eq('gym_id', gymId)
      .eq('status', 'paid')
      .gte('paid_date', startDate.toISOString())
      .order('paid_date', { ascending: true });

    if (error) throw error;

    // Group by month
    const revenueByMonth: Record<string, number> = {};
    data.forEach((payment) => {
      if (payment.paid_date) {
        const date = new Date(payment.paid_date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        revenueByMonth[key] = (revenueByMonth[key] || 0) + (payment.amount || 0);
      }
    });

    return revenueByMonth;
  },
};
