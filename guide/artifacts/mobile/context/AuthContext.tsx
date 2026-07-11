import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { login as apiLogin, setAuthTokenGetter, setOnUnauthorized } from "@workspace/api-client-react";
import { queryClient } from "./queryClient";

interface AuthState {
  isLoggedIn: boolean;
  isLoading: boolean;
  userRole: "guide" | "admin" | null;
  userName: string;
  phone: string;
}

interface AuthContextType extends AuthState {
  login: (phone: string, role: "guide" | "admin") => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "@yc_auth_v2";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoggedIn: false,
    isLoading: true,
    userRole: null,
    userName: "",
    phone: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.userId) {
            // Register token getter globally
            setAuthTokenGetter(() => parsed.userId.toString());
          }
          setState({
            isLoggedIn: parsed.isLoggedIn,
            isLoading: false,
            userRole: parsed.userRole,
            userName: parsed.userName,
            phone: parsed.phone,
          });
        } else {
          setState((s) => ({ ...s, isLoading: false }));
        }
      } catch {
        setState((s) => ({ ...s, isLoading: false }));
      }
    })();
  }, []);

  const login = useCallback(async (phone: string, role: "guide" | "admin") => {
    // Call real API
    const user = await apiLogin({ phone, role });

    // Configure token getter
    setAuthTokenGetter(() => user.id.toString());

    const newState = {
      isLoggedIn: true,
      userRole: user.role as "guide" | "admin",
      userName: user.name,
      phone: user.phone,
      userId: user.id,
    };

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    
    setState({
      isLoggedIn: true,
      isLoading: false,
      userRole: newState.userRole,
      userName: newState.userName,
      phone: newState.phone,
    });
  }, []);

  const logout = useCallback(async () => {
    setAuthTokenGetter(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
    queryClient.clear();
    setState({ isLoggedIn: false, isLoading: false, userRole: null, userName: "", phone: "" });
  }, []);

  useEffect(() => {
    setOnUnauthorized(logout);
    return () => setOnUnauthorized(null);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
