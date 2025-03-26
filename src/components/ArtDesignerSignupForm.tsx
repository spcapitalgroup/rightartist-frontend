import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signupUser } from "../api";

interface ArtDesignerSignupFormProps {
  onClose: () => void;
  setIsAuthenticated: (val: boolean) => void;
}

const ArtDesignerSignupForm: React.FC<ArtDesignerSignupFormProps> = ({ onClose, setIsAuthenticated }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
  });
  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = { fullName: "", email: "", password: "", phone: "" };
    let isValid = true;

    // Full Name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full Name is required";
      isValid = false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email Address is required";
      isValid = false;
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
      isValid = false;
    }

    // Phone validation (optional, but validate format if provided)
    const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    if (formData.phone.trim() && !phoneRegex.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number (e.g., 123-456-7890)";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Art Designer signup form submitted:", formData); // Debug: Confirm form submission

    if (validateForm()) {
      setIsLoading(true);
      setError("");
      try {
        // Clear existing token and role from local storage to start fresh
        localStorage.removeItem("authToken");
        localStorage.removeItem("userRole");
        console.log("Cleared local storage before signup");

        // Split fullName into firstName and lastName
        const [firstName, ...lastNameParts] = formData.fullName.trim().split(" ");
        const lastName = lastNameParts.join(" ") || "Unknown"; // Fallback if no last name

        const payload = {
          email: formData.email,
          password: formData.password,
          firstName,
          lastName,
          userType: "designer" as const, // Use 'as const' to ensure literal type
        };
        console.log("Calling signupUser API with payload:", payload); // Debug: Before API call

        const response = await signupUser(payload);
        console.log("Signup API response:", response); // Debug: After API call

        if (response.message === "Signup successful" && response.token) {
          // Store the token in local storage
          localStorage.setItem("authToken", response.token);
          localStorage.setItem("userRole", "ArtDesigner");
          console.log("Stored new token in local storage:", response.token);

          // Update authentication state
          setIsAuthenticated(true);

          // Redirect to the design feed (Art Designer dashboard) and reload to ensure token is used
          navigate("/design-feed", { replace: true });
          window.location.reload(); // Force reload to ensure all components use the new token
        } else {
          setError("Signup failed. Please try again.");
        }
      } catch (err: any) {
        console.error("Signup error:", err); // Debug: Log any errors
        setError(err.response?.data?.message || "An error occurred during signup. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign Up as an Art Designer</h2>
        {/* Art Designers can upload designs, sell to Shops, and connect with Fans on the platform */}
        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="mb-4">
            <label className="block text-gray-900 mb-1" htmlFor="fullName">Full Name *</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 text-gray-900"
            />
            {errors.fullName && <p className="text-red-600 text-sm mt-1">{errors.fullName}</p>}
          </div>

          {/* Email Address */}
          <div className="mb-4">
            <label className="block text-gray-900 mb-1" htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 text-gray-900"
            />
            {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="block text-gray-900 mb-1" htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 text-gray-900"
            />
            {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
          </div>

          {/* Phone Number */}
          <div className="mb-4">
            <label className="block text-gray-900 mb-1" htmlFor="phone">Phone Number</label>
            <input
              type="text"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 text-gray-900"
              placeholder="e.g., 123-456-7890"
            />
            {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
          </div>

          {/* Error Message */}
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

          {/* Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-300"
              disabled={isLoading}
            >
              {isLoading ? "Signing Up..." : "Sign Up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ArtDesignerSignupForm;