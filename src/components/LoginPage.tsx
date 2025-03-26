import React, { useState, useEffect } from "react";
import axios from "axios";
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
      setIsLogin(false); // Force signup mode
      const params = new URLSearchParams(location.search);
      const inviteCode = params.get("invite");
      if (!inviteCode) {
        setError("Invite link required for signup");
        navigate("/");
      } else {
        setInvite(inviteCode);
        axios.get(`${process.env.REACT_APP_API_URL}/api/admin/validate-invite?invite=${inviteCode}`)
          .then(response => {
            if (!response.data.valid) {
              setError("Invalid or used invite link");
              navigate("/");
            }
          })
          .catch(err => {
            console.error("❌ Validate Invite Error:", err);
            setError("Failed to validate invite link");
            navigate("/");
          });
      }
    } else {
      setIsLogin(true); // Default to login for "/"
    }
  }, [location, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const loginUrl = `${process.env.REACT_APP_API_URL}/api/login`; // Updated to /api/login
      console.log("📤 Sending login to:", loginUrl);
      const response = await axios.post(loginUrl, { email, password });
      const token = response.data.token;
      localStorage.setItem("authToken", token);
      const decoded = JSON.parse(atob(token.split(".")[1]));
      localStorage.setItem("userRole", decoded.userType === "fan" ? "Fan" : decoded.userType === "designer" ? "ArtDesigner" : decoded.userType);
      setIsAuthenticated(true);
      setError("");
      if (decoded.userType === "fan") {
        navigate("/booking-feed");
      } else {
        navigate("/design-feed");
      }
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
      const signupUrl = `${process.env.REACT_APP_API_URL}/api/signup`; // Updated to /api/signup
      console.log("📤 Sending signup to:", signupUrl);
      console.log("📤 Payload:", { email, password, firstName, lastName, userType, invite });
      const response = await axios.post(signupUrl, {
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
      localStorage.setItem("userRole", decoded.userType === "fan" ? "Fan" : decoded.userType === "designer" ? "ArtDesigner" : decoded.userType);
      setIsAuthenticated(true);
      setError("");
      navigate("/design-feed");
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
      className="min-h-screen flex items-center justify-center bg-tattoo-black"
    >
      <div className="bg-tattoo-gray/20 p-8 rounded-lg shadow-lg border border-tattoo-red/30 max-w-md w-full">
        <h1 className="text-3xl font-bold text-tattoo-red mb-6 text-center">
          {isLogin ? "Login" : "Sign Up"}
        </h1>
        {error && <p className="text-tattoo-red mb-4 text-center">{error}</p>}
        
        <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
          {!isLogin && (
            <>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
                className="w-full p-3 bg-tattoo-black border border-tattoo-gray rounded-lg text-tattoo-light focus:outline-none focus:ring-2 focus:ring-tattoo-red"
                required
              />
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
                className="w-full p-3 bg-tattoo-black border border-tattoo-gray rounded-lg text-tattoo-light focus:outline-none focus:ring-2 focus:ring-tattoo-red"
                required
              />
            </>
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-3 bg-tattoo-black border border-tattoo-gray rounded-lg text-tattoo-light focus:outline-none focus:ring-2 focus:ring-tattoo-red"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-3 bg-tattoo-black border border-tattoo-gray rounded-lg text-tattoo-light focus:outline-none focus:ring-2 focus:ring-tattoo-red"
            required
          />
          {!isLogin && (
            <>
              <select
                value={userType}
                onChange={(e) => setUserType(e.target.value as "fan" | "designer" | "shop")}
                className="w-full p-3 bg-tattoo-black border border-tattoo-gray rounded-lg text-tattoo-light focus:outline-none focus:ring-2 focus:ring-tattoo-red"
                required
              >
                <option value="fan">Inkhunter (Fan) - Free</option>
                <option value="designer">Art Creator (Designer) - Free</option>
                <option value="shop">Shop Pro (Shop) - $24.99</option>
              </select>
              {userType === "shop" && (
                <p className="text-tattoo-gray text-sm">
                  Note: Shop Pro requires payment setup after signup.
                </p>
              )}
            </>
          )}
          <button
            type="submit"
            className="w-full p-3 bg-tattoo-red text-tattoo-light rounded-lg hover:bg-tattoo-red/80 transition duration-200 font-bold"
            disabled={isSubmitting}
          >
            {isLogin ? "Login" : "Sign Up"}
          </button>
        </form>

        {isLogin && (
          <p className="text-tattoo-gray text-center mt-4">
            Contact an admin for an invite to sign up.
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default LoginPage;