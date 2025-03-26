import React, { useEffect, useState, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
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

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("authToken"));
  const [token, setToken] = useState(localStorage.getItem("authToken"));
  const [notifications, setNotifications] = useState<string[]>([]);
  const [messages, setMessages] = useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);

  // Derive user details from the token
  const userId = token ? JSON.parse(atob(token.split(".")[1])).id : "";
  const userType = token ? JSON.parse(atob(token.split(".")[1])).userType : "";
  const isAdmin = token ? JSON.parse(atob(token.split(".")[1])).isAdmin : false;
  const isPaid = token ? JSON.parse(atob(token.split(".")[1])).isPaid : false;
  const isElite = token ? JSON.parse(atob(token.split(".")[1])).isElite : false;

  // Debug log to verify userType
  useEffect(() => {
    console.log("🔍 App.tsx - userType:", userType, "isAuthenticated:", isAuthenticated, "location:", location.pathname);
  }, [userType, isAuthenticated, location.pathname]);

  // Handle logout at the app level
  const handleLogoClick = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    setIsAuthenticated(false);
    setToken(null); // Clear token to ensure NavBar hides
    setNotifications([]); // Clear notifications
    setMessages([]); // Clear messages
    navigate("/"); // Redirect to landing page
  };

  // Handle post-login redirect
  useEffect(() => {
    // Redirect if the user is authenticated and on a login/signup/landing page
    if (isAuthenticated && (location.pathname === "/login" || location.pathname === "/signup" || location.pathname === "/")) {
      if (isAdmin) {
        navigate("/admin");
      } else if (userType === "fan") {
        navigate("/booking-feed");
      } else if (userType === "designer") {
        navigate("/design-feed");
      } else if (userType === "shop") {
        navigate("/design-feed");
      }
    }
  }, [isAuthenticated, userType, isAdmin, location.pathname, navigate]);

  // Listen for changes to localStorage.getItem("authToken")
  useEffect(() => {
    const handleStorageChange = () => {
      const newToken = localStorage.getItem("authToken");
      setToken(newToken);
      setIsAuthenticated(!!newToken);
    };

    // Initial check
    handleStorageChange();

    // Listen for storage events (e.g., when token changes in another tab)
    window.addEventListener("storage", handleStorageChange);

    // Poll localStorage for changes (in case storage event doesn't fire in the same tab)
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

  useEffect(() => {
    if (!token || !userId) return;

    const fetchNotifications = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("🔍 Fetched queued notifications for:", userId, response.data);
        setNotifications(response.data || []);
      } catch (error: any) {
        console.error("❌ Failed to fetch notifications:", error.response?.data?.message || error.message);
        setNotifications([]);
      }
    };

    const connectWebSocket = () => {
      const ws = new WebSocket("ws://localhost:3002");
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("🔌 Connected to WebSocket");
        ws.send(JSON.stringify({ userId }));
        console.log("🔍 Sent userId to WebSocket:", userId);
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("🔍 WebSocket message received for:", userId, "Data:", data);
          if (data.type === "connected") {
            console.log("✅ WebSocket confirmed connection for:", data.userId);
          }
          if (data.type === "notification" && data.userId === userId) {
            console.log("🔔 Adding notification for:", userId, "Message:", data.data);
            setNotifications((prev) => {
              if (prev.includes(data.data)) return prev;
              return [...prev, data.data];
            });
          }
          if (data.type === "message" && !isAdmin) {
            if (data.message.senderId === userId) return;
            if (data.message.receiverId === userId) {
              console.log("📩 Adding message for:", userId, "Message:", data.message);
              setMessages((prev) => {
                const messageString = JSON.stringify(data.message);
                if (prev.includes(messageString)) return prev;
                return [...prev, messageString];
              });
            }
          }
        } catch (error) {
          console.error("❌ Error processing WebSocket message:", error);
        }
      };

      ws.onclose = () => {
        console.log("❌ WebSocket Disconnected for:", userId, "—Reconnecting...");
        if (reconnectAttempts.current < 5) {
          setTimeout(connectWebSocket, 1000 * Math.pow(2, reconnectAttempts.current));
          reconnectAttempts.current += 1;
          console.log("🔍 Reconnect attempt:", reconnectAttempts.current);
        }
      };

      ws.onerror = (err) => console.error("❌ WebSocket Error for:", userId, err);
    };

    if (isAuthenticated) {
      fetchNotifications();
      if (!isAdmin) connectWebSocket();
    }

    const heartbeat = setInterval(() => {
      if (wsRef.current) {
        console.log("🔍 WebSocket state for:", userId, "is:", wsRef.current.readyState);
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "heartbeat", userId }));
          console.log("🏓 Sent heartbeat to WebSocket for:", userId);
        } else {
          console.log("⚠️ WebSocket not open for:", userId, "State:", wsRef.current.readyState, "—reconnecting...");
          connectWebSocket();
        }
      }
    }, 1000);

    const handleFocus = () => {
      if (wsRef.current && wsRef.current.readyState !== WebSocket.OPEN) {
        console.log("🔍 Window focused—reconnecting WebSocket for:", userId);
        connectWebSocket();
      }
    };
    if (!isAdmin) window.addEventListener("focus", handleFocus);

    return () => {
      console.log("🛑 Closing WebSocket");
      clearInterval(heartbeat);
      if (!isAdmin) window.removeEventListener("focus", handleFocus);
      setTimeout(() => {
        if (wsRef.current) {
          wsRef.current.close();
        }
      }, 500);
    };
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

  return (
    <>
      {isAuthenticated && !isLoginOrSignup && (
        <NavBar 
          setIsAuthenticated={setIsAuthenticated} 
          notifications={[...notifications]} 
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