import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useNavigate } from "react-router-dom";

const localizer = momentLocalizer(moment);

interface Booking {
  id: string;
  title: string;
  scheduledDate: string;
  user: { id: string; username: string };
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
}

const ShopCalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState("");
  const token = localStorage.getItem("authToken");

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        if (!token) {
          setError("Please log in to view your calendar");
          return;
        }

        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/shops/bookings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("🔍 Bookings Response:", response.data);
        setBookings(response.data.bookings || []);
      } catch (err: any) {
        console.error("❌ Fetch Bookings Error:", err.response?.data || err.message);
        setError(err.response?.data?.message || "Failed to load bookings");
      }
    };
    fetchBookings();
  }, [token]);

  const events: CalendarEvent[] = bookings.map((booking) => {
    const start = new Date(booking.scheduledDate);
    const end = new Date(start);
    end.setHours(start.getHours() + 1); // Assume 1-hour duration for simplicity

    return {
      id: booking.id,
      title: `Tattoo Appointment: ${booking.title} with ${booking.user.username}`,
      start,
      end,
    };
  });

  const handleSelectEvent = (event: CalendarEvent) => {
    navigate(`/post/${event.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen pt-20 pb-8 px-4 bg-tattoo-black"
    >
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-tattoo-red mb-6">Shop Calendar</h1>
        {error && <p className="text-tattoo-red mb-4">{error}</p>}
        <div className="bg-tattoo-gray/20 p-6 rounded-lg shadow-lg border border-tattoo-red/30">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500 }}
            onSelectEvent={handleSelectEvent}
            className="text-tattoo-light"
          />
        </div>
      </div>
    </motion.div>
  );
};

export default ShopCalendarPage;