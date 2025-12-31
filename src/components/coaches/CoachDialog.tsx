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
import { Badge } from "@/components/ui/badge";
import { Loader2, X } from "lucide-react";
import type { Coach } from "@/types/database";

interface CoachDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coach?: Coach | null;
  onSave: (data: CoachFormData) => Promise<void>;
}

export interface CoachFormData {
  name: string;
  email: string;
  phone: string;
  specializations: string[];
  bio: string;
  hourly_rate: number;
}

const COMMON_SPECIALIZATIONS = [
  "Strength",
  "HIIT",
  "Yoga",
  "Pilates",
  "Cardio",
  "Weight Loss",
  "Nutrition",
  "Spinning",
  "CrossFit",
  "Boxing",
  "Swimming",
  "Rehabilitation",
];

export default function CoachDialog({
  open,
  onOpenChange,
  coach,
  onSave,
}: CoachDialogProps) {
  const [loading, setLoading] = useState(false);
  const [newSpec, setNewSpec] = useState("");
  const [formData, setFormData] = useState<CoachFormData>({
    name: "",
    email: "",
    phone: "",
    specializations: [],
    bio: "",
    hourly_rate: 50,
  });

  const isEditing = !!coach;

  useEffect(() => {
    if (coach) {
      setFormData({
        name: coach.name,
        email: coach.email,
        phone: coach.phone || "",
        specializations: coach.specializations || [],
        bio: coach.bio || "",
        hourly_rate: coach.hourly_rate,
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        specializations: [],
        bio: "",
        hourly_rate: 50,
      });
    }
  }, [coach, open]);

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

  const addSpecialization = (spec: string) => {
    if (spec && !formData.specializations.includes(spec)) {
      setFormData({
        ...formData,
        specializations: [...formData.specializations, spec],
      });
    }
    setNewSpec("");
  };

  const removeSpecialization = (spec: string) => {
    setFormData({
      ...formData,
      specializations: formData.specializations.filter((s) => s !== spec),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Coach" : "New Coach"}
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
              <Label htmlFor="rate">Hourly Rate ($)</Label>
              <Input
                id="rate"
                type="number"
                min="0"
                step="0.01"
                value={formData.hourly_rate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hourly_rate: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Specializations</Label>
              <div className="flex flex-wrap gap-1 mb-2">
                {formData.specializations.map((spec) => (
                  <Badge key={spec} variant="secondary" className="gap-1">
                    {spec}
                    <button
                      type="button"
                      onClick={() => removeSpecialization(spec)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newSpec}
                  onChange={(e) => setNewSpec(e.target.value)}
                  placeholder="New specialization..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSpecialization(newSpec);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addSpecialization(newSpec)}
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {COMMON_SPECIALIZATIONS.filter(
                  (s) => !formData.specializations.includes(s)
                )
                  .slice(0, 6)
                  .map((spec) => (
                    <Badge
                      key={spec}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => addSpecialization(spec)}
                    >
                      + {spec}
                    </Badge>
                  ))}
              </div>
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                placeholder="Short description of the coach..."
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
