import React, { useEffect, useState, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import api from "./api/axios"; // Import the custom axios instance
import LandingPage from "./components/LandingPage";
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

// Define the Notification type based on the backend response
interface Notification {
  id: string;
  userId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("authToken"));
  const [token, setToken] = useState(localStorage.getItem("authToken"));
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messages, setMessages] = useState<string[]>([]);
  const [userData, setUserData] = useState<any>(null); // Cache user data
  const location = useLocation();
  const navigate = useNavigate();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectInterval = 5000; // 5 seconds between reconnection attempts

  // Derive user details from the token and cached user data
  const userId = token ? JSON.parse(atob(token.split(".")[1])).id : "";
  const userType = userData ? userData.userType : token ? JSON.parse(atob(token.split(".")[1])).userType : "";
  const isAdmin = userData ? userData.isAdmin : token ? JSON.parse(atob(token.split(".")[1])).isAdmin : false;
  const isPaid = userData ? userData.isPaid : token ? JSON.parse(atob(token.split(".")[1])).isPaid : false;
  const isElite = userData ? userData.isElite : token ? JSON.parse(atob(token.split(".")[1])).isElite : false;

  // Fetch user data once on mount
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

  // Debug log to verify userType
  useEffect(() => {
    console.log("🔍 App.tsx - userType:", userType, "isAuthenticated:", isAuthenticated, "location:", location.pathname);
  }, [userType, isAuthenticated, location.pathname]);

  // Handle logout at the app level
  const handleLogoClick = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    setIsAuthenticated(false);
    setToken(null);
    setUserData(null);
    setNotifications([]);
    setMessages([]);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }
    navigate("/");
  };

  // Handle post-login redirect
  useEffect(() => {
    if (isAuthenticated && (location.pathname === "/login" || location.pathname === "/signup" || location.pathname === "/")) {
      if (isAdmin) {
        navigate("/admin");
      } else if (userType === "fan") {
        navigate("/booking-feed");
      } else if (userType === "designer") {
        navigate("/design-feed");
      } else if (userType === "shop") {
        navigate("/bookings"); // Redirect shop users to the new Bookings page
      }
    }
  }, [isAuthenticated, userType, isAdmin, location.pathname, navigate]);

  // Listen for changes to localStorage.getItem("authToken")
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
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.close();
        }
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

  // WebSocket connection for notifications and messages
  useEffect(() => {
    if (!token || !userId || isAdmin) return; // Skip WebSocket for admin users

    const fetchNotifications = async () => {
      try {
        const response = await api.get("/api/notifications");
        console.log("🔍 Fetched queued notifications for:", userId, response.data);
        const fetchedNotifications = Array.isArray(response.data.notifications) ? response.data.notifications : [];
        setNotifications(fetchedNotifications);
      } catch (error: any) {
        console.error("❌ Failed to fetch notifications:", error.response?.data?.message || error.message);
        setNotifications([]);
      }
    };

    const connectWebSocket = () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        console.log("🔍 WebSocket already connected for:", userId);
        return;
      }

      wsRef.current = new WebSocket("ws://localhost:3002");
      console.log("🔌 Attempting WebSocket connection for:", userId);

      wsRef.current.onopen = () => {
        console.log("🔌 Connected to WebSocket");
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          try {
            wsRef.current.send(JSON.stringify({ userId }));
            console.log("🔍 Sent userId to WebSocket:", userId);
            reconnectAttempts.current = 0; // Reset reconnection attempts on success
          } catch (err) {
            console.error("❌ Failed to send userId on WebSocket open:", err);
          }
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("🔍 WebSocket message received for:", userId, "Data:", data);
          if (data.type === "connected") {
            console.log("✅ WebSocket confirmed connection for:", data.userId);
            fetchNotifications();
          }
          if (data.type === "notification" && data.userId === userId) {
            console.log("🔔 Adding notification for:", userId, "Message:", data.data);
            setNotifications((prev) => {
              const currentNotifications = Array.isArray(prev) ? prev : [];
              const newNotification = typeof data.data === "object" && data.data.message ? data.data : { message: JSON.stringify(data.data) };
              if (currentNotifications.some((n) => n.message === newNotification.message)) return currentNotifications;
              return [...currentNotifications, newNotification];
            });
          }
          if (data.type === "message" && !isAdmin) {
            if (data.message.senderId === userId) return;
            if (data.message.receiverId === userId) {
              console.log("📩 Adding message for:", userId, "Message:", data.message);
              setMessages((prev) => {
                const messageString = JSON.stringify(data.message);
                const currentMessages = Array.isArray(prev) ? prev : [];
                if (currentMessages.includes(messageString)) return currentMessages;
                return [...currentMessages, messageString];
              });
            }
          }
        } catch (error) {
          console.error("❌ Error processing WebSocket message:", error);
        }
      };

      wsRef.current.onclose = () => {
        console.log("❌ WebSocket Disconnected for:", userId, "—Reconnecting...");
        if (reconnectAttempts.current < maxReconnectAttempts) {
          console.log(`🔍 Reconnect attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts}`);
          setTimeout(() => {
            reconnectAttempts.current += 1;
            connectWebSocket();
          }, reconnectInterval);
        } else {
          console.error("❌ Max reconnection attempts reached. WebSocket connection failed.");
        }
      };

      wsRef.current.onerror = (err) => {
        console.error("❌ WebSocket Error for:", userId, err);
      };
    };

    if (isAuthenticated && !isAdmin) {
      fetchNotifications();
      connectWebSocket();

      // Heartbeat to keep the connection alive
      const heartbeat = setInterval(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          try {
            wsRef.current.send(JSON.stringify({ type: "heartbeat", userId }));
            console.log("🏓 Sent heartbeat to WebSocket for:", userId);
          } catch (err) {
            console.error("❌ Failed to send heartbeat:", err);
          }
        } else {
          console.log("⚠️ Web W e b S o c k e t  not open for:", userId, "State:", wsRef.current?.readyState, "—reconnecting...");
          connectWebSocket();
        }
      }, 30000); // Send heartbeat every 30 seconds (increased from 1 second)

      // Handle window focus to reconnect if needed
      const handleFocus = () => {
        if (wsRef.current && wsRef.current.readyState !== WebSocket.OPEN) {
          console.log("🔍 Window focused—reconnecting WebSocket for:", userId);
          connectWebSocket();
        }
      };
      window.addEventListener("focus", handleFocus);

      return () => {
        console.log("🛑 Cleaning up WebSocket");
        clearInterval(heartbeat);
        window.removeEventListener("focus", handleFocus);
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.close();
        }
      };
    }
  }, [isAuthenticated, token, userId, isAdmin]);

  const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    return isAuthenticated ? children : <Navigate to="/login" replace />;
  };

  const InviteRoute = ({ children }: { children: JSX.Element }) => {
    const params = new URLSearchParams(location.search);
    const invite = params.get("invite");
    return invite ? children : <Navigate to="/login" replace />;
  };

  const isLoginOrSignup = location.pathname === "/login" || location.pathname === "/signup";

  console.log("🔍 Rendering NavBar with notifications:", notifications);

  return (
    <>
      {isAuthenticated && !isLoginOrSignup && (
        <NavBar 
          setIsAuthenticated={setIsAuthenticated} 
          notifications={Array.isArray(notifications) ? [...notifications] : []}
          setNotifications={setNotifications} 
          messages={messages} 
          onLogoClick={handleLogoClick}
        />
      )}
      <div className={isAuthenticated && !isLoginOrSignup ? "pt-16" : ""}>
        <Routes>
          <Route path="/" element={<LandingPage setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/login" element={<LoginPage setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/signup" element={<InviteRoute><LoginPage setIsAuthenticated={setIsAuthenticated} /></InviteRoute>} />
          <Route path="/design-feed" element={
            <ProtectedRoute>
              {(userType === "designer" || userType === "shop") ? (
                <FeedPage feedType="design" />
              ) : (
                <Navigate to="/" replace />
              )}
            </ProtectedRoute>
          } />
          <Route path="/booking-feed" element={
            <ProtectedRoute>
              {(userType === "fan" || userType === "shop") ? (
                <FeedPage feedType="booking" />
              ) : (
                <Navigate to="/" replace />
              )}
            </ProtectedRoute>
          } />
          <Route path="/post/:id" element={<ProtectedRoute><PostPage /></ProtectedRoute>} />
          <Route path="/post/:id/schedule" element={<ProtectedRoute><ScheduleInkPage /></ProtectedRoute>} />
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route path="/messages" element={
            <ProtectedRoute>
              {userType !== "admin" ? <MessagingPage messages={messages} /> : <Navigate to="/admin" replace />}
            </ProtectedRoute>
          } />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/stats" element={
            <ProtectedRoute>
              {(userType === "designer" || (userType === "shop" && isPaid)) ? <StatsPage /> : <Navigate to="/" replace />}
            </ProtectedRoute>
          } />
          <Route path="/overlay" element={
            <ProtectedRoute>
              {userType === "shop" && isElite ? <OverlayPage /> : <Navigate to="/" replace />}
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              {userType === "admin" ? <AdminPage /> : <Navigate to="/" replace />}
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          } />
          <Route path="/designs" element={
            <ProtectedRoute>
              {(userType === "designer" || userType === "shop") ? <DesignsPage /> : <Navigate to="/" replace />}
            </ProtectedRoute>
          } />
          <Route path="/bookings" element={
            <ProtectedRoute>
              {userType === "shop" ? <BookingsPage /> : <Navigate to="/" replace />}
            </ProtectedRoute>
          } />
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