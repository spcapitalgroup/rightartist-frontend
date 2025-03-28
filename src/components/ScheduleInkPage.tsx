import React, { useState, useEffect } from "react";
import api from "../api/axios";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface Post {
  id: string;
  title: string;
  shopId?: string | null;
  shop?: { id: string; username: string; depositSettings?: { required: boolean; amount: number } };
}

const ScheduleInkPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [icsContent, setIcsContent] = useState<string | null>(null);
  const [isScheduled, setIsScheduled] = useState(false);
  const token = localStorage.getItem("authToken");

  useEffect(() => {
    const fetchPost = async () => {
      try {
        if (!token) {
          setError("Please log in to schedule an ink");
          return;
        }

        const response = await api.get("/api/feed/", {
          params: { postId: id },
        });
        console.log("🔍 Post Response:", response.data);

        const posts = response.data.posts || [];
        if (posts.length === 0) {
          setError("Post not found");
          return;
        }

        setPost(posts[0]);
      } catch (err: any) {
        console.error("❌ Post Fetch Error:", err.response?.data || err.message);
        setError(err.response?.data?.message || "Failed to load post");
      }
    };
    fetchPost();
  }, [id, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledDate || !phone || !email) {
      setError("Please fill in all fields");
      return;
    }

    try {
      const data = {
        scheduledDate: scheduledDate.toISOString(),
        contactInfo: { phone, email },
      };

      const response = await api.post(`/api/posts/${id}/schedule`, data, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log("✅ Schedule Response:", response.data);
      setIcsContent(response.data.icsContent.fan);
      setIsScheduled(true);
    } catch (err: any) {
      console.error("❌ Schedule Error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to schedule ink");
    }
  };

  const handleDownloadIcs = () => {
    if (!icsContent) return;
    const blob = new Blob([icsContent], { type: "text/calendar" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "event.ics");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (!post) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen pt-20 pb-8 px-4 bg-dark-black text-light-white"
      >
        <div className="max-w-md mx-auto text-red-500">{error || "Loading post..."}</div>
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
      <div className="max-w-md mx-auto">
        <motion.div
          className="bg-dark-gray p-6 rounded-sm shadow-lg border border-accent-gray"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <h1 className="text-3xl font-semibold text-light-white mb-6 tracking-wide">
            Schedule an Ink: {post.title}
          </h1>
          {error && <p className="text-red-500 mb-6">{error}</p>}
          {isScheduled ? (
            <div className="space-y-4">
              <motion.p
                className="text-light-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Your ink has been scheduled successfully!
              </motion.p>
              <div className="flex space-x-2">
                <motion.button
                  onClick={handleDownloadIcs}
                  className="bg-accent-red text-light-white px-4 py-2 rounded-sm font-semibold hover:bg-red-700 transition duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  Download .ics File
                </motion.button>
                <motion.button
                  onClick={() => navigate("/booking-feed")}
                  className="bg-accent-gray text-light-white px-4 py-2 rounded-sm hover:bg-gray-600 transition duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  Back to Booking Feed
                </motion.button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-text-gray mb-1">Date and Time</label>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <DatePicker
                    selected={scheduledDate}
                    onChange={(date: Date | null) => setScheduledDate(date)}
                    showTimeSelect
                    dateFormat="Pp"
                    className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                    placeholderText="Select date and time"
                    required
                  />
                </motion.div>
              </div>
              <div>
                <label className="block text-text-gray mb-1">Phone Number</label>
                <motion.input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone Number"
                  className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                  required
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                />
              </div>
              <div>
                <label className="block text-text-gray mb-1">Email</label>
                <motion.input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                  required
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                />
              </div>
              <motion.div
                className="text-text-gray"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <p>
                  Deposit Required: {post.shop?.depositSettings?.amount || 0} (Payment processing will be added later)
                </p>
              </motion.div>
              <div className="flex justify-end space-x-2">
                <motion.button
                  type="button"
                  onClick={() => navigate(`/post/${id}`)}
                  className="px-4 py-2 bg-accent-gray text-light-white rounded-sm hover:bg-gray-600 transition duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  className="px-4 py-2 bg-accent-red text-light-white rounded-sm font-semibold hover:bg-red-700 transition duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  Schedule
                </motion.button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ScheduleInkPage;