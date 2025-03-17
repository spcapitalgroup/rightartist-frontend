import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";

const AdminPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/stats/admin`, { // Fixed URL
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setStats(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load stats");
        console.error("❌ Admin Stats Fetch Error:", err.response?.data || err.message);
      }
    };
    fetchStats();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pt-20 pb-8 px-4 bg-tattoo-black"
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-tattoo-red mb-6">Admin Dashboard</h1>
        {error && <p className="text-tattoo-red mb-4">{error}</p>}
        {stats ? (
          <div className="bg-tattoo-gray/20 p-6 rounded-lg shadow-lg border border-tattoo-red/30">
            <h2 className="text-xl font-bold text-tattoo-light">Total Users: {stats.totalUsers}</h2>
            <p className="text-tattoo-gray mt-2">Total Posts: {stats.totalPosts}</p>
            <p className="text-tattoo-gray mt-2">Total Revenue: ${stats.totalRevenue.toFixed(2)}</p>
          </div>
        ) : (
          <p className="text-tattoo-gray">Loading...</p>
        )}
      </div>
    </motion.div>
  );
};

export default AdminPage;
export {};