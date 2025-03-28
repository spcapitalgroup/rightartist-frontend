import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { motion } from "framer-motion";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  userType: "fan" | "designer" | "shop";
  isPaid: boolean;
  isAdmin: boolean;
  depositSettings: { required: boolean; amount: number };
  calendarIntegrations: Record<string, any>;
  portfolio: string[];
  bio: string;
  location: string;
  operatingHours: Record<string, any>;
  socialLinks: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface Post {
  id: string;
  title: string;
  description: string;
  location: string;
  feedType: "design" | "booking";
  status: "open" | "closed" | "accepted" | "scheduled" | "completed" | "cancelled";
  clientId: string | null;
  shopId: string | null;
  images: string[];
  createdAt: string;
  scheduledDate: string;
  contactInfo: { phone: string; email: string };
  comments: Comment[];
  shop: { id: string; username: string };
  client: { id: string; username: string };
}

interface Comment {
  id: string;
  content: string;
  userId: string;
  postId: string;
  parentId: string | null;
  price: number;
  user: { id: string; username: string };
  replies: Comment[];
  createdAt: string;
}

interface Rating {
  id: string;
  raterId: string;
  rateeId: string;
  postId: string;
  rating: number;
  comment: string;
  createdAt: string;
  rater: { id: string; username: string };
  ratee: { id: string; username: string };
}

