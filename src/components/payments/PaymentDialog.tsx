import { useState, useEffect } from "react";
import { format, addMonths } from "date-fns";
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
import type { Payment, Member, PaymentStatus } from "@/types/database";
import type { PaymentInsert, PaymentUpdate } from "@/services/payments";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment?: Payment | null;
  members: Member[];
  onSave: (data: PaymentInsert | PaymentUpdate) => Promise<void>;
  loading?: boolean;
}

const PAYMENT_TYPES = [
  { value: "membership", label: "Mitgliedsbeitrag" },
  { value: "personal_training", label: "Personal Training" },
  { value: "class", label: "Kursbuchung" },
  { value: "merchandise", label: "Merchandise" },
  { value: "other", label: "Sonstiges" },
];

const PAYMENT_STATUSES: { value: PaymentStatus; label: string }[] = [
  { value: "pending", label: "Ausstehend" },
  { value: "paid", label: "Bezahlt" },
  { value: "overdue", label: "Überfällig" },
];

const PAYMENT_METHODS = [
  { value: "bank_transfer", label: "Überweisung" },
  { value: "cash", label: "Bar" },
  { value: "card", label: "Karte" },
  { value: "direct_debit", label: "Lastschrift" },
  { value: "paypal", label: "PayPal" },
];

interface FormData {
  member_id: string;
  amount: number;
  description: string;
  payment_type: string;
  status: PaymentStatus;
  due_date: string;
  paid_date: string;
  payment_method: string;
  invoice_number: string;
}

export default function PaymentDialog({
  open,
  onOpenChange,
  payment,
  members,
  onSave,
  loading = false,
}: PaymentDialogProps) {
  const isEditing = !!payment;

  const getInitialFormData = (): FormData => {
    if (payment) {
      return {
        member_id: payment.member_id,
        amount: payment.amount,
        description: payment.description || "",
        payment_type: payment.payment_type,
        status: payment.status,
        due_date: payment.due_date.slice(0, 10),
        paid_date: payment.paid_date ? payment.paid_date.slice(0, 10) : "",
        payment_method: payment.payment_method || "",
        invoice_number: payment.invoice_number || "",
      };
    }

    const nextMonth = addMonths(new Date(), 1);
    nextMonth.setDate(1);

    return {
      member_id: members[0]?.id || "",
      amount: 49,
      description: "",
      payment_type: "membership",
      status: "pending",
      due_date: format(nextMonth, "yyyy-MM-dd"),
      paid_date: "",
      payment_method: "",
      invoice_number: "",
    };
  };

  const [formData, setFormData] = useState<FormData>(getInitialFormData);

  useEffect(() => {
    if (open) {
      setFormData(getInitialFormData());
    }
  }, [payment, open, members]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      member_id: formData.member_id,
      amount: formData.amount,
      description: formData.description || null,
      payment_type: formData.payment_type,
      status: formData.status,
      due_date: new Date(formData.due_date).toISOString(),
      paid_date: formData.paid_date ? new Date(formData.paid_date).toISOString() : null,
      payment_method: formData.payment_method || null,
      invoice_number: formData.invoice_number || null,
    });
  };

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Auto-set paid_date when status changes to paid
  const handleStatusChange = (status: PaymentStatus) => {
    updateField("status", status);
    if (status === "paid" && !formData.paid_date) {
      updateField("paid_date", format(new Date(), "yyyy-MM-dd"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Zahlung bearbeiten" : "Neue Zahlung"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Member */}
            <div className="col-span-2 space-y-2">
              <Label>Mitglied *</Label>
              <Select
                value={formData.member_id}
                onValueChange={(v) => updateField("member_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Mitglied wählen" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Betrag (EUR) *</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => updateField("amount", parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            {/* Payment Type */}
            <div className="space-y-2">
              <Label>Zahlungsart *</Label>
              <Select
                value={formData.payment_type}
                onValueChange={(v) => updateField("payment_type", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="due_date">Fälligkeitsdatum *</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => updateField("due_date", e.target.value)}
                required
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Paid Date (only show when status is paid) */}
            {formData.status === "paid" && (
              <div className="space-y-2">
                <Label htmlFor="paid_date">Bezahlt am</Label>
                <Input
                  id="paid_date"
                  type="date"
                  value={formData.paid_date}
                  onChange={(e) => updateField("paid_date", e.target.value)}
                />
              </div>
            )}

            {/* Payment Method (only show when status is paid) */}
            {formData.status === "paid" && (
              <div className="space-y-2">
                <Label>Zahlungsmethode</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(v) => updateField("payment_method", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Invoice Number */}
            <div className="space-y-2">
              <Label htmlFor="invoice_number">Rechnungsnummer</Label>
              <Input
                id="invoice_number"
                value={formData.invoice_number}
                onChange={(e) => updateField("invoice_number", e.target.value)}
                placeholder="z.B. INV-2024-001"
              />
            </div>

            {/* Description */}
            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Optionale Beschreibung..."
                className="w-full min-h-[60px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
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
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading || !formData.member_id}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Speichern...
                </>
              ) : isEditing ? (
                "Speichern"
              ) : (
                "Erstellen"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
