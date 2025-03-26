import React, { useEffect, useState, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
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

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("authToken"));
  const [token, setToken] = useState(localStorage.getItem("authToken"));
  const [notifications, setNotifications] = useState<string[]>([]);
  const [messages, setMessages] = useState<string[]>([]);
  const location = useLocation();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);

  // Derive user details from the token
  const userId = token ? JSON.parse(atob(token.split(".")[1])).id : "";
  const userType = token ? JSON.parse(atob(token.split(".")[1])).userType : "";
  const isAdmin = token ? JSON.parse(atob(token.split(".")[1])).isAdmin : false;
  const isPaid = token ? JSON.parse(atob(token.split(".")[1])).isPaid : false;
  const isElite = token ? JSON.parse(atob(token.split(".")[1])).isElite : false;

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
        if (response.data.success) {
          const queuedNotifications = response.data.notifications.map((n: { message: string }) => n.message);
          console.log("🔍 Fetched queued notifications for:", userId, queuedNotifications);
          setNotifications((prev) => [...new Set([...prev, ...queuedNotifications])]);
        } else {
          console.error("❌ Fetch notifications failed:", response.data.message);
        }
      } catch (error) {
        console.error("❌ Failed to fetch notifications:", error);
      }
    };

    const connectWebSocket = () => {
      const ws = new WebSocket("ws://localhost:3000");
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
      if (wsRef.current) wsRef.current.close();
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

  const isLoginOrSignup = location.pathname === "/" || location.pathname === "/login" || location.pathname === "/signup";

  return (
    <>
      {isAuthenticated && !isLoginOrSignup && (
        <NavBar 
          setIsAuthenticated={setIsAuthenticated} 
          notifications={[...notifications]} 
          setNotifications={setNotifications} 
          messages={messages} 
        />
      )}
      <div className={isAuthenticated && !isLoginOrSignup ? "pt-16" : ""}>
        <Routes>
          <Route path="/" element={<LandingPage setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/login" element={<LoginPage setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/signup" element={<InviteRoute><LoginPage setIsAuthenticated={setIsAuthenticated} /></InviteRoute>} />
          <Route path="/design-feed" element={<ProtectedRoute><FeedPage feedType="design" /></ProtectedRoute>} />
          <Route path="/booking-feed" element={<ProtectedRoute><FeedPage feedType="booking" /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute>{userType !== "admin" ? <MessagingPage messages={messages} /> : <Navigate to="/admin" replace />}</ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/stats" element={<ProtectedRoute>{(userType === "designer" || (userType === "shop" && isPaid)) ? <StatsPage /> : <Navigate to="/" replace />}</ProtectedRoute>} />
          <Route path="/overlay" element={<ProtectedRoute>{userType === "shop" && isElite ? <OverlayPage /> : <Navigate to="/" replace />}</ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute>{userType === "admin" ? <AdminPage /> : <Navigate to="/" replace />}</ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage notifications={notifications} setNotifications={setNotifications} /></ProtectedRoute>} />
        </Routes>
      </div>
    </>
  );
};

const AppWrapper: React.FC = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;