const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [portfolioImages, setPortfolioImages] = useState<File[]>([]);
  const [socialLinks, setSocialLinks] = useState({
    instagram: "",
    facebook: "",
    twitter: "",
  });

  const token = localStorage.getItem("authToken");
  const decoded = token ? JSON.parse(atob(token.split(".")[1])) : {};
  const currentUserId = decoded.id || "";
  const userType = decoded.userType || "fan";
  const isOwnProfile = currentUserId === id;

  useEffect(() => {
    const fetchUserAndPosts = async () => {
      try {
        if (!id) {
          setError("No user ID provided");
          return;
        }

        // Fetch user data
        const userResponse = await api.get(`/api/users/${id}`);
        const userData = userResponse.data;
        setUser(userData);
        setBio(userData.bio || "");
        setLocation(userData.location || "");
        setSocialLinks(userData.socialLinks || { instagram: "", facebook: "", twitter: "" });

        // Fetch posts based on user type
        if (userData.userType === "fan") {
          const postsResponse = await api.get(`/api/posts/user/${id}/booking`);
          setPosts(postsResponse.data.posts || []);
        } else if (userData.userType === "designer" || userData.userType === "shop") {
          const postsResponse = await api.get(`/api/posts/user/${id}/design`);
          setPosts(postsResponse.data.posts || []);
        }

        // Fetch ratings for the user
        const ratingsResponse = await api.get(`/api/ratings/user/${id}`);
        const userRatings = ratingsResponse.data.ratings || [];
        setRatings(userRatings);

        // Calculate average rating
        if (userRatings.length > 0) {
          const totalRating = userRatings.reduce(
            (sum: number, rating: Rating) => sum + rating.rating,
            0
          );
          const avgRating = totalRating / userRatings.length;
          setAverageRating(avgRating);
        } else {
          setAverageRating(null);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load profile");
        console.error("❌ Fetch Error:", err.response?.data || err.message);
      }
    };

    fetchUserAndPosts();
  }, [id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPortfolioImages(Array.from(e.target.files).slice(0, 5));
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.style.display = "none"; // Hide the image if it fails to load
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedUser = {
        bio,
        location,
        socialLinks,
      };

      const userResponse = await api.put(`/api/users/${id}`, updatedUser);
      setUser(userResponse.data);

      if (portfolioImages.length > 0) {
        const formData = new FormData();
        portfolioImages.forEach((image) => formData.append("portfolio", image));
        const portfolioResponse = await api.post(`/api/users/${id}/portfolio`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setUser((prev) =>
          prev ? { ...prev, portfolio: portfolioResponse.data.portfolio } : prev
        );
      }

      setIsEditing(false);
      setPortfolioImages([]);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update profile");
      console.error("❌ Update Error:", err.response?.data || err.message);
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen pt-20 pb-8 px-4 bg-dark-black"
      >
        <div className="max-w-4xl mx-auto text-red-500">{error}</div>
      </motion.div>
    );
  }

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen pt-20 pb-8 px-4 bg-dark-black"
      >
        <div className="max-w-4xl mx-auto text-light-white">Loading...</div>
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
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="bg-dark-gray p-6 rounded-sm shadow-lg border border-accent-gray"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
            <motion.h1
              className="text-3xl font-semibold text-light-white tracking-wide"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {user.firstName} {user.lastName}'s Profile
            </motion.h1>
            {isOwnProfile && (
              <motion.button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-accent-red text-light-white px-4 py-2 rounded-sm font-semibold hover:bg-red-700 transition duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {isEditing ? "Cancel" : "Edit Profile"}
              </motion.button>
            )}
          </div>

          {isEditing ? (
            <motion.form
              onSubmit={handleEditSubmit}
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div>
                <label className="block text-text-gray mb-1">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-text-gray mb-1">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                />
              </div>
              {userType === "designer" && (
                <div>
                  <label className="block text-text-gray mb-1">
                    Add to Portfolio (Images)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleImageChange}
                    className="text-light-white"
                  />
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-text-gray mb-1">Instagram</label>
                  <input
                    type="text"
                    value={socialLinks.instagram}
                    onChange={(e) =>
                      setSocialLinks({ ...socialLinks, instagram: e.target.value })
                    }
                    className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                  />
                </div>
                <div>
                  <label className="block text-text-gray mb-1">Facebook</label>
                  <input
                    type="text"
                    value={socialLinks.facebook}
                    onChange={(e) =>
                      setSocialLinks({ ...socialLinks, facebook: e.target.value })
                    }
                    className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                  />
                </div>
                <div>
                  <label className="block text-text-gray mb-1">Twitter</label>
                  <input
                    type="text"
                    value={socialLinks.twitter}
                    onChange={(e) =>
                      setSocialLinks({ ...socialLinks, twitter: e.target.value })
                    }
                    className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                  />
                </div>
              </div>
              <motion.button
                type="submit"
                className="bg-accent-red text-light-white px-6 py-2 rounded-sm font-semibold hover:bg-red-700 transition duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Save Changes
              </motion.button>
            </motion.form>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-text-gray">
                    Username: <span className="text-light-white">{user.username}</span>
                  </p>
                  <p className="text-text-gray mt-1">
                    Email: <span className="text-light-white">{user.email}</span>
                  </p>
                  <p className="text-text-gray mt-1">
                    User Type: <span className="text-light-white">{user.userType}</span>
                  </p>
                  {averageRating !== null && (
                    <p className="text-text-gray mt-1">
                      Average Rating:{" "}
                      <span className="text-light-white">
                        {averageRating.toFixed(1)} ★★★★★ ({ratings.length}{" "}
                        {ratings.length === 1 ? "rating" : "ratings"})
                      </span>
                    </p>
                  )}
                  <p className="text-text-gray mt-1">
                    Bio: <span className="text-light-white">{user.bio || "Not set"}</span>
                  </p>
                  <p className="text-text-gray mt-1">
                    Location: <span className="text-light-white">{user.location || "Not set"}</span>
                  </p>
                </div>
                <div>
                  {user.socialLinks?.instagram && (
                    <p className="text-text-gray">
                      Instagram:{" "}
                      <a
                        href={user.socialLinks.instagram}
                        className="text-accent-red hover:underline"
                      >
                        {user.socialLinks.instagram}
                      </a>
                    </p>
                  )}
                  {user.socialLinks?.facebook && (
                    <p className="text-text-gray mt-1">
                      Facebook:{" "}
                      <a
                        href={user.socialLinks.facebook}
                        className="text-accent-red hover:underline"
                      >
                        {user.socialLinks.facebook}
                      </a>
                    </p>
                  )}
                  {user.socialLinks?.twitter && (
                    <p className="text-text-gray mt-1">
                      Twitter:{" "}
                      <a
                        href={user.socialLinks.twitter}
                        className="text-accent-red hover:underline"
                      >
                        {user.socialLinks.twitter}
                      </a>
                    </p>
                  )}
                </div>
              </div>

              {userType === "designer" && (
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-light-white mb-4">
                    Portfolio
                  </h2>
                  {user.portfolio && user.portfolio.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {user.portfolio.map((image, index) => (
                        <motion.img
                          key={index}
                          src={`http://localhost:3000/uploads/${image}`}
                          alt={`Portfolio ${index + 1}`}
                          className="w-full h-32 object-cover rounded-sm hover:scale-105 transition-transform duration-300"
                          onError={handleImageError}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1, duration: 0.3 }}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-text-gray">No portfolio images available.</p>
                  )}
                </div>
              )}

              <h2 className="text-2xl font-semibold text-light-white mb-4">
                {userType === "fan" ? "Booking Posts" : "Design Posts"}
              </h2>
              <div className="space-y-6">
                {posts.length > 0 ? (
                  posts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="bg-dark-black p-4 rounded-sm shadow-sm border border-accent-gray hover:shadow-xl hover:border-accent-red transition-all duration-300"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                        <div className="flex-1">
                          <h3
                            className="text-xl font-semibold text-light-white hover:text-accent-red transition-colors duration-200 cursor-pointer"
                            onClick={() => navigate(`/post/${post.id}`)}
                          >
                            {post.title}
                          </h3>
                          <p className="text-text-gray mt-2">
                            {truncateText(post.description, 100)}
                          </p>
                          <p className="text-text-gray mt-1">Location: {post.location}</p>
                          <p className="text-text-gray mt-1">
                            Posted by:{" "}
                            <span
                              className="text-accent-red hover:underline cursor-pointer"
                              onClick={() =>
                                navigate(
                                  `/profile/${
                                    userType === "fan" ? post.shopId : post.clientId
                                  }`
                                )
                              }
                            >
                              {userType === "fan"
                                ? post.shop?.username
                                : post.client?.username || "Unknown"}
                            </span>
                          </p>
                          <p className="text-text-gray text-sm mt-1">
                            Created: {new Date(post.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {post.images && post.images[0] && (
                          <motion.img
                            src={`http://localhost:3000/uploads/${post.images[0]}`}
                            alt={post.title}
                            className="w-16 h-16 object-cover rounded-sm hover:scale-110 hover:brightness-110 transition-transform duration-200"
                            onError={handleImageError}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                        )}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-text-gray">No posts available.</p>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ProfilePage;