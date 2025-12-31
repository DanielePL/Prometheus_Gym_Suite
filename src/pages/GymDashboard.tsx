import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserCheck,
  DollarSign,
  TrendingDown,
  Clock,
  AlertTriangle,
  Bell,
  Calendar,
  MessageSquare,
  FileText,
  ChevronRight,
} from "lucide-react";

const GymDashboard = () => {
  // Demo data
  const stats = [
    { label: "Total Members", value: "1,247", change: "+12%", icon: Users, color: "text-blue-500" },
    { label: "Active Coaches", value: "18", change: "+2", icon: UserCheck, color: "text-green-500" },
    { label: "Revenue MTD", value: "€47,890", change: "+8%", icon: DollarSign, color: "text-primary" },
    { label: "Churn Rate", value: "3.2%", change: "-0.5%", icon: TrendingDown, color: "text-yellow-500" },
  ];

  const todaysSessions = [
    { time: "09:00", coach: "Max M.", type: "Personal Training", client: "Anna S.", status: "confirmed" },
    { time: "10:30", coach: "Lisa K.", type: "Group Class", client: "Yoga Flow", status: "confirmed" },
    { time: "14:00", coach: "Tom B.", type: "Personal Training", client: "Peter H.", status: "pending" },
    { time: "16:00", coach: "Sarah L.", type: "Consultation", client: "New Lead", status: "pending" },
    { time: "18:00", coach: "Max M.", type: "Group Class", client: "HIIT Express", status: "confirmed" },
  ];

  const alerts = [
    { type: "warning", message: "5 memberships expiring this week", priority: "high" },
    { type: "info", message: "Coach Lisa requested time-off (Dec 24-26)", priority: "medium" },
    { type: "alert", message: "3 overdue payments need attention", priority: "high" },
    { type: "success", message: "Monthly targets achieved!", priority: "low" },
  ];

  const quickActions = [
    { label: "Add Member", icon: Users, color: "bg-blue-500" },
    { label: "Schedule Session", icon: Calendar, color: "bg-green-500" },
    { label: "Send Broadcast", icon: MessageSquare, color: "bg-purple-500" },
    { label: "Generate Report", icon: FileText, color: "bg-primary" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Command Center</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </Button>
          <Button className="bg-primary hover:bg-primary/90">
            Quick Action
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
                <Badge variant="secondary" className="text-xs">
                  {stat.change}
                </Badge>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's Sessions */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Today's Sessions
            </CardTitle>
            <Button variant="ghost" size="sm">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todaysSessions.map((session, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-mono text-muted-foreground w-12">
                      {session.time}
                    </span>
                    <div>
                      <p className="font-medium">{session.client}</p>
                      <p className="text-sm text-muted-foreground">
                        {session.type} • {session.coach}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={session.status === "confirmed" ? "default" : "secondary"}
                    className={session.status === "confirmed" ? "bg-green-500" : ""}
                  >
                    {session.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alert Center */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Alert Center
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border-l-4 ${
                    alert.priority === "high"
                      ? "border-l-destructive bg-destructive/10"
                      : alert.priority === "medium"
                      ? "border-l-yellow-500 bg-yellow-500/10"
                      : "border-l-green-500 bg-green-500/10"
                  }`}
                >
                  <p className="text-sm">{alert.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="h-24 flex-col gap-2 hover:scale-105 transition-transform"
              >
                <div className={`p-2 rounded-lg ${action.color}`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <span>{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GymDashboard;
