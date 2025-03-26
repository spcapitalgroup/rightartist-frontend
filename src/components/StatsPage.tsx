import React, { useState, useEffect } from "react";
import axios from "axios";
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
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/stats/${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
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
        className="min-h-screen pt-20 pb-8 px-4 bg-tattoo-black flex items-center justify-center"
      >
        <p className="text-tattoo-red">{error}</p>
      </motion.div>
    );
  }

  if (!stats) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen pt-20 pb-8 px-4 bg-tattoo-black flex items-center justify-center"
      >
        <p className="text-tattoo-light">Loading...</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen pt-20 pb-8 px-4 bg-tattoo-black"
    >
      <div className="max-w-md mx-auto bg-tattoo-gray/20 p-6 rounded-lg shadow-lg border border-tattoo-red/30">
        <h1 className="text-3xl font-bold text-tattoo-red mb-6">Stats</h1>
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-tattoo-light">Total Earnings</h2>
            <p className="text-tattoo-gray">${stats.totalEarnings.toFixed(2)}</p>
          </div>
          {userType === "designer" && stats.designsSold !== undefined && (
            <div>
              <h2 className="text-xl font-bold text-tattoo-light">Designs Sold</h2>
              <p className="text-tattoo-gray">{stats.designsSold}</p>
            </div>
          )}
          {userType === "shop" && stats.bookings !== undefined && (
            <div>
              <h2 className="text-xl font-bold text-tattoo-light">Bookings Handled</h2>
              <p className="text-tattoo-gray">{stats.bookings}</p>
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold text-tattoo-light">Trends</h2>
            <p className="text-tattoo-gray">Monthly: {stats.trends.monthly}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StatsPage;