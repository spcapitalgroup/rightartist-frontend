import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface NavBarProps {
  setIsAuthenticated: (val: boolean) => void;
  notifications: string[];
  setNotifications: (notifications: string[]) => void;
  messages: string[];
}

const NavBar: React.FC<NavBarProps> = ({ setIsAuthenticated, notifications, setNotifications, messages }) => {
  const navigate = useNavigate();
  const userType = localStorage.getItem("userType") || "fan";
  const isAdmin = localStorage.getItem("isAdmin") === "true";
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    localStorage.removeItem("isAdmin");
    setIsAuthenticated(false);
    navigate("/");
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleNotifications = () => setIsNotificationsOpen(!isNotificationsOpen);
  const clearNotifications = () => {
    setNotifications([]);
    setIsNotificationsOpen(false);
  };

  const visibleNotifications = notifications.slice(0, 5);
  const unreadMessages = messages.filter((msg) => {
    const parsed = JSON.parse(msg);
    return !parsed.isRead;
  }).length;

  console.log("🔍 NavBar rendered with notifications:", notifications); // Debug log

  const menuVariants = {
    closed: { opacity: 0, x: "-100%" },
    open: { opacity: 1, x: 0 },
  };

  const dropdownVariants = {
    closed: { opacity: 0, y: -10 },
    open: { opacity: 1, y: 0 },
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 w-full bg-tattoo-black shadow-lg border-b border-tattoo-red/20 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-4">
            <button onClick={toggleMenu} className="text-tattoo-light text-2xl focus:outline-none">
              ☰
            </button>
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-tattoo-red text-2xl font-bold tracking-tight">RightArtist</span>
            </Link>
          </div>
          <div className="flex items-center">
            <div className="relative">
              <button
                onClick={toggleNotifications}
                className="text-tattoo-light hover:text-tattoo-red transition duration-200 text-xl"
              >
                🔔
                {visibleNotifications.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-tattoo-red text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {visibleNotifications.length}
                  </span>
                )}
              </button>
              {isNotificationsOpen && (
                <motion.div
                  initial="closed"
                  animate="open"
                  exit="closed"
                  variants={dropdownVariants}
                  className="absolute right-0 mt-2 w-72 bg-tattoo-black border border-tattoo-red/30 shadow-lg rounded-lg p-4 z-50 max-h-64 overflow-y-auto"
                >
                  <h3 className="text-tattoo-red text-sm font-bold mb-2">Notifications</h3>
                  {visibleNotifications.length > 0 ? (
                    <>
                      <ul className="max-h-48 overflow-y-auto">
                        {visibleNotifications.map((notif, index) => (
                          <li key={index} className="p-2 text-tattoo-light text-sm border-b border-tattoo-gray last:border-b-0">
                            {notif}
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={clearNotifications}
                        className="mt-2 w-full bg-tattoo-red text-white text-sm p-2 rounded-lg hover:bg-tattoo-red/80 transition duration-200"
                      >
                        Clear All
                      </button>
                      {notifications.length > 5 && (
                        <Link
                          to="/notifications"
                          onClick={() => setIsNotificationsOpen(false)}
                          className="mt-2 w-full text-center text-tattoo-light hover:text-tattoo-red text-sm block"
                        >
                          View All ({notifications.length})
                        </Link>
                      )}
                    </>
                  ) : (
                    <p className="text-tattoo-gray text-sm">No new notifications.</p>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
      {isMenuOpen && (
        <motion.div
          initial="closed"
          animate="open"
          exit="closed"
          variants={menuVariants}
          className="fixed top-16 left-0 w-64 bg-tattoo-gray/90 h-full shadow-lg z-40"
        >
          <div className="flex flex-col p-4 space-y-4">
            {(userType === "shop" || userType === "elite" || userType === "designer") && (
              <Link
                to="/design-feed"
                onClick={toggleMenu}
                className="text-tattoo-light hover:text-tattoo-red transition duration-200 text-lg"
              >
                Design Feed
              </Link>
            )}
            {(userType === "shop" || userType === "elite" || userType === "fan") && (
              <Link
                to="/booking-feed"
                onClick={toggleMenu}
                className="text-tattoo-light hover:text-tattoo-red transition duration-200 text-lg"
              >
                Booking Feed
              </Link>
            )}
            <Link
              to="/messages"
              onClick={toggleMenu}
              className="text-tattoo-light hover:text-tattoo-red transition duration-200 text-lg flex items-center"
            >
              Messages
              {unreadMessages > 0 && (
                <span className="ml-2 bg-tattoo-red text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadMessages}
                </span>
              )}
            </Link>
            <Link
              to="/settings"
              onClick={toggleMenu}
              className="text-tattoo-light hover:text-tattoo-red transition duration-200 text-lg"
            >
              Settings
            </Link>
            {userType === "designer" && (
              <Link
                to="/stats"
                onClick={toggleMenu}
                className="text-tattoo-light hover:text-tattoo-red transition duration-200 text-lg"
              >
                Stats
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={toggleMenu}
                className="text-tattoo-light hover:text-tattoo-red transition duration-200 text-lg"
              >
                Admin
              </Link>
            )}
            <Link
              to="/notifications"
              onClick={toggleMenu}
              className="text-tattoo-light hover:text-tattoo-red transition duration-200 text-lg"
            >
              Notifications
            </Link>
            <button
              onClick={() => {
                handleLogout();
                toggleMenu();
              }}
              className="text-tattoo-light hover:text-tattoo-red transition duration-200 text-lg text-left"
            >
              Logout
            </button>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default NavBar;