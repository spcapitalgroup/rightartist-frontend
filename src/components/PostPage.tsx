import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { motion } from "framer-motion";

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

const PostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [error, setError] = useState("");
  const [newComment, setNewComment] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = localStorage.getItem("authToken");
  const decoded = token ? JSON.parse(atob(token.split(".")[1])) : {};
  const userId = decoded.id || "";
  const userType = decoded.userType || "fan";
  const isShop = userType === "shop";
  const isDesigner = userType === "designer";
  const isFan = userType === "fan";
  const canComment =
    (isShop && post?.feedType === "design") ||
    (isDesigner && post?.feedType === "design") ||
    (isFan && post?.feedType === "booking");
  const canSchedule =
    (isShop && post?.feedType === "booking") ||
    (isFan && post?.feedType === "booking");
  const canRate =
    post?.status === "completed" &&
    ((isShop && post?.clientId) || (isFan && post?.shopId) || (isDesigner && post?.shopId));

  useEffect(() => {
    const fetchPost = async () => {
      try {
        if (!id) throw new Error("No post ID provided");
        const postResponse = await api.get(`/api/posts/${id}`);
        if (!postResponse.data) throw new Error("Post not found");
        setPost(postResponse.data);
        setError("");
      } catch (err: any) {
        console.error("❌ Post Fetch Error:", err.response?.data || err.message);
        setError(err.response?.data?.message || "Failed to load post");
      }
    };

    const fetchComments = async () => {
      try {
        if (!id) return;
        const commentsResponse = await api.get(`/api/comments/post/${id}`);
        setComments(commentsResponse.data.comments || []);
      } catch (err: any) {
        console.error("❌ Comments Fetch Error:", err.response?.data || err.message);
        setComments([]);
      }
    };

    const fetchRatings = async () => {
      try {
        if (!id) return;
        const ratingsResponse = await api.get(`/api/ratings/post/${id}`);
        setRatings(ratingsResponse.data.ratings || []);
      } catch (err: any) {
        console.error("❌ Ratings Fetch Error:", err.response?.data || err.message);
        setRatings([]);
      }
    };

    fetchPost();
    fetchComments();
    fetchRatings();
  }, [id]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !id) return;
    setIsSubmitting(true);

    try {
      const commentData = {
        content: newComment,
        postId: id,
        parentId: replyingTo,
        price: newPrice ? parseFloat(newPrice) : undefined,
      };

      const response = await api.post("/api/comments", commentData);
      const newCommentData = response.data.data; // Backend returns { data: comment }
      
      setComments((prev) => {
        if (replyingTo) {
          return prev.map((comment) =>
            comment.id === replyingTo
              ? { ...comment, replies: [...(comment.replies || []), newCommentData] }
              : comment
          );
        }
        return [...prev, newCommentData];
      });

      setNewComment("");
      setNewPrice("");
      setReplyingTo(null);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to post comment");
      console.error("❌ Comment Error:", err.response?.data || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptComment = async (commentId: string) => {
    try {
      if (!id) throw new Error("No post ID provided");
      await api.put(`/api/posts/${id}/accept`, { commentId });
      setPost((prev) =>
        prev
          ? {
              ...prev,
              status: "accepted",
              comments: prev.comments.map((c) =>
                c.id === commentId ? { ...c, accepted: true } : c
              ),
            }
          : prev
      );
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to accept comment");
      console.error("❌ Accept Comment Error:", err.response?.data || err.message);
    }
  };

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !ratingValue || !id || !post) return;
    setIsSubmitting(true);

    try {
      const rateeId = isShop
        ? post.clientId
        : isFan
        ? post.shopId
        : isDesigner
        ? post.shopId
        : null;
      if (!rateeId) throw new Error("No ratee ID found");

      const ratingData = {
        postId: id,
        raterId: userId,
        rateeId,
        rating: ratingValue,
        comment: ratingComment,
      };

      const response = await api.post("/api/ratings", ratingData);
      setRatings((prev) => [...prev, response.data]);
      setRatingValue(0);
      setRatingComment("");
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit rating");
      console.error("❌ Rating Error:", err.response?.data || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.style.display = "none";
  };

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen pt-20 pb-8 px-4 bg-dark-black text-light-white flex items-center justify-center"
      >
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-red-500 text-xl">{error}</p>
          <motion.button
            onClick={() => navigate(-1)}
            className="mt-4 bg-accent-red text-light-white px-6 py-2 rounded-sm font-semibold hover:bg-red-700 transition duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Go Back
          </motion.button>
        </div>
      </motion.div>
    );
  }

  if (!post) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen pt-20 pb-8 px-4 bg-dark-black text-light-white flex items-center justify-center"
      >
        <div className="max-w-4xl mx-auto text-center">Loading...</div>
      </motion.div>
    );
  }

  const canSeeContactInfo = (isShop && post.shopId === userId) || (isFan && post.clientId === userId);

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
          <h1 className="text-3xl font-semibold text-light-white mb-6 tracking-wide">
            {post.title}
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-text-gray">{post.description}</p>
              <p className="text-text-gray mt-2">Location: {post.location}</p>
              <p className="text-text-gray mt-1">
                Posted by:{" "}
                <Link
                  to={`/profile/${post.feedType === "design" ? post.shopId : post.clientId}`}
                  className="text-accent-red hover:underline"
                >
                  {post.feedType === "design" ? post.shop?.username : post.client?.username || "Unknown"}
                </Link>
              </p>
              <p className="text-text-gray mt-1">Status: {post.status}</p>
              <p className="text-text-gray mt-1">
                Created: {new Date(post.createdAt).toLocaleDateString()}
              </p>
              {post.status === "scheduled" && post.scheduledDate && (
                <div className="text-text-gray mt-2">
                  <p key="scheduled">Scheduled: {new Date(post.scheduledDate).toLocaleString()}</p>
                  {canSeeContactInfo && post.contactInfo && (
                    <>
                      <p key="phone">Contact: {post.contactInfo.phone}</p>
                      <p key="email">Email: {post.contactInfo.email}</p>
                    </>
                  )}
                  <p key="with">
                    With:{" "}
                    <Link
                      to={`/profile/${post.feedType === "booking" ? post.shopId : post.clientId}`}
                      className="text-accent-red hover:underline"
                    >
                      {post.feedType === "booking" ? post.shop?.username : post.client?.username || "Unknown"}
                    </Link>
                  </p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {post.images.map((image, index) => (
                <motion.img
                  key={image}
                  src={`http://localhost:3000/uploads/${image}`}
                  alt={`Post ${index + 1}`}
                  className="w-full h-32 object-cover rounded-sm hover:scale-105 transition-transform duration-300"
                  onError={handleImageError}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                />
              ))}
            </div>
          </div>

          {canSchedule && post.status === "accepted" && (
            <motion.button
              onClick={() => navigate(`/post/${id}/schedule`)}
              className="bg-accent-red text-light-white px-6 py-2 rounded-sm font-semibold hover:bg-red-700 transition duration-300 mb-6"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Schedule
            </motion.button>
          )}

          {canRate && !ratings.some((r) => r.raterId === userId) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 p-4 bg-dark-black rounded-sm border border-accent-gray"
            >
              <h2 className="text-2xl font-semibold text-light-white mb-4">Rate This Interaction</h2>
              <form onSubmit={handleRatingSubmit} className="space-y-4">
                <div>
                  <label className="block text-text-gray mb-1">Rating (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={ratingValue}
                    onChange={(e) => setRatingValue(Number(e.target.value))}
                    className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-text-gray mb-1">Comment (Optional)</label>
                  <textarea
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                    rows={3}
                  />
                </div>
                <motion.button
                  type="submit"
                  className="bg-accent-red text-light-white px-6 py-2 rounded-sm font-semibold hover:bg-red-700 transition duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Rating"}
                </motion.button>
              </form>
            </motion.div>
          )}

          {ratings.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 p-4 bg-dark-black rounded-sm border border-accent-gray"
            >
              <h2 className="text-2xl font-semibold text-light-white mb-4">Ratings</h2>
              {ratings.map((rating) => (
                <motion.div
                  key={rating.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-dark-gray p-4 rounded-sm border border-accent-gray mb-2"
                >
                  <p key="rater" className="text-text-gray">
                    <Link to={`/profile/${rating.raterId}`} className="text-accent-red hover:underline">
                      {rating.rater.username}
                    </Link>{" "}
                    rated{" "}
                    <Link to={`/profile/${rating.rateeId}`} className="text-accent-red hover:underline">
                      {rating.ratee.username}
                    </Link>
                  </p>
                  <p key="rating" className="text-text-gray mt-1">
                    Rating: <span className="text-light-white">{rating.rating} ★★★★★</span>
                  </p>
                  {rating.comment && (
                    <p key="comment" className="text-text-gray mt-1">
                      Comment: <span className="text-light-white">{rating.comment}</span>
                    </p>
                  )}
                  <p key="date" className="text-text-gray text-sm mt-1">
                    Rated on: {new Date(rating.createdAt).toLocaleDateString()}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          )}

          <h2 className="text-2xl font-semibold text-light-white mb-4">Comments</h2>
          {canComment && (
            <motion.form
              onSubmit={handleCommentSubmit}
              className="mb-6 space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div>
                <label className="block text-text-gray mb-1">
                  {replyingTo ? "Reply" : "New Comment"}
                </label>
                <textarea
                  value={replyingTo ? replyContent : newComment}
                  onChange={(e) =>
                    replyingTo ? setReplyContent(e.target.value) : setNewComment(e.target.value)
                  }
                  className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                  rows={3}
                  required
                />
              </div>
              {(isShop || isDesigner) && post.feedType === "design" && !replyingTo && (
                <div>
                  <label className="block text-text-gray mb-1">Price (Optional)</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                  />
                </div>
              )}
              <div className="flex space-x-2">
                <motion.button
                  type="submit"
                  className="bg-accent-red text-light-white px-6 py-2 rounded-sm font-semibold hover:bg-red-700 transition duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Posting..." : replyingTo ? "Post Reply" : "Post Comment"}
                </motion.button>
                {replyingTo && (
                  <motion.button
                    type="button"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyContent("");
                    }}
                    className="bg-accent-gray text-light-white px-4 py-2 rounded-sm hover:bg-gray-600 transition duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel Reply
                  </motion.button>
                )}
              </div>
            </motion.form>
          )}

          <div className="space-y-4">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-dark-black p-4 rounded-sm shadow-sm border border-accent-gray hover:shadow-xl hover:border-accent-red transition-all duration-300"
                >
                  <p key="content" className="text-text-gray">{comment.content}</p>
                  {comment.price !== undefined && comment.price !== null && (
                    <p key="price" className="text-text-gray mt-1">
                      Price: ${comment.price.toFixed(2)}
                    </p>
                  )}
                  <p key="user" className="text-text-gray text-sm mt-1">
                    By:{" "}
                    <Link to={`/profile/${comment.userId}`} className="text-accent-red hover:underline">
                      {comment.user?.username}
                    </Link>
                  </p>
                  <p key="date" className="text-text-gray text-sm mt-1">
                    Posted: {new Date(comment.createdAt).toLocaleDateString()}
                  </p>
                  {isShop && post.feedType === "design" && post.status === "open" && (
                    <motion.button
                      onClick={() => handleAcceptComment(comment.id)}
                      className="mt-2 bg-accent-red text-light-white px-4 py-1 rounded-sm hover:bg-red-700 transition duration-200"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Accept
                    </motion.button>
                  )}
                  {canComment && (
                    <motion.button
                      onClick={() => {
                        setReplyingTo(comment.id);
                        setReplyContent("");
                      }}
                      className="mt-2 ml-2 text-accent-red hover:underline text-sm"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Reply
                    </motion.button>
                  )}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-6 mt-4 space-y-2">
                      {comment.replies.map((reply) => (
                        <div
                          key={reply.id}
                          className="bg-dark-gray p-3 rounded-sm border border-accent-gray"
                        >
                          <p key="content" className="text-text-gray">{reply.content}</p>
                          <p key="user" className="text-text-gray text-sm mt-1">
                            By:{" "}
                            <Link to={`/profile/${reply.userId}`} className="text-accent-red hover:underline">
                              {reply.user?.username}
                            </Link>
                          </p>
                          <p key="date" className="text-text-gray text-sm mt-1">
                            Posted: {new Date(reply.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))
            ) : (
              <p className="text-text-gray">No comments yet.</p>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PostPage;