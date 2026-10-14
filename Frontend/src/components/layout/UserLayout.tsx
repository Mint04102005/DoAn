import { Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { LoadingState } from "@/components/shared/StateViews";
import { ROLE_HOME } from "@/constants";
import { useAuthStore } from "@/stores/auth.store";

export function UserLayout() {
  const { user, hydrated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      navigate({ to: "/auth/login" });
      return;
    }
    if (user.role_id !== 2) {
      navigate({ to: ROLE_HOME[user.role_id] });
    }
  }, [user, hydrated, navigate]);

  if (!hydrated || !user || user.role_id !== 2) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingState label="Đang kiểm tra phiên đăng nhập..." />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
