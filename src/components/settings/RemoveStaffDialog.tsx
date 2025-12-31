import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import type { Profile } from "@/types/database";

interface RemoveStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: Profile | null;
  onConfirm: () => Promise<void>;
  loading?: boolean;
}

export default function RemoveStaffDialog({
  open,
  onOpenChange,
  staff,
  onConfirm,
  loading = false,
}: RemoveStaffDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mitarbeiter entfernen?</AlertDialogTitle>
          <AlertDialogDescription>
            Möchtest du <strong>{staff?.full_name || staff?.email}</strong> wirklich
            aus dem Team entfernen? Der Account bleibt bestehen, aber der Zugang
            zum Gym wird entzogen.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entfernen...
              </>
            ) : (
              "Entfernen"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
