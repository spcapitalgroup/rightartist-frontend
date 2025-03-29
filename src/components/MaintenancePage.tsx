import React from "react";
import { motion } from "framer-motion";

const MaintenancePage: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex items-center justify-center bg-dark-black text-light-white"
    >
      <div className="text-center">
        <h1 className="text-4xl font-semibold mb-4">Site Under Maintenance</h1>
        <p className="text-lg text-text-gray mb-6">
          We’re currently performing maintenance on RightArtistry. Please check back later.
        </p>
        <p className="text-sm text-text-gray">
          If you have any questions, please contact support at support@rightartistry.com.
        </p>
      </div>
    </motion.div>
  );
};

export default MaintenancePage;