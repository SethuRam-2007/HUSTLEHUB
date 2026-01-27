import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Lock } from "lucide-react";
import { toast } from "sonner";
import ChatUpgrade from "./ChatUpgrade";
import { chatMessageVariants, ANIMATION_CONFIG } from "@/lib/animations";

interface Message {
  id: string;
  task_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

interface TaskMessagesProps {
  taskId: string;
  taskStatus?: string;
}

const FREE_MESSAGE_LIMIT = 10;

const TaskMessages = ({ taskId, taskStatus }: TaskMessagesProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [taskInfo, setTaskInfo] = useState<{
    chat_message_count: number;
    chat_upgraded: boolean;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("task_messages")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (data && !error) {
      setMessages(data);
    }
  };

  const fetchTaskInfo = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("chat_message_count, chat_upgraded")
      .eq("id", taskId)
      .single();

    if (data && !error) {
      setTaskInfo(data);
    }
  };

  useEffect(() => {
    fetchMessages();
    fetchTaskInfo();

    // Subscribe to new messages
    const channel = supabase
      .channel(`task-messages-${taskId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "task_messages",
          filter: `task_id=eq.${taskId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          setTaskInfo((prev) =>
            prev ? { ...prev, chat_message_count: prev.chat_message_count + 1 } : prev
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleUpgrade = () => {
    setTaskInfo((prev) => (prev ? { ...prev, chat_upgraded: true } : prev));
  };

  const canSendMessage = () => {
    if (!taskInfo) return false;
    if (taskInfo.chat_upgraded) return true;
    return taskInfo.chat_message_count < FREE_MESSAGE_LIMIT;
  };

  const isTaskCompleted = taskStatus === 'completed' || taskStatus === 'approved';

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !canSendMessage()) return;

    if (newMessage.length > 500) {
      toast.error("Message too long. Maximum 500 characters.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("task_messages").insert({
      task_id: taskId,
      sender_id: user.id,
      message: newMessage.trim(),
    });

    setLoading(false);

    if (error) {
      toast.error("Failed to send message");
      return;
    }

    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border rounded-lg bg-card">
      <div className="p-3 border-b">
        <h4 className="font-medium text-sm">Task Messages</h4>
      </div>

      {taskInfo && (
        <div className="p-3 border-b">
          <ChatUpgrade
            taskId={taskId}
            messageCount={taskInfo.chat_message_count}
            isUpgraded={taskInfo.chat_upgraded}
            onUpgrade={handleUpgrade}
          />
        </div>
      )}

      <div className="h-64 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No messages yet. Start the conversation!
          </p>
        ) : (
          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                variants={chatMessageVariants}
                initial="initial"
                animate="animate"
                layout
                className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-2 rounded-lg text-sm ${
                    msg.sender_id === user?.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p>{msg.message}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t">
        {isTaskCompleted ? (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
            <Lock className="h-4 w-4" />
            <span>Chat disabled - Task completed</span>
          </div>
        ) : !canSendMessage() ? (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
            <Lock className="h-4 w-4" />
            <span>Upgrade chat to send more messages</span>
          </div>
        ) : (
          <motion.div 
            className="flex gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: ANIMATION_CONFIG.chat.duration }}
          >
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              maxLength={500}
            />
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.08 }}
            >
              <Button size="icon" onClick={handleSend} disabled={loading || !newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TaskMessages;