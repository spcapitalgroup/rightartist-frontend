import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

interface Post {
  id: string;
  title: string;
  description: string;
  location: string;
  feedType: "design" | "booking";
  status?: "open" | "closed";
  clientId?: string | null;
  shopId?: string | null;
  images?: string[];
  createdAt?: string;
  comments?: Comment[];
  shop?: { id: string; username: string }; // Added for Design Feed posts
  client?: { id: string; username: string }; // Added for Booking Feed posts
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
  const [sortByDate, setSortByDate] = useState(false);

  // Use the correct token key ("authToken" instead of "token")
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

        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/feed/`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { feedType },
        });
        console.log(`🔍 ${feedType} Feed Response:`, response.data);
        setPosts(response.data.posts || []);
      } catch (err: any) {
        console.error(`❌ ${feedType} Feed Fetch Error:`, err.response?.data || err.message);
        setError(err.response?.data?.message || "Failed to load feed");
      }
    };
    fetchPosts();
  }, [feedType, token]); // Add token as a dependency to re-fetch if it changes

  // Sort posts by createdAt timestamp
  useEffect(() => {
    if (sortByDate) {
      setPosts((prevPosts) =>
        [...prevPosts].sort((a, b) => {
          return new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime();
        })
      );
    } else {
      setPosts((prevPosts) =>
        [...prevPosts].sort((a, b) => {
          return new Date(a.createdAt || "").getTime() - new Date(b.createdAt || "").getTime();
        })
      );
    }
  }, [sortByDate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files).slice(0, 5));
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("location", location);
      formData.append("feedType", feedType);
      images.forEach((image) => formData.append("images", image));

      console.log("🔍 FormData contents:");
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value instanceof File ? `${value.name} (${value.size} bytes)` : value}`);
      }

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/posts`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("✅ Post Response:", response.data);
      setPosts([response.data.data, ...posts]);
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

  // Helper to truncate text
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen pt-20 pb-8 px-4 bg-tattoo-black"
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-tattoo-red">
            {feedType === "design" ? "Design Feed" : "Booking Feed"}
          </h1>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => setViewType(viewType === "list" ? "tiled" : "list")}
              className="text-tattoo-gray text-sm border border-tattoo-gray px-3 py-1 rounded-lg hover:bg-tattoo-gray/20 transition duration-200"
            >
              {viewType === "list" ? "Switch to Tiled View" : "Switch to List View"}
            </button>
            <button
              onClick={() => setSortByDate(!sortByDate)}
              className="text-tattoo-gray text-sm border border-tattoo-gray px-3 py-1 rounded-lg hover:bg-tattoo-gray/20 transition duration-200"
            >
              Sort by Date
            </button>
            {(feedType === "design" && userType === "shop" && isPaid) ||
             (feedType === "booking" && userType === "fan") ? (
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-tattoo-red text-tattoo-light px-4 py-2 rounded-lg hover:bg-tattoo-red/80 transition duration-200 font-bold"
              >
                New Post
              </button>
            ) : (
              <p className="text-tattoo-gray">
                {feedType === "design" && !isPaid && userType === "shop"
                  ? "Complete payment to post"
                  : "Only " + (feedType === "design" ? "Shop Pros" : "Ink Hunters") + " can post here"}
              </p>
            )}
          </div>
        </div>
        {error && <p className="text-tattoo-red mb-4">{error}</p>}
        <div className={`space-y-6 ${viewType === "tiled" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 grid-auto-rows-[256px] items-stretch" : ""}`}>
          {posts.map((post) => {
            const truncatedDescription = truncateText(post.description, 100);
            const visibleComments = post.comments?.slice(0, 2) || []; // Show only first 2 comments

            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`${
                  viewType === "tiled"
                    ? "bg-tattoo-gray/20 p-4 rounded-lg shadow-lg border border-tattoo-red/30 grid grid-rows-[1fr_auto] h-[256px] box-border overflow-hidden hover:scale-105 hover:shadow-xl transition-transform duration-200"
                    : "bg-tattoo-gray/20 p-6 rounded-lg shadow-lg border border-tattoo-red/30 grid grid-rows-[1fr_auto] h-[256px] box-border overflow-hidden hover:scale-105 hover:shadow-xl transition-transform duration-200"
                }`}
              >
                <div className="overflow-y-auto">
                  <div className="flex flex-col sm:flex-row items-center space-x-6">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-tattoo-light hover:text-tattoo-red transition-colors duration-200">{post.title}</h2>
                      <p className="text-tattoo-gray mt-2">{truncatedDescription}</p>
                      <p className="text-tattoo-gray mt-1">Location: {post.location}</p>
                      <p className="text-tattoo-gray text-sm mt-1">
                        Posted by: {feedType === "design" ? post.shop?.username : post.client?.username || "Unknown"}
                      </p>
                      <p className="text-tattoo-gray text-sm mt-1">
                        Posted: {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : "Unknown"}
                      </p>
                    </div>
                    {(viewType === "tiled" || viewType === "list") && post.images && post.images[0] && (
                      <img
                        src={`http://localhost:3000/uploads/${post.images[0]}`}
                        alt={post.title}
                        className="w-16 h-16 object-cover rounded-lg mt-4 sm:mt-0 hover:scale-110 hover:brightness-110 transition-transform duration-200"
                      />
                    )}
                  </div>
                  <div className="mt-2">
                    {visibleComments.length > 0 ? (
                      visibleComments.map(comment => (
                        <div key={comment.id} className="text-tattoo-gray text-sm">
                          <p>{truncateText(comment.content, 50)}</p>
                          {comment.price && <p>Price: ${comment.price.toFixed(2)}</p>}
                          <p>By: {comment.user?.username}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-tattoo-gray text-sm">No comments yet.</p>
                    )}
                    {post.comments && post.comments.length > 2 && (
                      <p className="text-tattoo-gray text-sm mt-1">
                        {post.comments.length - 2} more comment{post.comments.length - 2 > 1 ? "s" : ""}...
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-2">
                  <Link
                    to={`/post/${post.id}`}
                    className="text-tattoo-red hover:underline text-sm"
                  >
                    See All
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {isModalOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="bg-tattoo-gray/20 p-6 rounded-lg shadow-lg border border-tattoo-red/30 w-full max-w-md">
            <h2 className="text-2xl font-bold text-tattoo-red mb-4">New {feedType === "design" ? "Design" : "Booking"} Post</h2>
            <form onSubmit={handlePostSubmit} className="space-y-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="w-full p-2 bg-tattoo-black border border-tattoo-gray rounded-lg text-tattoo-light focus:outline-none focus:ring-2 focus:ring-tattoo-red transition duration-200"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
                className="w-full p-2 bg-tattoo-black border border-tattoo-gray rounded-lg text-tattoo-light focus:outline-none focus:ring-2 focus:ring-tattoo-red transition duration-200"
                rows={3}
                required
              />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location"
                className="w-full p-2 bg-tattoo-black border border-tattoo-gray rounded-lg text-tattoo-light focus:outline-none focus:ring-2 focus:ring-tattoo-red transition duration-200"
                required
              />
              <input
                type="file"
                name="images"
                multiple
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleImageChange}
                className="w-full text-tattoo-light"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-tattoo-gray text-tattoo-light rounded-lg hover:bg-tattoo-gray/80 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-tattoo-red text-tattoo-light rounded-lg hover:bg-tattoo-red/80 transition duration-200 font-bold"
                >
                  Post
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default FeedPage;