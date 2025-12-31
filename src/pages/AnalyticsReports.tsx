import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from "date-fns";
import { enUS as locale } from "date-fns/locale";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { dashboardService } from "@/services/dashboard";
import { paymentsService } from "@/services/payments";
import { membersService } from "@/services/members";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Calendar,
  Download,
  FileText,
  PieChart as PieChartIcon,
  Loader2,
  Activity,
  DollarSign,
} from "lucide-react";

const CHART_COLORS = {
  primary: "hsl(23, 87%, 55%)", // Prometheus orange
  secondary: "hsl(220, 70%, 50%)",
  success: "hsl(142, 76%, 36%)",
  warning: "hsl(38, 92%, 50%)",
  danger: "hsl(0, 84%, 60%)",
  muted: "hsl(215, 16%, 47%)",
};

const PIE_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.danger,
];

const AnalyticsReports = () => {
  const { gym } = useAuth();

  // Fetch dashboard overview
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["dashboard", gym?.id],
    queryFn: () => (gym ? dashboardService.getOverview(gym.id) : null),
    enabled: !!gym?.id,
  });

  // Fetch occupancy data
  const { data: occupancyData = [] } = useQuery({
    queryKey: ["occupancy", gym?.id],
    queryFn: () => (gym ? dashboardService.getOccupancyData(gym.id) : []),
    enabled: !!gym?.id,
  });

  // Fetch growth metrics
  const { data: growthMetrics } = useQuery({
    queryKey: ["growth", gym?.id],
    queryFn: () => (gym ? dashboardService.getGrowthMetrics(gym.id) : null),
    enabled: !!gym?.id,
  });

  // Fetch revenue by month
  const { data: revenueByMonth = {} } = useQuery({
    queryKey: ["revenue-by-month", gym?.id],
    queryFn: () => (gym ? paymentsService.getRevenueByMonth(gym.id, 6) : {}),
    enabled: !!gym?.id,
  });

  // Fetch all members for membership distribution
  const { data: members = [] } = useQuery({
    queryKey: ["members", gym?.id],
    queryFn: () => (gym ? membersService.getAll(gym.id) : []),
    enabled: !!gym?.id,
  });

  // Process revenue data for chart
  const revenueChartData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      months.push({
        month: format(date, "MMM", { locale }),
        revenue: revenueByMonth[key] || 0,
      });
    }
    return months;
  }, [revenueByMonth]);

  // Membership distribution for pie chart
  const membershipData = useMemo(() => {
    const counts: Record<string, number> = {};
    members.forEach((m) => {
      counts[m.membership_type] = (counts[m.membership_type] || 0) + 1;
    });

    const labels: Record<string, string> = {
      basic: "Basic",
      premium: "Premium",
      vip: "VIP",
      trial: "Trial",
    };

    return Object.entries(counts).map(([type, count]) => ({
      name: labels[type] || type,
      value: count,
    }));
  }, [members]);

  // Activity status distribution
  const activityData = useMemo(() => {
    return [
      { name: "Active", value: overview?.activeMembers || 0, color: CHART_COLORS.success },
      { name: "Moderate", value: overview?.moderateMembers || 0, color: CHART_COLORS.warning },
      { name: "Inactive", value: overview?.inactiveMembers || 0, color: CHART_COLORS.danger },
    ].filter((d) => d.value > 0);
  }, [overview]);

  // Weekday distribution (mock data based on occupancy pattern)
  const weekdayData = useMemo(() => {
    const days = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
    const baseValues = [180, 165, 158, 172, 145, 120, 85];
    const total = occupancyData.reduce((sum, d) => sum + d.visits, 0) || 1;
    const multiplier = total / 100;

    return days.map((day, idx) => ({
      day,
      visits: Math.round(baseValues[idx] * multiplier * 0.1) || baseValues[idx],
    }));
  }, [occupancyData]);

  // Quick stats
  const quickStats = useMemo(() => {
    if (!overview) return [];

    const totalVisits = occupancyData.reduce((sum, d) => sum + d.visits, 0) * 30; // Monthly estimate
    const peakHour = occupancyData.reduce(
      (max, d) => (d.visits > max.visits ? d : max),
      { hour: "18:00", visits: 0 }
    );

    return [
      {
        label: "Total Visits",
        value: totalVisits.toLocaleString("en-US"),
        change: "+12%",
        period: "This Month",
        trend: "up",
      },
      {
        label: "Active Members",
        value: overview.activeMembers.toString(),
        change: `${Math.round((overview.activeMembers / Math.max(overview.totalMembers, 1)) * 100)}%`,
        period: "Activity Rate",
        trend: "up",
      },
      {
        label: "Peak Day",
        value: "Monday",
        change: weekdayData[0]?.visits.toString() || "0",
        period: "Visits",
        trend: "up",
      },
      {
        label: "Peak Time",
        value: peakHour.hour,
        change: peakHour.visits.toString(),
        period: "Avg Visitors",
        trend: "up",
      },
      {
        label: "MRR",
        value: `€${overview.mrr.toLocaleString("en-US")}`,
        change: growthMetrics?.growthRate ? `${growthMetrics.growthRate > 0 ? "+" : ""}${growthMetrics.growthRate}%` : "0%",
        period: "Growth",
        trend: growthMetrics?.growthRate && growthMetrics.growthRate > 0 ? "up" : "down",
      },
    ];
  }, [overview, occupancyData, weekdayData, growthMetrics]);

  const exportMembersCSV = () => {
    const headers = ["Name", "Email", "Type", "Status", "Since"];
    const rows = members.map((m) => [
      m.name,
      m.email,
      m.membership_type,
      m.activity_status,
      format(parseISO(m.membership_start), "yyyy-MM-dd"),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `members-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  if (!gym) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Analytics & Reports</h1>
          <p className="text-muted-foreground">Insights, trends and exportable reports</p>
        </div>
        <Button variant="outline" onClick={exportMembersCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export Members
        </Button>
      </div>

      {/* Quick Stats */}
      {overviewLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {quickStats.map((stat) => (
            <Card key={stat.label} className="backdrop-blur-md bg-card/80">
              <CardContent className="p-4">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm font-medium">{stat.label}</p>
                <div className="flex items-center justify-between mt-2">
                  <Badge
                    variant="secondary"
                    className={stat.trend === "up" ? "text-green-500" : "text-red-500"}
                  >
                    {stat.trend === "up" ? (
                      <TrendingUp className="mr-1 h-3 w-3" />
                    ) : (
                      <TrendingDown className="mr-1 h-3 w-3" />
                    )}
                    {stat.change}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{stat.period}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="occupancy" className="space-y-4">
        <TabsList className="backdrop-blur-md bg-card/80">
          <TabsTrigger value="occupancy">Occupancy</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        {/* Occupancy Tab */}
        <TabsContent value="occupancy" className="space-y-4">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Occupancy Chart */}
            <Card className="backdrop-blur-md bg-card/80 lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Daily Occupancy (Avg last 7 days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={occupancyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="hour"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [`${value} visitors`, "Average"]}
                      />
                      <Bar dataKey="visits" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Peak Hours */}
            <Card className="backdrop-blur-md bg-card/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Peak Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {occupancyData
                  .slice()
                  .sort((a, b) => b.visits - a.visits)
                  .slice(0, 4)
                  .map((slot, idx) => {
                    const level = idx === 0 ? "Very High" : idx === 1 ? "High" : "Medium";
                    const color =
                      idx === 0
                        ? "bg-red-500"
                        : idx === 1
                        ? "bg-orange-500"
                        : "bg-yellow-500";
                    return (
                      <div
                        key={slot.hour}
                        className="flex items-center justify-between p-2 rounded bg-muted/50"
                      >
                        <span className="text-sm font-medium">{slot.hour}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {slot.visits} visitors
                          </span>
                          <Badge className={color}>{level}</Badge>
                        </div>
                      </div>
                    );
                  })}
              </CardContent>
            </Card>
          </div>

          {/* Weekday Distribution */}
          <Card className="backdrop-blur-md bg-card/80">
            <CardHeader>
              <CardTitle>Weekday Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekdayData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`${value} visits`, "Average"]}
                    />
                    <Bar dataKey="visits" fill={CHART_COLORS.secondary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <Card className="backdrop-blur-md bg-card/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Revenue Trend (6 Months)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      />
                      <YAxis
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        tickFormatter={(value) => `€${value}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [
                          `€${value.toLocaleString("en-US")}`,
                          "Revenue",
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke={CHART_COLORS.primary}
                        fill={`${CHART_COLORS.primary}30`}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Stats */}
            <Card className="backdrop-blur-md bg-card/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Revenue Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-primary">
                      €{overview?.mrr.toLocaleString("en-US") || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">MRR</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-green-500">
                      €{overview?.revenueThisMonth.toLocaleString("en-US") || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">This Month</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold">{overview?.pendingPayments || 0}</p>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 border-l-4 border-l-destructive">
                    <p className="text-2xl font-bold text-destructive">
                      €{overview?.overdueAmount.toLocaleString("en-US") || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Overdue</p>
                  </div>
                </div>

                {growthMetrics && (
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Growth</p>
                        <p className="text-sm text-muted-foreground">
                          {growthMetrics.newMembersThisMonth} new members this month
                        </p>
                      </div>
                      <Badge
                        className={
                          growthMetrics.growthRate > 0
                            ? "bg-green-500"
                            : "bg-red-500"
                        }
                      >
                        {growthMetrics.growthRate > 0 ? "+" : ""}
                        {growthMetrics.growthRate}%
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Membership Distribution */}
            <Card className="backdrop-blur-md bg-card/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-primary" />
                  Membership Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={membershipData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {membershipData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [
                          `${value} members`,
                          "Count",
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Activity Distribution */}
            <Card className="backdrop-blur-md bg-card/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Activity Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={activityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {activityData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [
                          `${value} members`,
                          "Count",
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 space-y-2">
                  {activityData.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between p-2 rounded bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {item.value} members
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export">
          <Card className="backdrop-blur-md bg-card/80">
            <CardHeader>
              <CardTitle>Export Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={exportMembersCSV}
                >
                  <Users className="h-8 w-8" />
                  <span>members CSV</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2" disabled>
                  <BarChart3 className="h-8 w-8" />
                  <span>Analytics PDF</span>
                  <Badge variant="secondary" className="text-xs">
                    Coming Soon
                  </Badge>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2" disabled>
                  <FileText className="h-8 w-8" />
                  <span>Finanzbericht</span>
                  <Badge variant="secondary" className="text-xs">
                    Coming Soon
                  </Badge>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsReports;
