import React, { useState, useEffect, useRef } from "react";
import api from "../api/axios";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface User {
  id: string;
  username: string;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  images: string[];
  designId?: string;
  stage?: "initial_sketch" | "revision_1" | "revision_2" | "revision_3" | "final_draft" | "final_design";
  createdAt: string;
  isRead: boolean;
  sender: User;
  receiver: User;
}

interface Design {
  id: string;
  designerId: string;
  shopId: string;
  postId: string;
  commentId: string;
  stage: "initial_sketch" | "revision_1" | "revision_2" | "revision_3" | "final_draft" | "final_design";
  images: string[];
  status: "pending" | "purchased";
  price: number;
  createdAt: string;
  updatedAt: string;
  designer: User;
  shop: User;
  Post: { id: string; title: string };
  comment: { id: string; content: string };
}

interface MessagingPageProps {
  messages: string[];
}

const MessagingPage: React.FC<MessagingPageProps> = ({ messages: initialMessages }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [selectedDesign, setSelectedDesign] = useState<string>("");
  const [selectedStage, setSelectedStage] = useState<string>("");
  const [error, setError] = useState("");
  const token = localStorage.getItem("authToken");
  const decoded = token ? JSON.parse(atob(token.split(".")[1])) : {};
  const userId = decoded.id || "";
  const userType = decoded.userType || "fan";
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get("/api/messages/users");
        setUsers(response.data.users || []);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load users");
        console.error("❌ Fetch Users Error:", err.response?.data || err.message);
      }
    };

    const fetchMessages = async () => {
      try {
        const inboxResponse = await api.get("/api/messages/inbox");
        const sentResponse = await api.get("/api/messages/sent");
        const allMessages = [...inboxResponse.data.messages, ...sentResponse.data.messages].sort(
          (a: Message, b: Message) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setMessages(allMessages);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load messages");
        console.error("❌ Fetch Messages Error:", err.response?.data || err.message);
      }
    };

    if (token) {
      fetchUsers();
      fetchMessages();
    }
  }, [token]);

  // Sync initialMessages from App.tsx
  useEffect(() => {
    const parsedMessages = initialMessages.map((msg) => JSON.parse(msg) as Message);
    setMessages((prev) => {
      const combined = [...prev, ...parsedMessages].filter(
        (msg, index, self) => index === self.findIndex((m) => m.id === msg.id)
      );
      return combined.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    });
  }, [initialMessages]);

  useEffect(() => {
    const fetchDesigns = async () => {
      if (!selectedUser) return;
      try {
        const response = await api.get(
          `/api/designs/conversation/${userType === "designer" ? userId : selectedUser.id}/${userType === "shop" ? userId : selectedUser.id}`
        );
        setDesigns(response.data.designs || []);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load designs for conversation");
        console.error("❌ Fetch Designs Error:", err.response?.data || err.message);
      }
    };

    fetchDesigns();
  }, [selectedUser, userId, userType]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const conversations = users
    .map((user) => {
      const userMessages = messages.filter(
        (msg) => (msg.senderId === user.id && msg.receiverId === userId) || (msg.senderId === userId && msg.receiverId === user.id)
      );
      const lastMessage = userMessages[userMessages.length - 1];
      return { user, lastMessage };
    })
    .filter((conv) => conv.lastMessage)
    .sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());

  useEffect(() => {
    if (conversations.length > 0 && !selectedUser) {
      setSelectedUser(conversations[0].user);
    }
  }, [conversations, selectedUser]);

  const handleSendMessage = async () => {
    if (!selectedUser || (!newMessage && images.length === 0)) return;

    try {
      const formData = new FormData();
      formData.append("receiverId", selectedUser.id);
      formData.append("content", newMessage);
      if (selectedDesign) formData.append("designId", selectedDesign);
      if (selectedStage) formData.append("stage", selectedStage);
      images.forEach((image) => formData.append("images", image));

      const response = await api.post("/api/messages/send", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMessages((prev) =>
        [...prev, response.data.data].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      );
      setNewMessage("");
      setImages([]);
      setSelectedDesign("");
      setSelectedStage("");
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send message");
      console.error("❌ Send Message Error:", err.response?.data || err.message);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await api.post("/api/messages/mark-read", { messageId });
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, isRead: true } : msg))
      );
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to mark message as read");
      console.error("❌ Mark Read Error:", err.response?.data || err.message);
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.style.display = "none";
    console.log(`Failed to load image: ${e.currentTarget.src}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen pt-20 pb-8 px-4 bg-dark-black text-light-white"
    >
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
        {/* Main Messaging Section */}
        <div className="lg:w-2/3 bg-dark-gray p-6 rounded-sm shadow-sm border border-accent-gray">
          <h1 className="text-3xl font-semibold text-light-white mb-6">Messages</h1>
          {error && <p className="text-red-500 mb-6">{error}</p>}
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            {/* Conversations List */}
            <div className="w-full sm:w-1/3">
              <h2 className="text-xl font-medium text-text-gray mb-4">Conversations</h2>
              {conversations.length > 0 ? (
                <ul className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {conversations.map(({ user, lastMessage }) => (
                    <li
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={`p-2 rounded-sm border border-accent-gray cursor-pointer transition duration-200 ${
                        selectedUser?.id === user.id ? "bg-dark-black" : "bg-dark-gray hover:bg-dark-black"
                      }`}
                    >
                      <p className="font-semibold text-light-white">{user.username}</p>
                      <p className="text-text-gray text-sm truncate">{lastMessage.content}</p>
                      <p className="text-text-gray text-xs">
                        {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true })}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-text-gray">No conversations yet.</p>
              )}
            </div>

            {/* Chat Area */}
            <div className="w-full sm:w-2/3 flex flex-col">
              {selectedUser ? (
                <>
                  <h2 className="text-xl font-medium text-text-gray mb-4">
                    Chat with {selectedUser.username}
                  </h2>

                  {/* Messages */}
                  <div className="flex-1 max-h-[50vh] overflow-y-auto mb-4 p-4 bg-dark-black rounded-sm border border-accent-gray">
                    {messages
                      .filter(
                        (msg) =>
                          (msg.senderId === userId && msg.receiverId === selectedUser.id) ||
                          (msg.senderId === selectedUser.id && msg.receiverId === userId)
                      )
                      .map((msg) => (
                        <div
                          key={msg.id}
                          className={`mb-4 ${msg.senderId === userId ? "text-right" : "text-left"}`}
                        >
                          <div
                            className={`inline-block p-2 rounded-sm max-w-[75%] ${
                              msg.senderId === userId ? "bg-accent-gray" : "bg-dark-gray"
                            }`}
                          >
                            <p className="text-light-white">{msg.content}</p>
                            {msg.stage && (
                              <span className="block text-sm italic text-text-gray">
                                Stage Update: {msg.stage.replace("_", " ").toUpperCase()}
                              </span>
                            )}
                            {msg.images.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {msg.images.map((image, index) => (
                                  <img
                                    key={index}
                                    src={`http://localhost:3000/uploads/${image}`}
                                    alt={`Message ${index + 1}`}
                                    className="w-24 h-24 object-cover rounded-sm"
                                    onError={handleImageError}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                          <p className="text-text-gray text-xs mt-1">
                            {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                          </p>
                          {msg.senderId !== userId && !msg.isRead && (
                            <button
                              onClick={() => handleMarkAsRead(msg.id)}
                              className="text-accent-red hover:underline text-sm"
                            >
                              Mark as Read
                            </button>
                          )}
                        </div>
                      ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="flex flex-col space-y-2">
                    {userType === "designer" && designs.length > 0 && (
                      <div className="flex space-x-2">
                        <select
                          value={selectedDesign}
                          onChange={(e) => setSelectedDesign(e.target.value)}
                          className="p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200 text-sm"
                        >
                          <option value="">Select Design (Optional)</option>
                          {designs.map((design) => (
                            <option key={design.id} value={design.id}>
                              {design.Post.title}
                            </option>
                          ))}
                        </select>
                        {selectedDesign && (
                          <select
                            value={selectedStage}
                            onChange={(e) => setSelectedStage(e.target.value)}
                            className="p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200 text-sm"
                          >
                            <option value="">Select Stage (Optional)</option>
                            <option value="initial_sketch">Initial Sketch</option>
                            <option value="revision_1">Revision 1</option>
                            <option value="revision_2">Revision 2</option>
                            <option value="revision_3">Revision 3</option>
                            <option value="final_draft">Final Draft</option>
                            <option value="final_design">Final Design</option>
                          </select>
                        )}
                      </div>
                    )}
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200 w-full"
                    />
                    <label
                      htmlFor="image-upload"
                      className="inline-block p-2 bg-dark-black border border-accent-gray rounded-sm cursor-pointer hover:bg-accent-gray transition duration-200"
                      title="Upload Images"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-light-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 9a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </label>
                    <input
                      id="image-upload"
                      type="file"
                      multiple
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={(e) => {
                        if (e.target.files) {
                          setImages(Array.from(e.target.files).slice(0, 5));
                        }
                      }}
                      className="hidden"
                    />
                    <button
                      onClick={handleSendMessage}
                      className="bg-accent-red text-light-white px-4 py-2 rounded-sm hover:bg-red-700 transition duration-200 font-semibold"
                    >
                      Send
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-text-gray">No conversations available.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Section: Design Sketches and Stages */}
        {selectedUser && (
          <div className="lg:w-1/3 bg-dark-gray p-6 rounded-sm shadow-sm border border-accent-gray">
            <h2 className="text-2xl font-semibold text-light-white mb-4">Design Sketches</h2>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              {designs.length > 0 ? (
                designs.map((design) => (
                  <motion.div
                    key={design.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="border border-accent-gray p-2 rounded-sm"
                  >
                    <p className="text-light-white">Design: {design.Post.title}</p>
                    <p className="text-text-gray text-sm">
                      Stage: {design.stage.replace("_", " ").toUpperCase()}
                    </p>
                    <p className="text-text-gray text-sm">Price: ${design.price.toFixed(2)}</p>
                    {design.images.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {design.images.map((image, index) => (
                          <img
                            key={index}
                            src={`http://localhost:3000/uploads/${image}`}
                            alt={`Design ${index + 1}`}
                            className="w-24 h-24 object-cover rounded-sm"
                            onError={handleImageError}
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))
              ) : (
                <p className="text-text-gray">No designs available for this conversation.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MessagingPage;