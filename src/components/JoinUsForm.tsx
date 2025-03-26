import React, { useState } from "react";

const JoinUsForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    shopName: "",
    ownerName: "",
    email: "",
    phone: "",
    address: "",
    message: "",
  });
  const [errors, setErrors] = useState({
    shopName: "",
    ownerName: "",
    email: "",
    phone: "",
  });

  const validateForm = () => {
    const newErrors = { shopName: "", ownerName: "", email: "", phone: "" };
    let isValid = true;

    // Shop Name validation
    if (!formData.shopName.trim()) {
      newErrors.shopName = "Shop Name is required";
      isValid = false;
    }

    // Owner Name validation
    if (!formData.ownerName.trim()) {
      newErrors.ownerName = "Owner Name is required";
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

    // Phone validation (optional, but validate format if provided)
    const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    if (formData.phone.trim() && !phoneRegex.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number (e.g., 123-456-7890)";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Construct email body
      const emailBody = `
Shop Name: ${formData.shopName}
Owner Name: ${formData.ownerName}
Email Address: ${formData.email}
Phone Number: ${formData.phone || "Not provided"}
Physical Address: ${formData.address || "Not provided"}
Message: ${formData.message || "Not provided"}
      `.trim();

      // Send email to shoprequests@rightartistry.com
      const mailtoLink = `mailto:shoprequests@rightartistry.com?subject=Shop Join Request - ${formData.shopName}&body=${encodeURIComponent(emailBody)}`;
      window.location.href = mailtoLink;

      // Close the modal after submission
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Join RightArtist</h2>
        <form onSubmit={handleSubmit}>
          {/* Shop Name */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-1" htmlFor="shopName">Shop Name *</label>
            <input
              type="text"
              id="shopName"
              name="shopName"
              value={formData.shopName}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
            />
            {errors.shopName && <p className="text-red-600 text-sm mt-1">{errors.shopName}</p>}
          </div>

          {/* Owner Name */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-1" htmlFor="ownerName">Owner Name *</label>
            <input
              type="text"
              id="ownerName"
              name="ownerName"
              value={formData.ownerName}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
            />
            {errors.ownerName && <p className="text-red-600 text-sm mt-1">{errors.ownerName}</p>}
          </div>

          {/* Email Address */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-1" htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
            />
            {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
          </div>

          {/* Phone Number */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-1" htmlFor="phone">Phone Number</label>
            <input
              type="text"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              placeholder="e.g., 123-456-7890"
            />
            {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
          </div>

          {/* Physical Address */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-1" htmlFor="address">Physical Address</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>

          {/* Message */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-1" htmlFor="message">Message</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              rows={3}
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-300"
            >
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinUsForm;