import React, { useState, useEffect } from "react";
import axios from "axios";
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

        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
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
      const response = await axios.put(`${process.env.REACT_APP_API_URL}/api/notifications/mark-read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      className="min-h-screen pt-20 pb-8 px-4 bg-tattoo-black"
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-tattoo-red mb-6">Notifications</h1>
        {error && <p className="text-tattoo-red mb-4">{error}</p>}
        {allNotifications.length > 0 ? (
          <div className="space-y-4">
            <div className="flex justify-end space-x-2">
              <button
                onClick={markAsRead}
                className="bg-tattoo-gray text-tattoo-light px-4 py-2 rounded-lg hover:bg-tattoo-gray/80"
              >
                Mark All as Read
              </button>
              <button
                onClick={clearAll}
                className="bg-tattoo-red text-tattoo-light px-4 py-2 rounded-lg hover:bg-tattoo-red/80"
              >
                Clear All
              </button>
            </div>
            <ul className="space-y-2">
              {allNotifications.map((notif) => (
                <li
                  key={notif.id}
                  className={`p-4 bg-tattoo-gray/20 rounded-lg ${notif.isRead ? "text-tattoo-gray" : "text-tattoo-light"}`}
                >
                  {notif.message}
                  <p className="text-tattoo-gray text-sm mt-1">
                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-tattoo-gray">No notifications yet.</p>
        )}
      </div>
    </motion.div>
  );
};

export default NotificationsPage;