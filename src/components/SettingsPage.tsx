import React, { useState, useEffect } from "react";
import api from "../api/axios";
import { motion } from "framer-motion";
import { usePaymentInputs } from "react-payment-inputs";

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
}

const SettingsPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [socialLinks, setSocialLinks] = useState({
    instagram: "",
    facebook: "",
    twitter: "",
  });
  const [depositRequired, setDepositRequired] = useState(false);
  const [depositAmount, setDepositAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState("");

  const { meta, getCardNumberProps, getExpiryDateProps, getCVCProps } = usePaymentInputs();

  const token = localStorage.getItem("authToken");
  const decoded = token ? JSON.parse(atob(token.split(".")[1])) : {};
  const userType = decoded.userType || "fan";

  useEffect(() => {
    console.log("🔍 SettingsPage: Mounting component");
    const fetchUser = async () => {
      try {
        if (!token) {
          setError("Please log in to access settings");
          return;
        }

        const response = await api.get("/api/auth/me");
        console.log("🔍 User Response (Full):", response);
        console.log("🔍 User Response Data:", response.data);

        const userData = response.data;
        setUser(userData);
        setFirstName(userData.firstName || "");
        setLastName(userData.lastName || "");
        setUsername(userData.username || "");
        setEmail(userData.email || "");
        setBio(userData.bio || "");
        setLocation(userData.location || "");
        setSocialLinks(userData.socialLinks || { instagram: "", facebook: "", twitter: "" });
        setDepositRequired(userData.depositSettings?.required || false);
        setDepositAmount(userData.depositSettings?.amount || 0);
      } catch (err: any) {
        console.error("❌ Fetch User Error:", err.message);
        setError(err.response?.data?.message || "Failed to load user data");
      }
    };

    fetchUser();

    return () => {
      console.log("🔍 SettingsPage: Unmounting component");
    };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const updatedUser = {
        firstName,
        lastName,
        username,
        email,
        bio,
        location,
        socialLinks,
        depositSettings: userType === "shop" ? { required: depositRequired, amount: depositAmount } : undefined,
      };

      const response = await api.put("/api/auth/update", updatedUser);
      setUser(response.data);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubscribing) return;
    setIsSubscribing(true);
    setError("");
    setSubscriptionStatus("");

    try {
      const { erroredInputs, values } = meta;
      if (erroredInputs.cardNumber || erroredInputs.expiryDate || erroredInputs.cvc) {
        throw new Error("Invalid card details");
      }

      // Step 1: Tokenize card details with SPIn
      const tokenizeResponse = await api.post("/api/spin/tokenize", {
        cardNumber: values.cardNumber.replace(/\s/g, ""),
        expiry: values.expiryDate,
        cvv: values.cvc,
      });

      const { cardToken } = tokenizeResponse.data;
      if (!cardToken) {
        throw new Error("Failed to tokenize card");
      }

      // Step 2: Process subscription payment with TransactAPI
      const subscribeResponse = await api.post("/api/payments/subscribe", { cardToken });
      setSubscriptionStatus(subscribeResponse.data.message);

      // Update user state to reflect paid status
      setUser((prev) => prev ? { ...prev, isPaid: true } : null);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to process subscription");
    } finally {
      setIsSubscribing(false);
    }
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
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="bg-dark-gray p-6 rounded-sm shadow-lg border border-accent-gray"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <h1 className="text-4xl font-bold text-light-white mb-6 tracking-wide">Settings</h1>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {subscriptionStatus && <p className="text-green-500 mb-4">{subscriptionStatus}</p>}

          {/* Existing Profile Settings Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <label className="block text-text-gray mb-1">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <label className="block text-text-gray mb-1">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                />
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <label className="block text-text-gray mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <label className="block text-text-gray mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <label className="block text-text-gray mb-1">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                rows={3}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <label className="block text-text-gray mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
              />
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <label className="block text-text-gray mb-1">Instagram</label>
                <input
                  type="text"
                  value={socialLinks.instagram}
                  onChange={(e) =>
                    setSocialLinks({ ...socialLinks, instagram: e.target.value })
                  }
                  className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <label className="block text-text-gray mb-1">Facebook</label>
                <input
                  type="text"
                  value={socialLinks.facebook}
                  onChange={(e) =>
                    setSocialLinks({ ...socialLinks, facebook: e.target.value })
                  }
                  className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
              >
                <label className="block text-text-gray mb-1">Twitter</label>
                <input
                  type="text"
                  value={socialLinks.twitter}
                  onChange={(e) =>
                    setSocialLinks({ ...socialLinks, twitter: e.target.value })
                  }
                  className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                />
              </motion.div>
            </div>
            {userType === "shop" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 1.0 }}
                >
                  <label className="block text-text-gray mb-1">Deposit Required</label>
                  <select
                    value={depositRequired.toString()}
                    onChange={(e) => setDepositRequired(e.target.value === "true")}
                    className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 1.1 }}
                >
                  <label className="block text-text-gray mb-1">Deposit Amount</label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                    disabled={!depositRequired}
                  />
                </motion.div>
              </div>
            )}
            <motion.div
              className="flex justify-end"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.0 }}
            >
              <motion.button
                type="submit"
                className="bg-accent-red text-light-white px-6 py-2 rounded-sm font-semibold hover:bg-red-700 transition duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </motion.button>
            </motion.div>
          </form>

          {/* Subscription Section */}
          {(userType === "shop" || userType === "elite") && !user.isPaid && (
            <div className="mt-8">
              <h2 className="text-2xl font-semibold text-light-white mb-4">Subscribe to Premium</h2>
              <p className="text-text-gray mb-4">
                Unlock premium features for {userType === "shop" ? "$24.99" : "$50.00"} per month.
              </p>
              <form onSubmit={handleSubscribe} className="space-y-4">
                <div>
                  <label className="block text-text-gray mb-1">Card Number</label>
                  <input
                    {...getCardNumberProps({ onChange: () => setError("") })}
                    className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                  />
                </div>
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block text-text-gray mb-1">Expiry Date</label>
                    <input
                      {...getExpiryDateProps({ onChange: () => setError("") })}
                      className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-text-gray mb-1">CVC</label>
                    <input
                      {...getCVCProps({ onChange: () => setError("") })}
                      className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                    />
                  </div>
                </div>
                <motion.button
                  type="submit"
                  className="bg-accent-red text-light-white px-6 py-2 rounded-sm font-semibold hover:bg-red-700 transition duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isSubscribing}
                >
                  {isSubscribing ? "Processing..." : "Subscribe"}
                </motion.button>
              </form>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SettingsPage;