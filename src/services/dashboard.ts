import { supabase } from '@/lib/supabase';

export const dashboardService = {
  async getOverview(gymId: string) {
    const [members, coaches, payments, sessions, alerts] = await Promise.all([
      supabase
        .from('members')
        .select('id, activity_status, membership_type, monthly_fee')
        .eq('gym_id', gymId),
      supabase
        .from('coaches')
        .select('id, is_active, client_count')
        .eq('gym_id', gymId),
      supabase
        .from('payments')
        .select('amount, status, paid_date')
        .eq('gym_id', gymId),
      supabase
        .from('sessions')
        .select('id, status, start_time')
        .eq('gym_id', gymId),
      supabase
        .from('alerts')
        .select('*')
        .eq('gym_id', gymId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const membersData = members.data || [];
    const coachesData = coaches.data || [];
    const paymentsData = payments.data || [];
    const sessionsData = sessions.data || [];

    // Calculate MRR
    const mrr = membersData.reduce((sum, m) => sum + (m.monthly_fee || 0), 0);

    // Calculate revenue this month
    const revenueThisMonth = paymentsData
      .filter(
        (p) =>
          p.status === 'paid' &&
          p.paid_date &&
          new Date(p.paid_date) >= startOfMonth
      )
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    // Today's sessions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaySessions = sessionsData.filter((s) => {
      const startTime = new Date(s.start_time);
      return startTime >= today && startTime < tomorrow;
    });

    return {
      totalMembers: membersData.length,
      activeMembers: membersData.filter((m) => m.activity_status === 'active').length,
      moderateMembers: membersData.filter((m) => m.activity_status === 'moderate').length,
      inactiveMembers: membersData.filter((m) => m.activity_status === 'inactive').length,
      totalCoaches: coachesData.length,
      activeCoaches: coachesData.filter((c) => c.is_active).length,
      mrr,
      revenueThisMonth,
      pendingPayments: paymentsData.filter((p) => p.status === 'pending').length,
      overduePayments: paymentsData.filter((p) => p.status === 'overdue').length,
      overdueAmount: paymentsData
        .filter((p) => p.status === 'overdue')
        .reduce((sum, p) => sum + (p.amount || 0), 0),
      todaySessionsCount: todaySessions.length,
      totalSessions: sessionsData.length,
      alerts: alerts.data || [],
    };
  },

  async getRecentActivity(gymId: string, limit = 10) {
    const { data, error } = await supabase
      .from('member_visits')
      .select(`
        *,
        member:members(id, name, avatar_url)
      `)
      .eq('gym_id', gymId)
      .order('check_in', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async getUpcomingSessions(gymId: string, limit = 5) {
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

  async getOccupancyData(gymId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get visits for the last 7 days
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data, error } = await supabase
      .from('member_visits')
      .select('check_in')
      .eq('gym_id', gymId)
      .gte('check_in', weekAgo.toISOString());

    if (error) throw error;

    // Group by hour
    const hourlyData: Record<number, number> = {};
    for (let i = 6; i <= 22; i++) {
      hourlyData[i] = 0;
    }

    data.forEach((visit) => {
      const hour = new Date(visit.check_in).getHours();
      if (hour >= 6 && hour <= 22) {
        hourlyData[hour]++;
      }
    });

    return Object.entries(hourlyData).map(([hour, count]) => ({
      hour: `${hour}:00`,
      visits: Math.round(count / 7), // Average per day
    }));
  },

  async getGrowthMetrics(gymId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const { data: currentMonthMembers } = await supabase
      .from('members')
      .select('id')
      .eq('gym_id', gymId)
      .gte('created_at', startOfMonth.toISOString());

    const { data: lastMonthMembers } = await supabase
      .from('members')
      .select('id')
      .eq('gym_id', gymId)
      .gte('created_at', startOfLastMonth.toISOString())
      .lt('created_at', endOfLastMonth.toISOString());

    const currentCount = currentMonthMembers?.length || 0;
    const lastCount = lastMonthMembers?.length || 0;

    const growthRate =
      lastCount > 0 ? ((currentCount - lastCount) / lastCount) * 100 : 0;

    return {
      newMembersThisMonth: currentCount,
      newMembersLastMonth: lastCount,
      growthRate: Math.round(growthRate * 10) / 10,
    };
  },

  async markAlertAsRead(alertId: string) {
    const { error } = await supabase
      .from('alerts')
      .update({ is_read: true })
      .eq('id', alertId);

    if (error) throw error;
  },

  async dismissAllAlerts(gymId: string) {
    const { error } = await supabase
      .from('alerts')
      .update({ is_read: true })
      .eq('gym_id', gymId);

    if (error) throw error;
  },
};
