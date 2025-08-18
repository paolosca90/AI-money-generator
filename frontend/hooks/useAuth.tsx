import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import backend from "~backend/client";

interface User {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
  validateSession: () => Promise<boolean>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const validateSession = async (): Promise<boolean> => {
    if (!token) {
      return false;
    }

    try {
      const response = await backend.with({ auth: `Bearer ${token}` }).user.me();
      if (response.user) {
        // Update user data if it's different
        if (!user || user.id !== response.user.id) {
          setUser(response.user);
        }
        return true;
      } else {
        // Invalid session
        setUser(null);
        setToken(null);
        localStorage.removeItem("auth_token");
        return false;
      }
    } catch (error) {
      // Session validation failed - clear authentication
      setUser(null);
      setToken(null);
      localStorage.removeItem("auth_token");
      return false;
    }
  };

  const refreshSession = async (): Promise<void> => {
    const isValid = await validateSession();
    if (!isValid && token) {
      // If we had a token but validation failed, the user needs to re-authenticate
      throw new Error("Session expired. Please log in again.");
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("auth_token");
    
    if (savedToken) {
      setToken(savedToken);
      backend.with({ auth: `Bearer ${savedToken}` }).user.me()
        .then(response => {
          if (response.user) {
            setUser(response.user);
          } else {
            localStorage.removeItem("auth_token");
            setToken(null);
          }
        })
        .catch(() => {
          localStorage.removeItem("auth_token");
          setToken(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  // Periodic session validation
  useEffect(() => {
    if (!token || !user) return;

    // Set up periodic session validation (every 5 minutes)
    const intervalId = setInterval(async () => {
      try {
        await validateSession();
      } catch (error) {
        console.warn("Session validation failed:", error);
        // The validateSession method will handle cleanup
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(intervalId);
  }, [token, user]);

  // Enhanced login with immediate session validation
  const login = async (email: string, password: string) => {
    try {
      const response = await backend.user.login({ email, password });
      setUser(response.user);
      setToken(response.token);
      localStorage.setItem("auth_token", response.token);
      
      // Validate the new session immediately
      setTimeout(() => validateSession(), 1000);
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      const response = await backend.user.register({ email, password, firstName, lastName });
      setUser(response.user);
      setToken(response.token);
      localStorage.setItem("auth_token", response.token);
      
      // Validate the new session immediately
      setTimeout(() => validateSession(), 1000);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await backend.with({ auth: `Bearer ${token}` }).user.logout();
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Continue with cleanup even if logout API call fails
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("auth_token");
    }
  };

  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      register,
      logout,
      isLoading,
      isAuthenticated,
      validateSession,
      refreshSession
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
