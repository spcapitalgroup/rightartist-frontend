import React from "react";
import { Link } from "react-router-dom";

// Mock user data (replace with API fetch later)
const mockUsers = [
  { id: 1, name: "InkSpot Studio", role: "Shop Pro", price: "$24.99/month", image: "https://via.placeholder.com/150" },
  { id: 2, name: "Art by Jane", role: "Art Designer", price: "$25-$100/design", image: "https://via.placeholder.com/150" },
  { id: 3, name: "Tattoo Haven", role: "Shop Elite", price: "$49.99/month", image: "https://via.placeholder.com/150" },
  { id: 4, name: "Designs by Alex", role: "Art Designer", price: "$25-$100/design", image: "https://via.placeholder.com/150" },
];

const LandingPage: React.FC = () => {
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
        <p className="text-xl mb-8 tracking-wide">Connect tattoo shops with art designers for DRM-protected designs in 30 minutes.</p>
      </section>

      {/* Tiled User Information */}
      <section className="users py-16 px-4 bg-gray-100">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-800 tracking-tight">Meet Our Community</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {mockUsers.map((user) => (
            <div key={user.id} className="user-card bg-white shadow-lg rounded-lg p-4 text-center hover:scale-105 transition-transform duration-300 border border-gray-200">
              <img src={user.image} alt={user.name} className="w-24 h-24 rounded-full mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800">{user.name}</h3>
              <p className="text-gray-600">{user.role}</p>
              <p className="text-gray-800 font-bold">{user.price}</p>
            </div>
          ))}
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
              <li><span className="font-semibold">Time Efficiency:</span> Get polished designs in 30 minutes flat—no more hours sketching, just ink-ready art (unlimited basics with Shop Pro, priority queue with Shop Elite).</li>
              <li><span className="font-semibold">Apprentice Reach:</span> Your new artists shine—post requests to our Design Feed, get pro designs back, and build their rep fast.</li>
              <li><span className="font-semibold">Secure & Simple:</span> DRM-protection keeps your work safe, tiled feeds make browsing a breeze—focus on tattooing, not chasing.</li>
            </ul>
            <div className="mt-auto text-center">
              <p className="text-gray-600 mb-2">We’re onboarding our first 50 shops! Contact us to join.</p>
              <a href="mailto:support@rightartistry.com" className="text-red-600 font-semibold hover:underline">
                Request to Join
              </a>
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
            <Link to="/signup" className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 inline-block mt-auto transition-colors duration-300">
              Join as a Fan—Design Your Next Ink!
            </Link>
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
            <Link to="/signup" className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 inline-block mt-auto transition-colors duration-300">
              Sign Up as an Art Designer—Start Earning Now!
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section (Moved Below "Join the RightArtist Community") */}
      <section className="features bg-gray-200 py-16 px-4 text-center">
        <h2 className="text-3xl font-bold mb-12 text-gray-800 tracking-tight">Why Choose RightArtist?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="feature p-4">
            <h3 className="text-xl font-semibold mb-2 text-gray-800 tracking-tight">Fast Designs</h3>
            <p className="text-gray-600 tracking-wide">DRM-protected designs delivered in 30 minutes for $25-$100.</p>
          </div>
          <div className="feature p-4">
            <h3 className="text-xl font-semibold mb-2 text-gray-800 tracking-tight">Shop Subscriptions</h3>
            <p className="text-gray-600 tracking-wide">Shop Pro ($24.99/month) and Shop Elite ($49.99/month) plans.</p>
          </div>
          <div className="feature p-4">
            <h3 className="text-xl font-semibold mb-2 text-gray-800 tracking-tight">Community Driven</h3>
            <p className="text-gray-600 tracking-wide">Connect shops, designers, and fans through our Design Feed.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;