import React, { useState, useEffect } from "react";
import api from "../api/axios"; // Import the custom axios instance
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Link, useParams, useNavigate } from "react-router-dom";

interface Post {
  id: string;
  title: string;
  description: string;
  location: string;
  feedType: "design" | "booking";
  userId: string;
  clientId?: string | null;
  shopId?: string | null;
  artistId?: string | null;
  status: "open" | "accepted" | "scheduled" | "completed" | "cancelled";
  images: string[];
  scheduledDate?: string;
  contactInfo?: { phone: string; email: string };
  comments: Comment[];
  user: { id: string; username: string };
  shop?: { id: string; username: string };
  client?: { id: string; username: string };
  createdAt: string;
}

interface Comment {
  id: string;
  content: string;
  userId: string;
  postId: string;
  parentId: string | null;
  price?: number;
  estimatedDuration?: string;
  availability?: string;
  withdrawn: boolean;
  images: string[];
  user: { id: string; username: string };
  replies?: Comment[];
  createdAt: string;
}

const PostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [comment, setComment] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [availability, setAvailability] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [isReplying, setIsReplying] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [hasReviewed, setHasReviewed] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const token = localStorage.getItem("authToken");
  const decoded = token ? JSON.parse(atob(token.split(".")[1])) : {};
  const userId = decoded.id || "";
  const userType = decoded.userType || "";
  const isPostOwner = post?.userId === userId;
  const hasShopId = !!post?.shopId;

  useEffect(() => {
    const fetchPost = async () => {
      try {
        if (!token) {
          setError("Please log in to view this post");
          return;
        }

        const response = await api.get("/api/feed/", {
          params: { postId: id },
        });
        console.log("🔍 Fetched post:", response.data);
        const fetchedPost = response.data.posts[0];
        if (fetchedPost) {
          setPost(fetchedPost);

          if (fetchedPost.status === "completed" && fetchedPost.userId === userId) {
            const reviewResponse = await api.get(`/api/users/${fetchedPost.shopId}/reviews`);
            const userReview = reviewResponse.data.find((review: any) => review.bookingId === id);
            if (userReview) {
              setHasReviewed(true);
            } else {
              setShowReviewModal(true);
            }
          }
        } else {
          setError("Post not found");
        }
      } catch (err: any) {
        console.error("❌ Post Fetch Error:", err.response?.data || err.message);
        setError(err.response?.data?.message || "Failed to load post");
      }
    };
    fetchPost();
  }, [id, userId, token]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!token) {
        setError("Please log in to comment");
        return;
      }

      if (!comment) {
        setError("Comment content is required");
        return;
      }

      const formData = new FormData();
      formData.append("content", comment);
      if (parentId) formData.append("parentId", parentId);
      if (price) formData.append("price", price);
      if (estimatedDuration) formData.append("estimatedDuration", estimatedDuration);
      if (availability) formData.append("availability", availability);
      images.forEach((image) => formData.append("images", image));

      const response = await api.post(`/api/comments/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("✅ Comment Response:", response.data);

      const newComment = response.data.data;
      setPost((prev) => {
        if (!prev) return prev;
        if (parentId) {
          const updatedComments = prev.comments.map((c) => {
            if (c.id === parentId) {
              return { ...c, replies: [...(c.replies || []), newComment] };
            }
            return c;
          });
          return { ...prev, comments: updatedComments };
        }
        return { ...prev, comments: [...prev.comments, newComment] };
      });
      setComment("");
      setParentId(null);
      setPrice("");
      setEstimatedDuration("");
      setAvailability("");
      setImages([]);
      setError("");
      setIsReplying(null);
    } catch (err: any) {
      console.error("❌ Comment Error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to post comment");
    }
  };

  const handleAcceptPitch = async (commentId: string, shopId: string) => {
    try {
      if (!token) {
        setError("Please log in to accept a pitch");
        return;
      }

      const response = await api.post(`/api/posts/${id}/accept-pitch`, { commentId, shopId });
      console.log("✅ Accept Pitch Response:", response.data);
      setPost((prev) => {
        if (!prev) return prev;
        return { ...prev, shopId, status: "accepted" };
      });
      setError("");
    } catch (err: any) {
      console.error("❌ Accept Pitch Error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to accept pitch");
    }
  };

  const handleWithdrawPitch = async (commentId: string) => {
    try {
      if (!token) {
        setError("Please log in to withdraw a pitch");
        return;
      }

      const response = await api.post(`/api/comments/${commentId}/withdraw`, {});
      console.log("✅ Withdraw Pitch Response:", response.data);
      setPost((prev) => {
        if (!prev) return prev;
        const updatedComments = prev.comments.map((c) =>
          c.id === commentId ? { ...c, withdrawn: true } : c
        );
        return { ...prev, comments: updatedComments };
      });
      setError("");
    } catch (err: any) {
      console.error("❌ Withdraw Pitch Error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to withdraw pitch");
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!token) {
        setError("Please log in to submit a review");
        return;
      }

      if (!reviewRating) {
        setError("Please provide a rating");
        return;
      }

      const response = await api.post("/api/users/reviews", {
        targetUserId: post?.shopId,
        rating: reviewRating,
        comment: reviewComment,
        bookingId: id,
      });
      console.log("✅ Review Response:", response.data);
      setShowReviewModal(false);
      setHasReviewed(true);
      setError("");
    } catch (err: any) {
      console.error("❌ Review Error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to submit review");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files).slice(0, 5));
    }
  };

  const shouldShowScheduleButton = () => {
    if (!post) return false;
    const conditions = {
      feedType: post.feedType,
      userType,
      isPostOwner,
      hasShopId,
      status: post.status,
      shouldShowButton: post.feedType === "booking" && userType === "fan" && isPostOwner && hasShopId && post.status === "accepted",
    };
    console.log("🔍 Schedule an Ink Button Conditions:", conditions);
    return conditions.shouldShowButton;
  };

  const nonWithdrawnComments = post?.comments?.filter(comment => !comment.withdrawn) || [];

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen pt-20 pb-8 px-4 bg-dark-black text-light-white"
      >
        <div className="max-w-4xl mx-auto text-red-500">{error}</div>
      </motion.div>
    );
  }

  if (!post) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen pt-20 pb-8 px-4 bg-dark-black text-light-white"
      >
        <div className="max-w-4xl mx-auto">Loading...</div>
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
      <div className="max-w-4xl mx-auto">
        <div className="bg-dark-gray p-6 rounded-sm shadow-sm border border-accent-gray">
          <button
            onClick={() => navigate(-1)}
            className="text-accent-red hover:underline mb-4"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-semibold text-light-white mb-4">{post.title}</h1>
          <p className="text-text-gray mb-2">{post.description}</p>
          <p className="text-text-gray mb-2">Location: {post.location}</p>
          <p className="text-text-gray mb-2">
            Posted by: <Link to={`/profile/${post.userId}`} className="text-accent-red hover:underline">{post.user.username}</Link>
          </p>
          <p className="text-text-gray mb-2">
            Posted: {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </p>
          {post.status === "scheduled" && post.scheduledDate && (
            <div className="text-text-gray mb-4">
              <p>Scheduled: {new Date(post.scheduledDate).toLocaleString()}</p>
              {post.contactInfo && (
                <>
                  <p>Contact: {post.contactInfo.phone}</p>
                  <p>Email: {post.contactInfo.email}</p>
                </>
              )}
              <p>With: <Link to={`/profile/${post.shopId}`} className="text-accent-red hover:underline">{post.shop?.username}</Link></p>
            </div>
          )}
          {post.images && post.images.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {post.images.map((image, index) => (
                <img
                  key={index}
                  src={`http://localhost:3000/uploads/${image}`}
                  alt={`Post ${index + 1}`}
                  className="w-full h-40 object-cover rounded-sm hover:scale-105 transition-transform duration-200"
                />
              ))}
            </div>
          )}
          <h2 className="text-xl font-medium text-text-gray mb-4">Comments</h2>
          {nonWithdrawnComments.length > 0 ? (
            <>
              {post.feedType === "booking" && isPostOwner && nonWithdrawnComments.length > 1 && (
                <button
                  onClick={() => setShowCompareModal(true)}
                  className="mb-4 bg-accent-red text-light-white px-4 py-2 rounded-sm hover:bg-red-700 transition duration-200 font-semibold"
                >
                  Compare Pitches
                </button>
              )}
              {nonWithdrawnComments.map((c) => (
                <div key={c.id} className="mb-4 bg-dark-black p-4 rounded-sm border border-accent-gray">
                  <p className="text-light-white">{c.content}</p>
                  {c.price && <p className="text-text-gray">Price: ${c.price.toFixed(2)}</p>}
                  {c.estimatedDuration && <p className="text-text-gray">Duration: {c.estimatedDuration}</p>}
                  {c.availability && <p className="text-text-gray">Availability: {c.availability}</p>}
                  <p className="text-text-gray text-sm">
                    By: <Link to={`/profile/${c.userId}`} className="text-accent-red hover:underline">{c.user.username}</Link>
                  </p>
                  <p className="text-text-gray text-sm">
                    {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                  </p>
                  {c.images && c.images.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                      {c.images.map((image, index) => (
                        <img
                          key={index}
                          src={`http://localhost:3000/uploads/${image}`}
                          alt={`Comment ${index + 1}`}
                          className="w-full h-40 object-cover rounded-sm hover:scale-105 transition-transform duration-200"
                        />
                      ))}
                    </div>
                  )}
                  <div className="mt-2 flex space-x-2">
                    {post.feedType === "booking" && userType === "fan" && isPostOwner && !hasShopId && !c.parentId && !c.withdrawn && (
                      <button
                        onClick={() => handleAcceptPitch(c.id, c.userId)}
                        className="bg-accent-red text-light-white px-4 py-2 rounded-sm hover:bg-red-700 transition duration-200 font-semibold"
                      >
                        Accept Pitch
                      </button>
                    )}
                    {post.feedType === "booking" && userType === "shop" && c.userId === userId && !hasShopId && !c.parentId && !c.withdrawn && (
                      <button
                        onClick={() => handleWithdrawPitch(c.id)}
                        className="bg-accent-gray text-light-white px-4 py-2 rounded-sm hover:bg-gray-600 transition duration-200"
                      >
                        Withdraw Pitch
                      </button>
                    )}
                    {shouldShowScheduleButton() && !c.parentId && c.userId === post.shopId && (
                      <Link
                        to={`/post/${id}/schedule`}
                        className="text-accent-red hover:underline"
                      >
                        Schedule an Ink
                      </Link>
                    )}
                    {post.feedType === "booking" && userType === "fan" && c.userId === post.shopId && !c.replies?.length && (
                      <button
                        onClick={() => setIsReplying(c.id)}
                        className="text-accent-red hover:underline text-sm"
                      >
                        Reply
                      </button>
                    )}
                  </div>
                  {c.withdrawn && <p className="text-text-gray mt-2">Withdrawn</p>}
                  {isReplying === c.id && (
                    <form onSubmit={handleCommentSubmit} className="mt-2 space-y-2">
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Your reply..."
                        className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                        rows={2}
                        onFocus={() => setParentId(c.id)}
                      />
                      <div className="flex space-x-2">
                        <button
                          type="submit"
                          className="bg-accent-red text-light-white px-4 py-2 rounded-sm hover:bg-red-700 transition duration-200 font-semibold"
                        >
                          Reply
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsReplying(null);
                            setComment("");
                            setParentId(null);
                          }}
                          className="bg-accent-gray text-light-white px-4 py-2 rounded-sm hover:bg-gray-600 transition duration-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                  {c.replies && c.replies.length > 0 && (
                    <div className="ml-4 mt-2 space-y-2">
                      {c.replies.map((reply) => (
                        <div key={reply.id} className="bg-dark-gray p-2 rounded-sm border border-accent-gray">
                          <p className="text-light-white">{reply.content}</p>
                          <p className="text-text-gray text-sm">
                            By: <Link to={`/profile/${reply.userId}`} className="text-accent-red hover:underline">{reply.user.username}</Link>
                          </p>
                          <p className="text-text-gray text-sm">
                            {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          ) : (
            <p className="text-text-gray mb-4">No comments yet.</p>
          )}
          {(userType === "designer" || userType === "shop") && (
            <form onSubmit={handleCommentSubmit} className="space-y-4">
              <div>
                <label className="block text-text-gray mb-1">Add a Comment</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                  rows={3}
                />
              </div>
              {post.feedType === "booking" && userType === "shop" && !parentId && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-text-gray mb-1">Price</label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="Price"
                      className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-text-gray mb-1">Estimated Duration</label>
                    <input
                      type="text"
                      value={estimatedDuration}
                      onChange={(e) => setEstimatedDuration(e.target.value)}
                      placeholder="Estimated Duration (e.g., 2 hours)"
                      className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-text-gray mb-1">Availability</label>
                    <input
                      type="text"
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                      placeholder="Availability (e.g., Next week)"
                      className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                    />
                  </div>
                </div>
              )}
              {post.feedType === "design" && userType === "designer" && (
                <div>
                  <label className="block text-text-gray mb-1">Images</label>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleImageChange}
                    className="text-light-white"
                  />
                </div>
              )}
              <button
                type="submit"
                className="bg-accent-red text-light-white px-4 py-2 rounded-sm hover:bg-red-700 transition duration-200 font-semibold"
              >
                Post Comment
              </button>
            </form>
          )}
        </div>
      </div>

      {showReviewModal && !hasReviewed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="bg-dark-gray p-6 rounded-sm shadow-sm border border-accent-gray w-full max-w-md">
            <h2 className="text-2xl font-semibold text-light-white mb-4">Review Your Experience</h2>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-text-gray mb-1">Rating (1-5)</label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className={`text-2xl ${reviewRating >= star ? "text-yellow-400" : "text-text-gray"}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-text-gray mb-1">Review</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Your review..."
                  className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="bg-accent-gray text-light-white px-4 py-2 rounded-sm hover:bg-gray-600 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-accent-red text-light-white px-4 py-2 rounded-sm hover:bg-red-700 transition duration-200 font-semibold"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}

      {showCompareModal && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="bg-dark-gray p-6 rounded-sm shadow-sm border border-accent-gray w-full max-w-4xl">
            <h2 className="text-2xl font-semibold text-light-white mb-4">Compare Pitches</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-light-white">
                <thead>
                  <tr className="border-b border-accent-gray">
                    <th className="p-2 text-left">Shop</th>
                    <th className="p-2 text-left">Price</th>
                    <th className="p-2 text-left">Duration</th>
                    <th className="p-2 text-left">Availability</th>
                    <th className="p-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {nonWithdrawnComments.filter(c => !c.parentId).map((c) => (
                    <tr key={c.id} className="border-b border-accent-gray/50">
                      <td className="p-2">
                        <Link to={`/profile/${c.userId}`} className="text-accent-red hover:underline">{c.user.username}</Link>
                      </td>
                      <td className="p-2">{c.price ? `$${c.price.toFixed(2)}` : "N/A"}</td>
                      <td className="p-2">{c.estimatedDuration || "N/A"}</td>
                      <td className="p-2">{c.availability || "N/A"}</td>
                      <td className="p-2">
                        <button
                          onClick={() => handleAcceptPitch(c.id, c.userId)}
                          className="bg-accent-red text-light-white px-4 py-1 rounded-sm hover:bg-red-700 transition duration-200 font-semibold"
                        >
                          Accept
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={() => setShowCompareModal(false)}
              className="mt-4 bg-accent-gray text-light-white px-4 py-2 rounded-sm hover:bg-gray-600 transition duration-200"
            >
              Close
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PostPage;