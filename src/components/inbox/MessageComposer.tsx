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
import { Switch } from "@/components/ui/switch";
import { Loader2, Send, Users, User } from "lucide-react";
import type { Message, Profile } from "@/types/database";

interface MessageWithSender extends Message {
  sender?: { id: string; full_name: string | null; avatar_url: string | null; email: string } | null;
}

interface MessageComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: Pick<Profile, "id" | "full_name" | "avatar_url" | "email" | "role">[];
  replyTo?: MessageWithSender | null;
  onSend: (data: {
    recipientId?: string;
    subject: string;
    content: string;
    isBroadcast: boolean;
  }) => Promise<void>;
  loading?: boolean;
}

export default function MessageComposer({
  open,
  onOpenChange,
  staff,
  replyTo,
  onSend,
  loading = false,
}: MessageComposerProps) {
  const [recipientId, setRecipientId] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [isBroadcast, setIsBroadcast] = useState(false);

  useEffect(() => {
    if (open) {
      if (replyTo) {
        setRecipientId(replyTo.sender?.id || "");
        setSubject(`Re: ${replyTo.subject}`);
        setContent(`\n\n---\nOn ${new Date(replyTo.created_at).toLocaleDateString("en-US")} ${replyTo.sender?.full_name || replyTo.sender?.email} wrote:\n${replyTo.content}`);
        setIsBroadcast(false);
      } else {
        setRecipientId("");
        setSubject("");
        setContent("");
        setIsBroadcast(false);
      }
    }
  }, [open, replyTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSend({
      recipientId: isBroadcast ? undefined : recipientId,
      subject,
      content,
      isBroadcast,
    });
  };

  const isValid = subject.trim() && content.trim() && (isBroadcast || recipientId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {replyTo ? "Reply" : "New Message"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Broadcast Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              {isBroadcast ? (
                <Users className="h-5 w-5 text-primary" />
              ) : (
                <User className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">
                  {isBroadcast ? "Team Broadcast" : "Direct Message"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isBroadcast
                    ? "Message will be sent to all team members"
                    : "Message to a specific recipient"}
                </p>
              </div>
            </div>
            <Switch
              checked={isBroadcast}
              onCheckedChange={setIsBroadcast}
              disabled={!!replyTo}
            />
          </div>

          {/* Recipient (only for non-broadcast) */}
          {!isBroadcast && (
            <div className="space-y-2">
              <Label>Recipient *</Label>
              <Select value={recipientId} onValueChange={setRecipientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select recipient" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <span>{member.full_name || member.email}</span>
                        <span className="text-xs text-muted-foreground capitalize">
                          ({member.role})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Message subject"
              required
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Message *</Label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Your message..."
              className="w-full min-h-[200px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
              required
            />
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
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {isBroadcast ? "Send to Team" : "Send"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
