import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types/healthcare';
import { login as apiLogin } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string, role: UserRole) => Promise<User | null>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Validate stored token on app initialization
  useEffect(() => {
    const validateStoredToken = async () => {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        try {
          // Try to validate token by making a request to a protected endpoint
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
            },
          });

          if (response.ok) {
            const userData = await response.json();
            const formattedUser: User = {
              id: userData.id,
              username: userData.username,
              email: userData.email,
              role: userData.role as UserRole,
            };
            setUser(formattedUser);
            setToken(storedToken);
          } else {
            // Token is invalid, remove it
            localStorage.removeItem('auth_token');
          }
        } catch (error) {
          // Token validation failed, remove it
          localStorage.removeItem('auth_token');
        }
      }
      setIsLoading(false);
    };

    validateStoredToken();
  }, []);

  const login = async (username: string, password: string, role: UserRole): Promise<User | null> => {
    try {
      console.log('🔐 Login attempt:', { username, role });
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username_or_email: username, password, role }),
      });
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { detail: errorText || 'Login failed' };
        }
        throw new Error(errorData.detail || `Login failed with status ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Login successful');
      const userData = result.user;
      const accessToken = result.access_token;
      
      const formattedUser: User = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        role: userData.role as UserRole,
      };
      
      setUser(formattedUser);
      setToken(accessToken);
      localStorage.setItem('auth_token', accessToken);
      return formattedUser;
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user, isLoading }}>
      {children}
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
