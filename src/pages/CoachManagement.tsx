import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  UserPlus,
  Star,
  Calendar,
  MessageSquare,
  TrendingUp,
  DollarSign,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { coachesService } from "@/services/coaches";
import CoachDialog, { CoachFormData } from "@/components/coaches/CoachDialog";
import DeleteCoachDialog from "@/components/coaches/DeleteCoachDialog";
import type { Coach } from "@/types/database";

const CoachManagement = () => {
  const { gym } = useAuth();
  const queryClient = useQueryClient();
  const [coachDialogOpen, setCoachDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);

  // Fetch coaches
  const { data: coaches = [], isLoading } = useQuery({
    queryKey: ["coaches", gym?.id],
    queryFn: () => (gym?.id ? coachesService.getAll(gym.id) : Promise.resolve([])),
    enabled: !!gym?.id,
  });

  // Create coach mutation
  const createMutation = useMutation({
    mutationFn: (data: CoachFormData) =>
      coachesService.create({
        ...data,
        gym_id: gym!.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coaches"] });
      toast.success("Coach added successfully");
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  // Update coach mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CoachFormData }) =>
      coachesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coaches"] });
      toast.success("Coach updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  // Delete coach mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => coachesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coaches"] });
      toast.success("Coach deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      coachesService.toggleActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coaches"] });
      toast.success("Status updated");
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  // Calculate stats
  const stats = useMemo(() => {
    const activeCoaches = coaches.filter((c: Coach) => c.is_active).length;
    const avgRating =
      coaches.length > 0
        ? coaches.reduce((sum: number, c: Coach) => sum + (c.rating || 0), 0) / coaches.length
        : 0;
    const totalClients = coaches.reduce((sum: number, c: Coach) => sum + (c.client_count || 0), 0);
    const totalRevenue = coaches.reduce(
      (sum: number, c: Coach) => sum + (c.revenue_this_month || 0),
      0
    );

    return {
      activeCoaches,
      avgRating: avgRating.toFixed(1),
      totalClients,
      totalRevenue,
    };
  }, [coaches]);

  const handleAddCoach = () => {
    setSelectedCoach(null);
    setCoachDialogOpen(true);
  };

  const handleEditCoach = (coach: Coach) => {
    setSelectedCoach(coach);
    setCoachDialogOpen(true);
  };

  const handleDeleteCoach = (coach: Coach) => {
    setSelectedCoach(coach);
    setDeleteDialogOpen(true);
  };

  const handleSaveCoach = async (data: CoachFormData) => {
    if (selectedCoach) {
      await updateMutation.mutateAsync({ id: selectedCoach.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedCoach) {
      await deleteMutation.mutateAsync(selectedCoach.id);
    }
  };

  const handleToggleActive = (coach: Coach) => {
    toggleActiveMutation.mutate({ id: coach.id, isActive: !coach.is_active });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate utilization (sessions this month / expected sessions)
  const getUtilization = (coach: Coach) => {
    const expectedSessions = 40; // Assumed max sessions per month
    return Math.min(100, Math.round((coach.sessions_this_month / expectedSessions) * 100));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Coach Management</h1>
          <p className="text-muted-foreground">
            Manage your coaching team and track performance
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90" onClick={handleAddCoach}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Coach
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.activeCoaches}</p>
                <p className="text-sm text-muted-foreground">Active Coaches</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.avgRating}</p>
                <p className="text-sm text-muted-foreground">Avg. Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalClients}</p>
                <p className="text-sm text-muted-foreground">Total Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-sm text-muted-foreground">Team Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="roster" className="space-y-4">
        <TabsList className="glass">
          <TabsTrigger value="roster">Team</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="schedule">Calendar</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
        </TabsList>

        <TabsContent value="roster" className="space-y-4">
          {coaches.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No Coaches Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first coach to get started.
                </p>
                <Button onClick={handleAddCoach}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Coach
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {coaches.map((coach: Coach) => (
                <Card
                  key={coach.id}
                  className={`glass-card hover:scale-[1.02] transition-transform ${
                    !coach.is_active ? "opacity-60" : ""
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                          {coach.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{coach.name}</h3>
                            <p className="text-sm text-muted-foreground">{coach.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={coach.is_active ? "default" : "secondary"}
                              className={coach.is_active ? "bg-green-500" : ""}
                            >
                              {coach.is_active ? "Active" : "Inactive"}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditCoach(coach)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleActive(coach)}>
                                  {coach.is_active ? (
                                    <>
                                      <ToggleLeft className="h-4 w-4 mr-2" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <ToggleRight className="h-4 w-4 mr-2" />
                                      Activate
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteCoach(coach)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {coach.specializations?.map((spec) => (
                            <Badge key={spec} variant="outline" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                          {(!coach.specializations || coach.specializations.length === 0) && (
                            <span className="text-xs text-muted-foreground">
                              No specializations
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                          <div>
                            <p className="font-semibold">{coach.client_count}</p>
                            <p className="text-xs text-muted-foreground">Clients</p>
                          </div>
                          <div>
                            <p className="font-semibold flex items-center justify-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              {coach.rating?.toFixed(1) || "–"}
                            </p>
                            <p className="text-xs text-muted-foreground">Rating</p>
                          </div>
                          <div>
                            <p className="font-semibold">
                              {formatCurrency(coach.revenue_this_month)}
                            </p>
                            <p className="text-xs text-muted-foreground">Revenue</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Coach Utilization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {coaches.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No coaches available
                </p>
              ) : (
                coaches.map((coach: Coach) => (
                  <div key={coach.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{coach.name}</span>
                        {!coach.is_active && (
                          <Badge variant="secondary" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {coach.sessions_this_month} Sessions ({getUtilization(coach)}%)
                      </span>
                    </div>
                    <Progress value={getUtilization(coach)} className="h-2" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Revenue per Coach</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {coaches
                .filter((c: Coach) => c.is_active)
                .sort((a: Coach, b: Coach) => b.revenue_this_month - a.revenue_this_month)
                .map((coach: Coach) => (
                  <div key={coach.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/20 text-primary text-sm">
                          {coach.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{coach.name}</span>
                    </div>
                    <span className="font-semibold text-primary">
                      {formatCurrency(coach.revenue_this_month)}
                    </span>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <Card className="glass-card">
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Calendar View</h3>
              <p className="text-muted-foreground">Calendar integration coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communication">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Team Communication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <MessageSquare className="h-6 w-6" />
                  <span>Direct Message</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Users className="h-6 w-6" />
                  <span>Team Broadcast</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Coach Dialog */}
      <CoachDialog
        open={coachDialogOpen}
        onOpenChange={setCoachDialogOpen}
        coach={selectedCoach}
        onSave={handleSaveCoach}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteCoachDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        coach={selectedCoach}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default CoachManagement;
