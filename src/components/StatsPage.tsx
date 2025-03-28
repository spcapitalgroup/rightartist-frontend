import React, { useState, useEffect } from "react";
import api from "../api/axios"; // Updated to use the custom axios instance
import { motion } from "framer-motion";

interface StatsData {
  totalEarnings: number;
  designsSold?: number; // For designers
  bookings?: number; // For shops
  trends: { monthly: string };
}

const StatsPage: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [error, setError] = useState("");
  const token = localStorage.getItem("authToken");
  const decoded = token ? JSON.parse(atob(token.split(".")[1])) : {};
  const userType = decoded.userType || "fan";

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (!token) {
          setError("Please log in to access stats");
          return;
        }

        if (userType !== "designer" && userType !== "shop") {
          setError("Stats are only available for designers and shop users");
          return;
        }

        const endpoint = userType === "designer" ? "designer" : "shop";
        const response = await api.get(`/api/stats/${endpoint}`);
        console.log(`🔍 Fetched ${userType} stats:`, response.data);
        setStats(response.data.data);
      } catch (err: any) {
        console.error("❌ Stats Fetch Error:", err.response?.data || err.message);
        setError(err.response?.data?.message || "Failed to load stats");
      }
    };
    fetchStats();
  }, [token, userType]);

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen pt-20 pb-8 px-4 bg-dark-black flex items-center justify-center"
      >
        <p className="text-red-500">{error}</p>
      </motion.div>
    );
  }

  if (!stats) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen pt-20 pb-8 px-4 bg-dark-black flex items-center justify-center"
      >
        <p className="text-light-white">Loading...</p>
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
      <div className="max-w-4xl mx-auto">
        <div className="bg-dark-gray p-6 rounded-sm shadow-sm border border-accent-gray">
          <h1 className="text-3xl font-semibold text-light-white mb-6">Stats</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-dark-black rounded-sm border border-accent-gray">
              <h2 className="text-xl font-medium text-text-gray mb-2">Total Earnings</h2>
              <p className="text-light-white text-2xl">${stats.totalEarnings.toFixed(2)}</p>
            </div>
            {userType === "designer" && stats.designsSold !== undefined && (
              <div className="p-4 bg-dark-black rounded-sm border border-accent-gray">
                <h2 className="text-xl font-medium text-text-gray mb-2">Designs Sold</h2>
                <p className="text-light-white text-2xl">{stats.designsSold}</p>
              </div>
            )}
            {userType === "shop" && stats.bookings !== undefined && (
              <div className="p-4 bg-dark-black rounded-sm border border-accent-gray">
                <h2 className="text-xl font-medium text-text-gray mb-2">Bookings Handled</h2>
                <p className="text-light-white text-2xl">{stats.bookings}</p>
              </div>
            )}
            <div className="p-4 bg-dark-black rounded-sm border border-accent-gray">
              <h2 className="text-xl font-medium text-text-gray mb-2">Trends</h2>
              <p className="text-light-white text-2xl">Monthly: {stats.trends.monthly}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StatsPage;