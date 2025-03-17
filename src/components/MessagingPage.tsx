import React, { useState, useEffect, useCallback, useRef, memo } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  sender?: { username: string };
}

interface User {
  id: string;
  username: string;
}

interface MessagingPageProps {
  messages: string[];
}

const MessagingPage: React.FC<MessagingPageProps> = memo(({ messages }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("selectedUser");
    return saved ? JSON.parse(saved) : null;
  });
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");
  const userId = token ? JSON.parse(atob(token.split(".")[1])).id : "";
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const isSendingRef = useRef(false);

  useEffect(() => {
    console.log("🔍 MessagingPage rendered for user:", userId, "Selected:", selectedUser?.id);
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/messages/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(response.data.users.filter((u: User) => u.id !== userId));
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load users");
      }
    };
    fetchUsers();
  }, [token, userId, selectedUser?.id]);

  useEffect(() => {
    if (selectedUser) {
      localStorage.setItem("selectedUser", JSON.stringify(selectedUser));
    }
  }, [selectedUser]);

  const fetchInbox = useCallback(async () => {
    if (!selectedUser) return;
    try {
      const inboxResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/messages/inbox`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sentResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/messages/sent`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allMessages = [...inboxResponse.data.messages, ...sentResponse.data.messages].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setChatMessages(allMessages);
      console.log("🔍 Fetched messages for:", userId, "Count:", allMessages.length);
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load messages");
    }
  }, [token, selectedUser, userId]);

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  useEffect(() => {
    if (messages.length > 0) {
      const latest = messages[messages.length - 1];
      try {
        const latestMessage = JSON.parse(latest);
        if (latestMessage.type === "message" && latestMessage.message) {
          setChatMessages((prev) => {
            const exists = prev.some((msg) => msg.id === latestMessage.message.id);
            if (exists) {
              return prev.map((msg) =>
                msg.id === latestMessage.message.id ? latestMessage.message : msg
              );
            }
            const updated = [...prev, latestMessage.message].sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
            return updated;
          });
          console.log("🔍 WebSocket updated messages for:", userId, "New message:", latestMessage.message);
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
          }
        }
      } catch (err: unknown) {
        console.error("❌ Failed to parse WebSocket message:", err instanceof Error ? err.message : "Unknown error", "Raw:", latest);
      }
    }
  }, [messages, userId]);

  const markAsRead = useCallback(
    async (messageId: string) => {
      try {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/api/messages/mark-read`,
          { messageId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setChatMessages((prev) =>
          prev.map((msg) => (msg.id === messageId ? { ...msg, isRead: true } : msg))
        );
        console.log("✅ Marked message as read:", messageId);
      } catch (err: any) {
        console.error("❌ Mark as Read Error:", err.response?.data?.message || "Failed to mark as read");
      }
    },
    [token]
  );

  useEffect(() => {
    if (selectedUser) {
      chatMessages.forEach((msg) => {
        if (msg.senderId === selectedUser.id && !msg.isRead && msg.receiverId === userId) {
          markAsRead(msg.id);
        }
      });
    }
  }, [chatMessages, selectedUser, userId, markAsRead]);

  const handleSendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedUser || !newMessage.trim() || isSendingRef.current) return;

      isSendingRef.current = true;
      console.log("🔍 Before send - selectedUser:", selectedUser);
      try {
        console.log("🔍 Sending message to:", selectedUser.id);
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/messages/send`,
          { receiverId: selectedUser.id, content: newMessage },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setChatMessages((prev) => {
          const exists = prev.some((msg) => msg.id === response.data.data.id);
          if (exists) return prev;
          const updated = [...prev, response.data.data].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          return updated;
        });
        setNewMessage("");
        setError("");
        console.log("🔍 After send - selectedUser:", selectedUser);
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to send message");
        console.log("🔍 After error - selectedUser:", selectedUser);
      } finally {
        isSendingRef.current = false;
        if (window.location.pathname !== "/messages") {
          navigate("/messages", { replace: true });
        }
      }
    },
    [selectedUser, newMessage, token, navigate]
  );

  const filteredMessages = selectedUser
    ? chatMessages.filter(
        (msg) =>
          (msg.senderId === userId && msg.receiverId === selectedUser.id) ||
          (msg.senderId === selectedUser.id && msg.receiverId === userId)
      )
    : [];

  const hasUnreadMessages = useCallback(
    (user: User) =>
      chatMessages.some((msg) => msg.senderId === user.id && msg.receiverId === userId && !msg.isRead),
    [chatMessages, userId]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pt-20 pb-8 px-4 bg-tattoo-black flex"
    >
      <div className="w-1/4 bg-tattoo-gray/10 p-4 rounded-lg shadow-lg border border-tattoo-red/30">
        <h2 className="text-2xl font-bold text-tattoo-red mb-4">Contacts</h2>
        {error && <p className="text-tattoo-red text-sm mb-2">{error}</p>}
        <div className="space-y-2 max-h-[calc(100vh-12rem)] overflow-y-auto">
          {users.map((user) => (
            <motion.div
              key={user.id}
              whileHover={{ scale: 1.02 }}
              className={`p-2 rounded cursor-pointer ${
                selectedUser?.id === user.id
                  ? "bg-tattoo-red/50"
                  : hasUnreadMessages(user)
                  ? "bg-tattoo-gray/40 font-bold text-tattoo-red"
                  : "hover:bg-tattoo-gray/20"
              }`}
              onClick={() => setSelectedUser(user)}
            >
              <p className="text-tattoo-light">{user.username}</p>
            </motion.div>
          ))}
        </div>
      </div>
      <div className="w-3/4 bg-tattoo-gray/20 p-6 rounded-lg shadow-lg border border-tattoo-red/30 ml-4 flex flex-col">
        <h1 className="text-3xl font-bold text-tattoo-red mb-4">
          {selectedUser ? `Chat with ${selectedUser.username}` : "Messages"}
        </h1>
        {selectedUser ? (
          <>
            <div className="flex-1 max-h-[calc(100vh-16rem)] overflow-y-auto space-y-4">
              {filteredMessages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-lg ${
                    msg.senderId === userId ? "bg-tattoo-red/50 ml-auto" : "bg-tattoo-black"
                  } max-w-xs`}
                >
                  <p className="text-tattoo-light">{msg.content}</p>
                  <p className="text-tattoo-gray text-xs mt-1">
                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                  </p>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="mt-4 flex">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 p-2 bg-tattoo-black border border-tattoo-gray rounded-l-lg text-tattoo-light focus:outline-none focus:ring-2 focus:ring-tattoo-red"
              />
              <button
                type="submit"
                disabled={isSendingRef.current}
                className="p-2 bg-tattoo-red text-tattoo-light rounded-r-lg hover:bg-tattoo-red/80 transition duration-200"
              >
                Send
              </button>
            </form>
          </>
        ) : (
          <p className="text-tattoo-gray">Select a contact to start chatting.</p>
        )}
      </div>
    </motion.div>
  );
});

export default MessagingPage;