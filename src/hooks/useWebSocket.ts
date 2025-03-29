import { useEffect, useRef, useState, useCallback } from "react";
import api from "../api/axios";

interface Notification {
  id: string;
  userId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

const useWebSocket = (userId: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messages, setMessages] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const isMounted = useRef(true);

  const fetchQueuedData = useCallback(async () => {
    try {
      const response = await api.get("/api/notifications");
      console.log(`🔍 Fetched queued notifications for: "${userId}"`, response.data);
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error("❌ Error fetching notifications:", error);
    }
  }, [userId]);

  const connectWebSocket = useCallback(() => {
    if (!userId || (wsRef.current && wsRef.current.readyState === WebSocket.OPEN)) return;

    // Ensure REACT_APP_API_URL is a string, with a fallback
    const apiUrl: string = process.env.REACT_APP_API_URL || "https://rightartist-backend.onrender.com";
    const wsUrl = `${apiUrl.replace("https://", "wss://")}`;
    console.log(`🔌 Attempting WebSocket connection for: "${userId}" to ${wsUrl}`);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log(`🔌 Connected to WebSocket for: "${userId}"`);
      ws.send(JSON.stringify({ type: "connect", userId }));
      reconnectAttempts.current = 0;
      fetchQueuedData();
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log(`🔍 WebSocket message received for: "${userId}"`, "Data:", data);
      if (data.type === "connected") {
        console.log(`✅ WebSocket confirmed connection for: "${userId}"`);
      } else if (data.type === "notification" && data.userId === userId) {
        setNotifications((prev) => {
          const newNotification = typeof data.data === "object" && data.data.message ? data.data : { message: JSON.stringify(data.data) };
          if (prev.some((n) => n.id === newNotification.id)) return prev;
          return [...prev, newNotification];
        });
      } else if (data.type === "message" && data.message.receiverId === userId) {
        setMessages((prev) => {
          const messageString = JSON.stringify(data.message);
          if (prev.includes(messageString)) return prev;
          return [...prev, messageString];
        });
      }
    };

    ws.onclose = () => {
      console.log(`❌ WebSocket Disconnected for: "${userId}"`);
      if (isMounted.current && reconnectAttempts.current < maxReconnectAttempts) {
        console.log(`🔍 Reconnecting WebSocket, attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts}`);
        reconnectAttempts.current += 1;
        setTimeout(connectWebSocket, 1000 * reconnectAttempts.current);
      }
    };

    ws.onerror = (error) => {
      console.error(`❌ WebSocket Error for: "${userId}"`, error);
    };
  }, [userId, fetchQueuedData]);

  useEffect(() => {
    isMounted.current = true;
    if (userId) {
      connectWebSocket();

      const heartbeat = setInterval(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          console.log(`🏓 Sent heartbeat to WebSocket for: "${userId}"`);
          wsRef.current.send(JSON.stringify({ type: "heartbeat", userId }));
        }
      }, 30000);

      return () => {
        isMounted.current = false;
        console.log(`🛑 Cleaning up WebSocket for: "${userId}"`);
        clearInterval(heartbeat);
        if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = null;
        }
      };
    }
  }, [userId, connectWebSocket]);

  return { notifications, messages };
};

export default useWebSocket;