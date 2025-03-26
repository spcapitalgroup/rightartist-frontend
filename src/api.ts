import axios from "axios";

const API_BASE_URL = "http://localhost:3000"; // Your backend URL

// Define the expected response type
interface SignupResponse {
  message: string;
  token: string;
}

// Define the payload type to match the backend
interface SignupPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: "fan" | "designer" | "shop";
}

export const signupUser = async (userData: SignupPayload): Promise<SignupResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/signup`, userData);
    return response.data; // { message: "Signup successful", token }
  } catch (error) {
    console.error("Signup API error:", error);
    throw error; // Let the caller handle the error
  }
};