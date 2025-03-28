import React, { useState, useEffect } from "react";
import api from "../api/axios";
import { motion } from "framer-motion";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

// Set up date-fns localizer for react-big-calendar
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { "en-US": enUS },
});

interface Booking {
  id: string;
  postId: string;
  shopId: string;
  clientId: string;
  scheduledDate: string;
  status: "scheduled" | "completed" | "cancelled";
  contactInfo: { phone: string; email: string };
  shop?: { id: string; username: string };
  client?: { id: string; username: string };
  post?: { id: string; title: string };
}

interface Post {
  id: string;
  title: string;
  description: string;
  location: string;
  feedType: "design" | "booking";
  status: "open" | "closed" | "accepted" | "scheduled" | "completed" | "cancelled";
  clientId: string | null;
  shopId: string | null;
  images: string[];
  createdAt: string;
  scheduledDate: string;
  contactInfo: { phone: string; email: string };
  comments: Comment[];
  shop: { id: string; username: string };
  client: { id: string; username: string };
}

interface Comment {
  id: string;
  content: string;
  userId: string;
  postId: string;
  parentId: string | null;
  price: number;
  user: { id: string; username: string };
  replies: Comment[];
  createdAt: string;
}

const ScheduleInkPage: React.FC = () => {
  const [post, setPost] = useState<Post | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<"schedule" | "calendar" | "bookings">("schedule");

  const token = localStorage.getItem("authToken");
  const decoded = token ? JSON.parse(atob(token.split(".")[1])) : {};
  const userType = decoded.userType || "fan";
  const userId = decoded.id || "";

  useEffect(() => {
    const fetchPostAndBookings = async () => {
      try {
        if (!token) {
          setError("Please log in to access this page");
          return;
        }

        // Extract postId from URL (assuming the route is /post/:id/schedule)
        const postId = window.location.pathname.split("/")[2];
        if (!postId) {
          setError("No post ID found in URL");
          return;
        }

        // Fetch the post details
        const postResponse = await api.get(`/api/posts/${postId}`);
        setPost(postResponse.data);

        // Fetch bookings for the shop (if user is a shop)
        if (userType === "shop") {
          const bookingsResponse = await api.get(`/api/bookings/shop/${userId}`);
          setBookings(bookingsResponse.data.bookings || []);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load data");
        console.error("❌ Fetch Error:", err.response?.data || err.message);
      }
    };

    fetchPostAndBookings();
  }, [token, userType, userId]);

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (!post) throw new Error("Post not found");

      const scheduleData = {
        postId: post.id,
        shopId: userType === "shop" ? userId : post.shopId,
        clientId: userType === "fan" ? userId : post.clientId,
        scheduledDate,
        contactInfo: { phone, email },
      };

      const response = await api.post("/api/bookings/schedule", scheduleData);
      setBookings((prev) => [...prev, response.data]);
      setError("");
      setScheduledDate("");
      setPhone("");
      setEmail("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to schedule booking");
      console.error("❌ Schedule Error:", err.response?.data || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await api.put(`/api/bookings/${bookingId}/cancel`);
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId ? { ...booking, status: "cancelled" } : booking
        )
      );
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to cancel booking");
      console.error("❌ Cancel Booking Error:", err.response?.data || err.message);
    }
  };

  const calendarEvents = bookings.map((booking) => ({
    title: `Booking: ${booking.post?.title || "Untitled"} with ${booking.client?.username || "Unknown"}`,
    start: new Date(booking.scheduledDate),
    end: new Date(booking.scheduledDate),
    allDay: false,
    resource: booking,
  }));

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

  if (!post && viewMode === "schedule") {
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
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="bg-dark-gray p-6 rounded-sm shadow-lg border border-accent-gray"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
            <motion.h1
              className="text-3xl font-semibold text-light-white tracking-wide"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {viewMode === "schedule" ? "Schedule Ink" : viewMode === "calendar" ? "Calendar" : "Bookings"}
            </motion.h1>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <motion.button
                onClick={() => setViewMode("schedule")}
                className={`text-text-gray text-sm border border-accent-gray px-3 py-1 rounded-sm hover:bg-dark-black transition duration-200 ${
                  viewMode === "schedule" ? "bg-accent-red text-light-white" : ""
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Schedule
              </motion.button>
              {userType === "shop" && (
                <>
                  <motion.button
                    onClick={() => setViewMode("calendar")}
                    className={`text-text-gray text-sm border border-accent-gray px-3 py-1 rounded-sm hover:bg-dark-black transition duration-200 ${
                      viewMode === "calendar" ? "bg-accent-red text-light-white" : ""
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    Calendar
                  </motion.button>
                  <motion.button
                    onClick={() => setViewMode("bookings")}
                    className={`text-text-gray text-sm border border-accent-gray px-3 py-1 rounded-sm hover:bg-dark-black transition duration-200 ${
                      viewMode === "bookings" ? "bg-accent-red text-light-white" : ""
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    Bookings
                  </motion.button>
                </>
              )}
            </div>
          </div>

          {viewMode === "schedule" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-semibold text-light-white mb-4">
                Schedule: {post?.title || "Loading..."}
              </h2>
              <form onSubmit={handleScheduleSubmit} className="space-y-4">
                <div>
                  <label className="block text-text-gray mb-1">Scheduled Date</label>
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-text-gray mb-1">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-text-gray mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                    required
                  />
                </div>
                <motion.button
                  type="submit"
                  className="bg-accent-red text-light-white px-6 py-2 rounded-sm font-semibold hover:bg-red-700 transition duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Scheduling..." : "Schedule"}
                </motion.button>
              </form>
            </motion.div>
          )}

          {viewMode === "calendar" && userType === "shop" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 500 }}
                className="bg-dark-black text-light-white rounded-sm border border-accent-gray"
                onSelectEvent={(event) => {
                  const booking = event.resource as Booking;
                  alert(
                    `Booking: ${booking.post?.title || "Untitled"}\n` +
                    `With: ${booking.client?.username || "Unknown"}\n` +
                    `Date: ${new Date(booking.scheduledDate).toLocaleString()}\n` +
                    `Status: ${booking.status}\n` +
                    `Contact: ${booking.contactInfo.phone}, ${booking.contactInfo.email}`
                  );
                }}
              />
            </motion.div>
          )}

          {viewMode === "bookings" && userType === "shop" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              {bookings.length > 0 ? (
                bookings.map((booking, index) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="bg-dark-black p-4 rounded-sm shadow-sm border border-accent-gray hover:shadow-xl hover:border-accent-red transition-all duration-300"
                  >
                    <h3 className="text-xl font-semibold text-light-white">
                      {booking.post?.title || "Untitled"}
                    </h3>
                    <p className="text-text-gray mt-1">
                      With: {booking.client?.username || "Unknown"}
                    </p>
                    <p className="text-text-gray mt-1">
                      Date: {new Date(booking.scheduledDate).toLocaleString()}
                    </p>
                    <p className="text-text-gray mt-1">Status: {booking.status}</p>
                    <p className="text-text-gray mt-1">
                      Contact: {booking.contactInfo.phone}, {booking.contactInfo.email}
                    </p>
                    {booking.status === "scheduled" && (
                      <motion.button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="mt-2 bg-red-600 text-light-white px-4 py-1 rounded-sm hover:bg-red-700 transition duration-200"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Cancel Booking
                      </motion.button>
                    )}
                  </motion.div>
                ))
              ) : (
                <p className="text-text-gray">No bookings found.</p>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ScheduleInkPage;