import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler, // Import the Filler plugin
  ChartData,
} from "chart.js";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

// Define the user interface
interface User {
  id: string;
  username: string;
  email: string;
  userType: "shop" | "fan" | "designer";
  createdAt: string;
}

const AdminPage: React.FC = () => {
  const [stats, setStats] = useState({ totalUsers: 0, totalPosts: 0, totalRevenue: 0 });
  const [users, setUsers] = useState<User[]>([]);
  const [inviteLink, setInviteLink] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"shop" | "fan" | "designer">("shop");
  const [timeRange, setTimeRange] = useState<"30days" | "90days">("30days");
  const [dailyData, setDailyData] = useState<ChartData<"line">>({ labels: [], datasets: [] });
  const [monthlyData, setMonthlyData] = useState<ChartData<"bar">>({ labels: [], datasets: [] });
  const [churnRate, setChurnRate] = useState(0);
  const token = localStorage.getItem("authToken");

  // Fetch admin stats (existing functionality)
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

  // Fetch user list
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(response.data.users || []);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load users");
      }
    };
    fetchUsers();
  }, [token]);

  // Fetch stats data for the active tab
  useEffect(() => {
    const fetchStatsData = async () => {
      try {
        // Fetch daily users
        const dailyResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/stats/users/daily`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { userType: activeTab, range: timeRange },
        });
        const dailyData = dailyResponse.data;
        setDailyData({
          labels: dailyData.labels,
          datasets: [
            {
              label: `New ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Users Per Day`,
              data: dailyData.data,
              borderColor: "rgba(255, 99, 132, 1)",
              backgroundColor: "rgba(255, 99, 132, 0.2)",
              fill: true,
            },
          ],
        });

        // Fetch monthly users
        const monthlyResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/stats/users/monthly`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { userType: activeTab },
        });
        const monthlyData = monthlyResponse.data;
        setMonthlyData({
          labels: monthlyData.labels,
          datasets: [
            {
              label: `New ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Users Per Month`,
              data: monthlyData.data,
              backgroundColor: "rgba(255, 99, 132, 0.5)",
            },
          ],
        });

        // Fetch churn rate
        const churnResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/stats/churn`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { userType: activeTab },
        });
        setChurnRate(churnResponse.data.churnRate || 0);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load stats data");
      }
    };
    fetchStatsData();
  }, [token, activeTab, timeRange]);

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

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(users.filter(user => user.id !== userId));
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete user");
    }
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true },
    },
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
          {/* Overall Stats Section */}
          <div>
            <h2 className="text-xl font-bold text-tattoo-light">Overall Stats</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-tattoo-gray/40 rounded-lg">
                <p className="text-tattoo-gray">Total Users: {stats.totalUsers}</p>
              </div>
              <div className="p-4 bg-tattoo-gray/40 rounded-lg">
                <p className="text-tattoo-gray">Total Posts: {stats.totalPosts}</p>
              </div>
              <div className="p-4 bg-tattoo-gray/40 rounded-lg">
                <p className="text-tattoo-gray">Total Revenue: ${stats.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* User List Section */}
          <div>
            <h2 className="text-xl font-bold text-tattoo-light mb-4">User List</h2>
            {users.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-tattoo-light">
                  <thead>
                    <tr className="border-b border-tattoo-gray">
                      <th className="p-2 text-left">ID</th>
                      <th className="p-2 text-left">Username</th>
                      <th className="p-2 text-left">Email</th>
                      <th className="p-2 text-left">Type</th>
                      <th className="p-2 text-left">Created</th>
                      <th className="p-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} className="border-b border-tattoo-gray/50">
                        <td className="p-2">{user.id.slice(0, 8)}...</td>
                        <td className="p-2">{user.username}</td>
                        <td className="p-2">{user.email}</td>
                        <td className="p-2">{user.userType}</td>
                        <td className="p-2">{format(new Date(user.createdAt), "MMM dd, yyyy")}</td>
                        <td className="p-2">
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-tattoo-red hover:underline"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-tattoo-gray">No users found.</p>
            )}
          </div>

          {/* Stats Charts Section with Tabs */}
          <div>
            <h2 className="text-xl font-bold text-tattoo-light mb-4">User Stats</h2>
            <div className="flex space-x-4 mb-4">
              <button
                onClick={() => setActiveTab("shop")}
                className={`px-4 py-2 rounded-lg ${activeTab === "shop" ? "bg-tattoo-red text-tattoo-light" : "bg-tattoo-gray text-tattoo-light"} hover:bg-tattoo-red/80 transition duration-200`}
              >
                Shop Users
              </button>
              <button
                onClick={() => setActiveTab("fan")}
                className={`px-4 py-2 rounded-lg ${activeTab === "fan" ? "bg-tattoo-red text-tattoo-light" : "bg-tattoo-gray text-tattoo-light"} hover:bg-tattoo-red/80 transition duration-200`}
              >
                Fan Users
              </button>
              <button
                onClick={() => setActiveTab("designer")}
                className={`px-4 py-2 rounded-lg ${activeTab === "designer" ? "bg-tattoo-red text-tattoo-light" : "bg-tattoo-gray text-tattoo-light"} hover:bg-tattoo-red/80 transition duration-200`}
              >
                Designer Users
              </button>
            </div>
            <div className="mb-4">
              <label className="text-tattoo-light mr-2">Time Range:</label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as "30days" | "90days")}
                className="p-2 bg-tattoo-black border border-tattoo-gray rounded-lg text-tattoo-light"
              >
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Users Per Day (Line Chart) - Spans 2 columns */}
              <div className="col-span-2 p-4 bg-tattoo-gray/40 rounded-lg">
                <h3 className="text-lg font-bold text-tattoo-light mb-2">New Users Per Day</h3>
                <Line data={dailyData} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, title: { display: true, text: `New ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Users Per Day` } } }} />
              </div>
              {/* Users Per Month (Bar Chart) - Spans 1 column, 2 rows */}
              <div className="row-span-2 p-4 bg-tattoo-gray/40 rounded-lg">
                <h3 className="text-lg font-bold text-tattoo-light mb-2">New Users Per Month</h3>
                <Bar data={monthlyData} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, title: { display: true, text: `New ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Users Per Month` } } }} />
              </div>
              {/* Churn Rate (Text Display) - Spans 1 column, 1 row */}
              <div className="p-4 bg-tattoo-gray/40 rounded-lg">
                <h3 className="text-lg font-bold text-tattoo-light mb-2">Churn Rate</h3>
                <p className="text-tattoo-gray">Monthly Churn Rate: {churnRate.toFixed(2)}%</p>
              </div>
            </div>
          </div>

          {/* Invite Section */}
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