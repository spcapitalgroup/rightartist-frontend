import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

interface DepositStats {
  totalDepositAmount: number;
  paidDeposits: number;
  pendingDeposits: number;
  bookings: Array<{
    id: string;
    title: string;
    depositAmount: number;
    depositStatus: "pending" | "paid";
  }>;
}

const ShopDepositsPage: React.FC = () => {
  const [stats, setStats] = useState<DepositStats | null>(null);
  const [error, setError] = useState("");
  const token = localStorage.getItem("authToken");

  useEffect(() => {
    const fetchDeposits = async () => {
      try {
        if (!token) {
          setError("Please log in to view deposit stats");
          return;
        }

        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/shops/deposits`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("🔍 Deposits Response:", response.data);
        setStats(response.data);
      } catch (err: any) {
        console.error("❌ Fetch Deposits Error:", err.response?.data || err.message);
        setError(err.response?.data?.message || "Failed to load deposit stats");
      }
    };
    fetchDeposits();
  }, [token]);

  if (!stats) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen pt-20 pb-8 px-4 bg-tattoo-black"
      >
        <div className="max-w-4xl mx-auto text-tattoo-gray">{error || "Loading deposit stats..."}</div>
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
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-tattoo-red mb-6">Deposit Tracking</h1>
        {error && <p className="text-tattoo-red mb-4">{error}</p>}
        <div className="bg-tattoo-gray/20 p-6 rounded-lg shadow-lg border border-tattoo-red/30">
          <h2 className="text-xl font-bold text-tattoo-light mb-4">Deposit Stats for This Month</h2>
          <p className="text-tattoo-gray">Total Deposit Amount: ${stats.totalDepositAmount.toFixed(2)}</p>
          <p className="text-tattoo-gray">Paid Deposits: {stats.paidDeposits}</p>
          <p className="text-tattoo-gray">Pending Deposits: {stats.pendingDeposits}</p>
          <p className="text-tattoo-gray mt-2">Note: Deposit status is pending until payment processing is integrated.</p>
          <h3 className="text-lg font-bold text-tattoo-red mt-6 mb-2">Bookings</h3>
          {stats.bookings.length > 0 ? (
            stats.bookings.map((booking) => (
              <div key={booking.id} className="bg-tattoo-gray/10 p-4 rounded-lg mb-2">
                <Link to={`/post/${booking.id}`} className="text-tattoo-light hover:text-tattoo-red">
                  {booking.title}
                </Link>
                <p className="text-tattoo-gray">Deposit Amount: ${booking.depositAmount.toFixed(2)}</p>
                <p className="text-tattoo-gray">Status: {booking.depositStatus}</p>
              </div>
            ))
          ) : (
            <p className="text-tattoo-gray">No bookings for this month.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ShopDepositsPage;