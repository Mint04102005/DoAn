import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Bell,
  CheckCircle,
  History,
  LogOut,
  Menu,
  ShieldAlert,
  ShieldCheck,
  User as UserIcon,
  UserCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/shared/Logo";
import { LoadingState } from "@/components/shared/StateViews";
import { ROLE_HOME } from "@/constants";
import { useAuthStore } from "@/stores/auth.store";

export function AdminLayout() {
  const { user, hydrated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      navigate({ to: "/auth/login" });
      return;
    }
    if (user.role_id !== 1) {
      navigate({ to: ROLE_HOME[user.role_id] || "/auth/login" });
    }
  }, [user, hydrated, navigate]);

  if (!hydrated || !user || user.role_id !== 1) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <LoadingState label="Đang xác thực quyền Quản trị viên..." />
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    toast.success("Đã đăng xuất tài khoản Quản trị viên");
    navigate({ to: "/auth/login" });
  };

  const navItems = [
    {
      label: "Phê duyệt Salon",
      to: "/admin/approvals" as const,
      icon: ShieldCheck,
      description: "Xác minh & duyệt salon đối tác",
    },
    {
      label: "Người dùng",
      to: "/admin/users" as const,
      icon: Users,
      description: "Quản lý tài khoản hệ thống",
    },
    {
      label: "Nhật ký hệ thống",
      to: "/admin/logs" as const,
      icon: History,
      description: "Lịch sử kiểm toán & audit trail",
    },
    {
      label: "Hồ sơ cá nhân",
      to: "/admin/profile" as const,
      icon: UserIcon,
      description: "Thông tin & bảo mật tài khoản",
    },
  ];

  const currentNav =
    navItems.find((item) => location.pathname.startsWith(item.to)) || navItems[0];

  return (
    <div className="flex h-screen h-dvh w-full overflow-hidden bg-muted/20 text-foreground">
      {/* Desktop Sidebar (Fixed 260px) */}
      <aside className="hidden w-64 h-full shrink-0 flex-col border-r border-border bg-card lg:flex">
        {/* Sidebar Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
          <Logo to="/admin/approvals" />
        </div>

        {/* Admin Badge */}
        <div className="shrink-0 px-5 pt-4 pb-2">
          <div className="flex items-center justify-between rounded-xl bg-primary/10 px-3.5 py-2.5 text-xs text-primary">
            <span className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="h-4 w-4" />
              <span>Admin Portal</span>
            </span>
            <span className="rounded-md bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
              v3.0 PRO
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto space-y-1.5 px-3 py-3">
          {navItems.map((item) => {
            const active = location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon
                  className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                    active
                      ? "text-primary-foreground"
                      : "text-muted-foreground group-hover:text-foreground"
                  }`}
                />
                <div className="flex flex-col">
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Admin Profile Section */}
        <div className="shrink-0 border-t border-border p-3.5">
          <Link
            to="/admin/profile"
            className="flex items-center gap-3 rounded-xl bg-muted/40 p-2.5 transition-colors hover:bg-muted/70 group"
          >
            <Avatar className="h-9 w-9 border border-border">
              <AvatarImage src={user.avatar_url} alt={user.username} />
              <AvatarFallback className="bg-primary/20 text-xs font-semibold text-primary">
                {user.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                {user.fullname || user.username}
              </p>
              <p className="flex items-center gap-1 truncate text-[11px] font-medium text-primary">
                <UserCheck className="h-3 w-3" />
                Quản trị viên
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleLogout();
              }}
              title="Đăng xuất"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content Area: Fixed Topbar + Scrollable Content */}
      <div className="flex flex-1 flex-col h-full min-w-0 overflow-hidden">
        {/* Topbar Header (Fixed at top) */}
        <header className="sticky top-0 z-30 shrink-0 flex h-16 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/75 sm:px-6">
          {/* Mobile Menu Trigger & Title */}
          <div className="flex items-center gap-3 lg:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Mở menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-72 flex-col p-0">
                <SheetHeader className="border-b border-border p-5">
                  <SheetTitle>
                    <Logo to="/admin/approvals" />
                  </SheetTitle>
                </SheetHeader>

                <div className="px-5 pt-4">
                  <div className="flex items-center justify-between rounded-xl bg-primary/10 px-3.5 py-2.5 text-xs text-primary">
                    <span className="flex items-center gap-2 font-semibold">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Admin Portal</span>
                    </span>
                    <Badge variant="outline" className="border-primary/40 text-primary">
                      v3.0
                    </Badge>
                  </div>
                </div>

                <nav className="flex-1 space-y-1.5 p-4">
                  {navItems.map((item) => {
                    const active = location.pathname.startsWith(item.to);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all ${
                          active
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>

                <div className="border-t border-border p-4">
                  <Link
                    to="/admin/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl bg-muted/40 p-2.5"
                  >
                    <Avatar className="h-9 w-9 border border-border">
                      <AvatarImage src={user.avatar_url} alt={user.username} />
                      <AvatarFallback className="bg-primary/20 text-xs font-semibold text-primary">
                        {user.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {user.fullname || user.username}
                      </p>
                      <p className="truncate text-[11px] text-primary">Quản trị viên</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleLogout();
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">
                {currentNav?.label || "Admin Portal"}
              </span>
            </div>
          </div>

          {/* Desktop Breadcrumb & System Status */}
          <div className="hidden items-center gap-3 text-sm lg:flex">
            <span className="font-medium text-muted-foreground">Admin</span>
            <span className="text-muted-foreground">/</span>
            <span className="font-semibold text-foreground">
              {currentNav?.label || "Bảng quản trị"}
            </span>

            <div className="ml-4 flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Hệ thống ổn định
            </div>
          </div>

          {/* Topbar Right Section */}
          <div className="flex items-center gap-3">
            {/* System Notifications Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="relative h-9 w-9 rounded-xl border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Bell className="h-4 w-4" />
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                    2
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 rounded-2xl p-2 shadow-xl">
                <DropdownMenuLabel className="flex items-center justify-between text-xs font-semibold text-foreground">
                  <span>Thông báo Quản trị</span>
                  <Badge variant="secondary" className="text-[10px]">
                    2 mới
                  </Badge>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="space-y-1.5 p-1 text-xs">
                  <div className="rounded-xl bg-amber-500/10 p-2.5 transition-colors hover:bg-amber-500/15">
                    <p className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-400">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Yêu cầu duyệt Salon mới
                    </p>
                    <p className="mt-0.5 text-muted-foreground">
                      Salon #1 (Maison Hair Studio) đang chờ xác minh giấy phép.
                    </p>
                    <span className="mt-1 block text-[10px] text-muted-foreground">5 phút trước</span>
                  </div>
                  <div className="rounded-xl bg-emerald-500/10 p-2.5 transition-colors hover:bg-emerald-500/15">
                    <p className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Sao lưu hệ thống thành công
                    </p>
                    <p className="mt-0.5 text-muted-foreground">Dữ liệu 37 tài khoản đã được đồng bộ.</p>
                    <span className="mt-1 block text-[10px] text-muted-foreground">1 giờ trước</span>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2.5 rounded-full p-1 pl-1.5 pr-2.5 hover:bg-muted"
                >
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarImage src={user.avatar_url} alt={user.username} />
                    <AvatarFallback className="bg-primary/20 text-xs font-semibold text-primary">
                      {user.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden text-left sm:block">
                    <p className="text-xs font-semibold leading-tight text-foreground">
                      {user.fullname || user.username}
                    </p>
                    <p className="text-[10px] text-primary font-medium">Quản trị viên</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-xl">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      {user.fullname || user.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{user.username} • {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/admin/profile" className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-primary" />
                    <span>Hồ sơ cá nhân</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/admin/approvals" className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span>Phê duyệt Salon</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/admin/users" className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span>Quản lý Người dùng</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/admin/logs" className="flex items-center gap-2">
                    <History className="h-4 w-4 text-primary" />
                    <span>Nhật ký hệ thống</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Dynamic Page Content (Scrollable) */}
        <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
