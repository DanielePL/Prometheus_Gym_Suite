import { useState, useEffect } from "react";
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
import { Loader2, Save } from "lucide-react";
import type { Profile, StaffRole } from "@/types/database";

interface StaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: Profile | null;
  onSave: (data: { full_name: string; role: StaffRole }) => Promise<void>;
  loading?: boolean;
}

const ROLES: { value: StaffRole; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Administrator" },
  { value: "manager", label: "Manager" },
  { value: "coach", label: "Coach" },
  { value: "receptionist", label: "Receptionist" },
];

export default function StaffDialog({
  open,
  onOpenChange,
  staff,
  onSave,
  loading = false,
}: StaffDialogProps) {
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<StaffRole>("receptionist");

  useEffect(() => {
    if (open && staff) {
      setFullName(staff.full_name || "");
      setRole(staff.role);
    }
  }, [open, staff]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      full_name: fullName,
      role,
    });
  };

  const isValid = fullName.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Staff Member</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email (readonly) */}
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={staff?.email || ""} disabled className="bg-muted" />
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Name *</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full Name"
              required
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label>Role *</Label>
            <Select value={role} onValueChange={(v) => setRole(v as StaffRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !isValid}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
