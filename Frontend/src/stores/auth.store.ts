import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@/types";
import { authService } from "@/services/auth.service";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hydrated: boolean;

  setUser: (user: User | null) => void;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  checkAuth: () => Promise<User | null>;
  setHydrated: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      hydrated: false,

      setUser: (user) => {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        set({
          user,
          accessToken: token,
          isAuthenticated: !!user,
        });
      },

      setAuth: (user, token) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("accessToken", token);
        }
        set({
          user,
          accessToken: token,
          isAuthenticated: true,
        });
      },

      logout: () => {
        authService.logout();
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        });
      },

      checkAuth: async () => {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

        if (!token) {
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
            hydrated: true,
          });
          return null;
        }

        set({ isLoading: true });
        try {
          const user = await authService.getMe();
          set({
            user,
            accessToken: token,
            isAuthenticated: true,
            isLoading: false,
            hydrated: true,
          });
          return user;
        } catch (error) {
          // Token không hợp lệ hoặc đã hết hạn
          authService.logout();
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
            hydrated: true,
          });
          return null;
        }
      },

      setHydrated: (v: boolean) => set({ hydrated: v }),
    }),
    {
      name: "ai-hairstyle-auth",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? window.localStorage
          : {
              getItem: () => null,
              setItem: () => undefined,
              removeItem: () => undefined,
            },
      ),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
