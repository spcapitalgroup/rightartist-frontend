import React, { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
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

interface Notification {
  id: string;
  userId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FeedPageProps {
  notifications: Notification[];
}

const FeedPage: React.FC<FeedPageProps> = ({ notifications }) => {
  const [designPosts, setDesignPosts] = useState<Post[]>([]);
  const [bookingPosts, setBookingPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<"design" | "booking">("design");
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
  const isShop = userType === "shop";

  const fetchPosts = useCallback(async () => {
    try {
      if (!token) {
        setError("Please log in to access the feed");
        return;
      }

      if (isShop) {
        const designResponse = await api.get("/api/feed/", { params: { feedType: "design" } });
        const bookingResponse = await api.get("/api/feed/", { params: { feedType: "booking" } });
        console.log("🔍 Design Feed Response:", designResponse.data);
        console.log("🔍 Booking Feed Response:", bookingResponse.data);
        const designPostsData = Array.isArray(designResponse.data.posts)
          ? designResponse.data.posts.filter((post: Post) => post !== undefined && post !== null)
          : [];
        const bookingPostsData = Array.isArray(bookingResponse.data.posts)
          ? bookingResponse.data.posts.filter((post: Post) => post !== undefined && post !== null)
          : [];
        setDesignPosts(designPostsData);
        setBookingPosts(bookingPostsData);

        const designUserIds = designPostsData
          .map((post: Post) => post.shopId)
          .filter((id: string | null | undefined): id is string => Boolean(id));
        const bookingUserIds = bookingPostsData
          .map((post: Post) => post.clientId)
          .filter((id: string | null | undefined): id is string => Boolean(id));
        const uniqueUserIds = [...new Set([...designUserIds, ...bookingUserIds])] as string[];
        const ratingsData: { [key: string]: number } = {};
        for (const userId of uniqueUserIds) {
          const ratingResponse = await api.get(`/api/users/${userId}/rating`);
          ratingsData[userId] = ratingResponse.data.averageRating || 0;
        }
        setRatings(ratingsData);
      } else {
        const feedType = userType === "fan" ? "booking" : "design";
        const response = await api.get("/api/feed/", { params: { feedType } });
        console.log(`🔍 ${feedType} Feed Response:`, response.data);
        const fetchedPosts = Array.isArray(response.data.posts)
          ? response.data.posts.filter((post: Post) => post !== undefined && post !== null)
          : [];
        setDesignPosts(fetchedPosts);
        setBookingPosts([]);

        const userIds = fetchedPosts
          .map((post: Post) => (feedType === "booking" ? post.clientId : post.shopId))
          .filter((id: string | null | undefined): id is string => Boolean(id));
        const uniqueUserIds = [...new Set(userIds)] as string[];
        const ratingsData: { [key: string]: number } = {};
        for (const userId of uniqueUserIds) {
          const ratingResponse = await api.get(`/api/users/${userId}/rating`);
          ratingsData[userId] = ratingResponse.data.averageRating || 0;
        }
        setRatings(ratingsData);
      }
    } catch (err: any) {
      console.error(`❌ Feed Fetch Error:`, err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to load feed");
    }
  }, [token, userType, isShop]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[notifications.length - 1];
      if (latestNotification.message.toLowerCase().includes("post") || latestNotification.message.toLowerCase().includes("feed")) {
        console.log("🔔 New feed-related notification detected, refetching posts...");
        fetchPosts();
      }
    }
  }, [notifications, fetchPosts]);

  const sortPosts = useCallback(
    (posts: Post[]) => {
      if (sortBy === "date") {
        return [...posts].sort((a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime());
      } else if (sortBy === "rating") {
        return [...posts].sort((a, b) => {
          const userIdA = isShop && activeTab === "booking" ? a.clientId : a.shopId;
          const userIdB = isShop && activeTab === "booking" ? b.clientId : b.shopId;
          const ratingA = userIdA ? ratings[userIdA] || 0 : 0;
          const ratingB = userIdB ? ratings[userIdB] || 0 : 0;
          return ratingB - ratingA;
        });
      }
      return posts;
    },
    [sortBy, ratings, isShop, activeTab]
  );

  useEffect(() => {
    const postsToSort = isShop ? (activeTab === "design" ? designPosts : bookingPosts) : designPosts;
    const sortedPosts = sortPosts(postsToSort);
    if (isShop) {
      if (activeTab === "design" && JSON.stringify(designPosts) !== JSON.stringify(sortedPosts)) {
        setDesignPosts(sortedPosts);
      } else if (activeTab === "booking" && JSON.stringify(bookingPosts) !== JSON.stringify(sortedPosts)) {
        setBookingPosts(sortedPosts);
      }
    } else if (JSON.stringify(designPosts) !== JSON.stringify(sortedPosts)) {
      setDesignPosts(sortedPosts);
    }
  }, [sortBy, ratings, activeTab, isShop, designPosts, bookingPosts, sortPosts]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files).slice(0, 5));
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.style.display = "none";
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const feedType = isShop ? activeTab : userType === "fan" ? "booking" : "design";
      const postData = { title, description, location, feedType };

      console.log("🔍 Post Data:", postData);

      const createResponse = await api.post("/api/posts/create", postData, {
        headers: { "Content-Type": "application/json" },
      });
      console.log("✅ Post Creation Response:", createResponse.data);

      const newPost = createResponse.data.post; // Access the post from createResponse.data.post

      if (!newPost || !newPost.id) {
        throw new Error("Invalid post data received from server");
      }

      if (images.length > 0) {
        const formData = new FormData();
        formData.append("postId", newPost.id);
        images.forEach((image) => formData.append("images", image));

        console.log("🔍 Uploading Images for Post:", newPost.id);
        const uploadResponse = await api.post("/api/posts/upload-images", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        console.log("✅ Image Upload Response:", uploadResponse.data);

        newPost.images = uploadResponse.data.imageUrls || [];
      }

      // Ensure newPost has all required fields
      const formattedPost: Post = {
        id: newPost.id,
        title: newPost.title || "Untitled",
        description: newPost.description || "No description",
        location: newPost.location || "Unknown",
        feedType: newPost.feedType || feedType,
        status: newPost.status || "open",
        images: newPost.images || [],
        createdAt: newPost.createdAt || new Date().toISOString(),
        comments: newPost.comments || [],
        shop: newPost.shop || undefined,
        client: newPost.client || undefined,
        clientId: newPost.clientId || null,
        shopId: newPost.shopId || null,
      };

      if (isShop) {
        if (activeTab === "design") {
          setDesignPosts((prev) => {
            const updatedPosts = [formattedPost, ...prev];
            console.log("🔍 Updated Design Posts:", updatedPosts);
            return updatedPosts;
          });
        } else {
          setBookingPosts((prev) => {
            const updatedPosts = [formattedPost, ...prev];
            console.log("🔍 Updated Booking Posts:", updatedPosts);
            return updatedPosts;
          });
        }
      } else {
        setDesignPosts((prev) => {
          const updatedPosts = [formattedPost, ...prev];
          console.log("🔍 Updated Design Posts:", updatedPosts);
          return updatedPosts;
        });
      }

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
    if (!text) return "No content";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const postsToShow = isShop ? (activeTab === "design" ? designPosts : bookingPosts) : designPosts;

  console.log("🔍 Posts to Show:", postsToShow);

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
              Feed
            </motion.h1>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {isShop && (
                <div className="flex space-x-2">
                  <motion.button
                    onClick={() => setActiveTab("design")}
                    className={`px-4 py-2 rounded-sm font-semibold transition duration-300 ${
                      activeTab === "design"
                        ? "bg-accent-red text-light-white"
                        : "bg-dark-gray text-text-gray hover:bg-accent-gray"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Design
                  </motion.button>
                  <motion.button
                    onClick={() => setActiveTab("booking")}
                    className={`px-4 py-2 rounded-sm font-semibold transition duration-300 ${
                      activeTab === "booking"
                        ? "bg-accent-red text-light-white"
                        : "bg-dark-gray text-text-gray hover:bg-accent-gray"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Booking
                  </motion.button>
                </div>
              )}
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
              {(isShop && isPaid) || (!isShop && userType === "fan") ? (
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
                  {isShop && !isPaid
                    ? "Complete payment to post"
                    : "Only " + (isShop ? "Shop Pros" : "Ink Hunters") + " can post here"}
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
            {postsToShow.map((post, index) => {
              // Add robust null check to ensure post exists and has required fields
              if (!post || !post.id) {
                console.warn("🔴 Skipping invalid post:", post);
                return null;
              }

              const truncatedDescription = truncateText(post.description || "No description", 100);
              const visibleComments = post.comments?.slice(0, 2) || [];
              const userId = isShop && activeTab === "booking" ? post.clientId : post.shopId;
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
                        {post.title || "Untitled"}
                      </h2>
                      <p className="text-text-gray mt-2">{truncatedDescription}</p>
                      <p className="text-text-gray mt-1">Location: {post.location || "Unknown"}</p>
                      <p className="text-text-gray text-sm mt-1">
                        Posted by:{" "}
                        <Link
                          to={`/profile/${isShop && activeTab === "booking" ? post.clientId : post.shopId}`}
                          className="text-accent-red hover:underline"
                        >
                          {(isShop && activeTab === "booking" ? post.client?.username : post.shop?.username) || "Unknown"}
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
                              <p>Contact: {post.contactInfo.phone || "N/A"}</p>
                              <p>Email: {post.contactInfo.email || "N/A"}</p>
                            </>
                          )}
                          <p>
                            With:{" "}
                            <Link
                              to={`/profile/${isShop && activeTab === "booking" ? post.shopId : post.clientId}`}
                              className="text-accent-red hover:underline"
                            >
                              {(isShop && activeTab === "booking" ? post.shop?.username : post.client?.username) || "Unknown"}
                            </Link>
                          </p>
                        </div>
                      )}
                    </div>
                    {(viewType === "tiled" || viewType === "list") && post.images && post.images[0] && (
                      <motion.img
                        src={post.images[0]} // Use the Cloudinary URL directly
                        alt={post.title || "Post Image"}
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
                          <p>{truncateText(comment.content || "No content", 50)}</p>
                          {comment.price && <p>Price: ${comment.price.toFixed(2)}</p>}
                          <p>
                            By:{" "}
                            <Link to={`/profile/${comment.userId}`} className="text-accent-red hover:underline">
                              {comment.user?.username || "Unknown"}
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
              New {isShop ? activeTab.charAt(0).toUpperCase() + activeTab.slice(1) : userType === "fan" ? "Booking" : "Design"} Post
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
                  required
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
                <label
                  htmlFor="image-upload"
                  className="inline-block p-2 bg-dark-black border border-accent-gray rounded-sm cursor-pointer hover:bg-accent-gray transition duration-200"
                  title="Upload Images"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-light-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </label>
                <motion.input
                  id="image-upload"
                  type="file"
                  name="images"
                  multiple
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleImageChange}
                  className="hidden"
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