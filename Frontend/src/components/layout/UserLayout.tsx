import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { LoadingState } from "@/components/shared/StateViews";
import { ROLE_HOME } from "@/constants";
import { useAuthStore } from "@/stores/auth.store";

export function UserLayout() {
  const { user, hydrated } = useAuthStore();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Các route công khai cho phép khách vãng lai xem mà không bắt buộc đăng nhập
  const isPublicRoute =
    pathname === "/user/home" ||
    pathname === "/user/salons" ||
    pathname === "/user/try-on" ||
    pathname === "/user/recommendation";

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      if (!isPublicRoute) {
        navigate({ to: "/auth/login" });
      }
      return;
    }
    if (user.role_id !== 2 && !isPublicRoute) {
      navigate({ to: ROLE_HOME[user.role_id] });
    }
  }, [user, hydrated, navigate, isPublicRoute]);

  if (!hydrated && !isPublicRoute) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingState label="Đang kiểm tra phiên đăng nhập..." />
      </div>
    );
  }

  if (!user && !isPublicRoute) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingState label="Đang chuyển hướng đến trang đăng nhập..." />
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
