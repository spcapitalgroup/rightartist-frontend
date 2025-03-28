import React, { useState, useEffect } from "react";
import api from "../api/axios";
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
  Filler,
  ChartData,
} from "chart.js";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

interface User {
  id: string;
  username: string;
  email: string;
  userType: "shop" | "fan" | "designer";
  createdAt: string;
}

interface Post {
  id: string;
  title: string;
  feedType: "design" | "booking";
  userId: string;
  createdAt: string;
  user: { username: string };
}

interface Comment {
  id: string;
  content: string;
  postId: string;
  userId: string;
  createdAt: string;
  user: { username: string };
  post?: { title: string }; // Made optional to handle cases where post is null
}

interface Review {
  id: string;
  userId: string;
  targetUserId: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: { username: string };
  targetUser: { username: string };
}

const AdminPage: React.FC = () => {
  const [stats, setStats] = useState({ totalUsers: 0, totalPosts: 0, totalRevenue: 0 });
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [inviteLink, setInviteLink] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"shop" | "fan" | "designer">("shop");
  const [timeRange, setTimeRange] = useState<"30days" | "90days">("30days");
  const [dailyData, setDailyData] = useState<ChartData<"line">>({ labels: [], datasets: [] });
  const [monthlyData, setMonthlyData] = useState<ChartData<"bar">>({ labels: [], datasets: [] });
  const [churnRate, setChurnRate] = useState(0);
  const token = localStorage.getItem("authToken");

  // Fetch admin stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/api/stats/admin");
        setStats(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load stats");
        console.error("❌ Fetch Admin Stats Error:", err.response?.data || err.message);
      }
    };
    fetchStats();
  }, [token]);

  // Fetch user list
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get("/api/users");
        setUsers(response.data.users || []);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load users");
        console.error("❌ Fetch Users Error:", err.response?.data || err.message);
      }
    };
    fetchUsers();
  }, [token]);

  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const designResponse = await api.get("/api/feed/", {
          params: { feedType: "design" },
        });
        const bookingResponse = await api.get("/api/feed/", {
          params: { feedType: "booking" },
        });
        const combinedPosts = [
          ...(designResponse.data.posts || []),
          ...(bookingResponse.data.posts || []),
        ];
        setPosts(combinedPosts);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load posts");
        console.error("❌ Fetch Posts Error:", err.response?.data || err.message);
      }
    };
    fetchPosts();
  }, []);

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await api.get("/api/comments");
        setComments(response.data.comments || []);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load comments");
        console.error("❌ Fetch Comments Error:", err.response?.data || err.message);
      }
    };
    fetchComments();
  }, []);

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await api.get("/api/users/reviews");
        setReviews(response.data || []);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load reviews");
        console.error("❌ Fetch Reviews Error:", err.response?.data || err.message);
      }
    };
    fetchReviews();
  }, []);

  // Fetch stats data for the active tab
  useEffect(() => {
    const fetchStatsData = async () => {
      try {
        const dailyResponse = await api.get("/api/stats/users/daily", {
          params: { userType: activeTab, range: timeRange },
        });
        const dailyData = dailyResponse.data;
        setDailyData({
          labels: dailyData.labels,
          datasets: [
            {
              label: `New ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Users Per Day`,
              data: dailyData.data,
              borderColor: "#FF4D4D", // accent-red
              backgroundColor: "rgba(255, 77, 77, 0.2)",
              fill: true,
            },
          ],
        });

        const monthlyResponse = await api.get("/api/stats/users/monthly", {
          params: { userType: activeTab },
        });
        const monthlyData = monthlyResponse.data;
        setMonthlyData({
          labels: monthlyData.labels,
          datasets: [
            {
              label: `New ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Users Per Month`,
              data: monthlyData.data,
              backgroundColor: "rgba(255, 77, 77, 0.5)",
            },
          ],
        });

        const churnResponse = await api.get("/api/stats/churn", {
          params: { userType: activeTab },
        });
        setChurnRate(churnResponse.data.churnRate || 0);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load stats data");
        console.error("❌ Fetch Stats Data Error:", err.response?.data || err.message);
      }
    };
    fetchStatsData();
  }, [activeTab, timeRange]);

  const handleGenerateInvite = async () => {
    try {
      const response = await api.post("/api/admin/invite", {});
      setInviteLink(response.data.inviteLink);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to generate invite");
      console.error("❌ Generate Invite Error:", err.response?.data || err.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/api/users/${userId}`);
      setUsers(users.filter(user => user.id !== userId));
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete user");
      console.error("❌ Delete User Error:", err.response?.data || err.message);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await api.delete(`/api/posts/${postId}`);
      setPosts(posts.filter(post => post.id !== postId));
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete post");
      console.error("❌ Delete Post Error:", err.response?.data || err.message);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      await api.delete(`/api/comments/${commentId}`);
      setComments(comments.filter(comment => comment.id !== commentId));
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete comment");
      console.error("❌ Delete Comment Error:", err.response?.data || err.message);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      await api.delete(`/api/reviews/${reviewId}`);
      setReviews(reviews.filter(review => review.id !== reviewId));
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete review");
      console.error("❌ Delete Review Error:", err.response?.data || err.message);
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
      transition={{ duration: 0.5 }}
      className="min-h-screen pt-20 pb-8 px-4 bg-dark-black text-light-white"
    >
      <div className="max-w-6xl mx-auto">
        <div className="bg-dark-gray p-6 rounded-sm shadow-sm border border-accent-gray">
          <h1 className="text-3xl font-semibold text-light-white mb-6">Admin Dashboard</h1>
          {error && <p className="text-red-500 mb-6">{error}</p>}
          <div className="space-y-8">
            {/* Overall Stats Section */}
            <div>
              <h2 className="text-xl font-medium text-text-gray mb-4">Overall Stats</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-dark-black rounded-sm border border-accent-gray">
                  <p className="text-text-gray text-sm">Total Users</p>
                  <p className="text-light-white text-2xl">{stats.totalUsers}</p>
                </div>
                <div className="p-4 bg-dark-black rounded-sm border border-accent-gray">
                  <p className="text-text-gray text-sm">Total Posts</p>
                  <p className="text-light-white text-2xl">{stats.totalPosts}</p>
                </div>
                <div className="p-4 bg-dark-black rounded-sm border border-accent-gray">
                  <p className="text-text-gray text-sm">Total Revenue</p>
                  <p className="text-light-white text-2xl">${stats.totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* User List Section */}
            <div>
              <h2 className="text-xl font-medium text-text-gray mb-4">User List</h2>
              {users.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-light-white">
                    <thead>
                      <tr className="border-b border-accent-gray">
                        <th className="p-2 text-left text-text-gray">ID</th>
                        <th className="p-2 text-left text-text-gray">Username</th>
                        <th className="p-2 text-left text-text-gray">Email</th>
                        <th className="p-2 text-left text-text-gray">Type</th>
                        <th className="p-2 text-left text-text-gray">Created</th>
                        <th className="p-2 text-left text-text-gray">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.id} className="border-b border-accent-gray/50">
                          <td className="p-2 text-light-white">{user.id.slice(0, 8)}...</td>
                          <td className="p-2 text-light-white">{user.username}</td>
                          <td className="p-2 text-light-white">{user.email}</td>
                          <td className="p-2 text-light-white">{user.userType}</td>
                          <td className="p-2 text-light-white">{format(new Date(user.createdAt), "MMM dd, yyyy")}</td>
                          <td className="p-2">
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-accent-red hover:underline text-sm"
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
                <p className="text-text-gray">No users found.</p>
              )}
            </div>

            {/* Post List Section */}
            <div>
              <h2 className="text-xl font-medium text-text-gray mb-4">Post List</h2>
              {posts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-light-white">
                    <thead>
                      <tr className="border-b border-accent-gray">
                        <th className="p-2 text-left text-text-gray">ID</th>
                        <th className="p-2 text-left text-text-gray">Title</th>
                        <th className="p-2 text-left text-text-gray">Feed Type</th>
                        <th className="p-2 text-left text-text-gray">Posted By</th>
                        <th className="p-2 text-left text-text-gray">Created</th>
                        <th className="p-2 text-left text-text-gray">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {posts.map(post => (
                        <tr key={post.id} className="border-b border-accent-gray/50">
                          <td className="p-2 text-light-white">{post.id.slice(0, 8)}...</td>
                          <td className="p-2 text-light-white">{post.title}</td>
                          <td className="p-2 text-light-white">{post.feedType}</td>
                          <td className="p-2 text-light-white">{post.user.username}</td>
                          <td className="p-2 text-light-white">{format(new Date(post.createdAt), "MMM dd, yyyy")}</td>
                          <td className="p-2">
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="text-accent-red hover:underline text-sm"
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
                <p className="text-text-gray">No posts found.</p>
              )}
            </div>

            {/* Comment List Section */}
            <div>
              <h2 className="text-xl font-medium text-text-gray mb-4">Comment List</h2>
              {comments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-light-white">
                    <thead>
                      <tr className="border-b border-accent-gray">
                        <th className="p-2 text-left text-text-gray">ID</th>
                        <th className="p-2 text-left text-text-gray">Content</th>
                        <th className="p-2 text-left text-text-gray">Post</th>
                        <th className="p-2 text-left text-text-gray">Posted By</th>
                        <th className="p-2 text-left text-text-gray">Created</th>
                        <th className="p-2 text-left text-text-gray">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comments.map(comment => (
                        <tr key={comment.id} className="border-b border-accent-gray/50">
                          <td className="p-2 text-light-white">{comment.id.slice(0, 8)}...</td>
                          <td className="p-2 text-light-white">{comment.content.slice(0, 50)}...</td>
                          <td className="p-2 text-light-white">{comment.post ? comment.post.title : "N/A"}</td>
                          <td className="p-2 text-light-white">{comment.user.username}</td>
                          <td className="p-2 text-light-white">{format(new Date(comment.createdAt), "MMM dd, yyyy")}</td>
                          <td className="p-2">
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-accent-red hover:underline text-sm"
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
                <p className="text-text-gray">No comments found.</p>
              )}
            </div>

            {/* Review List Section */}
            <div>
              <h2 className="text-xl font-medium text-text-gray mb-4">Review List</h2>
              {reviews.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-light-white">
                    <thead>
                      <tr className="border-b border-accent-gray">
                        <th className="p-2 text-left text-text-gray">ID</th>
                        <th className="p-2 text-left text-text-gray">Reviewer</th>
                        <th className="p-2 text-left text-text-gray">Target User</th>
                        <th className="p-2 text-left text-text-gray">Rating</th>
                        <th className="p-2 text-left text-text-gray">Comment</th>
                        <th className="p-2 text-left text-text-gray">Created</th>
                        <th className="p-2 text-left text-text-gray">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviews.map(review => (
                        <tr key={review.id} className="border-b border-accent-gray/50">
                          <td className="p-2 text-light-white">{review.id.slice(0, 8)}...</td>
                          <td className="p-2 text-light-white">{review.user.username}</td>
                          <td className="p-2 text-light-white">{review.targetUser.username}</td>
                          <td className="p-2 text-light-white">{review.rating} ★★★★★</td>
                          <td className="p-2 text-light-white">{review.comment ? review.comment.slice(0, 50) + "..." : "N/A"}</td>
                          <td className="p-2 text-light-white">{format(new Date(review.createdAt), "MMM dd, yyyy")}</td>
                          <td className="p-2">
                            <button
                              onClick={() => handleDeleteReview(review.id)}
                              className="text-accent-red hover:underline text-sm"
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
                <p className="text-text-gray">No reviews found.</p>
              )}
            </div>

            {/* Stats Charts Section with Tabs */}
            <div>
              <h2 className="text-xl font-medium text-text-gray mb-4">User Stats</h2>
              <div className="flex space-x-2 mb-4">
                <button
                  onClick={() => setActiveTab("shop")}
                  className={`px-4 py-2 rounded-sm border border-accent-gray text-sm font-medium transition duration-200 ${
                    activeTab === "shop" ? "bg-accent-red text-light-white" : "bg-dark-black text-light-white hover:bg-dark-gray"
                  }`}
                >
                  Shop Users
                </button>
                <button
                  onClick={() => setActiveTab("fan")}
                  className={`px-4 py-2 rounded-sm border border-accent-gray text-sm font-medium transition duration-200 ${
                    activeTab === "fan" ? "bg-accent-red text-light-white" : "bg-dark-black text-light-white hover:bg-dark-gray"
                  }`}
                >
                  Fan Users
                </button>
                <button
                  onClick={() => setActiveTab("designer")}
                  className={`px-4 py-2 rounded-sm border border-accent-gray text-sm font-medium transition duration-200 ${
                    activeTab === "designer" ? "bg-accent-red text-light-white" : "bg-dark-black text-light-white hover:bg-dark-gray"
                  }`}
                >
                  Designer Users
                </button>
              </div>
              <div className="mb-4">
                <label className="text-text-gray mr-2 text-sm">Time Range:</label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as "30days" | "90days")}
                  className="p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200 text-sm"
                >
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                </select>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 p-4 bg-dark-black rounded-sm border border-accent-gray">
                  <h3 className="text-lg font-medium text-text-gray mb-2">New Users Per Day</h3>
                  <Line
                    data={dailyData}
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        title: {
                          display: true,
                          text: `New ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Users Per Day`,
                          color: "#F5F5F5",
                        },
                        legend: { labels: { color: "#F5F5F5" } },
                        tooltip: { titleColor: "#F5F5F5", bodyColor: "#F5F5F5" },
                      },
                      scales: {
                        x: { ticks: { color: "#F5F5F5" } },
                        y: { ticks: { color: "#F5F5F5" } },
                      },
                    }}
                  />
                </div>
                <div className="lg:row-span-2 p-4 bg-dark-black rounded-sm border border-accent-gray">
                  <h3 className="text-lg font-medium text-text-gray mb-2">New Users Per Month</h3>
                  <Bar
                    data={monthlyData}
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        title: {
                          display: true,
                          text: `New ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Users Per Month`,
                          color: "#F5F5F5",
                        },
                        legend: { labels: { color: "#F5F5F5" } },
                        tooltip: { titleColor: "#F5F5F5", bodyColor: "#F5F5F5" },
                      },
                      scales: {
                        x: { ticks: { color: "#F5F5F5" } },
                        y: { ticks: { color: "#F5F5F5" } },
                      },
                    }}
                  />
                </div>
                <div className="p-4 bg-dark-black rounded-sm border border-accent-gray">
                  <h3 className="text-lg font-medium text-text-gray mb-2">Churn Rate</h3>
                  <p className="text-light-white">Monthly Churn Rate: {churnRate.toFixed(2)}%</p>
                </div>
              </div>
            </div>

            {/* Invite Section */}
            <div>
              <h2 className="text-xl font-medium text-text-gray mb-4">Invite New User</h2>
              <button
                onClick={handleGenerateInvite}
                className="px-4 py-2 bg-accent-red text-light-white rounded-sm hover:bg-red-700 transition duration-200 font-semibold"
              >
                Generate Invite Link
              </button>
              {inviteLink && (
                <p className="text-text-gray mt-2">
                  Invite Link: <a href={inviteLink} className="text-accent-red hover:underline">{inviteLink}</a>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminPage;