import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface Notification {
  id: string;
  userId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NavBarProps {
  setIsAuthenticated: (val: boolean) => void;
  notifications: Notification[];
  messages: string[];
  onLogoClick: () => void;
}

const NavBar: React.FC<NavBarProps> = ({ setIsAuthenticated, notifications, messages, onLogoClick }) => {
  const token = localStorage.getItem("authToken");
  const decoded = token ? JSON.parse(atob(token.split(".")[1])) : {};
  const userId = decoded.id || "";
  const userType = decoded.userType || "";
  const userRole = userType === "fan" ? "Fan" : userType === "designer" ? "ArtDesigner" : userType === "shop" ? "Shop" : userType;
  const isAdmin = decoded.isAdmin || false;
  const firstName = decoded.firstName || "";
  const lastName = decoded.lastName || "";
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleNotifications = () => setIsNotificationsOpen(!isNotificationsOpen);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    setIsAuthenticated(false);
  };

  const visibleNotifications = notifications.slice(0, 5);
  const unreadMessages = messages.filter((msg) => {
    const parsed = JSON.parse(msg);
    return !parsed.isRead;
  }).length;

  console.log("🔍 Rendering NavBar with notifications:", notifications);

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
      className="fixed top-0 w-full bg-dark-black shadow-lg border-b border-accent-gray z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-4">
            <button onClick={toggleMenu} className="text-light-white text-2xl focus:outline-none">
              ☰
            </button>
            <Link
              to="/"
              onClick={onLogoClick}
              className="flex-shrink-0 flex items-center"
            >
              <span className="text-accent-red text-2xl font-bold tracking-tight">RightArtist</span>
            </Link>
          </div>
          <div className="flex items-center">
            <div className="relative">
              <button
                onClick={toggleNotifications}
                className="text-light-white hover:text-accent-red transition duration-200 text-xl"
              >
                🔔
                {visibleNotifications.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-accent-red text-light-white text-xs font-bold px-2 py-0.5 rounded-full">
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
                  className="absolute right-0 mt-2 w-72 bg-dark-gray border border-accent-gray shadow-lg rounded-sm p-4 z-50 max-h-64 overflow-y-auto"
                >
                  <h3 className="text-accent-red text-sm font-bold mb-2">Notifications</h3>
                  {visibleNotifications.length > 0 ? (
                    <>
                      <ul className="max-h-48 overflow-y-auto">
                        {visibleNotifications.map((notif) => (
                          <li key={notif.id} className="p-2 text-light-white text-sm border-b border-accent-gray last:border-b-0">
                            {notif.message}
                            <p className="text-text-gray text-xs">
                              {new Date(notif.createdAt).toLocaleString()}
                            </p>
                          </li>
                        ))}
                      </ul>
                      {notifications.length > 5 && (
                        <Link
                          to="/notifications"
                          onClick={() => setIsNotificationsOpen(false)}
                          className="mt-2 w-full text-center text-light-white hover:text-accent-red text-sm block"
                        >
                          View All ({notifications.length})
                        </Link>
                      )}
                    </>
                  ) : (
                    <p className="text-text-gray text-sm">No new notifications.</p>
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
          className="fixed top-16 left-0 w-64 bg-dark-gray h-full shadow-lg z-40"
        >
          <div className="flex flex-col p-4 space-y-4">
            <span className="text-light-white text-lg">
              Hello {firstName} {lastName}!
            </span>
          </div>
          <div className="flex flex-col p-4 space-y-4">
            {userRole === "Shop" && (
              <Link
                to="/bookings"
                onClick={toggleMenu}
                className="text-light-white hover:text-accent-red transition duration-200 text-lg"
              >
                Dashboard
              </Link>
            )}
            <Link
              to={`/profile/${userId}`}
              onClick={toggleMenu}
              className="text-light-white hover:text-accent-red transition duration-200 text-lg"
            >
              Profile
            </Link>
            <Link
              to="/feed"
              onClick={toggleMenu}
              className="text-light-white hover:text-accent-red transition duration-200 text-lg"
            >
              Feed
            </Link>
            {(userRole === "ArtDesigner" || userRole === "Shop") && (
              <Link
                to="/designs"
                onClick={toggleMenu}
                className="text-light-white hover:text-accent-red transition duration-200 text-lg"
              >
                Designs
              </Link>
            )}
            <Link
              to="/messages"
              onClick={toggleMenu}
              className="text-light-white hover:text-accent-red transition duration-200 text-lg flex items-center"
            >
              Messages
              {unreadMessages > 0 && (
                <span className="ml-2 bg-accent-red text-light-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadMessages}
                </span>
              )}
            </Link>
            <Link
              to="/settings"
              onClick={toggleMenu}
              className="text-light-white hover:text-accent-red transition duration-200 text-lg"
            >
              Settings
            </Link>
            {userRole === "ArtDesigner" && (
              <Link
                to="/stats"
                onClick={toggleMenu}
                className="text-light-white hover:text-accent-red transition duration-200 text-lg"
              >
                Stats
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={toggleMenu}
                className="text-light-white hover:text-accent-red transition duration-200 text-lg"
              >
                Admin
              </Link>
            )}
            <Link
              to="/notifications"
              onClick={toggleMenu}
              className="text-light-white hover:text-accent-red transition duration-200 text-lg"
            >
              Notifications
            </Link>
            <button
              onClick={() => {
                handleLogout();
                toggleMenu();
              }}
              className="text-light-white hover:text-accent-red transition duration-200 text-lg text-left"
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