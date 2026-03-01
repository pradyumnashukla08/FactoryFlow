import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("factoryflow_token"));
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuth = useCallback(async () => {
    const storedToken = localStorage.getItem("factoryflow_token");
    if (!storedToken) {
      setLoading(false);
      setIsAuthenticated(false);
      setUser(null);
      return;
    }
    try {
      const userData = await api.getProfile();
      setUser(userData);
      setToken(storedToken);
      setIsAuthenticated(true);
    } catch (error) {
      localStorage.removeItem("factoryflow_token");
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (credentials) => {
    const response = await api.login(credentials);
    localStorage.setItem("factoryflow_token", response.token);
    setToken(response.token);
    setUser(response.user);
    setIsAuthenticated(true);
    return response;
  };

  const register = async (userData) => {
    const response = await api.register(userData);
    localStorage.setItem("factoryflow_token", response.token);
    setToken(response.token);
    setUser(response.user);
    setIsAuthenticated(true);
    return response;
  };

  const logout = () => {
    localStorage.removeItem("factoryflow_token");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = async (data) => {
    const updatedUser = await api.updateProfile(data);
    setUser(updatedUser);
    return updatedUser;
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
