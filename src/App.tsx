import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import api from "./api/axios";
import MaintenancePage from "./components/MaintenancePage"; // Import the new MaintenancePage
import LoginPage from "./components/LoginPage";
import FeedPage from "./components/FeedPage";
import MessagingPage from "./components/MessagingPage";
import SettingsPage from "./components/SettingsPage";
import StatsPage from "./components/StatsPage";
import OverlayPage from "./components/OverlayPage";
import AdminPage from "./components/AdminPage";
import NavBar from "./components/NavBar";
import NotificationsPage from "./components/NotificationsPage";
import PostPage from "./components/PostPage";
import DesignsPage from "./components/DesignsPage";
import ScheduleInkPage from "./components/ScheduleInkPage";
import ProfilePage from "./components/ProfilePage";
import BookingsPage from "./components/BookingsPage";
import useWebSocket from "./hooks/useWebSocket";

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("authToken"));
  const [token, setToken] = useState(localStorage.getItem("authToken"));
  const [userData, setUserData] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const userId = token ? JSON.parse(atob(token.split(".")[1])).id : "";
  const userType = userData ? userData.userType : token ? JSON.parse(atob(token.split(".")[1])).userType : "";
  const isAdmin = userData ? userData.isAdmin : token ? JSON.parse(atob(token.split(".")[1])).isAdmin : false;
  const isPaid = userData ? userData.isPaid : token ? JSON.parse(atob(token.split(".")[1])).isPaid : false;
  const isElite = userData ? userData.isElite : token ? JSON.parse(atob(token.split(".")[1])).isElite : false;

  const { notifications, messages } = useWebSocket(userId);

  useEffect(() => {
    const fetchUserData = async () => {
      const currentToken = localStorage.getItem("authToken");
      if (currentToken) {
        try {
          const response = await api.get("/api/auth/me");
          setUserData(response.data);
          setIsAuthenticated(true);
        } catch (err) {
          console.error("❌ Auth Check Error:", err);
          setIsAuthenticated(false);
          setUserData(null);
        }
      } else {
        setIsAuthenticated(false);
        setUserData(null);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    console.log("🔍 App.tsx - userType:", userType, "isAuthenticated:", isAuthenticated, "location:", location.pathname);
  }, [userType, isAuthenticated, location.pathname]);

  const handleLogoClick = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    setIsAuthenticated(false);
    setToken(null);
    setUserData(null);
    navigate("/login"); // Redirect to login instead of landing page
  };

  useEffect(() => {
    if (isAuthenticated && (location.pathname === "/login" || location.pathname === "/signup")) {
      if (isAdmin) {
        navigate("/admin");
      } else if (userType === "fan") {
        navigate("/feed");
      } else if (userType === "designer") {
        navigate("/designs");
      } else if (userType === "shop") {
        navigate("/bookings");
      }
    }
  }, [isAuthenticated, userType, isAdmin, location.pathname, navigate]);

  useEffect(() => {
    const handleStorageChange = () => {
      const newToken = localStorage.getItem("authToken");
      setToken(newToken);
      setIsAuthenticated(!!newToken);
      if (newToken) {
        const fetchUserData = async () => {
          try {
            const response = await api.get("/api/auth/me");
            setUserData(response.data);
          } catch (err) {
            console.error("❌ Auth Check Error:", err);
            setUserData(null);
          }
        };
        fetchUserData();
      } else {
        setUserData(null);
      }
    };

    handleStorageChange();

    window.addEventListener("storage", handleStorageChange);

    const interval = setInterval(() => {
      const currentToken = localStorage.getItem("authToken");
      if (currentToken !== token) {
        handleStorageChange();
      }
    }, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [token]);

  const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    return isAuthenticated ? children : <Navigate to="/login" replace />;
  };

  const InviteRoute = ({ children }: { children: JSX.Element }) => {
    const params = new URLSearchParams(location.search);
    const invite = params.get("invite");
    return invite ? children : <Navigate to="/login" replace />;
  };

  const isLoginOrSignup = location.pathname === "/login" || location.pathname === "/signup";

  return (
    <>
      {isAuthenticated && !isLoginOrSignup && (
        <NavBar
          setIsAuthenticated={setIsAuthenticated}
          notifications={notifications}
          messages={messages}
          onLogoClick={handleLogoClick}
        />
      )}
      <div className={isAuthenticated && !isLoginOrSignup ? "pt-16" : ""}>
        <Routes>
          {/* Default route redirects to MaintenancePage */}
          <Route path="/" element={<MaintenancePage />} />

          {/* Allow access to login and signup routes */}
          <Route path="/login" element={<LoginPage setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/signup" element={<InviteRoute><LoginPage setIsAuthenticated={setIsAuthenticated} /></InviteRoute>} />

          {/* All other routes redirect to MaintenancePage */}
          <Route path="/feed" element={<MaintenancePage />} />
          <Route path="/post/:id" element={<MaintenancePage />} />
          <Route path="/post/:id/schedule" element={<MaintenancePage />} />
          <Route path="/profile/:id" element={<MaintenancePage />} />
          <Route path="/messages" element={<MaintenancePage />} />
          <Route path="/settings" element={<MaintenancePage />} />
          <Route path="/stats" element={<MaintenancePage />} />
          <Route path="/overlay" element={<MaintenancePage />} />
          <Route path="/admin" element={<MaintenancePage />} />
          <Route path="/notifications" element={<MaintenancePage />} />
          <Route path="/designs" element={<MaintenancePage />} />
          <Route path="/bookings" element={<MaintenancePage />} />
          <Route path="*" element={<MaintenancePage />} />
        </Routes>
      </div>
    </>
  );
};

const AppWrapper: React.FC = () => (
  <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <App />
  </Router>
);

export default AppWrapper;