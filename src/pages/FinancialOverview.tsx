import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO, isToday, isYesterday, startOfMonth, startOfQuarter, startOfYear } from "date-fns";
import { enUS as locale } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { paymentsService } from "@/services/payments";
import { membersService } from "@/services/members";
import { coachesService } from "@/services/coaches";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Download,
  Calendar,
  Users,
  Plus,
  MoreHorizontal,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Mail,
  Edit,
  Trash2,
} from "lucide-react";
import PaymentDialog from "@/components/payments/PaymentDialog";
import MarkPaidDialog from "@/components/payments/MarkPaidDialog";
import type { Payment, Member, Coach } from "@/types/database";

interface PaymentWithMember extends Payment {
  member?: { id: string; name: string; avatar_url: string | null; email: string } | null;
}

const FinancialOverview = () => {
  const { gym } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithMember | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  // Fetch payments
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ["payments", gym?.id],
    queryFn: () => (gym ? paymentsService.getAll(gym.id) : []),
    enabled: !!gym?.id,
  });

  // Fetch members for dropdown
  const { data: members = [] } = useQuery({
    queryKey: ["members", gym?.id],
    queryFn: () => (gym ? membersService.getAll(gym.id) : []),
    enabled: !!gym?.id,
  });

  // Fetch coaches for revenue by coach
  const { data: coaches = [] } = useQuery({
    queryKey: ["coaches", gym?.id],
    queryFn: () => (gym ? coachesService.getAll(gym.id) : []),
    enabled: !!gym?.id,
  });

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const quarterStart = startOfQuarter(now);
    const yearStart = startOfYear(now);

    const paidPayments = payments.filter((p) => p.status === "paid" && p.paid_date);

    const revenueMTD = paidPayments
      .filter((p) => new Date(p.paid_date!) >= monthStart)
      .reduce((sum, p) => sum + p.amount, 0);

    const revenueQTD = paidPayments
      .filter((p) => new Date(p.paid_date!) >= quarterStart)
      .reduce((sum, p) => sum + p.amount, 0);

    const revenueYTD = paidPayments
      .filter((p) => new Date(p.paid_date!) >= yearStart)
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingAmount = payments
      .filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + p.amount, 0);

    const overduePayments = payments.filter((p) => p.status === "overdue");
    const overdueAmount = overduePayments.reduce((sum, p) => sum + p.amount, 0);

    return {
      revenueMTD,
      revenueQTD,
      revenueYTD,
      pendingAmount,
      pendingCount: payments.filter((p) => p.status === "pending").length,
      overdueAmount,
      overdueCount: overduePayments.length,
    };
  }, [payments]);

  // Revenue by payment type
  const revenueByType = useMemo(() => {
    const paidPayments = payments.filter((p) => p.status === "paid");
    const total = paidPayments.reduce((sum, p) => sum + p.amount, 0);

    const byType: Record<string, number> = {};
    paidPayments.forEach((p) => {
      byType[p.payment_type] = (byType[p.payment_type] || 0) + p.amount;
    });

    const typeLabels: Record<string, string> = {
      membership: "Memberships",
      personal_training: "Personal Training",
      class: "Classes",
      merchandise: "Merchandise",
      other: "Other",
    };

    return Object.entries(byType)
      .map(([type, amount]) => ({
        type,
        label: typeLabels[type] || type,
        amount,
        percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [payments]);

  // Coach revenue ranking
  const coachRevenue = useMemo(() => {
    return coaches
      .filter((c) => c.revenue_this_month > 0)
      .sort((a, b) => b.revenue_this_month - a.revenue_this_month)
      .slice(0, 5)
      .map((coach, index) => ({
        ...coach,
        rank: index + 1,
      }));
  }, [coaches]);

  // Filter payments by tab
  const filteredPayments = useMemo(() => {
    switch (activeTab) {
      case "pending":
        return payments.filter((p) => p.status === "pending");
      case "overdue":
        return payments.filter((p) => p.status === "overdue");
      case "paid":
        return payments.filter((p) => p.status === "paid");
      default:
        return payments;
    }
  }, [payments, activeTab]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: paymentsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      setDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof paymentsService.update>[1] }) =>
      paymentsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      setDialogOpen(false);
      setSelectedPayment(null);
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: ({ id, method }: { id: string; method: string }) =>
      paymentsService.markAsPaid(id, method),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      setMarkPaidOpen(false);
      setSelectedPayment(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: paymentsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });

  const formatDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMM d", { locale });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="mr-1 h-3 w-3" />
            Paid
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case "overdue":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Overdue
          </Badge>
        );
      default:
        return null;
    }
  };

  const getPaymentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      membership: "Membership",
      personal_training: "PT",
      class: "Class",
      merchandise: "Shop",
      other: "Other",
    };
    return labels[type] || type;
  };

  const handleEdit = (payment: PaymentWithMember) => {
    setSelectedPayment(payment);
    setDialogOpen(true);
  };

  const handleMarkPaid = (payment: PaymentWithMember) => {
    setSelectedPayment(payment);
    setMarkPaidOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this payment?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const exportCSV = () => {
    const headers = ["Member", "Amount", "Type", "Due", "Status", "Paid On"];
    const rows = payments.map((p) => [
      p.member?.name || "Unknown",
      p.amount.toFixed(2),
      getPaymentTypeLabel(p.payment_type),
      format(parseISO(p.due_date), "yyyy-MM-dd"),
      p.status,
      p.paid_date ? format(parseISO(p.paid_date), "yyyy-MM-dd") : "",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments-${format(new Date(), "yyyy-MM-dd")}.csv`;
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
          <h1 className="text-2xl md:text-3xl font-bold">Financials</h1>
          <p className="text-muted-foreground">Manage revenue and payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => { setSelectedPayment(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            New Payment
          </Button>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="backdrop-blur-md bg-card/80">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <Badge variant="secondary" className="text-green-500">MTD</Badge>
            </div>
            <p className="text-xl font-bold">€{stats.revenueMTD.toLocaleString("en-US")}</p>
            <p className="text-xs text-muted-foreground">Revenue this month</p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-md bg-card/80">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <Badge variant="secondary" className="text-green-500">QTD</Badge>
            </div>
            <p className="text-xl font-bold">€{stats.revenueQTD.toLocaleString("en-US")}</p>
            <p className="text-xs text-muted-foreground">Revenue QTD</p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-md bg-card/80">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="h-5 w-5 text-green-500" />
              <Badge variant="secondary" className="text-green-500">YTD</Badge>
            </div>
            <p className="text-xl font-bold">€{stats.revenueYTD.toLocaleString("en-US")}</p>
            <p className="text-xs text-muted-foreground">Revenue YTD</p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-md bg-card/80">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <Badge variant="secondary">{stats.pendingCount}</Badge>
            </div>
            <p className="text-xl font-bold">€{stats.pendingAmount.toLocaleString("en-US")}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-md bg-card/80 border-l-4 border-l-destructive">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <Badge variant="destructive">{stats.overdueCount}</Badge>
            </div>
            <p className="text-xl font-bold">€{stats.overdueAmount.toLocaleString("en-US")}</p>
            <p className="text-xs text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue by Source */}
        <Card className="backdrop-blur-md bg-card/80">
          <CardHeader>
            <CardTitle>Revenue by Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {revenueByType.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No data yet</p>
            ) : (
              revenueByType.map((item) => (
                <div key={item.type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-muted-foreground">€{item.amount.toLocaleString("en-US")}</span>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Coach Revenue */}
        <Card className="backdrop-blur-md bg-card/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Revenue by Coach
            </CardTitle>
          </CardHeader>
          <CardContent>
            {coachRevenue.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No data yet</p>
            ) : (
              <div className="space-y-3">
                {coachRevenue.map((coach) => (
                  <div
                    key={coach.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        coach.rank === 1 ? "bg-yellow-500 text-yellow-950" :
                        coach.rank === 2 ? "bg-gray-300 text-gray-700" :
                        coach.rank === 3 ? "bg-orange-400 text-orange-950" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {coach.rank}
                      </div>
                      <div>
                        <p className="font-medium">{coach.name}</p>
                        <p className="text-sm text-muted-foreground">{coach.client_count} clients</p>
                      </div>
                    </div>
                    <p className="font-bold text-primary">€{coach.revenue_this_month.toLocaleString("en-US")}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card className="backdrop-blur-md bg-card/80">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Payments
            </CardTitle>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">
                  Pending ({stats.pendingCount})
                </TabsTrigger>
                <TabsTrigger value="overdue">
                  Overdue ({stats.overdueCount})
                </TabsTrigger>
                <TabsTrigger value="paid">Paid</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPayments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No payments found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.slice(0, 20).map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {payment.member?.name || "Unknown"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getPaymentTypeLabel(payment.payment_type)}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      €{payment.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(payment.due_date)}
                    </TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {payment.status !== "paid" && (
                            <DropdownMenuItem onClick={() => handleMarkPaid(payment)}>
                              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                              Mark as paid
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleEdit(payment)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(payment.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Overdue Alert */}
      {stats.overdueCount > 0 && (
        <Card className="backdrop-blur-md bg-card/80 border-l-4 border-l-destructive">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <div>
                  <p className="font-semibold">{stats.overdueCount} overdue payments</p>
                  <p className="text-sm text-muted-foreground">
                    Total: €{stats.overdueAmount.toLocaleString("en-US")} outstanding
                  </p>
                </div>
              </div>
              <Button variant="destructive">
                <Mail className="mr-2 h-4 w-4" />
                Send reminders
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Dialog */}
      <PaymentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        payment={selectedPayment}
        members={members}
        onSave={async (data) => {
          if (selectedPayment) {
            await updateMutation.mutateAsync({ id: selectedPayment.id, data });
          } else if (gym) {
            await createMutation.mutateAsync({ ...data, gym_id: gym.id } as Parameters<typeof paymentsService.create>[0]);
          }
        }}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Mark Paid Dialog */}
      <MarkPaidDialog
        open={markPaidOpen}
        onOpenChange={setMarkPaidOpen}
        payment={selectedPayment}
        onConfirm={async (method) => {
          if (selectedPayment) {
            await markPaidMutation.mutateAsync({ id: selectedPayment.id, method });
          }
        }}
      />
    </div>
  );
};

export default FinancialOverview;
