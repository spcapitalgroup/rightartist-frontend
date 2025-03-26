import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { useParams, useNavigate } from "react-router-dom";

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

const PostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // Get post ID from URL
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState("");
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: { content: string; price?: string } }>({});
  const [editingComment, setEditingComment] = useState<string | null>(null);

  const token = localStorage.getItem("authToken");
  const decoded = token ? JSON.parse(atob(token.split(".")[1])) : {};
  const userType = decoded.userType || "fan";
  const userId = decoded.id;

  useEffect(() => {
    const fetchPost = async () => {
      try {
        if (!token || !id) {
          setError("Please log in to view this post");
          return;
        }

        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/feed/`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { postId: id }, // Assuming the backend supports fetching a single post by ID
        });

        const posts = response.data.posts || [];
        if (posts.length === 0) {
          setError("Post not found");
          return;
        }

        setPost(posts[0]);
      } catch (err: any) {
        console.error("❌ Post Fetch Error:", err.response?.data || err.message);
        setError(err.response?.data?.message || "Failed to load post");
      }
    };
    fetchPost();
  }, [id, token]);

  const handleCommentSubmit = async (postId: string, parentId?: string) => {
    try {
      const { content, price } = commentInputs[postId] || {};
      if (!content) return;

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/comments/${postId}`, {
        content,
        parentId,
        price: post?.feedType === "design" ? parseFloat(price || "0") : undefined,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPost((prevPost) =>
        prevPost
          ? {
              ...prevPost,
              comments: parentId
                ? prevPost.comments?.map(c => c.id === parentId ? { ...c, replies: [...(c.replies || []), response.data.data] } : c)
                : [...(prevPost.comments || []), response.data.data],
            }
          : prevPost
      );
      setCommentInputs({ ...commentInputs, [postId]: { content: "", price: "" } });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to comment");
      console.error("❌ Comment Error:", err.response?.data || err.message);
    }
  };

  const handleCommentEdit = async (commentId: string) => {
    try {
      const postId = post?.id;
      const { content, price } = commentInputs[postId!] || {};
      if (!content) return;

      const response = await axios.put(`${process.env.REACT_APP_API_URL}/api/comments/${commentId}`, {
        content,
        price: post?.feedType === "design" ? parseFloat(price || "0") : undefined,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPost((prevPost) =>
        prevPost
          ? {
              ...prevPost,
              comments: prevPost.comments?.map(c => c.id === commentId ? response.data.data : c),
            }
          : prevPost
      );
      setEditingComment(null);
      setCommentInputs({ ...commentInputs, [postId!]: { content: "", price: "" } });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to edit comment");
      console.error("❌ Edit Comment Error:", err.response?.data || err.message);
    }
  };

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen pt-20 pb-8 px-4 bg-tattoo-black"
      >
        <div className="max-w-4xl mx-auto text-tattoo-red">{error}</div>
      </motion.div>
    );
  }

  if (!post) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen pt-20 pb-8 px-4 bg-tattoo-black"
      >
        <div className="max-w-4xl mx-auto text-tattoo-gray">Loading...</div>
      </motion.div>
    );
  }

  const canCommentDesign = post.feedType === "design" && userType === "designer" && !post.comments?.some(c => c.userId === userId);
  const canCommentBooking = post.feedType === "booking" && userType === "designer" && !post.comments?.some(c => c.userId === userId && !c.parentId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pt-20 pb-8 px-4 bg-tattoo-black"
    >
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(post.feedType === "design" ? "/design-feed" : "/booking-feed")}
          className="text-tattoo-red hover:underline mb-4"
        >
          ← Back to {post.feedType === "design" ? "Design Feed" : "Booking Feed"}
        </button>
        <div className="bg-tattoo-gray/20 p-6 rounded-lg shadow-lg border border-tattoo-red/30">
          <h2 className="text-2xl font-bold text-tattoo-light">{post.title}</h2>
          <p className="text-tattoo-gray mt-2">{post.description}</p>
          <p className="text-tattoo-gray mt-1">Location: {post.location}</p>
          <p className="text-tattoo-gray text-sm mt-1">
            Posted: {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : "Unknown"}
          </p>
          {post.images && post.images.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {post.images.map((image, index) => (
                <img
                  key={index}
                  src={`http://localhost:3000/uploads/${image}`}
                  alt={`${post.title} image ${index + 1}`}
                  className="w-32 h-32 object-cover rounded-lg"
                />
              ))}
            </div>
          )}
          <div className="mt-6">
            <h3 className="text-xl font-bold text-tattoo-red mb-2">Comments</h3>
            {post.comments && post.comments.length > 0 ? (
              post.comments.map(comment => (
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
                      {post.feedType === "design" && (
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
                    post.feedType === "booking" && userType === "designer" && comment.userId === userId && (
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
              ))
            ) : (
              <p className="text-tattoo-gray">No comments yet.</p>
            )}
            {(canCommentDesign || canCommentBooking) && (
              <div className="mt-4">
                <textarea
                  value={commentInputs[post.id]?.content || ""}
                  onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: { ...commentInputs[post.id], content: e.target.value } })}
                  placeholder={post.feedType === "design" ? "Submit your design..." : "Respond to booking..."}
                  className="w-full p-2 bg-tattoo-black border border-tattoo-gray rounded-lg text-tattoo-light"
                />
                {post.feedType === "design" && (
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
                  {post.feedType === "design" ? "Submit Design" : "Respond"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PostPage;