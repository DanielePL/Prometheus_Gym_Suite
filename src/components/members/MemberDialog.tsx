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
import { Loader2 } from "lucide-react";
import type { Member, Coach, MembershipType } from "@/types/database";

interface MemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: Member | null;
  coaches: Coach[];
  onSave: (data: MemberFormData) => Promise<void>;
}

export interface MemberFormData {
  name: string;
  email: string;
  phone: string;
  membership_type: MembershipType;
  monthly_fee: number;
  coach_id: string | null;
  notes: string;
}

export default function MemberDialog({
  open,
  onOpenChange,
  member,
  coaches,
  onSave,
}: MemberDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<MemberFormData>({
    name: "",
    email: "",
    phone: "",
    membership_type: "basic",
    monthly_fee: 49,
    coach_id: null,
    notes: "",
  });

  const isEditing = !!member;

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name,
        email: member.email,
        phone: member.phone || "",
        membership_type: member.membership_type,
        monthly_fee: member.monthly_fee,
        coach_id: member.coach_id,
        notes: member.notes || "",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        membership_type: "basic",
        monthly_fee: 49,
        coach_id: null,
        notes: "",
      });
    }
  }, [member, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const membershipPrices: Record<MembershipType, number> = {
    trial: 0,
    basic: 49,
    premium: 89,
    vip: 149,
  };

  const handleMembershipChange = (value: MembershipType) => {
    setFormData({
      ...formData,
      membership_type: value,
      monthly_fee: membershipPrices[value],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Member" : "New Member"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="john@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+1 555 ..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="membership">Membership</Label>
              <Select
                value={formData.membership_type}
                onValueChange={handleMembershipChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial (Free)</SelectItem>
                  <SelectItem value="basic">Basic ($49/month)</SelectItem>
                  <SelectItem value="premium">Premium ($89/month)</SelectItem>
                  <SelectItem value="vip">VIP ($149/month)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fee">Monthly Fee ($)</Label>
              <Input
                id="fee"
                type="number"
                min="0"
                step="0.01"
                value={formData.monthly_fee}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    monthly_fee: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="coach">Assign Coach</Label>
              <Select
                value={formData.coach_id || "none"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    coach_id: value === "none" ? null : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="No Coach" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Coach</SelectItem>
                  {coaches.map((coach) => (
                    <SelectItem key={coach.id} value={coach.id}>
                      {coach.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Optional notes..."
                className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm"
              />
            </div>
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
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                "Save"
              ) : (
                "Add"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
