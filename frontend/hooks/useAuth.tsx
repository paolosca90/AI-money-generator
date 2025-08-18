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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token in localStorage
    const savedToken = localStorage.getItem("auth_token");
    console.log("AuthProvider - Checking saved token:", !!savedToken);
    
    if (savedToken) {
      setToken(savedToken);
      // Verify token and get user info using the correct auth format
      console.log("AuthProvider - Verifying token with backend");
      backend.with({ auth: `Bearer ${savedToken}` }).user.me()
        .then(response => {
          console.log("AuthProvider - Token verification response:", response);
          if (response.user) {
            setUser(response.user);
            console.log("AuthProvider - User set successfully");
          } else {
            console.log("AuthProvider - No user in response, clearing token");
            localStorage.removeItem("auth_token");
            setToken(null);
          }
        })
        .catch((error) => {
          console.error("AuthProvider - Token verification failed:", error);
          localStorage.removeItem("auth_token");
          setToken(null);
        })
        .finally(() => {
          console.log("AuthProvider - Token verification complete");
          setIsLoading(false);
        });
    } else {
      console.log("AuthProvider - No saved token found");
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log("AuthProvider - Attempting login");
      const response = await backend.user.login({ email, password });
      console.log("AuthProvider - Login successful, setting user and token");
      setUser(response.user);
      setToken(response.token);
      localStorage.setItem("auth_token", response.token);
    } catch (error) {
      console.error("AuthProvider - Login failed:", error);
      throw error;
    }
  };

  const register = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      console.log("AuthProvider - Attempting registration");
      const response = await backend.user.register({ email, password, firstName, lastName });
      console.log("AuthProvider - Registration successful, setting user and token");
      setUser(response.user);
      setToken(response.token);
      localStorage.setItem("auth_token", response.token);
    } catch (error) {
      console.error("AuthProvider - Registration failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (token) {
        console.log("AuthProvider - Attempting logout");
        await backend.with({ auth: `Bearer ${token}` }).user.logout();
      }
    } catch (error) {
      console.error("AuthProvider - Logout error:", error);
    } finally {
      console.log("AuthProvider - Clearing user and token");
      setUser(null);
      setToken(null);
      localStorage.removeItem("auth_token");
    }
  };

  const isAuthenticated = !!user && !!token;
  console.log("AuthProvider - Current state:", { 
    hasUser: !!user, 
    hasToken: !!token, 
    isAuthenticated, 
    isLoading,
    tokenLength: token?.length 
  });

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      register,
      logout,
      isLoading,
      isAuthenticated
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
