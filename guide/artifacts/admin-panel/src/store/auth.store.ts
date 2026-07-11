import { create } from "zustand";
import type { Admin } from "@/types";
import { authService } from "@/services/auth.service";

interface AuthState {
  admin: Admin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  admin: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    set({ isLoading: true });
    console.log("🚀 Attempting login for:", email);
    try {
      const data = await authService.login(email, password);
      console.log("🔑 Login success, token received");
      localStorage.setItem("token", data.token);
      set({ 
        admin: data.admin, 
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (err) {
      console.error("🔥 Login error:", err);
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ admin: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    const token = localStorage.getItem("token");
    console.log("🔍 Checking auth, token exists:", !!token);
    
    if (!token) {
      console.log("🔄 No token found, redirecting to login...");
      set({ admin: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const admin = await authService.getMe();
      console.log("✅ Auth check success:", admin?.email || admin?.name || "Admin");
      set({ admin, isAuthenticated: true, isLoading: false });
    } catch (err) {
      console.error("❌ Auth check failed:", err);
      localStorage.removeItem("token");
      set({ admin: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
