import { useState, useEffect } from "react";
import { format, addHours, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Trash2 } from "lucide-react";
import type { Session, Coach, SessionStatus } from "@/types/database";
import type { SessionInsert, SessionUpdate } from "@/services/sessions";

interface SessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session?: Session | null;
  initialDate?: Date;
  coaches: Coach[];
  onSave: (data: SessionInsert | SessionUpdate) => Promise<void>;
  onDelete?: () => void;
  loading?: boolean;
}

const SESSION_TYPES = [
  { value: "personal", label: "Personal Training" },
  { value: "group", label: "Group Class" },
  { value: "class", label: "Class" },
  { value: "consultation", label: "Consultation" },
];

const SESSION_STATUSES: { value: SessionStatus; label: string }[] = [
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No-Show" },
];

interface FormData {
  title: string;
  description: string;
  session_type: string;
  coach_id: string;
  start_time: string;
  end_time: string;
  status: SessionStatus;
  price: number;
  max_participants: number;
  location: string;
  notes: string;
}

export default function SessionDialog({
  open,
  onOpenChange,
  session,
  initialDate,
  coaches,
  onSave,
  onDelete,
  loading = false,
}: SessionDialogProps) {
  const isEditing = !!session;

  const getInitialFormData = (): FormData => {
    if (session) {
      return {
        title: session.title,
        description: session.description || "",
        session_type: session.session_type,
        coach_id: session.coach_id,
        start_time: session.start_time.slice(0, 16),
        end_time: session.end_time.slice(0, 16),
        status: session.status,
        price: session.price,
        max_participants: session.max_participants,
        location: session.location || "",
        notes: session.notes || "",
      };
    }

    const startTime = initialDate || new Date();
    const endTime = addHours(startTime, 1);

    return {
      title: "",
      description: "",
      session_type: "personal",
      coach_id: coaches[0]?.id || "",
      start_time: format(startTime, "yyyy-MM-dd'T'HH:mm"),
      end_time: format(endTime, "yyyy-MM-dd'T'HH:mm"),
      status: "scheduled",
      price: 50,
      max_participants: 1,
      location: "",
      notes: "",
    };
  };

  const [formData, setFormData] = useState<FormData>(getInitialFormData);

  useEffect(() => {
    if (open) {
      setFormData(getInitialFormData());
    }
  }, [session, initialDate, open, coaches]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      title: formData.title,
      description: formData.description || null,
      session_type: formData.session_type,
      coach_id: formData.coach_id,
      start_time: new Date(formData.start_time).toISOString(),
      end_time: new Date(formData.end_time).toISOString(),
      status: formData.status,
      price: formData.price,
      max_participants: formData.max_participants,
      location: formData.location || null,
      notes: formData.notes || null,
    });
  };

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Auto-update end time when start time changes
  const handleStartTimeChange = (value: string) => {
    updateField("start_time", value);
    if (value) {
      const endTime = addHours(new Date(value), 1);
      updateField("end_time", format(endTime, "yyyy-MM-dd'T'HH:mm"));
    }
  };

  // Auto-update max_participants based on session type
  const handleSessionTypeChange = (value: string) => {
    updateField("session_type", value);
    if (value === "personal" || value === "consultation") {
      updateField("max_participants", 1);
    } else if (value === "group") {
      updateField("max_participants", 10);
    } else if (value === "class") {
      updateField("max_participants", 20);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Session" : "New Session"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Title */}
            <div className="col-span-2 space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="e.g. HIIT Training with Max"
                required
              />
            </div>

            {/* Session Type */}
            <div className="space-y-2">
              <Label>Session Type *</Label>
              <Select
                value={formData.session_type}
                onValueChange={handleSessionTypeChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SESSION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Coach */}
            <div className="space-y-2">
              <Label>Coach *</Label>
              <Select
                value={formData.coach_id}
                onValueChange={(v) => updateField("coach_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select coach" />
                </SelectTrigger>
                <SelectContent>
                  {coaches.filter((c) => c.is_active).map((coach) => (
                    <SelectItem key={coach.id} value={coach.id}>
                      {coach.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Time */}
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time *</Label>
              <Input
                id="start_time"
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                required
              />
            </div>

            {/* End Time */}
            <div className="space-y-2">
              <Label htmlFor="end_time">End Time *</Label>
              <Input
                id="end_time"
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => updateField("end_time", e.target.value)}
                required
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => updateField("price", parseFloat(e.target.value) || 0)}
              />
            </div>

            {/* Max Participants */}
            <div className="space-y-2">
              <Label htmlFor="max_participants">Max. Participants</Label>
              <Input
                id="max_participants"
                type="number"
                min="1"
                value={formData.max_participants}
                onChange={(e) => updateField("max_participants", parseInt(e.target.value) || 1)}
              />
            </div>

            {/* Location */}
            <div className="col-span-2 space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => updateField("location", e.target.value)}
                placeholder="e.g. Training Room 1, Online"
              />
            </div>

            {/* Status (only for editing) */}
            {isEditing && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => updateField("status", v as SessionStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SESSION_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Description */}
            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Brief description of the session..."
                className="w-full min-h-[60px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
              />
            </div>

            {/* Notes */}
            <div className="col-span-2 space-y-2">
              <Label htmlFor="notes">Internal Notes</Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Notes (only visible to the team)..."
                className="w-full min-h-[60px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            {isEditing && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
                disabled={loading}
                className="mr-auto"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.coach_id}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                "Save"
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
