// src/pages/shared/Chat.tsx
import { useParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send, File, Download, Paperclip, Loader2, AlertCircle } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_file: boolean;
  file_url?: string | null;
  mime_type?: string | null;
  file_name?: string | null;
  read_at?: string | null;
  created_at: string;
};

type UserProfile = {
  id: string;
  full_name: string;
  avatar_url?: string | null;
};

export default function Chat() {
  const { sellerId: otherUserId } = useParams<{ sellerId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [messageText, setMessageText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);

  if (!otherUserId || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-slate-400 bg-slate-950 p-6">
        <AlertCircle className="h-16 w-16 mb-4 text-yellow-400" />
        <h2 className="text-xl font-bold text-white">Invalid chat</h2>
      </div>
    );
  }

  // ── Load other user's profile ──
  const { data: directUser, isLoading: userLoading } = useQuery({
    queryKey: ["user-profile", otherUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("id", otherUserId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!otherUserId,
  });

  useEffect(() => {
    if (directUser) setOtherUser(directUser);
  }, [directUser]);

  // ── Fetch messages ──
  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["messages", otherUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!otherUserId,
  });

  // ── Mark unread messages as read (initial load) ──
  useEffect(() => {
    if (!messages.length) return;

    const unreadIds = messages
      .filter((m) => !m.read_at && m.receiver_id === user.id)
      .map((m) => m.id);

    if (!unreadIds.length) return;

    // Optimistic cache update
    queryClient.setQueryData<Message[]>(["messages", otherUserId], (old = []) =>
      old.map((m) => (unreadIds.includes(m.id) ? { ...m, read_at: new Date().toISOString() } : m))
    );

    // Async mark read
    void supabase.from("messages").update({ read_at: new Date().toISOString() }).in("id", unreadIds);
  }, [messages, otherUserId, user?.id, queryClient]);

  // ── Realtime subscription with auto-mark-read ──
  useEffect(() => {
    if (!user || !otherUserId) return;

    const channel = supabase
      .channel(`dm-${[user.id, otherUserId].sort().join("-")}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `or(
            and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),
            and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})
          )`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;

          // Add to cache if not exists
          queryClient.setQueryData<Message[]>(["messages", otherUserId], (old = []) => {
            if (old.some((m) => m.id === newMsg.id)) return old;
            return [...old, newMsg];
          });

          // If the message is from the other user, mark as read
          if (newMsg.receiver_id === user.id && !newMsg.read_at) {
            void supabase
              .from("messages")
              .update({ read_at: new Date().toISOString() })
              .eq("id", newMsg.id);

            // Update cache optimistically
            queryClient.setQueryData<Message[]>(["messages", otherUserId], (old = []) =>
              old.map((m) => (m.id === newMsg.id ? { ...m, read_at: new Date().toISOString() } : m))
            );
          }

          // Scroll to bottom
          bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, otherUserId, queryClient]);

  // ── File upload ──
  const uploadFile = async (file: File) => {
    setUploadingFile(true);
    try {
      const fileExt = file.name.split(".").pop() || "file";
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `chat-files/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("chat-files")
        .upload(filePath, file, { upsert: false, contentType: file.type });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("chat-files").getPublicUrl(filePath);
      return { url: data.publicUrl, mime_type: file.type, file_name: file.name };
    } finally {
      setUploadingFile(false);
    }
  };

  // ── Send message ──
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!messageText.trim() && !selectedFile) throw new Error("Cannot send empty message");

      let payload: any = {
        sender_id: user.id,
        receiver_id: otherUserId,
      };

      if (selectedFile) {
        const fileData = await uploadFile(selectedFile);
        payload = {
          ...payload,
          is_file: true,
          file_url: fileData.url,
          mime_type: fileData.mime_type,
          content: fileData.file_name || "File attached",
          file_name: fileData.file_name,
        };
        setSelectedFile(null);
      } else {
        payload = { ...payload, content: messageText.trim(), is_file: false };
      }

      const { error } = await supabase.from("messages").insert(payload);
      if (error) throw error;

      // Optimistic update
      const newMsg: Message = {
        id: "temp-" + Date.now(),
        sender_id: user.id,
        receiver_id: otherUserId,
        content: payload.content,
        is_file: payload.is_file,
        file_url: payload.file_url ?? null,
        file_name: payload.file_name ?? null,
        mime_type: payload.mime_type ?? null,
        read_at: null,
        created_at: new Date().toISOString(),
      };
      queryClient.setQueryData<Message[]>(["messages", otherUserId], (old = []) => [...old, newMsg]);
    },
    onSuccess: () => {
      setMessageText("");
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    },
    onError: (err: any) => {
      toast.error("Failed to send: " + (err.message || "Unknown error"));
    },
  });

  const handleSend = () => sendMessageMutation.mutate();

  if (userLoading || messagesLoading || !otherUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
        <Skeleton height={500} baseColor="#1e293b" highlightColor="#334155" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-4 flex flex-col max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-700">
        <Avatar className="h-12 w-12">
          <AvatarImage src={otherUser.avatar_url ?? undefined} />
          <AvatarFallback>{otherUser.full_name?.[0] || "?"}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-xl font-bold text-white">{otherUser.full_name}</h2>
          <p className="text-sm text-slate-400">Direct Message</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="text-center text-slate-500 mt-20">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>Start the conversation...</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user.id;
            const timestamp = new Date(msg.created_at).toLocaleString("en-ZA", {
              dateStyle: "medium",
              timeStyle: "short",
            });
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <div
                  className={cn(
                    "max-w-[80%] p-3 rounded-2xl break-words",
                    isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-slate-800 text-slate-100 rounded-bl-none"
                  )}
                >
                  {msg.is_file && msg.file_url ? (
                    <div className="space-y-2">
                      {msg.mime_type?.startsWith("image/") ? (
                        <img
                          src={msg.file_url}
                          alt={msg.file_name || "Image"}
                          className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(msg.file_url, "_blank")}
                        />
                      ) : (
                        <a
                          href={msg.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-2 bg-slate-700/50 rounded hover:bg-slate-700 transition-colors"
                        >
                          <File className="h-6 w-6 text-slate-300" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{msg.file_name || "Attached file"}</p>
                            <p className="text-xs text-slate-400">
                              {msg.mime_type?.split("/").pop()?.toUpperCase() || "File"}
                            </p>
                          </div>
                          <Download className="h-5 w-5 text-slate-300" />
                        </a>
                      )}
                      {msg.content && msg.content !== msg.file_name && (
                        <p className="text-sm opacity-90">{msg.content}</p>
                      )}
                    </div>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
                <span className="text-xs text-slate-500 mt-1 opacity-70">{timestamp}</span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 pt-4 border-t border-slate-700">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setSelectedFile(file);
          }}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingFile || sendMessageMutation.isPending}
        >
          {uploadingFile ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
        </Button>

        {selectedFile && (
          <div className="flex-1 flex items-center gap-2 text-sm text-slate-300 truncate pr-2">
            <File className="h-4 w-4" />
            <span className="truncate">{selectedFile.name}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-slate-400 hover:text-red-400"
              onClick={() => setSelectedFile(null)}
            >
              ×
            </Button>
          </div>
        )}

        <Input
          placeholder={selectedFile ? "Add message or send file..." : "Type a message..."}
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
          className="flex-1 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          disabled={sendMessageMutation.isPending || uploadingFile}
        />

        <Button
          onClick={handleSend}
          disabled={sendMessageMutation.isPending || uploadingFile || (!messageText.trim() && !selectedFile)}
          className="bg-blue-600 hover:bg-blue-700 min-w-[44px]"
        >
          {sendMessageMutation.isPending || uploadingFile ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5 rotate-[-30deg]" />
          )}
        </Button>
      </div>
    </div>
  );
}
