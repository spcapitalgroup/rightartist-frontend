import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
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
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/messages/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(response.data.users || []);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load users");
        console.error("❌ Fetch Users Error:", err.response?.data || err.message);
      }
    };

    const fetchMessages = async () => {
      try {
        const inboxResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/messages/inbox`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const sentResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/messages/sent`, {
          headers: { Authorization: `Bearer ${token}` },
        });
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

    // Set up WebSocket
    wsRef.current = new WebSocket("ws://localhost:3002");
    wsRef.current.onopen = () => {
      wsRef.current?.send(JSON.stringify({ userId }));
    };
    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("🔍 WebSocket message received for:", userId, "Data:", data);
        if (data.type === "message") {
          setMessages((prev) => [...prev, data.message].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          ));
        }
      } catch (error) {
        console.error("❌ WebSocket Message Error:", error);
      }
    };
    wsRef.current.onclose = () => {
      console.log("❌ WebSocket Disconnected for MessagingPage");
    };

    return () => {
      wsRef.current?.close();
    };
  }, [token, userId]);

  useEffect(() => {
    const fetchDesigns = async () => {
      if (!selectedUser) return;
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/designs/conversation/${
            userType === "designer" ? userId : selectedUser.id
          }/${userType === "shop" ? userId : selectedUser.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setDesigns(response.data.designs || []);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load designs for conversation");
        console.error("❌ Fetch Designs Error:", err.response?.data || err.message);
      }
    };

    fetchDesigns();
  }, [selectedUser, token, userId, userType]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Automatically select the first conversation when conversations are loaded
  const conversations = users.map((user) => {
    const userMessages = messages.filter(
      (msg) => (msg.senderId === user.id && msg.receiverId === userId) || (msg.senderId === userId && msg.receiverId === user.id)
    );
    const lastMessage = userMessages[userMessages.length - 1];
    return { user, lastMessage };
  }).filter((conv) => conv.lastMessage).sort(
    (a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
  );

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

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/messages/send`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setMessages((prev) => [...prev, response.data.data].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ));
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
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/messages/mark-read`,
        { messageId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, isRead: true } : msg))
      );
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to mark message as read");
      console.error("❌ Mark Read Error:", err.response?.data || err.message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pt-20 pb-8 px-4 bg-tattoo-black"
    >
      <div className="max-w-6xl mx-auto flex">
        {/* Conversations List */}
        <div className="w-1/3 bg-tattoo-gray/20 p-4 rounded-lg mr-4">
          <h2 className="text-2xl font-bold text-tattoo-red mb-4">Conversations</h2>
          {conversations.length > 0 ? (
            <ul className="space-y-2">
              {conversations.map(({ user, lastMessage }) => (
                <li
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`p-2 rounded-lg cursor-pointer ${
                    selectedUser?.id === user.id ? "bg-tattoo-red text-tattoo-light" : "bg-tattoo-gray text-tattoo-light hover:bg-tattoo-gray/80"
                  }`}
                >
                  <p className="font-bold">{user.username}</p>
                  <p className="text-sm truncate">{lastMessage.content}</p>
                  <p className="text-xs">{formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true })}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-tattoo-gray">No conversations yet.</p>
          )}
        </div>

        {/* Chat Area */}
        <div className="w-2/3 bg-tattoo-gray/20 p-4 rounded-lg">
          {selectedUser ? (
            <>
              <h2 className="text-2xl font-bold text-tattoo-red mb-4">Chat with {selectedUser.username}</h2>
              {error && <p className="text-tattoo-red mb-4">{error}</p>}

              {/* Designs Section */}
              {designs.length > 0 && (
                <div className="mb-4 p-4 bg-tattoo-black rounded-lg">
                  <h3 className="text-xl font-bold text-tattoo-light mb-2">Related Designs</h3>
                  <div className="space-y-4">
                    {designs.map((design) => (
                      <div key={design.id} className="border border-tattoo-red/30 p-2 rounded-lg">
                        <p className="text-tattoo-light">Design: {design.Post.title}</p>
                        <p className="text-tattoo-gray">Stage: {design.stage.replace("_", " ").toUpperCase()}</p>
                        <p className="text-tattoo-gray">Price: ${design.price.toFixed(2)}</p>
                        {design.images.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {design.images.map((image, index) => (
                              <img
                                key={index}
                                src={`http://localhost:3000/uploads/${image}`}
                                alt={`Design ${index + 1}`}
                                className="w-24 h-24 object-cover rounded-lg"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  console.log(`Failed to load image: ${image}`);
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="h-96 overflow-y-auto mb-4 p-4 bg-tattoo-black rounded-lg">
                {messages
                  .filter(
                    (msg) =>
                      (msg.senderId === userId && msg.receiverId === selectedUser.id) ||
                      (msg.senderId === selectedUser.id && msg.receiverId === userId)
                  )
                  .map((msg) => (
                    <div
                      key={msg.id}
                      className={`mb-4 ${
                        msg.senderId === userId ? "text-right" : "text-left"
                      }`}
                    >
                      <p className={`inline-block p-2 rounded-lg ${
                        msg.senderId === userId ? "bg-tattoo-red text-tattoo-light" : "bg-tattoo-gray text-tattoo-light"
                      }`}>
                        {msg.content}
                        {msg.stage && (
                          <span className="block text-sm italic">
                            Stage Update: {msg.stage.replace("_", " ").toUpperCase()}
                          </span>
                        )}
                      </p>
                      {msg.images.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {msg.images.map((image, index) => (
                            <img
                              key={index}
                              src={`http://localhost:3000/uploads/${image}`}
                              alt={`Message ${index + 1}`}
                              className="w-24 h-24 object-cover rounded-lg"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                console.log(`Failed to load image: ${image}`);
                              }}
                            />
                          ))}
                        </div>
                      )}
                      <p className="text-tattoo-gray text-sm mt-1">
                        {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                      </p>
                      {msg.senderId !== userId && !msg.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(msg.id)}
                          className="text-tattoo-red text-sm hover:underline"
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
                      className="p-2 bg-tattoo-black border border-tattoo-gray rounded-lg text-tattoo-light"
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
                        className="p-2 bg-tattoo-black border border-tattoo-gray rounded-lg text-tattoo-light"
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
                  className="p-2 bg-tattoo-black border border-tattoo-gray rounded-lg text-tattoo-light w-full"
                />
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={(e) => {
                    if (e.target.files) {
                      setImages(Array.from(e.target.files).slice(0, 5));
                    }
                  }}
                  className="text-tattoo-light"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-tattoo-red text-tattoo-light px-4 py-2 rounded-lg hover:bg-tattoo-red/80"
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <p className="text-tattoo-gray">No conversations available.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MessagingPage;