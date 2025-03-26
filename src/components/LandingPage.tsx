import React, { useState } from "react";
import { Link } from "react-router-dom";
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

  return (
    <div className="landing-page min-h-screen font-sans">
      {/* Hero Section */}
      <section className="hero bg-black text-white py-20 text-center relative">
        <div className="absolute top-4 right-4">
          <Link to="/login" className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors duration-300">
            Log In
          </Link>
        </div>
        <h1 className="text-5xl font-bold mb-4 tracking-tight">Welcome to RightArtist</h1>
        <p className="text-xl mb-8 tracking-wide">Connect tattoo shops with art designers for DRM-protected designs in under an hour.</p>
      </section>

      {/* Why Join RightArtist? Section */}
      <section className="features bg-gray-200 py-16 px-4 text-center">
        <h2 className="text-3xl font-bold mb-12 text-gray-800 tracking-tight">Why Join RightArtist?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="feature p-4">
            <h3 className="text-xl font-semibold mb-2 text-gray-800 tracking-tight">Fast Designs</h3>
            <p className="text-gray-600 tracking-wide">DRM-protected designs delivered in under an hour for $25-$100.</p>
          </div>
          <div className="feature p-4">
            <h3 className="text-xl font-semibold mb-2 text-gray-800 tracking-tight">Secure IP Protection</h3>
            <p className="text-gray-600 tracking-wide">Our DRM technology ensures your designs are safe—use them with confidence, knowing your work is protected.</p>
          </div>
          <div className="feature p-4">
            <h3 className="text-xl font-semibold mb-2 text-gray-800 tracking-tight">Community Driven</h3>
            <p className="text-gray-600 tracking-wide">Connect shops, designers, and fans through our Design Feed.</p>
          </div>
        </div>
      </section>

      {/* User Tiles Section */}
      <section className="user-tiles py-16 px-4 bg-white text-center">
        <h2 className="text-3xl font-bold mb-12 text-gray-800 tracking-tight">Join the RightArtist Community</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Shop Tile */}
          <div className="tile bg-gray-100 shadow-lg rounded-lg p-6 hover:scale-105 transition-transform duration-300 flex flex-col min-h-[450px] border border-gray-200">
            <h3 className="text-2xl font-bold mb-2 text-gray-800 tracking-tight">Boost Your Shop with RightArtist</h3>
            <p className="text-lg font-semibold text-gray-600 mb-4 tracking-wide">More Clients, Less Time, Bigger Reach</p>
            <ul className="text-left text-gray-600 mb-6 space-y-2">
              <li><span className="font-semibold">Increased Clients:</span> Connect directly with fans seeking custom tattoos—fill your chairs with bookings from our mobile app.</li>
              <li><span className="font-semibold">Time Efficiency:</span> Get polished designs in under an hour—no more hours sketching, just ink-ready art (unlimited basics with Shop Pro, priority queue with Shop Elite).</li>
              <li><span className="font-semibold">Apprentice Reach:</span> Your new artists shine—post requests to our Design Feed, get pro designs back, and build their rep fast.</li>
              <li><span className="font-semibold">Secure & Simple:</span> DRM-protection keeps your work safe, tiled feeds make browsing a breeze—focus on tattooing, not chasing.</li>
            </ul>
            <div className="mt-auto text-center">
              <p className="text-gray-600 mb-2">We’re onboarding our first 50 shops! Contact us to join.</p>
              <button
                onClick={() => setIsShopFormOpen(true)}
                className="text-red-600 font-semibold hover:underline"
              >
                Request to Join
              </button>
            </div>
          </div>

          {/* Fan Tile */}
          <div className="tile bg-gray-100 shadow-lg rounded-lg p-6 hover:scale-105 transition-transform duration-300 flex flex-col min-h-[450px] border border-gray-200">
            <h3 className="text-2xl font-bold mb-2 text-gray-800 tracking-tight">Your Dream Tattoo, Your Way</h3>
            <p className="text-lg font-semibold text-gray-600 mb-4 tracking-wide">Pick the Style, Skip the Guesswork</p>
            <ul className="text-left text-gray-600 mb-6 space-y-2">
              <li><span className="font-semibold">Total Control:</span> Post your tattoo ideas—choose the exact style you want from top artists, not just what’s on the wall.</li>
              <li><span className="font-semibold">Direct to Artists:</span> Chat with tattoo pros in your area—no awkward shop hops, just the vibe you’re after.</li>
              <li><span className="font-semibold">Book with Ease:</span> Secure your slot with a deposit via our mobile app—save your spot, no surprises.</li>
              <li><span className="font-semibold">Find Your Match:</span> Browse tiled feeds of designs and artists near you—get the ink you love, every time.</li>
            </ul>
            <button
              onClick={() => setIsFanFormOpen(true)}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 inline-block mt-auto transition-colors duration-300"
            >
              Join as a Fan—Design Your Next Ink!
            </button>
          </div>

          {/* Art Designer Tile */}
          <div className="tile bg-gray-100 shadow-lg rounded-lg p-6 hover:scale-105 transition-transform duration-300 flex flex-col min-h-[450px] border border-gray-200">
            <h3 className="text-2xl font-bold mb-2 text-gray-800 tracking-tight">Get Paid to Create with RightArtist</h3>
            <p className="text-lg font-semibold text-gray-600 mb-4 tracking-wide">Your Art, Your Cash, Your Rules</p>
            <ul className="text-left text-gray-600 mb-6 space-y-2">
              <li><span className="font-semibold">Earn Big:</span> Make $25-$100 per design—turn your skills into an extra $1,500-$2,000 a month.</li>
              <li><span className="font-semibold">Same-Day Pay:</span> Cash hits your account the day your design’s delivered—no waiting, just creating.</li>
              <li><span className="font-semibold">Theft-Proof:</span> DRM-protection locks your work—shops can’t steal, you keep control.</li>
              <li><span className="font-semibold">Design Freedom:</span> Answer shop requests via our tiled Design Feed—craft what you love, when you want.</li>
            </ul>
            <button
              onClick={() => setIsDesignerFormOpen(true)}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 inline-block mt-auto transition-colors duration-300"
            >
              Sign Up as an Art Designer—Start Earning Now!
            </button>
          </div>
        </div>
      </section>

      {/* Meet the Founder Section */}
      <section className="meet-founder bg-gray-100 py-16 px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-800 tracking-tight">Meet the Founder</h2>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start gap-8">
          <div className="w-full md:w-1/3">
            <img
              src="https://via.placeholder.com/300x300"
              alt="Trenton Shupp, Founder of RightArtist"
              className="w-full h-auto rounded-lg shadow-lg"
            />
          </div>
          <div className="w-full md:w-2/3 text-center md:text-left">
            <p className="text-gray-600 tracking-wide italic">
              "I’ve always been obsessed with tattoos—the art, the culture, the stories they tell. That’s why I created RightArtist: to make it easier for shops, artists, and fans to connect and create amazing designs in under an hour, all while keeping their work safe with DRM protection. I can’t wait to see how this platform empowers our tattoo community to thrive."
            </p>
            <p className="text-gray-800 font-semibold text-lg mt-4 italic">-Trenton Shupp</p>
          </div>
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