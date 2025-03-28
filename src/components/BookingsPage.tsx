import React, { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import { motion } from "framer-motion";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useNavigate, Link } from "react-router-dom";

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
  depositAmount?: number;
  shop?: { id: string; username: string };
  client?: { id: string; username: string };
  post?: { id: string; title: string };
}

interface Stats {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
}

interface Notification {
  id: string;
  userId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BookingsPageProps {
  notifications: Notification[];
}

const BookingsPage: React.FC<BookingsPageProps> = ({ notifications }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalRevenue: 0,
  });
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [rescheduleBookingId, setRescheduleBookingId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem("authToken");
  const decoded = token ? JSON.parse(atob(token.split(".")[1])) : {};
  const userType = decoded.userType || "fan";
  const userId = decoded.id || "";

  const fetchBookingsAndStats = useCallback(async () => {
    try {
      if (!token) {
        setError("Please log in to access this page");
        return;
      }

      if (userType !== "shop") {
        setError("Only shop users can access this page");
        return;
      }

      const response = await api.get(`/api/bookings/shop/${userId}`);
      const fetchedBookings: Booking[] = response.data.bookings || [];

      setBookings(fetchedBookings);

      const totalBookings = fetchedBookings.length;
      const completedBookings = fetchedBookings.filter((b: Booking) => b.status === "completed").length;
      const cancelledBookings = fetchedBookings.filter((b: Booking) => b.status === "cancelled").length;
      const totalRevenue = fetchedBookings
        .filter((b: Booking) => b.status === "completed" && b.depositAmount)
        .reduce((sum: number, b: Booking) => sum + (b.depositAmount || 0), 0);

      setStats({
        totalBookings,
        completedBookings,
        cancelledBookings,
        totalRevenue,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load bookings");
      console.error("❌ Fetch Bookings Error:", err.response?.data || err.message);
    }
  }, [token, userType, userId]);

  useEffect(() => {
    fetchBookingsAndStats();
  }, [fetchBookingsAndStats]);

  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[notifications.length - 1];
      if (latestNotification.message.toLowerCase().includes("booking")) {
        console.log("🔔 New booking-related notification detected, refetching bookings...");
        fetchBookingsAndStats();
      }
    }
  }, [notifications, fetchBookingsAndStats]);

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await api.put(`/api/bookings/${bookingId}/cancel`);
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId ? { ...booking, status: "cancelled" } : booking
        )
      );
      setStats((prev) => ({
        ...prev,
        cancelledBookings: prev.cancelledBookings + 1,
      }));
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to cancel booking");
      console.error("❌ Cancel Booking Error:", err.response?.data || err.message);
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !rescheduleBookingId) return;
    setIsSubmitting(true);

    try {
      await api.put(`/api/bookings/${rescheduleBookingId}/reschedule`, {
        scheduledDate: rescheduleDate,
      });
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === rescheduleBookingId
            ? { ...booking, scheduledDate: rescheduleDate }
            : booking
        )
      );
      setRescheduleBookingId(null);
      setRescheduleDate("");
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reschedule booking");
      console.error("❌ Reschedule Booking Error:", err.response?.data || err.message);
    } finally {
      setIsSubmitting(false);
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
              Bookings Dashboard
            </motion.h1>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <motion.button
                onClick={() => setViewMode("calendar")}
                className={`text-text-gray text-sm border border-accent-gray px-3 py-1 rounded-sm hover:bg-dark-black transition duration-200 ${
                  viewMode === "calendar" ? "bg-accent-red text-light-white" : ""
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Calendar View
              </motion.button>
              <motion.button
                onClick={() => setViewMode("list")}
                className={`text-text-gray text-sm border border-accent-gray px-3 py-1 rounded-sm hover:bg-dark-black transition duration-200 ${
                  viewMode === "list" ? "bg-accent-red text-light-white" : ""
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                List View
              </motion.button>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <div className="bg-dark-black p-4 rounded-sm border border-accent-gray">
              <h3 className="text-lg font-semibold text-light-white">Total Bookings</h3>
              <p className="text-2xl text-accent-red">{stats.totalBookings}</p>
            </div>
            <div className="bg-dark-black p-4 rounded-sm border border-accent-gray">
              <h3 className="text-lg font-semibold text-light-white">Completed</h3>
              <p className="text-2xl text-accent-red">{stats.completedBookings}</p>
            </div>
            <div className="bg-dark-black p-4 rounded-sm border border-accent-gray">
              <h3 className="text-lg font-semibold text-light-white">Cancelled</h3>
              <p className="text-2xl text-accent-red">{stats.cancelledBookings}</p>
            </div>
            <div className="bg-dark-black p-4 rounded-sm border border-accent-gray">
              <h3 className="text-lg font-semibold text-light-white">Total Revenue</h3>
              <p className="text-2xl text-accent-red">${stats.totalRevenue.toFixed(2)}</p>
            </div>
          </motion.div>

          {viewMode === "calendar" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 400 }}
                className="bg-dark-black text-light-white rounded-sm border border-accent-gray w-full max-w-4xl mx-auto"
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

          {viewMode === "list" && (
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
                      With:{" "}
                      <Link
                        to={`/profile/${booking.clientId}`}
                        className="text-accent-red hover:underline"
                      >
                        {booking.client?.username || "Unknown"}
                      </Link>
                    </p>
                    <p className="text-text-gray mt-1">
                      Date: {new Date(booking.scheduledDate).toLocaleString()}
                    </p>
                    <p className="text-text-gray mt-1">Status: {booking.status}</p>
                    <p className="text-text-gray mt-1">
                      Contact: {booking.contactInfo.phone}, {booking.contactInfo.email}
                    </p>
                    <div className="mt-2 flex space-x-2">
                      {booking.status === "scheduled" && (
                        <>
                          <motion.button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="bg-red-600 text-light-white px-4 py-1 rounded-sm hover:bg-red-700 transition duration-200"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Cancel
                          </motion.button>
                          <motion.button
                            onClick={() => setRescheduleBookingId(booking.id)}
                            className="bg-accent-red text-light-white px-4 py-1 rounded-sm hover:bg-red-700 transition duration-200"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Reschedule
                          </motion.button>
                        </>
                      )}
                      <motion.button
                        onClick={() => navigate(`/post/${booking.postId}`)}
                        className="bg-accent-gray text-light-white px-4 py-1 rounded-sm hover:bg-gray-600 transition duration-200"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        View Post
                      </motion.button>
                    </div>
                    {rescheduleBookingId === booking.id && (
                      <motion.form
                        onSubmit={handleRescheduleSubmit}
                        className="mt-4 space-y-2"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div>
                          <label className="block text-text-gray mb-1">New Date</label>
                          <input
                            type="datetime-local"
                            value={rescheduleDate}
                            onChange={(e) => setRescheduleDate(e.target.value)}
                            className="w-full p-2 bg-dark-black border border-accent-gray rounded-sm text-light-white focus:outline-none focus:ring-2 focus:ring-accent-red transition duration-200"
                            required
                          />
                        </div>
                        <div className="flex space-x-2">
                          <motion.button
                            type="submit"
                            className="bg-accent-red text-light-white px-4 py-1 rounded-sm hover:bg-red-700 transition duration-200"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? "Rescheduling..." : "Confirm"}
                          </motion.button>
                          <motion.button
                            type="button"
                            onClick={() => {
                              setRescheduleBookingId(null);
                              setRescheduleDate("");
                            }}
                            className="bg-accent-gray text-light-white px-4 py-1 rounded-sm hover:bg-gray-600 transition duration-200"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Cancel
                          </motion.button>
                        </div>
                      </motion.form>
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

export default BookingsPage;