import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const StatsPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log("🔍 Fetching stats from:", `${process.env.REACT_APP_API_URL}/api/stats/designer`);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/stats/designer`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        console.log("✅ Stats Response:", response.data);
        setStats(response.data.data || { totalEarnings: 0, designsSold: 0, trends: { monthly: "No Data" } });
      } catch (err: any) {
        console.error("❌ Stats Fetch Error:", err.response?.data || err.message);
        setError(err.response?.data?.message || "Failed to load stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const chartData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May"],
    datasets: [
      {
        label: "Earnings",
        data: stats ? [stats.totalEarnings / 5, stats.totalEarnings / 4, stats.totalEarnings / 3, stats.totalEarnings / 2, stats.totalEarnings] : [0, 0, 0, 0, 0],
        borderColor: "#b91c1c",
        backgroundColor: "rgba(185, 28, 28, 0.2)",
        tension: 0.4,
      },
    ],
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pt-20 pb-8 px-4 bg-tattoo-black"
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-tattoo-red mb-6">Designer Stats</h1>
        {loading && <p className="text-tattoo-gray">Loading stats...</p>}
        {error && <p className="text-tattoo-red mb-4">{error}</p>}
        {!loading && !error && (
          stats ? (
            <div className="space-y-6">
              <div className="bg-tattoo-gray/20 p-6 rounded-lg shadow-lg border border-tattoo-red/30">
                <h2 className="text-xl font-bold text-tattoo-light">Total Earnings: ${stats.totalEarnings.toFixed(2)}</h2>
                <p className="text-tattoo-gray">Designs Sold: {stats.designsSold}</p>
                <p className="text-tattoo-gray">Trend: {stats.trends.monthly}</p>
              </div>
              <div className="bg-tattoo-gray/20 p-6 rounded-lg shadow-lg border border-tattoo-red/30">
                <Line data={chartData} options={{ responsive: true, scales: { y: { beginAtZero: true } } }} />
              </div>
            </div>
          ) : (
            <p className="text-tattoo-gray">No stats available yet.</p>
          )
        )}
      </div>
    </motion.div>
  );
};

export default StatsPage;