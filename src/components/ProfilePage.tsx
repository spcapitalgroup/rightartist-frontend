import React, { useState, useEffect } from "react";
import api from "../api/axios"; // Import the custom axios instance
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { FaInstagram, FaTwitter, FaBehance, FaTiktok } from "react-icons/fa";

interface PortfolioItem {
  imageUrl: string;
  style: string;
  date: string;
  description: string;
}

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  userType: string;
  portfolio: PortfolioItem[];
  bio: string;
  location: string;
  operatingHours: { [key: string]: string };
  socialLinks: { [key: string]: string };
}

interface Review {
  id: string;
  userId: string;
  targetUserId: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: { id: string; username: string };
}

const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [operatingHours, setOperatingHours] = useState<{ [key: string]: string }>({});
  const [socialLinks, setSocialLinks] = useState<{ [key: string]: string }>({});
  const [newImages, setNewImages] = useState<File[]>([]);
  const [style, setStyle] = useState("");
  const [description, setDescription] = useState("");
  const token = localStorage.getItem("authToken");
  const decoded = token ? JSON.parse(atob(token.split(".")[1])) : {};
  const userId = decoded.id || "";

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get(`/api/users/${id}/profile`);
        console.log("🔍 Profile Response:", response.data);
        setProfile(response.data.user);
        setReviews(response.data.reviews || []);
        setAverageRating(response.data.averageRating || 0);
        setBio(response.data.user.bio);
        setLocation(response.data.user.location);
        setOperatingHours(response.data.user.operatingHours);
        setSocialLinks(response.data.user.socialLinks);
      } catch (err: any) {
        console.error("❌ Fetch Profile Error:", err.response?.data || err.message);
        setError(err.response?.data?.message || "Failed to load profile");
      }
    };
    fetchProfile();
  }, [id]);

  const handleImageUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || userId !== id) {
      setError("You can only update your own portfolio");
      return;
    }

    if (newImages.length === 0) {
      setError("Please select at least one image to upload");
      return;
    }

    const formData = new FormData();
    newImages.forEach((image) => formData.append("images", image));
    formData.append("style", style);
    formData.append("description", description);

    try {
      const response = await api.post(`/api/users/${id}/portfolio`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setProfile({ ...profile!, portfolio: response.data.portfolio });
      setNewImages([]);
      setStyle("");
      setDescription("");
      setError("");
    } catch (err: any) {
      console.error("❌ Upload Portfolio Error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to upload portfolio images");
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || userId !== id) {
      setError("You can only update your own profile");
      return;
    }

    try {
      const response = await api.put(`/api/users/${id}/profile`, {
        bio,
        location,
        operatingHours,
        socialLinks,
      });
      setProfile(response.data.user);
      setIsEditing(false);
      setError("");
    } catch (err: any) {
      console.error("❌ Update Profile Error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to update profile");
    }
  };

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

  if (!profile) {
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
      className="min-h-screen pt-20 pb-8 px-4 bg-dark-black text-light-white"
    >
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="text-accent-red hover:underline mb-4"
        >
          ← Back
        </button>
        <div className="bg-dark-gray p-6 rounded-sm shadow-sm border border-accent-gray">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-semibold text-light-white">
              {profile.firstName} {profile.lastName} (@{profile.username})
            </h1>
            {userId === id && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-accent-red text-light-white px-4 py-2 rounded-sm hover:bg-red-700 transition duration-200"
              >
                {isEditing ? "Cancel" : "Edit Profile"}
              </button>
            )}
          </div>
          <div className="mb-6">
            <h2 className="text-xl font-medium text-text-gray">Bio</h2>
            {isEditing ? (
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full p-2 mt-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                rows={4}
              />
            ) : (
              <p className="text-text-gray mt-2">{profile.bio || "No bio available."}</p>
            )}
          </div>
          {profile.userType === "shop" && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-medium text-text-gray">Location</h2>
                {isEditing ? (
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full p-2 mt-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                  />
                ) : (
                  <p className="text-text-gray mt-2">{profile.location || "No location provided."}</p>
                )}
              </div>
              <div className="mb-6">
                <h2 className="text-xl font-medium text-text-gray">Operating Hours</h2>
                {isEditing ? (
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                      <div key={day}>
                        <label className="block text-text-gray mb-1">{day}</label>
                        <input
                          type="text"
                          value={operatingHours[day.toLowerCase()] || ""}
                          onChange={(e) => setOperatingHours({ ...operatingHours, [day.toLowerCase()]: e.target.value })}
                          placeholder="e.g., 9am-5pm"
                          className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                      <div key={day}>
                        <p className="text-text-gray">{day}: {profile.operatingHours[day.toLowerCase()] || "Closed"}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
          {Object.keys(profile.socialLinks).length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-medium text-text-gray">Social Links</h2>
              <div className="flex space-x-4 mt-2">
                {profile.socialLinks.instagram && (
                  <a href={profile.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                    <>{FaInstagram({ className: "text-accent-red text-2xl hover:text-red-700 transition duration-200" })}</>
                  </a>
                )}
                {profile.socialLinks.twitter && (
                  <a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                    <>{FaTwitter({ className: "text-accent-red text-2xl hover:text-red-700 transition duration-200" })}</>
                  </a>
                )}
                {profile.socialLinks.behance && (
                  <a href={profile.socialLinks.behance} target="_blank" rel="noopener noreferrer">
                    <>{FaBehance({ className: "text-accent-red text-2xl hover:text-red-700 transition duration-200" })}</>
                  </a>
                )}
                {profile.socialLinks.tiktok && (
                  <a href={profile.socialLinks.tiktok} target="_blank" rel="noopener noreferrer">
                    <>{FaTiktok({ className: "text-accent-red text-2xl hover:text-red-700 transition duration-200" })}</>
                  </a>
                )}
              </div>
              {isEditing && (
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {["Instagram", "Twitter", "Behance", "TikTok"].map(platform => (
                    <div key={platform}>
                      <label className="block text-text-gray mb-1">{platform}</label>
                      <input
                        type="text"
                        value={socialLinks[platform.toLowerCase()] || ""}
                        onChange={(e) => setSocialLinks({ ...socialLinks, [platform.toLowerCase()]: e.target.value })}
                        placeholder={`https://${platform.toLowerCase()}.com/username`}
                        className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="mb-6">
            <h2 className="text-xl font-medium text-text-gray">Portfolio</h2>
            {profile.portfolio.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                {profile.portfolio.map((item, index) => (
                  <div key={index} className="bg-dark-black p-4 rounded-sm border border-accent-gray hover:shadow-md transition duration-200">
                    <img
                      src={`http://localhost:3000/uploads/${item.imageUrl}`}
                      alt={item.description}
                      className="w-full h-40 object-cover rounded-sm mb-2 hover:scale-105 transition-transform duration-200"
                    />
                    <p className="text-text-gray text-sm">Style: {item.style}</p>
                    <p className="text-text-gray text-sm">Date: {new Date(item.date).toLocaleDateString()}</p>
                    <p className="text-text-gray text-sm">{item.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-gray mt-2">No portfolio items yet.</p>
            )}
            {isEditing && (
              <form onSubmit={handleImageUpload} className="mt-4 space-y-4">
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={(e) => setNewImages(e.target.files ? Array.from(e.target.files) : [])}
                  className="text-light-white"
                />
                <input
                  type="text"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  placeholder="Style (e.g., Realism)"
                  className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description"
                  className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                  rows={3}
                />
                <button
                  type="submit"
                  className="bg-accent-red text-light-white px-4 py-2 rounded-sm hover:bg-red-700 transition duration-200"
                >
                  Upload Images
                </button>
              </form>
            )}
          </div>
          <div className="mb-6">
            <h2 className="text-xl font-medium text-text-gray">Ratings & Reviews</h2>
            {averageRating > 0 ? (
              <p className="text-text-gray mt-2">Average Rating: {averageRating.toFixed(1)} ★★★★★</p>
            ) : (
              <p className="text-text-gray mt-2">No reviews yet.</p>
            )}
            {reviews.length > 0 && (
              <div className="space-y-4 mt-2">
                {reviews.map(review => (
                  <div key={review.id} className="bg-dark-black p-4 rounded-sm border border-accent-gray">
                    <p className="text-text-gray">Rating: {review.rating} ★★★★★</p>
                    <p className="text-text-gray">{review.comment}</p>
                    <p className="text-text-gray text-sm">By: {review.user.username}</p>
                    <p className="text-text-gray text-sm">{new Date(review.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          {isEditing && (
            <button
              onClick={handleProfileUpdate}
              className="bg-accent-red text-light-white px-4 py-2 rounded-sm hover:bg-red-700 transition duration-200"
            >
              Save Profile
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProfilePage;