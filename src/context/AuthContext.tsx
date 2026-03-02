import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import api from "../services/api";
import type {
  User,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  AuthContextValue,
} from "../types";

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("factoryflow_token"));
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const checkAuth = useCallback(async (): Promise<void> => {
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
    } catch {
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

  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.login(credentials);
    localStorage.setItem("factoryflow_token", response.token);
    setToken(response.token);
    setUser(response.user);
    setIsAuthenticated(true);
    return response;
  };

  const register = async (userData: RegisterData): Promise<AuthResponse> => {
    const response = await api.register(userData);
    localStorage.setItem("factoryflow_token", response.token);
    setToken(response.token);
    setUser(response.user);
    setIsAuthenticated(true);
    return response;
  };

  const logout = (): void => {
    localStorage.removeItem("factoryflow_token");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = async (data: Partial<User>): Promise<User> => {
    const updatedUser = await api.updateProfile(data);
    setUser(updatedUser);
    return updatedUser;
  };

  const value: AuthContextValue = {
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
