import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import JoinUsForm from "./JoinUsForm";
import FanSignupForm from "./FanSignupForm";
import ArtDesignerSignupForm from "./ArtDesignerSignupForm";

interface LandingPageProps {
  setIsAuthenticated: (val: boolean) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ setIsAuthenticated }) => {
  const [isShopFormOpen, setIsShopFormOpen] = useState(false);
  const [isFanFormOpen, setIsFanFormOpen] = useState(false);
  const [isDesignerFormOpen, setIsDesignerFormOpen] = useState(false);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.style.display = "none"; // Hide the image if it fails to load
  };

  return (
    <div className="landing-page font-sans">
      {/* Hero Section */}
      <section className="hero bg-dark-black text-light-white py-20 text-center relative overflow-hidden">
        <div className="absolute top-4 right-4">
          <Link
            to="/login"
            className="bg-accent-red text-light-white px-6 py-3 rounded-sm font-semibold hover:bg-red-700 transition-colors duration-300"
          >
            Log In
          </Link>
        </div>
        <motion.h1
          className="text-5xl sm:text-6xl font-bold mb-4 tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          Welcome to RightArtist
        </motion.h1>
        <motion.p
          className="text-xl sm:text-2xl mb-8 tracking-wide text-text-gray"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          Connect tattoo shops with art designers for DRM-protected designs in under an hour.
        </motion.p>
      </section>

      {/* Why Join RightArtist? Section */}
      <section className="features bg-dark-gray py-16 px-4 text-center">
        <motion.h2
          className="text-3xl sm:text-4xl font-bold mb-12 text-light-white tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          Why Join RightArtist?
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <motion.div
            className="feature p-6 bg-dark-black rounded-sm shadow-lg border border-accent-gray hover:shadow-xl hover:border-accent-red transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          >
            <h3 className="text-xl font-semibold mb-2 text-light-white hover:text-accent-red transition-colors duration-200">
              Fast Designs
            </h3>
            <p className="text-text-gray tracking-wide">
              DRM-protected designs delivered in under an hour for $25-$100.
            </p>
          </motion.div>
          <motion.div
            className="feature p-6 bg-dark-black rounded-sm shadow-lg border border-accent-gray hover:shadow-xl hover:border-accent-red transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            <h3 className="text-xl font-semibold mb-2 text-light-white hover:text-accent-red transition-colors duration-200">
              Secure IP Protection
            </h3>
            <p className="text-text-gray tracking-wide">
              Our DRM technology ensures your designs are safe—use them with confidence, knowing your work is protected.
            </p>
          </motion.div>
          <motion.div
            className="feature p-6 bg-dark-black rounded-sm shadow-lg border border-accent-gray hover:shadow-xl hover:border-accent-red transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          >
            <h3 className="text-xl font-semibold mb-2 text-light-white hover:text-accent-red transition-colors duration-200">
              Community Driven
            </h3>
            <p className="text-text-gray tracking-wide">
              Connect shops, designers, and fans through our Design Feed.
            </p>
          </motion.div>
        </div>
      </section>

      {/* User Tiles Section */}
      <section className="user-tiles py-16 px-4 bg-dark-black text-center">
        <motion.h2
          className="text-3xl sm:text-4xl font-bold mb-12 text-light-white tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          Join the RightArtist Community
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Shop Tile */}
          <motion.div
            className="tile bg-dark-gray shadow-lg rounded-sm p-6 border border-accent-gray hover:shadow-xl hover:border-accent-red transition-all duration-300 flex flex-col min-h-[450px]"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          >
            <h3 className="text-2xl font-bold mb-2 text-light-white hover:text-accent-red transition-colors duration-200">
              Boost Your Shop with RightArtist
            </h3>
            <p className="text-lg font-semibold text-text-gray mb-4 tracking-wide">
              More Clients, Less Time, Bigger Reach
            </p>
            <ul className="text-left text-text-gray mb-6 space-y-2">
              <li>
                <span className="font-semibold text-light-white">Increased Clients:</span> Connect directly with fans seeking custom tattoos—fill your chairs with bookings from our mobile app.
              </li>
              <li>
                <span className="font-semibold text-light-white">Time Efficiency:</span> Get polished designs in under an hour—no more hours sketching, just ink-ready art (unlimited basics with Shop Pro, priority queue with Shop Elite).
              </li>
              <li>
                <span className="font-semibold text-light-white">Apprentice Reach:</span> Your new artists shine—post requests to our Design Feed, get pro designs back, and build their rep fast.
              </li>
              <li>
                <span className="font-semibold text-light-white">Secure & Simple:</span> DRM-protection keeps your work safe, tiled feeds make browsing a breeze—focus on tattooing, not chasing.
              </li>
            </ul>
            <div className="mt-auto text-center">
              <p className="text-text-gray mb-2">We’re onboarding our first 50 shops! Contact us to join.</p>
              <motion.button
                onClick={() => setIsShopFormOpen(true)}
                className="text-accent-red font-semibold hover:underline"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Request to Join
              </motion.button>
            </div>
          </motion.div>

          {/* Fan Tile */}
          <motion.div
            className="tile bg-dark-gray shadow-lg rounded-sm p-6 border border-accent-gray hover:shadow-xl hover:border-accent-red transition-all duration-300 flex flex-col min-h-[450px]"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            <h3 className="text-2xl font-bold mb-2 text-light-white hover:text-accent-red transition-colors duration-200">
              Your Dream Tattoo, Your Way
            </h3>
            <p className="text-lg font-semibold text-text-gray mb-4 tracking-wide">
              Pick the Style, Skip the Guesswork
            </p>
            <ul className="text-left text-text-gray mb-6 space-y-2">
              <li>
                <span className="font-semibold text-light-white">Total Control:</span> Post your tattoo ideas—choose the exact style you want from top artists, not just what’s on the wall.
              </li>
              <li>
                <span className="font-semibold text-light-white">Direct to Artists:</span> Chat with tattoo pros in your area—no awkward shop hops, just the vibe you’re after.
              </li>
              <li>
                <span className="font-semibold text-light-white">Book with Ease:</span> Secure your slot with a deposit via our mobile app—save your spot, no surprises.
              </li>
              <li>
                <span className="font-semibold text-light-white">Find Your Match:</span> Browse tiled feeds of designs and artists near you—get the ink you love, every time.
              </li>
            </ul>
            <motion.button
              onClick={() => setIsFanFormOpen(true)}
              className="bg-accent-red text-white px-6 py-3 rounded-lg hover:bg-red-700 inline-block mt-auto transition-colors duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Join as a Fan—Design Your Next Ink!
            </motion.button>
          </motion.div>

          {/* Art Designer Tile */}
          <motion.div
            className="tile bg-dark-gray shadow-lg rounded-sm p-6 border border-accent-gray hover:shadow-xl hover:border-accent-red transition-all duration-300 flex flex-col min-h-[450px]"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          >
            <h3 className="text-2xl font-bold mb-2 text-light-white hover:text-accent-red transition-colors duration-200">
              Get Paid to Create with RightArtist
            </h3>
            <p className="text-lg font-semibold text-text-gray mb-4 tracking-wide">
              Your Art, Your Cash, Your Rules
            </p>
            <ul className="text-left text-text-gray mb-6 space-y-2">
              <li>
                <span className="font-semibold text-light-white">Earn Big:</span> Make $25-$100 per design—turn your skills into an extra $1,500-$2,000 a month.
              </li>
              <li>
                <span className="font-semibold text-light-white">Same-Day Pay:</span> Cash hits your account the day your design’s delivered—no waiting, just creating.
              </li>
              <li>
                <span className="font-semibold text-light-white">Theft-Proof:</span> DRM-protection locks your work—shops can’t steal, you keep control.
              </li>
              <li>
                <span className="font-semibold text-light-white">Design Freedom:</span> Answer shop requests via our tiled Design Feed—craft what you love, when you want.
              </li>
            </ul>
            <motion.button
              onClick={() => setIsDesignerFormOpen(true)}
              className="bg-accent-red text-white px-6 py-3 rounded-lg hover:bg-red-700 inline-block mt-auto transition-colors duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Sign Up as an Art Designer—Start Earning Now!
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Meet the Founder Section */}
      <section className="meet-founder bg-dark-gray py-16 px-4">
        <motion.h2
          className="text-3xl sm:text-4xl font-bold text-center mb-12 text-light-white tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          Meet the Founder
        </motion.h2>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start gap-8">
          <motion.div
            className="w-full md:w-1/3"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <img
              src="https://via.placeholder.com/300x300"
              alt="Trenton Shupp, Founder of RightArtist"
              className="w-full h-auto rounded-sm shadow-lg hover:scale-105 transition-transform duration-300"
              onError={handleImageError}
            />
          </motion.div>
          <motion.div
            className="w-full md:w-2/3 text-center md:text-left"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            <p className="text-text-gray tracking-wide italic">
              "I’ve always been obsessed with tattoos—the art, the culture, the stories they tell. That’s why I created RightArtist: to make it easier for shops, artists, and fans to connect and create amazing designs in under an hour, all while keeping their work safe with DRM protection. I can’t wait to see how this platform empowers our tattoo community to thrive."
            </p>
            <p className="text-light-white font-semibold text-lg mt-4 italic">-Trenton Shupp</p>
          </motion.div>
        </div>
      </section>

      {/* Modals for Forms */}
      {isShopFormOpen && <JoinUsForm onClose={() => setIsShopFormOpen(false)} />}
      {isFanFormOpen && (
        <FanSignupForm
          onClose={() => setIsFanFormOpen(false)}
          setIsAuthenticated={setIsAuthenticated}
        />
      )}
      {isDesignerFormOpen && (
        <ArtDesignerSignupForm
          onClose={() => setIsDesignerFormOpen(false)}
          setIsAuthenticated={setIsAuthenticated}
        />
      )}
    </div>
  );
};

export default LandingPage;