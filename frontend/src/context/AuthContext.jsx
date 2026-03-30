import React, { createContext, useState, useEffect } from "react";
import api from "../services/api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from local storage on startup
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const { token: newToken, user: userData } = response.data;
      
      setUser(userData);
      setToken(newToken);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", newToken);
      
      return { success: true, role: userData.role, rawPayload: response.data };
      } catch (error) {
        // Defensive: handle both string and object error responses
        const errorData = error.response?.data?.error || error.response?.data?.message || error.message || "Login failed";
        const normalizedError = typeof errorData === "object" ? (errorData.message || JSON.stringify(errorData)) : errorData;
        
        return { 
          success: false, 
          error: normalizedError
        };
      }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
