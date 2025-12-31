import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isSameDay,
  isSameMonth,
  parseISO,
  addHours,
  setHours,
  setMinutes,
} from "date-fns";
import { enUS } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { sessionsService } from "@/services/sessions";
import { coachesService } from "@/services/coaches";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  User,
  Users,
  MapPin,
  Loader2,
} from "lucide-react";
import SessionDialog from "@/components/calendar/SessionDialog";
import DeleteSessionDialog from "@/components/calendar/DeleteSessionDialog";
import type { Session, Coach } from "@/types/database";

type ViewMode = "week" | "month";

interface SessionWithRelations extends Session {
  coach?: { id: string; name: string; avatar_url: string | null };
  member?: { id: string; name: string; avatar_url: string | null } | null;
}

const SESSION_TYPES = [
  { value: "personal", label: "Personal Training", color: "bg-blue-500" },
  { value: "group", label: "Group Class", color: "bg-green-500" },
  { value: "class", label: "Class", color: "bg-purple-500" },
  { value: "consultation", label: "Consultation", color: "bg-yellow-500" },
];

const HOURS = Array.from({ length: 15 }, (_, i) => i + 6); // 6:00 - 20:00

export default function Calendar() {
  const { gym } = useAuth();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [selectedCoach, setSelectedCoach] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionWithRelations | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; hour: number } | null>(null);

  // Calculate date range based on view mode
  const dateRange = useMemo(() => {
    if (viewMode === "week") {
      return {
        start: startOfWeek(currentDate, { weekStartsOn: 1 }),
        end: endOfWeek(currentDate, { weekStartsOn: 1 }),
      };
    }
    return {
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate),
    };
  }, [currentDate, viewMode]);

  const days = useMemo(() => {
    return eachDayOfInterval(dateRange);
  }, [dateRange]);

  // Fetch sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["sessions", gym?.id, dateRange.start, dateRange.end],
    queryFn: () =>
      gym ? sessionsService.getByDateRange(gym.id, dateRange.start, dateRange.end) : [],
    enabled: !!gym?.id,
  });

  // Fetch coaches for filter
  const { data: coaches = [] } = useQuery({
    queryKey: ["coaches", gym?.id],
    queryFn: () => (gym ? coachesService.getAll(gym.id) : []),
    enabled: !!gym?.id,
  });

  // Filter sessions by coach
  const filteredSessions = useMemo(() => {
    if (selectedCoach === "all") return sessions;
    return sessions.filter((s) => s.coach_id === selectedCoach);
  }, [sessions, selectedCoach]);

  // Create session mutation
  const createMutation = useMutation({
    mutationFn: sessionsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      setDialogOpen(false);
      setSelectedSlot(null);
    },
  });

  // Update session mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof sessionsService.update>[1] }) =>
      sessionsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      setDialogOpen(false);
      setSelectedSession(null);
    },
  });

  // Delete session mutation
  const deleteMutation = useMutation({
    mutationFn: sessionsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      setDeleteDialogOpen(false);
      setSelectedSession(null);
    },
  });

  const navigateDate = (direction: "prev" | "next") => {
    if (viewMode === "week") {
      setCurrentDate(direction === "prev" ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
    } else {
      setCurrentDate(direction === "prev" ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  const handleSlotClick = (date: Date, hour: number) => {
    const slotTime = setMinutes(setHours(date, hour), 0);
    setSelectedSlot({ date: slotTime, hour });
    setSelectedSession(null);
    setDialogOpen(true);
  };

  const handleSessionClick = (session: SessionWithRelations) => {
    setSelectedSession(session);
    setSelectedSlot(null);
    setDialogOpen(true);
  };

  const handleDeleteClick = (session: SessionWithRelations) => {
    setSelectedSession(session);
    setDeleteDialogOpen(true);
  };

  const getSessionsForSlot = (date: Date, hour: number) => {
    return filteredSessions.filter((session) => {
      const sessionStart = parseISO(session.start_time);
      return isSameDay(sessionStart, date) && sessionStart.getHours() === hour;
    });
  };

  const getSessionsForDay = (date: Date) => {
    return filteredSessions.filter((session) => {
      const sessionStart = parseISO(session.start_time);
      return isSameDay(sessionStart, date);
    });
  };

  const getSessionTypeColor = (type: string) => {
    return SESSION_TYPES.find((t) => t.value === type)?.color || "bg-gray-500";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge variant="outline" className="text-xs">Scheduled</Badge>;
      case "completed":
        return <Badge className="bg-green-500/20 text-green-400 text-xs">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive" className="text-xs">Cancelled</Badge>;
      case "no_show":
        return <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">No-Show</Badge>;
      default:
        return null;
    }
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">
            Manage sessions and classes
          </p>
        </div>
        <Button onClick={() => { setSelectedSession(null); setSelectedSlot(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          New Session
        </Button>
      </div>

      {/* Controls */}
      <Card className="backdrop-blur-md bg-card/80">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => navigateDate("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigateDate("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="ml-2 text-lg font-medium">
                {viewMode === "week"
                  ? `${format(dateRange.start, "MMM d", { locale: enUS })} - ${format(dateRange.end, "MMM d, yyyy", { locale: enUS })}`
                  : format(currentDate, "MMMM yyyy", { locale: enUS })}
              </span>
            </div>

            {/* View Mode & Filters */}
            <div className="flex items-center gap-4">
              <Select value={selectedCoach} onValueChange={setSelectedCoach}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by coach" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Coaches</SelectItem>
                  {coaches.map((coach) => (
                    <SelectItem key={coach.id} value={coach.id}>
                      {coach.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                <TabsList>
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="month">Month</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      {sessionsLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : viewMode === "week" ? (
        <WeekView
          days={days}
          hours={HOURS}
          sessions={filteredSessions}
          onSlotClick={handleSlotClick}
          onSessionClick={handleSessionClick}
          getSessionsForSlot={getSessionsForSlot}
          getSessionTypeColor={getSessionTypeColor}
        />
      ) : (
        <MonthView
          days={days}
          currentDate={currentDate}
          sessions={filteredSessions}
          onDayClick={(date) => handleSlotClick(date, 9)}
          onSessionClick={handleSessionClick}
          getSessionsForDay={getSessionsForDay}
          getSessionTypeColor={getSessionTypeColor}
        />
      )}

      {/* Session Dialog */}
      <SessionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        session={selectedSession}
        initialDate={selectedSlot?.date}
        coaches={coaches}
        onSave={async (data) => {
          if (selectedSession) {
            await updateMutation.mutateAsync({ id: selectedSession.id, data });
          } else if (gym) {
            await createMutation.mutateAsync({ ...data, gym_id: gym.id });
          }
        }}
        onDelete={() => {
          if (selectedSession) {
            setDialogOpen(false);
            handleDeleteClick(selectedSession);
          }
        }}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Dialog */}
      <DeleteSessionDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        session={selectedSession}
        onConfirm={() => selectedSession && deleteMutation.mutateAsync(selectedSession.id)}
      />
    </div>
  );
}

// Week View Component
function WeekView({
  days,
  hours,
  sessions,
  onSlotClick,
  onSessionClick,
  getSessionsForSlot,
  getSessionTypeColor,
}: {
  days: Date[];
  hours: number[];
  sessions: SessionWithRelations[];
  onSlotClick: (date: Date, hour: number) => void;
  onSessionClick: (session: SessionWithRelations) => void;
  getSessionsForSlot: (date: Date, hour: number) => SessionWithRelations[];
  getSessionTypeColor: (type: string) => string;
}) {
  const today = new Date();

  return (
    <Card className="backdrop-blur-md bg-card/80 overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header */}
          <div className="grid grid-cols-8 border-b">
            <div className="p-3 text-center text-sm font-medium text-muted-foreground border-r">
              Time
            </div>
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className={`p-3 text-center border-r last:border-r-0 ${
                  isSameDay(day, today) ? "bg-primary/10" : ""
                }`}
              >
                <div className="text-sm font-medium">
                  {format(day, "EEE", { locale: enUS })}
                </div>
                <div
                  className={`text-2xl font-bold ${
                    isSameDay(day, today) ? "text-primary" : ""
                  }`}
                >
                  {format(day, "d")}
                </div>
              </div>
            ))}
          </div>

          {/* Time Grid */}
          <div className="max-h-[600px] overflow-y-auto">
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-8 border-b last:border-b-0">
                <div className="p-2 text-center text-sm text-muted-foreground border-r bg-muted/30">
                  {`${hour.toString().padStart(2, "0")}:00`}
                </div>
                {days.map((day) => {
                  const slotSessions = getSessionsForSlot(day, hour);
                  return (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      className="min-h-[60px] p-1 border-r last:border-r-0 hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => slotSessions.length === 0 && onSlotClick(day, hour)}
                    >
                      {slotSessions.map((session) => (
                        <div
                          key={session.id}
                          className={`${getSessionTypeColor(session.session_type)} rounded-md p-2 mb-1 cursor-pointer hover:opacity-90 transition-opacity`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSessionClick(session);
                          }}
                        >
                          <div className="text-xs font-medium text-white truncate">
                            {session.title}
                          </div>
                          <div className="text-xs text-white/80 truncate">
                            {session.coach?.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

// Month View Component
function MonthView({
  days,
  currentDate,
  sessions,
  onDayClick,
  onSessionClick,
  getSessionsForDay,
  getSessionTypeColor,
}: {
  days: Date[];
  currentDate: Date;
  sessions: SessionWithRelations[];
  onDayClick: (date: Date) => void;
  onSessionClick: (session: SessionWithRelations) => void;
  getSessionsForDay: (date: Date) => SessionWithRelations[];
  getSessionTypeColor: (type: string) => string;
}) {
  const today = new Date();
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Pad days to start from Monday
  const firstDay = days[0];
  const startPadding = (firstDay.getDay() + 6) % 7;
  const paddedDays = [...Array(startPadding).fill(null), ...days];

  return (
    <Card className="backdrop-blur-md bg-card/80 overflow-hidden">
      <div className="grid grid-cols-7">
        {/* Header */}
        {weekDays.map((day) => (
          <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground border-b">
            {day}
          </div>
        ))}

        {/* Days */}
        {paddedDays.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="min-h-[120px] border-b border-r bg-muted/20" />;
          }

          const daySessions = getSessionsForDay(day);
          const isToday = isSameDay(day, today);
          const isCurrentMonth = isSameMonth(day, currentDate);

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[120px] p-2 border-b border-r cursor-pointer hover:bg-muted/30 transition-colors ${
                !isCurrentMonth ? "bg-muted/20" : ""
              } ${isToday ? "bg-primary/5" : ""}`}
              onClick={() => onDayClick(day)}
            >
              <div
                className={`text-sm font-medium mb-1 ${
                  isToday
                    ? "bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center"
                    : isCurrentMonth
                    ? ""
                    : "text-muted-foreground"
                }`}
              >
                {format(day, "d")}
              </div>
              <div className="space-y-1">
                {daySessions.slice(0, 3).map((session) => (
                  <div
                    key={session.id}
                    className={`${getSessionTypeColor(session.session_type)} rounded px-1 py-0.5 cursor-pointer hover:opacity-90`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSessionClick(session);
                    }}
                  >
                    <div className="text-xs text-white truncate">
                      {format(parseISO(session.start_time), "HH:mm")} {session.title}
                    </div>
                  </div>
                ))}
                {daySessions.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{daySessions.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
