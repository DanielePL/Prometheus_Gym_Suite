import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO, isToday, isYesterday, formatDistanceToNow } from "date-fns";
import { enUS as locale } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { messagesService } from "@/services/messages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Mail,
  MailOpen,
  Send,
  Trash2,
  Search,
  Plus,
  ArrowLeft,
  Users,
  Clock,
  CheckCheck,
  Loader2,
  Megaphone,
  User,
} from "lucide-react";
import MessageComposer from "@/components/inbox/MessageComposer";
import type { Message } from "@/types/database";

interface MessageWithSender extends Message {
  sender?: { id: string; full_name: string | null; avatar_url: string | null; email: string } | null;
  recipient?: { id: string; full_name: string | null; avatar_url: string | null; email: string } | null;
}

export default function Inbox() {
  const { gym, user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("inbox");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<MessageWithSender | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<MessageWithSender | null>(null);

  // Fetch inbox messages
  const { data: inboxMessages = [], isLoading: inboxLoading } = useQuery({
    queryKey: ["messages", "inbox", gym?.id, user?.id],
    queryFn: () => (gym && user ? messagesService.getInbox(gym.id, user.id) : []),
    enabled: !!gym?.id && !!user?.id,
  });

  // Fetch sent messages
  const { data: sentMessages = [], isLoading: sentLoading } = useQuery({
    queryKey: ["messages", "sent", gym?.id, user?.id],
    queryFn: () => (gym && user ? messagesService.getSent(gym.id, user.id) : []),
    enabled: !!gym?.id && !!user?.id,
  });

  // Fetch staff for composer
  const { data: staff = [] } = useQuery({
    queryKey: ["staff", gym?.id],
    queryFn: () => (gym ? messagesService.getStaffMembers(gym.id) : []),
    enabled: !!gym?.id,
  });

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: messagesService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: () => gym && user ? messagesService.markAllAsRead(gym.id, user.id) : Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });

  // Delete message mutation
  const deleteMutation = useMutation({
    mutationFn: messagesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      setSelectedMessage(null);
    },
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: messagesService.send,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      setComposerOpen(false);
      setReplyTo(null);
    },
  });

  // Send broadcast mutation
  const broadcastMutation = useMutation({
    mutationFn: ({ subject, content }: { subject: string; content: string }) =>
      gym && user ? messagesService.sendBroadcast(gym.id, user.id, subject, content) : Promise.reject(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      setComposerOpen(false);
    },
  });

  // Filter messages by search
  const filteredInbox = useMemo(() => {
    if (!searchQuery) return inboxMessages;
    const query = searchQuery.toLowerCase();
    return inboxMessages.filter(
      (m) =>
        m.subject.toLowerCase().includes(query) ||
        m.content.toLowerCase().includes(query) ||
        m.sender?.full_name?.toLowerCase().includes(query)
    );
  }, [inboxMessages, searchQuery]);

  const filteredSent = useMemo(() => {
    if (!searchQuery) return sentMessages;
    const query = searchQuery.toLowerCase();
    return sentMessages.filter(
      (m) =>
        m.subject.toLowerCase().includes(query) ||
        m.content.toLowerCase().includes(query) ||
        m.recipient?.full_name?.toLowerCase().includes(query)
    );
  }, [sentMessages, searchQuery]);

  const unreadCount = useMemo(() => {
    return inboxMessages.filter((m) => !m.is_read).length;
  }, [inboxMessages]);

  const handleSelectMessage = async (message: MessageWithSender) => {
    setSelectedMessage(message);
    if (!message.is_read && activeTab === "inbox") {
      await markReadMutation.mutateAsync(message.id);
    }
  };

  const handleReply = (message: MessageWithSender) => {
    setReplyTo(message);
    setComposerOpen(true);
  };

  const formatMessageDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return format(date, "HH:mm");
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMM d", { locale });
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!gym || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] p-6">
      <div className="flex flex-col h-full gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Inbox</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0
                ? `${unreadCount} unread message${unreadCount > 1 ? "s" : ""}`
                : "All messages read"}
            </p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark all read
              </Button>
            )}
            <Button onClick={() => { setReplyTo(null); setComposerOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              New Message
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 grid lg:grid-cols-3 gap-6 min-h-0">
          {/* Message List */}
          <Card className="backdrop-blur-md bg-card/80 lg:col-span-1 flex flex-col">
            <CardHeader className="pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <div className="px-4">
                <TabsList className="w-full">
                  <TabsTrigger value="inbox" className="flex-1">
                    <Mail className="h-4 w-4 mr-2" />
                    Inbox
                    {unreadCount > 0 && (
                      <Badge className="ml-2 bg-primary">{unreadCount}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="sent" className="flex-1">
                    <Send className="h-4 w-4 mr-2" />
                    Sent
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="inbox" className="flex-1 m-0">
                <ScrollArea className="h-[calc(100vh-24rem)]">
                  <div className="px-4 pb-4 space-y-2">
                    {inboxLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : filteredInbox.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No messages
                      </p>
                    ) : (
                      filteredInbox.map((message) => (
                        <MessageListItem
                          key={message.id}
                          message={message}
                          isSelected={selectedMessage?.id === message.id}
                          onClick={() => handleSelectMessage(message)}
                          formatDate={formatMessageDate}
                          getInitials={getInitials}
                          showSender
                        />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="sent" className="flex-1 m-0">
                <ScrollArea className="h-[calc(100vh-24rem)]">
                  <div className="px-4 pb-4 space-y-2">
                    {sentLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : filteredSent.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No sent messages
                      </p>
                    ) : (
                      filteredSent.map((message) => (
                        <MessageListItem
                          key={message.id}
                          message={message}
                          isSelected={selectedMessage?.id === message.id}
                          onClick={() => setSelectedMessage(message)}
                          formatDate={formatMessageDate}
                          getInitials={getInitials}
                          showSender={false}
                        />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </Card>

          {/* Message Detail */}
          <Card className="backdrop-blur-md bg-card/80 lg:col-span-2 flex flex-col">
            {selectedMessage ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={() => setSelectedMessage(null)}
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {selectedMessage.is_broadcast ? (
                            <Megaphone className="h-5 w-5" />
                          ) : (
                            getInitials(
                              activeTab === "inbox"
                                ? selectedMessage.sender?.full_name
                                : selectedMessage.recipient?.full_name
                            )
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{selectedMessage.subject}</h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedMessage.is_broadcast ? (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              Team Broadcast
                            </span>
                          ) : activeTab === "inbox" ? (
                            `From: ${selectedMessage.sender?.full_name || selectedMessage.sender?.email}`
                          ) : (
                            `To: ${selectedMessage.recipient?.full_name || selectedMessage.recipient?.email || "Team"}`
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {format(parseISO(selectedMessage.created_at), "MMMM d, yyyy, HH:mm", {
                          locale,
                        })}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(selectedMessage.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-6 overflow-auto">
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                    {selectedMessage.content}
                  </div>
                </CardContent>
                {activeTab === "inbox" && !selectedMessage.is_broadcast && (
                  <div className="p-4 border-t">
                    <Button onClick={() => handleReply(selectedMessage)}>
                      <Send className="h-4 w-4 mr-2" />
                      Reply
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MailOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No message selected</h3>
                  <p className="text-muted-foreground">
                    Select a message from the list
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Message Composer */}
      <MessageComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        staff={staff}
        replyTo={replyTo}
        onSend={async (data) => {
          if (data.isBroadcast) {
            await broadcastMutation.mutateAsync({
              subject: data.subject,
              content: data.content,
            });
          } else if (gym && user) {
            await sendMutation.mutateAsync({
              gym_id: gym.id,
              sender_id: user.id,
              recipient_id: data.recipientId,
              subject: data.subject,
              content: data.content,
              is_broadcast: false,
            });
          }
        }}
        loading={sendMutation.isPending || broadcastMutation.isPending}
      />
    </div>
  );
}

// Message List Item Component
function MessageListItem({
  message,
  isSelected,
  onClick,
  formatDate,
  getInitials,
  showSender,
}: {
  message: MessageWithSender;
  isSelected: boolean;
  onClick: () => void;
  formatDate: (date: string) => string;
  getInitials: (name: string | null | undefined) => string;
  showSender: boolean;
}) {
  const person = showSender ? message.sender : message.recipient;

  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg cursor-pointer transition-colors ${
        isSelected
          ? "bg-primary/10 border border-primary/30"
          : message.is_read || !showSender
          ? "hover:bg-muted/50"
          : "bg-muted/30 hover:bg-muted/50"
      }`}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-9 w-9 flex-shrink-0">
          <AvatarFallback className={`text-xs ${!message.is_read && showSender ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
            {message.is_broadcast ? (
              <Megaphone className="h-4 w-4" />
            ) : (
              getInitials(person?.full_name)
            )}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-sm truncate ${!message.is_read && showSender ? "font-semibold" : ""}`}>
              {message.is_broadcast
                ? "Team Broadcast"
                : person?.full_name || person?.email || "Unknown"}
            </span>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {formatDate(message.created_at)}
            </span>
          </div>
          <p className={`text-sm truncate ${!message.is_read && showSender ? "font-medium" : "text-muted-foreground"}`}>
            {message.subject}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {message.content.slice(0, 50)}...
          </p>
        </div>
        {!message.is_read && showSender && (
          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
        )}
      </div>
    </div>
  );
}
