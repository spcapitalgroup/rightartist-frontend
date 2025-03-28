import React, { useState, useEffect } from "react";
import api from "../api/axios"; // Updated to use the custom axios instance
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const NotificationsPage: React.FC = () => {
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState("");
  const token = localStorage.getItem("authToken");

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (!token) {
          setError("Please log in to view notifications");
          return;
        }

        const response = await api.get("/api/notifications");
        if (response.data.success) {
          setAllNotifications(response.data.notifications || []);
        } else {
          setError("Failed to load notifications");
        }
      } catch (err: any) {
        console.error("❌ Failed to fetch notifications:", err.response?.data || err.message);
        setError(err.response?.data?.message || "Failed to load notifications");
      }
    };
    fetchNotifications();
  }, [token]);

  const markAsRead = async () => {
    try {
      const response = await api.put("/api/notifications/mark-read", {});
      if (response.data.success) {
        setAllNotifications(allNotifications.map(n => ({ ...n, isRead: true })));
      } else {
        setError(response.data.message || "Failed to mark notifications as read");
      }
    } catch (err: any) {
      console.error("❌ Failed to mark notifications as read:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to mark notifications as read");
    }
  };

  const clearAll = () => {
    setAllNotifications([]);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen pt-20 pb-8 px-4 bg-dark-black text-light-white"
    >
      <div className="max-w-4xl mx-auto">
        <div className="bg-dark-gray p-6 rounded-sm shadow-sm border border-accent-gray">
          <h1 className="text-3xl font-semibold text-light-white mb-6">Notifications</h1>
          {error && <p className="text-red-500 mb-6">{error}</p>}
          {allNotifications.length > 0 ? (
            <div className="space-y-4">
              <div className="flex justify-end space-x-2">
                <button
                  onClick={markAsRead}
                  className="bg-accent-gray text-light-white px-4 py-2 rounded-sm hover:bg-gray-600 transition duration-200 font-semibold"
                >
                  Mark All as Read
                </button>
                <button
                  onClick={clearAll}
                  className="bg-accent-red text-light-white px-4 py-2 rounded-sm hover:bg-red-700 transition duration-200 font-semibold"
                >
                  Clear All
                </button>
              </div>
              <ul className="space-y-4">
                {allNotifications.map((notif) => (
                  <li
                    key={notif.id}
                    className={`p-4 bg-dark-black rounded-sm border border-accent-gray ${
                      notif.isRead ? "text-text-gray" : "text-light-white"
                    }`}
                  >
                    <p>{notif.message}</p>
                    <p className="text-text-gray text-sm mt-1">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-text-gray">No notifications yet.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default NotificationsPage;