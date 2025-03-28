import React, { useState, useEffect } from "react";
import api from "../api/axios"; // Relative import without .ts extension
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

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
  designer: { id: string; username: string };
  shop: { id: string; username: string };
  Post: { id: string; title: string };
  comment: { id: string; content: string };
}

const DesignsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"pending" | "purchased" | "sold">("pending");
  const [pendingDesigns, setPendingDesigns] = useState<Design[]>([]);
  const [purchasedDesigns, setPurchasedDesigns] = useState<Design[]>([]);
  const [soldDesigns, setSoldDesigns] = useState<Design[]>([]);
  const [error, setError] = useState("");
  const [stageUpdate, setStageUpdate] = useState<{ [key: string]: { stage: string; images: File[] } }>({});
  const token = localStorage.getItem("authToken");
  const decoded = token ? JSON.parse(atob(token.split(".")[1])) : {};
  const userType = decoded.userType || "fan";
  const userId = decoded.id || "";
  const wsRef = React.useRef<WebSocket | null>(null);
  const reconnectAttempts = React.useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectInterval = 5000; // 5 seconds

  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        if (!token) {
          setError("Please log in to access designs");
          return;
        }

        // Fetch pending designs (for both shop and designer users)
        const pendingResponse = await api.get("/api/designs/pending");
        setPendingDesigns(pendingResponse.data.designs || []);

        // Fetch purchased designs (for shop users)
        if (userType === "shop") {
          const purchasedResponse = await api.get("/api/designs/purchased");
          setPurchasedDesigns(purchasedResponse.data.designs || []);
        }

        // Fetch sold designs (for designer users)
        if (userType === "designer") {
          const soldResponse = await api.get("/api/designs/sold");
          setSoldDesigns(soldResponse.data.designs || []);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load designs");
        console.error("❌ Fetch Designs Error:", err.response?.data || err.message);
      }
    };

    fetchDesigns();

    // Set up WebSocket with reconnection logic
    const connectWebSocket = () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        console.log("🔍 WebSocket already connected for:", userId);
        return;
      }

      wsRef.current = new WebSocket("ws://localhost:3002");
      console.log("🔌 Attempting WebSocket connection for:", userId);

      wsRef.current.onopen = () => {
        console.log("🔌 Connected to WebSocket for:", userId);
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          try {
            wsRef.current.send(JSON.stringify({ userId }));
            reconnectAttempts.current = 0; // Reset reconnection attempts on success
          } catch (err) {
            console.error("❌ Failed to send userId on WebSocket open:", err);
          }
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("🔍 WebSocket message received for:", userId, "Data:", data);
          if (data.type === "stage-update") {
            console.log("🔔 Received stage-update for design:", data.designId);
            fetchDesigns(); // Refetch designs to reflect the update
          }
        } catch (error) {
          console.error("❌ WebSocket Message Error:", error);
        }
      };

      wsRef.current.onclose = () => {
        console.log("❌ WebSocket Disconnected for DesignsPage:", userId);
        if (reconnectAttempts.current < maxReconnectAttempts) {
          console.log(`🔍 Reconnecting WebSocket, attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts}`);
          setTimeout(() => {
            reconnectAttempts.current += 1;
            connectWebSocket();
          }, reconnectInterval);
        } else {
          console.error("❌ Max reconnection attempts reached. WebSocket connection failed.");
          setError("Failed to connect to WebSocket after multiple attempts.");
        }
      };

      wsRef.current.onerror = (err) => {
        console.error("❌ WebSocket Error for:", userId, err);
      };
    };

    if (token && userId) {
      connectWebSocket();

      // Heartbeat to keep the connection alive
      const heartbeat = setInterval(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          try {
            wsRef.current.send(JSON.stringify({ type: "heartbeat", userId }));
            console.log("🏓 Sent heartbeat to WebSocket for:", userId);
          } catch (err) {
            console.error("❌ Failed to send heartbeat:", err);
          }
        } else {
          console.log("⚠️ WebSocket not open for:", userId, "State:", wsRef.current?.readyState, "—reconnecting...");
          connectWebSocket();
        }
      }, 30000); // Send heartbeat every 30 seconds

      // Handle window focus to reconnect if needed
      const handleFocus = () => {
        if (wsRef.current && wsRef.current.readyState !== WebSocket.OPEN) {
          console.log("🔍 Window focused—reconnecting WebSocket for:", userId);
          connectWebSocket();
        }
      };
      window.addEventListener("focus", handleFocus);

      return () => {
        console.log("🛑 Cleaning up WebSocket for DesignsPage");
        clearInterval(heartbeat);
        window.removeEventListener("focus", handleFocus);
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.close();
        }
      };
    }
  }, [token, userType, userId]);

  const handleStageUpdate = async (designId: string) => {
    try {
      const { stage, images } = stageUpdate[designId] || {};
      if (!stage) return;

      const formData = new FormData();
      formData.append("stage", stage);
      if (images && images.length > 0) {
        images.forEach((image) => formData.append("images", image));
      }

      const response = await api.put(`/api/designs/${designId}/stage`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setPendingDesigns((prev) =>
        prev.map((design) => (design.id === designId ? response.data.data : design))
      );
      setStageUpdate((prev) => ({ ...prev, [designId]: { stage: "", images: [] } }));
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update stage");
      console.error("❌ Update Stage Error:", err.response?.data || err.message);
    }
  };

  const handlePurchase = async (designId: string) => {
    try {
      const response = await api.post(`/api/designs/${designId}/purchase`, {});
      setPendingDesigns((prev) => prev.filter((design) => design.id !== designId));
      setPurchasedDesigns((prev) => [...prev, response.data.data]);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to purchase design");
      console.error("❌ Purchase Design Error:", err.response?.data || err.message);
    }
  };

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen pt-20 pb-8 px-4 bg-dark-black"
      >
        <div className="max-w-4xl mx-auto text-red-500">{error}</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen pt-20 pb-8 px-4 bg-dark-black text-light-white"
    >
      <div className="max-w-6xl mx-auto">
        <div className="bg-dark-gray p-6 rounded-sm shadow-sm border border-accent-gray">
          <h1 className="text-4xl font-bold text-light-white mb-6 tracking-wide">Design Gallery</h1>
          <div className="flex mb-6 space-x-2">
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-2 rounded-sm border border-accent-gray text-sm font-medium transition duration-300 ${
                activeTab === "pending"
                  ? "bg-accent-red text-light-white"
                  : "bg-dark-black text-light-white hover:bg-dark-gray"
              }`}
            >
              Pending
            </button>
            {userType === "shop" && (
              <button
                onClick={() => setActiveTab("purchased")}
                className={`px-4 py-2 rounded-sm border border-accent-gray text-sm font-medium transition duration-300 ${
                  activeTab === "purchased"
                    ? "bg-accent-red text-light-white"
                    : "bg-dark-black text-light-white hover:bg-dark-gray"
                }`}
            >
              Purchased
            </button>
            )}
            {userType === "designer" && (
              <button
                onClick={() => setActiveTab("sold")}
                className={`px-4 py-2 rounded-sm border border-accent-gray text-sm font-medium transition duration-300 ${
                  activeTab === "sold"
                    ? "bg-accent-red text-light-white"
                    : "bg-dark-black text-light-white hover:bg-dark-gray"
                }`}
            >
              Sold
            </button>
            )}
          </div>
          <div className="space-y-6">
            {activeTab === "pending" ? (
              pendingDesigns.length > 0 ? (
                pendingDesigns.map((design) => (
                  <motion.div
                    key={design.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="bg-dark-black p-6 rounded-sm shadow-lg border border-accent-gray hover:shadow-xl hover:border-accent-red transition-all duration-300"
                  >
                    <h2 className="text-2xl font-semibold text-light-white mb-2 hover:text-accent-red transition-colors duration-200">
                      {design.Post ? design.Post.title : "Untitled Post"}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-text-gray text-sm">
                          Designer: <span className="text-light-white">{design.designer.username}</span>
                        </p>
                        <p className="text-text-gray text-sm">
                          Shop: <span className="text-light-white">{design.shop.username}</span>
                        </p>
                        <p className="text-text-gray text-sm">
                          Price: <span className="text-light-white">${design.price.toFixed(2)}</span>
                        </p>
                        <p className="text-text-gray text-sm">
                          Stage: <span className="text-light-white">{design.stage.replace("_", " ").toUpperCase()}</span>
                        </p>
                        <p className="text-text-gray text-xs mt-1">
                          Created: {formatDistanceToNow(new Date(design.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      {design.images.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {design.images.map((image, index) => (
                            <motion.img
                              key={index}
                              src={`http://localhost:3000/uploads/${image}`}
                              alt={`Design ${index + 1}`}
                              className="w-full h-32 object-cover rounded-sm hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                console.log(`Failed to load image: ${image}`);
                              }}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.1, duration: 0.3 }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    {userType === "designer" && (
                      <div className="mt-4 flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
                        <select
                          value={stageUpdate[design.id]?.stage || ""}
                          onChange={(e) =>
                            setStageUpdate({
                              ...stageUpdate,
                              [design.id]: { ...stageUpdate[design.id], stage: e.target.value },
                            })
                          }
                          className="p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200 text-sm"
                        >
                          <option value="">Select Stage</option>
                          <option value="initial_sketch">Initial Sketch</option>
                          <option value="revision_1">Revision 1</option>
                          <option value="revision_2">Revision 2</option>
                          <option value="revision_3">Revision 3</option>
                          <option value="final_draft">Final Draft</option>
                          <option value="final_design">Final Design</option>
                        </select>
                        <input
                          type="file"
                          multiple
                          accept="image/jpeg,image/jpg,image/png"
                          onChange={(e) => {
                            if (e.target.files) {
                              setStageUpdate({
                                ...stageUpdate,
                                [design.id]: {
                                  ...stageUpdate[design.id],
                                  images: Array.from(e.target.files).slice(0, 5),
                                },
                              });
                            }
                          }}
                          className="text-light-white"
                        />
                        <motion.button
                          onClick={() => handleStageUpdate(design.id)}
                          className="bg-accent-red text-light-white px-4 py-2 rounded-sm font-semibold hover:bg-red-700 transition duration-300"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Update Stage
                        </motion.button>
                      </div>
                    )}
                    {userType === "shop" && design.stage === "final_design" && (
                      <motion.button
                        onClick={() => handlePurchase(design.id)}
                        className="mt-4 bg-accent-red text-light-white px-4 py-2 rounded-sm font-semibold hover:bg-red-700 transition duration-300"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Purchase Design
                      </motion.button>
                    )}
                  </motion.div>
                ))
              ) : (
                <p className="text-text-gray">No pending designs.</p>
              )
            ) : activeTab === "purchased" ? (
              purchasedDesigns.length > 0 ? (
                purchasedDesigns.map((design) => (
                  <motion.div
                    key={design.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="bg-dark-black p-6 rounded-sm shadow-lg border border-accent-gray hover:shadow-xl hover:border-accent-red transition-all duration-300"
                  >
                    <h2 className="text-2xl font-semibold text-light-white mb-2 hover:text-accent-red transition-colors duration-200">
                      {design.Post ? design.Post.title : "Untitled Post"}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-text-gray text-sm">
                          Designer: <span className="text-light-white">{design.designer.username}</span>
                        </p>
                        <p className="text-text-gray text-sm">
                          Price: <span className="text-light-white">${design.price.toFixed(2)}</span>
                        </p>
                        <p className="text-text-gray text-xs mt-1">
                          Purchased: {formatDistanceToNow(new Date(design.updatedAt), { addSuffix: true })}
                        </p>
                      </div>
                      {design.images.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {design.images.map((image, index) => (
                            <motion.img
                              key={index}
                              src={`http://localhost:3000/uploads/${image}`}
                              alt={`Design ${index + 1}`}
                              className="w-full h-32 object-cover rounded-sm hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                console.log(`Failed to load image: ${image}`);
                              }}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.1, duration: 0.3 }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-text-gray">No purchased designs.</p>
              )
            ) : activeTab === "sold" ? (
              soldDesigns.length > 0 ? (
                soldDesigns.map((design) => (
                  <motion.div
                    key={design.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="bg-dark-black p-6 rounded-sm shadow-lg border border-accent-gray hover:shadow-xl hover:border-accent-red transition-all duration-300"
                  >
                    <h2 className="text-2xl font-semibold text-light-white mb-2 hover:text-accent-red transition-colors duration-200">
                      {design.Post ? design.Post.title : "Untitled Post"}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-text-gray text-sm">
                          Shop: <span className="text-light-white">{design.shop.username}</span>
                        </p>
                        <p className="text-text-gray text-sm">
                          Price: <span className="text-light-white">${design.price.toFixed(2)}</span>
                        </p>
                        <p className="text-text-gray text-xs mt-1">
                          Sold: {formatDistanceToNow(new Date(design.updatedAt), { addSuffix: true })}
                        </p>
                      </div>
                      {design.images.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {design.images.map((image, index) => (
                            <motion.img
                              key={index}
                              src={`http://localhost:3000/uploads/${image}`}
                              alt={`Design ${index + 1}`}
                              className="w-full h-32 object-cover rounded-sm hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                console.log(`Failed to load image: ${image}`);
                              }}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.1, duration: 0.3 }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-text-gray">No sold designs.</p>
              )
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DesignsPage;