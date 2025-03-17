import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";

const AdminPage: React.FC = () => {
  const [stats, setStats] = useState({ totalUsers: 0, totalPosts: 0, totalRevenue: 0 });
  const [inviteLink, setInviteLink] = useState("");
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load stats");
      }
    };
    fetchStats();
  }, [token]);

  const handleGenerateInvite = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/admin/invite`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInviteLink(response.data.inviteLink);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to generate invite");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pt-20 pb-8 px-4 bg-tattoo-black"
    >
      <div className="max-w-4xl mx-auto bg-tattoo-gray/20 p-6 rounded-lg shadow-lg border border-tattoo-red/30">
        <h1 className="text-3xl font-bold text-tattoo-red mb-6">Admin Dashboard</h1>
        {error && <p className="text-tattoo-red mb-4">{error}</p>}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-tattoo-light">Stats</h2>
            <p className="text-tattoo-gray">Total Users: {stats.totalUsers}</p>
            <p className="text-tattoo-gray">Total Posts: {stats.totalPosts}</p>
            <p className="text-tattoo-gray">Total Revenue: ${stats.totalRevenue.toFixed(2)}</p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-tattoo-light">Invite New User</h2>
            <button
              onClick={handleGenerateInvite}
              className="mt-2 p-3 bg-tattoo-red text-tattoo-light rounded-lg hover:bg-tattoo-red/80 transition duration-200 font-bold"
            >
              Generate Invite Link
            </button>
            {inviteLink && (
              <p className="text-tattoo-gray mt-2">
                Invite Link: <a href={inviteLink} className="text-tattoo-red underline">{inviteLink}</a>
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminPage;