import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

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
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: { content: string; price?: string } }>({});
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [viewType, setViewType] = useState<"list" | "tiled">("list");
  const [sortByDate, setSortByDate] = useState(false);

  // Use the correct token key ("authToken" instead of "token")
  const token = localStorage.getItem("authToken");
  const decoded = token ? JSON.parse(atob(token.split(".")[1])) : {};
  const userType = decoded.userType || "fan";
  const userId = decoded.id;
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
      setPosts((prevPosts) => [...prevPosts].sort((a, b) => {
        return new Date(a.createdAt || "").getTime() - new Date(b.createdAt || "").getTime();
      }));
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

  const handleCommentSubmit = async (postId: string, parentId?: string) => {
    try {
      const { content, price } = commentInputs[postId] || {};
      if (!content) return;

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/comments/${postId}`, {
        content,
        parentId,
        price: feedType === "design" ? parseFloat(price || "0") : undefined,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(posts.map(post => post.id === postId ? {
        ...post,
        comments: parentId
          ? post.comments?.map(c => c.id === parentId ? { ...c, replies: [...(c.replies || []), response.data.data] } : c)
          : [...(post.comments || []), response.data.data],
      } : post));
      setCommentInputs({ ...commentInputs, [postId]: { content: "", price: "" } });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to comment");
      console.error("❌ Comment Error:", err.response?.data || err.message);
    }
  };

  const handleCommentEdit = async (commentId: string) => {
    try {
      const postId = posts.find(p => p.comments?.some(c => c.id === commentId))?.id;
      const { content, price } = commentInputs[postId!] || {};
      if (!content) return;

      const response = await axios.put(`${process.env.REACT_APP_API_URL}/api/comments/${commentId}`, {
        content,
        price: feedType === "design" ? parseFloat(price || "0") : undefined,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(posts.map(post => post.id === postId ? {
        ...post,
        comments: post.comments?.map(c => c.id === commentId ? response.data.data : c),
      } : post));
      setEditingComment(null);
      setCommentInputs({ ...commentInputs, [postId!]: { content: "", price: "" } });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to edit comment");
      console.error("❌ Edit Comment Error:", err.response?.data || err.message);
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
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
              className="text-tattoo-gray text-sm border border-tattoo-gray px-3 py-1 rounded-lg hover:bg-tattoo-gray/20"
            >
              {viewType === "list" ? "Switch to Tiled View" : "Switch to List View"}
            </button>
            <button
              onClick={() => setSortByDate(!sortByDate)}
              className="text-tattoo-gray text-sm border border-tattoo-gray px-3 py-1 rounded-lg hover:bg-tattoo-gray/20"
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
        <div className={`space-y-6 ${viewType === "tiled" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : ""}`}>
          {posts.map((post) => {
            const canCommentDesign = feedType === "design" && userType === "designer" && !post.comments?.some(c => c.userId === userId);
            const canCommentBooking = feedType === "booking" && userType === "designer" && !post.comments?.some(c => c.userId === userId && !c.parentId);
            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${
                  viewType === "tiled"
                    ? "bg-tattoo-gray/20 p-4 rounded-lg shadow-lg border border-tattoo-red/30"
                    : "bg-tattoo-gray/20 p-6 rounded-lg shadow-lg border border-tattoo-red/30"
                }`}
              >
                <div className="flex flex-col sm:flex-row items-center space-x-6">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-tattoo-light">{post.title}</h2>
                    <p className="text-tattoo-gray mt-2">{post.description}</p>
                    <p className="text-tattoo-gray mt-1">Location: {post.location}</p>
                    <p className="text-tattoo-gray text-sm mt-1">
                      Posted: {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : "Unknown"}
                    </p>
                  </div>
                  {viewType === "tiled" && post.images && post.images[0] && (
                    <img
                      src={`http://localhost:3000/uploads/${post.images[0]}`}
                      alt={post.title}
                      className="w-32 h-32 object-cover rounded-lg mt-4 sm:mt-0"
                    />
                  )}
                  {viewType === "list" && post.images && post.images[0] && (
                    <img
                      src={`http://localhost:3000/uploads/${post.images[0]}`}
                      alt={post.title}
                      className="w-32 h-32 object-cover rounded-lg mt-4 sm:mt-0"
                    />
                  )}
                </div>
                <div className="mt-4">
                  {post.comments?.map(comment => (
                    <div key={comment.id} className={`ml-${comment.parentId ? 4 : 0} mt-2 border-l border-tattoo-gray pl-2`}>
                      <p className="text-tattoo-light">{comment.content}</p>
                      {comment.price && <p className="text-tattoo-gray">Price: ${comment.price.toFixed(2)}</p>}
                      <p className="text-tattoo-gray text-sm">By: {comment.user?.username}</p>
                      <p className="text-tattoo-gray text-sm">
                        {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : "Unknown"}
                      </p>
                      {comment.userId === userId && (
                        <button
                          onClick={() => setEditingComment(comment.id)}
                          className="text-tattoo-red hover:underline text-sm"
                        >
                          Edit
                        </button>
                      )}
                      {editingComment === comment.id ? (
                        <div className="mt-2">
                          <textarea
                            value={commentInputs[post.id]?.content || comment.content}
                            onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: { ...commentInputs[post.id], content: e.target.value } })}
                            className="w-full p-2 bg-tattoo-black border border-tattoo-gray rounded-lg text-tattoo-light"
                          />
                          {feedType === "design" && (
                            <input
                              type="number"
                              value={commentInputs[post.id]?.price || comment.price || ""}
                              onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: { ...commentInputs[post.id], price: e.target.value } })}
                              placeholder="Price"
                              className="w-full p-2 mt-2 bg-tattoo-black border border-tattoo-gray rounded-lg text-tattoo-light"
                            />
                          )}
                          <button
                            onClick={() => handleCommentEdit(comment.id)}
                            className="mt-2 bg-tattoo-red text-tattoo-light px-4 py-1 rounded-lg hover:bg-tattoo-red/80"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        feedType === "booking" && userType === "designer" && comment.userId === userId && (
                          <div className="mt-2">
                            <textarea
                              value={commentInputs[post.id + "-sub"]?.content || ""}
                              onChange={(e) => setCommentInputs({ ...commentInputs, [post.id + "-sub"]: { content: e.target.value } })}
                              placeholder="Reply..."
                              className="w-full p-2 bg-tattoo-black border border-tattoo-gray rounded-lg text-tattoo-light"
                            />
                            <button
                              onClick={() => handleCommentSubmit(post.id, comment.id)}
                              className="mt-2 bg-tattoo-red text-tattoo-light px-4 py-1 rounded-lg hover:bg-tattoo-red/80"
                            >
                              Reply
                            </button>
                          </div>
                        )
                      )}
                      {comment.replies?.map(reply => (
                        <div key={reply.id} className="ml-4 mt-2 border-l border-tattoo-gray pl-2">
                          <p className="text-tattoo-light">{reply.content}</p>
                          <p className="text-tattoo-gray text-sm">By: {reply.user?.username}</p>
                          <p className="text-tattoo-gray text-sm">
                            {reply.createdAt ? formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true }) : "Unknown"}
                          </p>
                        </div>
                      ))}
                    </div>
                  ))}
                  {(canCommentDesign || canCommentBooking) && (
                    <div className="mt-4">
                      <textarea
                        value={commentInputs[post.id]?.content || ""}
                        onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: { ...commentInputs[post.id], content: e.target.value } })}
                        placeholder={feedType === "design" ? "Submit your design..." : "Respond to booking..."}
                        className="w-full p-2 bg-tattoo-black border border-tattoo-gray rounded-lg text-tattoo-light"
                      />
                      {feedType === "design" && (
                        <input
                          type="number"
                          value={commentInputs[post.id]?.price || ""}
                          onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: { ...commentInputs[post.id], price: e.target.value } })}
                          placeholder="Price"
                          className="w-full p-2 mt-2 bg-tattoo-black border border-tattoo-gray rounded-lg text-tattoo-light"
                        />
                      )}
                      <button
                        onClick={() => handleCommentSubmit(post.id)}
                        className="mt-2 bg-tattoo-red text-tattoo-light px-4 py-1 rounded-lg hover:bg-tattoo-red/80"
                      >
                        {feedType === "design" ? "Submit Design" : "Respond"}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {isModalOpen && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={modalVariants}
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
                className="w-full p-2 bg-tattoo-black border border-tattoo-gray rounded-lg text-tattoo-light focus:outline-none focus:ring-2 focus:ring-tattoo-red"
                required
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
                className="w-full p-2 bg-tattoo-black border border-tattoo-gray rounded-lg text-tattoo-light focus:outline-none focus:ring-2 focus:ring-tattoo-red"
                rows={3}
                required
              />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location"
                className="w-full p-2 bg-tattoo-black border border-tattoo-gray rounded-lg text-tattoo-light focus:outline-none focus:ring-2 focus:ring-tattoo-red"
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