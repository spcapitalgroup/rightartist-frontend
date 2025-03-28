import React, { useState, useEffect } from "react";
import api from "../api/axios";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";

const LoginPage: React.FC<{ setIsAuthenticated: (value: boolean) => void }> = ({ setIsAuthenticated }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [userType, setUserType] = useState<"fan" | "designer" | "shop">("fan");
  const [invite, setInvite] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/signup") {
      setIsLogin(false);
      const params = new URLSearchParams(location.search);
      const inviteCode = params.get("invite");
      if (!inviteCode) {
        setError("Invite link required for signup");
        navigate("/");
      } else {
        setInvite(inviteCode);
        api
          .get(`/api/admin/validate-invite?invite=${inviteCode}`)
          .then((response) => {
            if (!response.data.valid) {
              setError("Invalid or used invite link");
              navigate("/");
            }
          })
          .catch((err) => {
            console.error("❌ Validate Invite Error:", err);
            setError("Failed to validate invite link");
            navigate("/");
          });
      }
    } else {
      setIsLogin(true);
    }
  }, [location, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await api.post("/api/auth/login", { email, password });
      const token = response.data.token;
      localStorage.setItem("authToken", token);
      const decoded = JSON.parse(atob(token.split(".")[1]));
      localStorage.setItem(
        "userRole",
        decoded.userType === "fan" ? "Fan" : decoded.userType === "designer" ? "ArtDesigner" : decoded.userType
      );
      setIsAuthenticated(true);
      setError("");
      // Delay to ensure App.tsx processes the token
      setTimeout(() => {
        if (decoded.userType === "fan") {
          navigate("/feed"); // Changed from /booking-feed
        } else if (decoded.userType === "designer") {
          navigate("/designs"); // Changed from /design-feed
        } else {
          navigate("/bookings"); // For shop users
        }
      }, 100);
    } catch (err: any) {
      console.error("❌ Login Error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      console.log("📤 Payload:", { email, password, firstName, lastName, userType, invite });
      const response = await api.post("/api/auth/signup", {
        email,
        password,
        firstName,
        lastName,
        userType,
        invite,
      });
      const token = response.data.token;
      localStorage.setItem("authToken", token);
      const decoded = JSON.parse(atob(token.split(".")[1]));
      localStorage.setItem(
        "userRole",
        decoded.userType === "fan" ? "Fan" : decoded.userType === "designer" ? "ArtDesigner" : decoded.userType
      );
      setIsAuthenticated(true);
      setError("");
      // Delay to ensure App.tsx processes the token
      setTimeout(() => {
        if (decoded.userType === "fan") {
          navigate("/feed"); // Changed from /design-feed
        } else if (decoded.userType === "designer") {
          navigate("/designs"); // Changed from /design-feed
        } else {
          navigate("/bookings"); // For shop users
        }
      }, 100);
    } catch (err: any) {
      console.error("❌ Signup Error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex items-center justify-center bg-dark-black"
    >
      <motion.div
        className="bg-dark-gray p-8 rounded-sm shadow-lg border border-accent-gray max-w-md w-full"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <h1 className="text-4xl font-bold text-light-white mb-6 text-center tracking-wide">
          {isLogin ? "Welcome Back" : "Join the Ink Community"}
        </h1>
        {error && <p className="text-red-500 mb-6 text-center">{error}</p>}

        <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
          {!isLogin && (
            <>
              <motion.input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
                className="w-full p-3 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                required
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              />
              <motion.input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
                className="w-full p-3 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                required
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              />
            </>
          )}
          <motion.input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-3 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
            required
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: isLogin ? 0.1 : 0.3 }}
          />
          <motion.input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-3 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
            required
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: isLogin ? 0.2 : 0.4 }}
          />
          {!isLogin && (
            <>
              <motion.select
                value={userType}
                onChange={(e) => setUserType(e.target.value as "fan" | "designer" | "shop")}
                className="w-full p-3 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                required
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <option value="fan">Inkhunter (Fan) - Free</option>
                <option value="designer">Art Creator (Designer) - Free</option>
                <option value="shop">Shop Pro (Shop) - $24.99</option>
              </motion.select>
              {userType === "shop" && (
                <motion.p
                  className="text-text-gray text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  Note: Shop Pro requires payment setup after signup.
                </motion.p>
              )}
            </>
          )}
          <motion.button
            type="submit"
            className="w-full p-3 bg-accent-red text-light-white rounded-sm font-semibold hover:bg-red-700 transition duration-300"
            disabled={isSubmitting}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: isLogin ? 0.3 : 0.7 }}
          >
            {isLogin ? "Login" : "Sign Up"}
          </motion.button>
        </form>

        {isLogin && (
          <motion.p
            className="text-text-gray text-center mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Contact an admin for an invite to sign up.
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
};

export default LoginPage;