import { create } from "zustand";
import type { Admin } from "@/types";
import { authService } from "@/services/auth.service";
import { guideService } from "@/services/guide.service";

let guideLoginAttemptedThisSession = false;

export async function ensureGuideToken(phone: string, role: string): Promise<void> {
  if (guideLoginAttemptedThisSession) return;
  if (localStorage.getItem("guide_token")) return;

  guideLoginAttemptedThisSession = true;
  try {
    console.log("🤖 Attempting to ensure Guide API token...");
    const guideAuth = await guideService.login(phone, role);
    localStorage.setItem("guide_token", guideAuth.id.toString());
    console.log("✅ Guide API token acquired, stored:", guideAuth.id);
  } catch (guideErr) {
    console.warn("⚠️ Failed to acquire Guide API token:", guideErr);
  }
}

interface AuthState {
  admin: Admin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAsGuide: (phone: string) => Promise<void>;
  logout: () => void;
  checkAuth: (force?: boolean) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  admin: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    set({ isLoading: true });
    console.log("🚀 Attempting login for:", email);
    try {
      const auth = await authService.login(email, password);
      localStorage.setItem("token", auth.token);
      set({ admin: auth.admin, isAuthenticated: true, isLoading: false });
    } catch (err) {
      console.error("❌ Login failed:", err);
      set({ isLoading: false });
      throw err;
    }
  },

  loginAsGuide: async (phone) => {
    set({ isLoading: true });
    console.log("🚀 Attempting guide login for phone:", phone);
    try {
      const guideAuth = await guideService.login(phone, 'guide');
      localStorage.setItem("guide_token", guideAuth.id.toString());
      set({
        admin: {
          id: guideAuth.id,
          name: guideAuth.name,
          email: guideAuth.email || null,
          role: "guide"
        },
        isAuthenticated: true,
        isLoading: false
      });
    } catch (err) {
      console.error("❌ Guide login failed:", err);
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("guide_token");
    set({ admin: null, isAuthenticated: false });
  },

  checkAuth: async (force = false) => {
    const currentState = get();
    if (!force && currentState.isAuthenticated && currentState.admin) {
      set({ isLoading: false });
      return;
    }

    const token = localStorage.getItem("token");
    const guideToken = localStorage.getItem("guide_token");
    
    if (!token && !guideToken) {
      set({ admin: null, isAuthenticated: false, isLoading: false });
      return;
    }

    set({ isLoading: true });

    // Case 1: Guide login session
    if (guideToken && !token) {
      try {
        const guideProfile = await guideService.getProfile();
        set({
          admin: {
            id: guideProfile.id,
            name: guideProfile.name,
            email: guideProfile.email || null,
            role: "guide"
          },
          isAuthenticated: true,
          isLoading: false
        });
      } catch (err) {
        console.error("❌ Guide auth check failed:", err);
        localStorage.removeItem("guide_token");
        set({ admin: null, isAuthenticated: false, isLoading: false });
      }
      return;
    }

    // Case 2: Admin/manager login session
    try {
      const admin = await authService.getMe();
      set({ admin, isAuthenticated: true, isLoading: false });
    } catch (err) {
      console.error("❌ Auth check failed:", err);
      localStorage.removeItem("token");
      localStorage.removeItem("guide_token");
      set({ admin: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
