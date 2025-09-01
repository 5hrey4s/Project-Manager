'use client';

import { createContext, useState, useContext, useEffect, ReactNode, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: number;
  username: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: { user: User; exp: number } = jwtDecode(token);
        if (Date.now() >= decoded.exp * 1000) {
          localStorage.removeItem('token');
        } else {
          setUser(decoded.user);
        }
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (token: string) => {
    try {
      localStorage.setItem('token', token);
      const decoded: { user: User } = jwtDecode(token);
      setUser(decoded.user);
      
      // *** THE FIX: Force a full page reload to the dashboard. ***
      // This is more reliable than router.push() during the auth callback.
      window.location.href = '/dashboard';

    } catch (error) {
      console.error("Failed to process token on login:", error);
      logout();
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    // Using router.push here is fine because it's a standard user action.
    router.push('/login');
  };

  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    login,
    logout,
  }), [user]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}