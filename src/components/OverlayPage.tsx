import React from "react";
import { motion } from "framer-motion";

const OverlayPage: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pt-20 pb-8 px-4 bg-tattoo-black"
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-tattoo-red mb-6">Overlay Generator</h1>
        <p className="text-tattoo-light">Overlay functionality has been removed. Coming soon!</p>
      </div>
    </motion.div>
  );
};

export default OverlayPage;
export {};