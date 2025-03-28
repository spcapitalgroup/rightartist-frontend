import React, { useState, useEffect } from "react";
import api from "../api/axios"; // Relative import without .ts extension
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

interface Post {
  id: string;
  title: string;
  description: string;
  location: string;
  feedType: "design" | "booking";
  status?: "open" | "closed" | "accepted" | "scheduled" | "completed" | "cancelled";
  clientId?: string | null;
  shopId?: string | null;
  images?: string[];
  createdAt?: string;
  scheduledDate?: string;
  contactInfo?: { phone: string; email: string };
  comments?: Comment[];
  shop?: { id: string; username: string };
  client?: { id: string; username: string };
}

interface Comment {
  id: string;
  content: string;
  userId: string;
  postId: string;
  parentId: string | null;
  price?: number;
  user?: { id: string; username: string };
  replies?: Comment[];
  createdAt?: string;
}

const FeedPage: React.FC<{ feedType: "design" | "booking" }> = ({ feedType }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewType, setViewType] = useState<"list" | "tiled">("list");
  const [sortBy, setSortBy] = useState<"date" | "rating">("date");
  const [ratings, setRatings] = useState<{ [key: string]: number }>({});

  const token = localStorage.getItem("authToken");
  const decoded = token ? JSON.parse(atob(token.split(".")[1])) : {};
  const userType = decoded.userType || "fan";
  const isPaid = decoded.isPaid === true;

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        if (!token) {
          setError("Please log in to access the feed");
          return;
        }

        const response = await api.get("/api/feed/", {
          params: { feedType },
        });
        console.log(`🔍 ${feedType} Feed Response:`, response.data);
        const fetchedPosts = response.data.posts || [];
        setPosts(fetchedPosts);

        const userIds = fetchedPosts
          .map((post: Post) => (feedType === "design" ? post.shopId : post.clientId))
          .filter((id: string | null | undefined): id is string => Boolean(id));
        const uniqueUserIds = [...new Set(userIds)] as string[];
        const ratingsData: { [key: string]: number } = {};
        for (const userId of uniqueUserIds) {
          const ratingResponse = await api.get(`/api/users/${userId}/rating`);
          ratingsData[userId] = ratingResponse.data.averageRating || 0;
        }
        setRatings(ratingsData);
      } catch (err: any) {
        console.error(`❌ ${feedType} Feed Fetch Error:`, err.response?.data || err.message);
        setError(err.response?.data?.message || "Failed to load feed");
      }
    };
    fetchPosts();
  }, [feedType, token]);

  useEffect(() => {
    if (sortBy === "date") {
      setPosts((prevPosts) =>
        [...prevPosts].sort((a, b) => {
          return new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime();
        })
      );
    } else if (sortBy === "rating") {
      setPosts((prevPosts) =>
        [...prevPosts].sort((a, b) => {
          const userIdA = feedType === "design" ? a.shopId : a.clientId;
          const userIdB = feedType === "design" ? b.shopId : b.clientId;
          const ratingA = userIdA ? ratings[userIdA] || 0 : 0;
          const ratingB = userIdB ? ratings[userIdB] || 0 : 0;
          return ratingB - ratingA;
        })
      );
    }
  }, [sortBy, ratings, feedType]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files).slice(0, 5));
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.style.display = "none"; // Hide the image if it fails to load
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const postData = {
        title,
        description,
        location,
        feedType,
      };

      console.log("🔍 Post Data:", postData);

      const createResponse = await api.post("/api/posts/create", postData, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log("✅ Post Creation Response:", createResponse.data);

      const newPost = createResponse.data.data;

      if (images.length > 0) {
        const formData = new FormData();
        formData.append("postId", newPost.id);
        images.forEach((image) => formData.append("images", image));

        console.log("🔍 Uploading Images for Post:", newPost.id);
        const uploadResponse = await api.post("/api/posts/upload-images", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        console.log("✅ Image Upload Response:", uploadResponse.data);

        newPost.images = uploadResponse.data.images;
      }

      setPosts([newPost, ...posts]);
      setTitle("");
      setDescription("");
      setLocation("");
      setImages([]);
      setError("");
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("❌ Post Error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to create post");
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

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
              {feedType === "design" ? "Design Feed" : "Booking Feed"}
            </motion.h1>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <motion.button
                onClick={() => setViewType(viewType === "list" ? "tiled" : "list")}
                className="text-text-gray text-sm border border-accent-gray px-3 py-1 rounded-sm hover:bg-dark-black transition duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {viewType === "list" ? "Switch to Tiled View" : "Switch to List View"}
              </motion.button>
              <motion.select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "date" | "rating")}
                className="p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200 text-sm"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <option value="date">Sort by Date</option>
                <option value="rating">Sort by Rating</option>
              </motion.select>
              {(feedType === "design" && userType === "shop" && isPaid) ||
              (feedType === "booking" && userType === "fan") ? (
                <motion.button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-accent-red text-light-white px-4 py-2 rounded-sm font-semibold hover:bg-red-700 transition duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  New Post
                </motion.button>
              ) : (
                <motion.p
                  className="text-text-gray text-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  {feedType === "design" && !isPaid && userType === "shop"
                    ? "Complete payment to post"
                    : "Only " + (feedType === "design" ? "Shop Pros" : "Ink Hunters") + " can post here"}
                </motion.p>
              )}
            </div>
          </div>
          {error && (
            <motion.p
              className="text-red-500 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {error}
            </motion.p>
          )}
          <div className={`space-y-6 ${viewType === "tiled" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : ""}`}>
            {posts.map((post, index) => {
              const truncatedDescription = truncateText(post.description, 100);
              const visibleComments = post.comments?.slice(0, 2) || [];
              const userId = feedType === "design" ? post.shopId : post.clientId;
              const rating = userId ? ratings[userId] || 0 : 0;

              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`bg-dark-black p-4 rounded-sm shadow-sm border border-accent-gray hover:shadow-xl hover:border-accent-red transition-all duration-300 ${
                    viewType === "tiled" ? "h-[256px] overflow-hidden" : ""
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-light-white hover:text-accent-red transition-colors duration-200">
                        {post.title}
                      </h2>
                      <p className="text-text-gray mt-2">{truncatedDescription}</p>
                      <p className="text-text-gray mt-1">Location: {post.location}</p>
                      <p className="text-text-gray text-sm mt-1">
                        Posted by:{" "}
                        <Link
                          to={`/profile/${feedType === "design" ? post.shopId : post.clientId}`}
                          className="text-accent-red hover:underline"
                        >
                          {feedType === "design" ? post.shop?.username : post.client?.username || "Unknown"}
                        </Link>
                      </p>
                      {rating > 0 && (
                        <p className="text-text-gray text-sm mt-1">Rating: {rating.toFixed(1)} ★★★★★</p>
                      )}
                      <p className="text-text-gray text-sm mt-1">
                        Posted: {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : "Unknown"}
                      </p>
                      {post.status === "scheduled" && post.scheduledDate && (
                        <div className="text-text-gray text-sm mt-1">
                          <p>Scheduled: {new Date(post.scheduledDate).toLocaleString()}</p>
                          {post.contactInfo && (
                            <>
                              <p>Contact: {post.contactInfo.phone}</p>
                              <p>Email: {post.contactInfo.email}</p>
                            </>
                          )}
                          <p>
                            With:{" "}
                            <Link
                              to={`/profile/${feedType === "booking" ? post.shopId : post.clientId}`}
                              className="text-accent-red hover:underline"
                            >
                              {feedType === "booking" ? post.shop?.username : post.client?.username || "Unknown"}
                            </Link>
                          </p>
                        </div>
                      )}
                    </div>
                    {(viewType === "tiled" || viewType === "list") && post.images && post.images[0] && (
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
                  <div className="mt-4">
                    {visibleComments.length > 0 ? (
                      visibleComments.map((comment) => (
                        <div key={comment.id} className="text-text-gray text-sm mb-2">
                          <p>{truncateText(comment.content, 50)}</p>
                          {comment.price && <p>Price: ${comment.price.toFixed(2)}</p>}
                          <p>
                            By:{" "}
                            <Link to={`/profile/${comment.userId}`} className="text-accent-red hover:underline">
                              {comment.user?.username}
                            </Link>
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-text-gray text-sm">No comments yet.</p>
                    )}
                    {post.comments && post.comments.length > 2 && (
                      <p className="text-text-gray text-sm mt-1">
                        {post.comments.length - 2} more comment{post.comments.length - 2 > 1 ? "s" : ""}...
                      </p>
                    )}
                  </div>
                  <div className="mt-2">
                    <Link to={`/post/${post.id}`} className="text-accent-red hover:underline text-sm">
                      See All
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {isModalOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            className="bg-dark-gray p-6 rounded-sm shadow-lg border border-accent-gray w-full max-w-md"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <h2 className="text-2xl font-semibold text-light-white mb-4 tracking-wide">
              New {feedType === "design" ? "Design" : "Booking"} Post
            </h2>
            <form onSubmit={handlePostSubmit} className="space-y-4">
              <div>
                <label className="block text-text-gray mb-1">Title</label>
                <motion.input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title"
                  className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                />
              </div>
              <div>
                <label className="block text-text-gray mb-1">Description</label>
                <motion.textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description"
                  className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                  rows={3}
                  required
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                />
              </div>
              <div>
                <label className="block text-text-gray mb-1">Location</label>
                <motion.input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location"
                  className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                  required
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                />
              </div>
              <div>
                <label className="block text-text-gray mb-1">Images</label>
                <motion.input
                  type="file"
                  name="images"
                  multiple
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleImageChange}
                  className="text-light-white"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <motion.button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-accent-gray text-light-white rounded-sm hover:bg-gray-600 transition duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  className="px-4 py-2 bg-accent-red text-light-white rounded-sm font-semibold hover:bg-red-700 transition duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  Post
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default FeedPage;