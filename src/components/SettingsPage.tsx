import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";

const SettingsPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        console.log("🔍 Fetching profile with token:", token);
        if (!token) {
          setError("No token found. Please log in again.");
          return;
        }
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
        setFirstName(response.data.firstName);
        setLastName(response.data.lastName);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load profile");
        console.error("❌ Profile Fetch Error:", err.response?.data || err.message);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No token found. Please log in again.");
        return;
      }
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/auth/me`,
        { firstName, lastName, password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess("Profile updated successfully");
      setError("");
      setPassword("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update profile");
      setSuccess("");
      console.error("❌ Profile Update Error:", err.response?.data || err.message);
    }
  };

  const handleUpgradeToElite = async () => {
    if (!user || user.userType !== "shop" || user.isElite) return;
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/auth/me`,
        { isElite: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUser(response.data);
      localStorage.setItem("isElite", "true");
      setSuccess("Upgraded to Shop Elite successfully");
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to upgrade to Shop Elite");
      setSuccess("");
      console.error("❌ Elite Upgrade Error:", err.response?.data || err.message);
    }
  };

  if (!user) return <div className="text-tattoo-light">Loading...</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pt-20 pb-8 px-4 bg-tattoo-black"
    >
      <div className="max-w-md mx-auto bg-tattoo-gray/20 p-6 rounded-lg shadow-lg border border-tattoo-red/30">
        <h1 className="text-3xl font-bold text-tattoo-red mb-6">Settings</h1>
        {error && <p className="text-tattoo-red mb-4">{error}</p>}
        {success && <p className="text-tattoo-light mb-4">{success}</p>}
        <form onSubmit={handleUpdate} className="space-y-6">
          <div>
            <label className="block text-tattoo-light mb-1">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full p-3 bg-tattoo-black border border-tattoo-gray rounded-lg text-tattoo-light focus:outline-none focus:ring-2 focus:ring-tattoo-red"
            />
          </div>
          <div>
            <label className="block text-tattoo-light mb-1">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full p-3 bg-tattoo-black border border-tattoo-gray rounded-lg text-tattoo-light focus:outline-none focus:ring-2 focus:ring-tattoo-red"
            />
          </div>
          <div>
            <label className="block text-tattoo-light mb-1">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current"
              className="w-full p-3 bg-tattoo-black border border-tattoo-gray rounded-lg text-tattoo-light focus:outline-none focus:ring-2 focus:ring-tattoo-red"
            />
          </div>
          <button
            type="submit"
            className="w-full p-3 bg-tattoo-red text-tattoo-light rounded-lg hover:bg-tattoo-red/80 transition duration-200 font-bold"
          >
            Save Profile
          </button>
        </form>

        {user.userType === "shop" && user.isAdmin === false && (
          <div className="mt-6">
            <h2 className="text-xl font-bold text-tattoo-light mb-2">Membership</h2>
            <p className="text-tattoo-gray">
              Current Plan: {user.isElite ? "Shop Elite ($49.99)" : "Shop Pro ($24.99)"}
            </p>
            {!user.isElite && (
              <button
                onClick={handleUpgradeToElite}
                className="mt-2 w-full p-3 bg-tattoo-red text-tattoo-light rounded-lg hover:bg-tattoo-red/80 transition duration-200 font-bold"
              >
                Upgrade to Shop Elite ($49.99)
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SettingsPage;