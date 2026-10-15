import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  ExternalLink,
  History,
  Image as ImageIcon,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  Scissors,
  Shield,
  ShieldCheck,
  Sparkles,
  Store,
  Trash2,
  Upload,
  User as UserIcon,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { BookingStatusBadge } from "@/components/shared/BookingStatusBadge";
import { EmptyState, LoadingState } from "@/components/shared/StateViews";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { bookingService } from "@/services/booking.service";
import { salonService } from "@/services/salon.service";
import { tryOnService } from "@/services/try-on.service";
import { userService } from "@/services/user.service";
import { useAuthStore } from "@/stores/auth.store";
import type { Booking, BookingStatus, Gender, TryOnHistory } from "@/types";

export const Route = createFileRoute("/user/profile")({
  head: () => ({
    meta: [
      { title: "Hồ sơ của tôi — AI Hairstyle Recommendation System" },
      {
        name: "description",
        content: "Quản lý thông tin cá nhân, lịch hẹn salon và bộ sưu tập kiểu tóc đã thử.",
      },
    ],
  }),
  component: UserProfilePage,
});

type ProfileTab = "profile" | "bookings" | "history" | "security";

const PRESET_AVATARS = [
  "https://i.pravatar.cc/150?img=1",
  "https://i.pravatar.cc/150?img=5",
  "https://i.pravatar.cc/150?img=11",
  "https://i.pravatar.cc/150?img=20",
  "https://i.pravatar.cc/150?img=33",
  "https://i.pravatar.cc/150?img=47",
  "https://i.pravatar.cc/150?img=60",
  "https://i.pravatar.cc/150?img=68",
];

function formatDateDisplay(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

function UserProfilePage() {
  const { user, setUser, logout } = useAuthStore();
  const navigate = useNavigate();

  // Active sidebar tab
  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");

  // Profile Edit State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<Gender>("female");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn tệp định dạng hình ảnh hợp lệ (PNG, JPG, WebP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dung lượng ảnh không được vượt quá 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setAvatarUrl(dataUrl);
        toast.success("Đã chọn ảnh từ thiết bị. Nhấn 'Lưu' để hoàn tất cập nhật.");
      }
    };
    reader.onerror = () => {
      toast.error("Không thể đọc tệp hình ảnh. Vui lòng thử lại.");
    };
    reader.readAsDataURL(file);
  };

  // Security / Password State
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [isChangingPwd, setIsChangingPwd] = useState(false);

  // Booking status filter
  const [bookingStatusFilter, setBookingStatusFilter] = useState<BookingStatus | "ALL">("ALL");

  // Real profile query from Backend API
  const profileQuery = useQuery({
    queryKey: ["user-me-profile"],
    queryFn: () => userService.getProfile(),
    staleTime: 1000 * 60 * 5,
  });

  // Sync user data to form
  useEffect(() => {
    const active = profileQuery.data || user;
    if (active) {
      setFullname(active.fullname || active.username || "");
      setEmail(active.email || "");
      setPhone(active.phone || "");
      setGender(active.gender || "male");
      setDob(active.dob || "");
      setAddress(active.address || "");
      setAvatarUrl(active.avatar_url || "");
    }
  }, [profileQuery.data, user, isEditing]);

  // Queries
  const historyQuery = useQuery({
    queryKey: ["history", user?.user_id],
    queryFn: () => tryOnService.listByUser(user!.user_id, 20),
    enabled: !!user,
  });

  const bookingsQuery = useQuery({
    queryKey: ["my-bookings", user?.user_id],
    queryFn: () => bookingService.listByUser(user!.user_id),
    enabled: !!user,
  });

  const salonsQuery = useQuery({
    queryKey: ["all-salons-lookup"],
    queryFn: () => salonService.search(),
  });

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingState label="Đang tải hồ sơ cá nhân..." />
      </div>
    );
  }

  const currentUser = profileQuery.data || user;

  const handleSaveProfile = async () => {
    if (!fullname.trim()) {
      toast.error("Họ và tên không được để trống");
      return;
    }

    setIsSavingProfile(true);
    try {
      const updated = await userService.updateProfile({
        name: fullname.trim(),
        phone: phone.trim() || undefined,
        avatarUrl: avatarUrl || undefined,
        gender: gender || undefined,
        dob: dob.trim() || undefined,
        address: address.trim() || undefined,
      });

      setUser({
        ...user,
        ...updated,
        fullname: updated.fullname || updated.username,
        phone: updated.phone || "",
        avatar_url: updated.avatar_url,
        gender: updated.gender,
        dob: updated.dob,
        address: updated.address,
      });

      await profileQuery.refetch();
      setIsEditing(false);
      setShowAvatarPicker(false);
      toast.success("Cập nhật thông tin cá nhân thành công!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cập nhật thông tin thất bại");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPwd) {
      toast.error("Vui lòng nhập mật khẩu hiện tại");
      return;
    }
    if (newPwd.length < 6) {
      toast.error("Mật khẩu mới phải tối thiểu 6 ký tự");
      return;
    }
    if (newPwd !== confirmPwd) {
      toast.error("Mật khẩu xác nhận không trùng khớp");
      return;
    }

    setIsChangingPwd(true);
    try {
      const res = await userService.changePassword({
        oldPassword: currentPwd,
        newPassword: newPwd,
      });
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
      toast.success(res.message || "Đổi mật khẩu tài khoản thành công!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Đổi mật khẩu thất bại");
    } finally {
      setIsChangingPwd(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Đã đăng xuất thành công");
    navigate({ to: "/auth/login" });
  };

  // Filtered bookings
  const userBookings = bookingsQuery.data || [];
  const filteredBookings =
    bookingStatusFilter === "ALL"
      ? userBookings
      : userBookings.filter((b) => b.status === bookingStatusFilter);

  const navMenuItems = [
    {
      id: "profile" as ProfileTab,
      label: "Thông tin cá nhân",
      desc: "Hồ sơ, liên hệ & avatar",
      icon: UserIcon,
    },
    {
      id: "bookings" as ProfileTab,
      label: "Lịch hẹn của tôi",
      desc: "Quản lý các lịch đặt salon",
      icon: CalendarCheck,
      badge: userBookings.length > 0 ? userBookings.length : undefined,
    },
    {
      id: "history" as ProfileTab,
      label: "Bộ sưu tập tóc đã thử",
      desc: "Ảnh ghép tóc AI đã lưu",
      icon: Sparkles,
      badge:
        historyQuery.data && historyQuery.data.length > 0 ? historyQuery.data.length : undefined,
    },
    {
      id: "security" as ProfileTab,
      label: "Bảo mật & Mật khẩu",
      desc: "Đổi mật khẩu, an toàn",
      icon: Shield,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Hồ sơ & Tài khoản
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quản lý thông tin cá nhân, lịch hẹn làm tóc và xem lại các kiểu tóc AI đã thử.
        </p>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Vertical Navigation Sidebar */}
        {/* ========================================================================= */}
        <div className="space-y-4 lg:col-span-4">
          {/* User Mini Profile Card */}
          <Card className="overflow-hidden rounded-3xl border-border bg-card p-5 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-sm">
                  <AvatarImage src={currentUser.avatar_url} alt={currentUser.username} />
                  <AvatarFallback className="bg-primary/20 text-lg font-bold text-primary">
                    {(currentUser.fullname || currentUser.username).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-base font-bold text-foreground">
                    {currentUser.fullname || currentUser.username}
                  </h2>
                </div>
                <p className="truncate text-xs text-muted-foreground">@{currentUser.username}</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <Badge variant="secondary" className="text-[10px] font-medium">
                    {currentUser.role_id === 1
                      ? "Admin"
                      : currentUser.role_id === 3
                        ? "Salon Partner"
                        : "Khách hàng"}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    • {currentUser.gender === "female" ? "Nữ" : "Nam"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick stats mini row */}
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border/60 pt-3 text-center">
              <div className="rounded-xl bg-muted/40 p-2">
                <p className="text-xs text-muted-foreground">Lịch đặt</p>
                <p className="text-base font-bold text-foreground">{userBookings.length}</p>
              </div>
              <div className="rounded-xl bg-muted/40 p-2">
                <p className="text-xs text-muted-foreground">Tóc đã thử</p>
                <p className="text-base font-bold text-foreground">
                  {historyQuery.data?.length || 0}
                </p>
              </div>
            </div>
          </Card>

          {/* Vertical Menu Buttons */}
          <Card className="rounded-3xl border-border bg-card p-2 shadow-xs">
            <nav className="space-y-1">
              {navMenuItems.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex w-full items-center justify-between rounded-2xl px-3.5 py-3 text-left transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                          isActive
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs leading-tight sm:text-sm">{item.label}</p>
                        <p
                          className={`text-[11px] leading-tight ${
                            isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                          }`}
                        >
                          {item.desc}
                        </p>
                      </div>
                    </div>

                    {item.badge !== undefined && (
                      <span
                        className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                          isActive
                            ? "bg-primary-foreground text-primary"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <Separator className="my-2" />

            <div className="p-1">
              <Button
                variant="ghost"
                className="w-full justify-start rounded-2xl text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" /> Đăng xuất tài khoản
              </Button>
            </div>
          </Card>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: Tab Content Display */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {/* ----------------------------------------------------------------------- */}
            {/* TAB 1: THÔNG TIN CÁ NHÂN */}
            {/* ----------------------------------------------------------------------- */}
            {activeTab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <Card className="rounded-3xl border-border bg-card shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div>
                      <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <UserIcon className="h-5 w-5 text-primary" /> Thông tin cá nhân
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Thông tin liên lạc sẽ được tự động điền khi bạn đặt lịch tại các Salon.
                      </CardDescription>
                    </div>

                    {!isEditing ? (
                      <Button
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="rounded-xl text-xs"
                      >
                        <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Chỉnh sửa
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false);
                            setShowAvatarPicker(false);
                          }}
                          className="rounded-xl text-xs"
                        >
                          <X className="mr-1 h-3.5 w-3.5" /> Hủy
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveProfile}
                          disabled={isSavingProfile}
                          className="rounded-xl text-xs"
                        >
                          {isSavingProfile ? (
                            <span className="mr-1 h-3 w-3 animate-spin rounded-full border-2 border-background border-t-transparent" />
                          ) : (
                            <Save className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          Lưu
                        </Button>
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Hidden File Input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/png, image/jpeg, image/webp, image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file);
                          e.target.value = "";
                        }
                      }}
                    />

                    {/* Avatar Picker Section */}
                    {isEditing && (
                      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <ImageIcon className="h-4 w-4 text-primary" /> Ảnh đại diện của bạn
                          </Label>
                          <span className="text-[11px] text-muted-foreground">
                            JPG, PNG, WebP (Tối đa 5MB)
                          </span>
                        </div>

                        {/* File Upload Action */}
                        <div className="flex flex-wrap items-center gap-3">
                          <Button
                            type="button"
                            variant="default"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="rounded-xl text-xs h-8 shadow-xs"
                          >
                            <Upload className="mr-1.5 h-3.5 w-3.5" /> Chọn ảnh trong máy
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            Hoặc chọn từ danh sách avatar gợi ý bên dưới:
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 pt-1">
                          {PRESET_AVATARS.map((url, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setAvatarUrl(url)}
                              className={`relative h-11 w-11 rounded-full overflow-hidden border-2 transition-transform hover:scale-105 ${
                                avatarUrl === url
                                  ? "border-primary ring-2 ring-primary/40 scale-105"
                                  : "border-transparent opacity-80 hover:opacity-100"
                              }`}
                            >
                              <img
                                src={url}
                                alt={`Preset ${idx + 1}`}
                                className="h-full w-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Profile Fields Grid */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Họ và tên</Label>
                        {isEditing ? (
                          <Input
                            value={fullname}
                            onChange={(e) => setFullname(e.target.value)}
                            placeholder="Nhập họ và tên..."
                            className="rounded-xl"
                          />
                        ) : (
                          <div className="rounded-xl border border-border/70 bg-muted/20 px-3.5 py-2.5 text-xs font-semibold text-foreground">
                            {currentUser.fullname || currentUser.username}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Tên đăng nhập</Label>
                        <div className="rounded-xl border border-border/70 bg-muted/40 px-3.5 py-2.5 text-xs font-mono text-muted-foreground">
                          @{currentUser.username} (Cố định)
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Email</Label>
                        {isEditing ? (
                          <Input
                            type="email"
                            value={email}
                            disabled
                            className="rounded-xl opacity-75 cursor-not-allowed bg-muted/40"
                          />
                        ) : (
                          <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/20 px-3.5 py-2.5 text-xs text-foreground">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" /> {currentUser.email}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Số điện thoại</Label>
                        {isEditing ? (
                          <Input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Nhập số điện thoại..."
                            className="rounded-xl"
                          />
                        ) : (
                          <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/20 px-3.5 py-2.5 text-xs text-foreground font-mono">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />{" "}
                            {currentUser.phone || "Chưa cập nhật"}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Giới tính</Label>
                        {isEditing ? (
                          <RadioGroup
                            value={gender}
                            onValueChange={(v) => setGender(v as Gender)}
                            className="flex gap-4 pt-1"
                          >
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="male" id="gender-male" />
                              <Label htmlFor="gender-male" className="text-xs cursor-pointer">
                                Nam
                              </Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="female" id="gender-female" />
                              <Label htmlFor="gender-female" className="text-xs cursor-pointer">
                                Nữ
                              </Label>
                            </div>
                          </RadioGroup>
                        ) : (
                          <div className="rounded-xl border border-border/70 bg-muted/20 px-3.5 py-2.5 text-xs text-foreground">
                            {currentUser.gender === "female"
                              ? "Nữ giới"
                              : currentUser.gender === "male"
                                ? "Nam giới"
                                : "Chưa cập nhật"}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Ngày sinh</Label>
                        {isEditing ? (
                          <Input
                            type="date"
                            value={dob}
                            onChange={(e) => setDob(e.target.value)}
                            className="rounded-xl"
                          />
                        ) : (
                          <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/20 px-3.5 py-2.5 text-xs text-foreground font-mono">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />{" "}
                            {currentUser.dob ? formatDateDisplay(currentUser.dob) : "Chưa cập nhật"}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-xs font-semibold">Địa chỉ liên hệ</Label>
                        {isEditing ? (
                          <Input
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Số nhà, tên đường, quận/huyện, thành phố..."
                            className="rounded-xl"
                          />
                        ) : (
                          <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/20 px-3.5 py-2.5 text-xs text-foreground">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />{" "}
                            {currentUser.address || "Chưa cập nhật"}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>

                  {isEditing && (
                    <CardFooter className="flex justify-end gap-2 border-t border-border/60 bg-muted/10 px-6 py-3.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(false)}
                        className="rounded-xl"
                      >
                        Hủy
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveProfile}
                        disabled={isSavingProfile}
                        className="rounded-xl"
                      >
                        Lưu thay đổi
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              </motion.div>
            )}

            {/* ----------------------------------------------------------------------- */}
            {/* TAB 2: LỊCH HẸN CỦA TÔI */}
            {/* ----------------------------------------------------------------------- */}
            {activeTab === "bookings" && (
              <motion.div
                key="bookings"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <Card className="rounded-3xl border-border bg-card shadow-sm">
                  <CardHeader className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <CalendarCheck className="h-5 w-5 text-primary" /> Lịch hẹn Salon của tôi
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Theo dõi trạng thái lịch đặt làm tóc tại các salon đối tác.
                      </CardDescription>
                    </div>

                    <Button asChild size="sm" className="rounded-xl text-xs">
                      <Link to="/user/salons">
                        <Plus className="mr-1 h-3.5 w-3.5" /> Đặt lịch mới
                      </Link>
                    </Button>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Status Tabs Filter */}
                    <div className="overflow-x-auto pb-1">
                      <Tabs
                        value={bookingStatusFilter}
                        onValueChange={(val) =>
                          setBookingStatusFilter(val as BookingStatus | "ALL")
                        }
                      >
                        <TabsList className="h-9 rounded-xl bg-muted/60 p-1">
                          <TabsTrigger value="ALL" className="text-xs rounded-lg">
                            Tất cả ({userBookings.length})
                          </TabsTrigger>
                          <TabsTrigger value="P" className="text-xs rounded-lg">
                            Chờ xác nhận ({userBookings.filter((b) => b.status === "P").length})
                          </TabsTrigger>
                          <TabsTrigger value="C" className="text-xs rounded-lg">
                            Đã xác nhận ({userBookings.filter((b) => b.status === "C").length})
                          </TabsTrigger>
                          <TabsTrigger value="D" className="text-xs rounded-lg">
                            Hoàn thành ({userBookings.filter((b) => b.status === "D").length})
                          </TabsTrigger>
                          <TabsTrigger value="X" className="text-xs rounded-lg">
                            Đã hủy ({userBookings.filter((b) => b.status === "X").length})
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>

                    {/* Bookings List */}
                    {bookingsQuery.isLoading ? (
                      <LoadingState label="Đang tải lịch hẹn..." />
                    ) : filteredBookings.length === 0 ? (
                      <EmptyState
                        title="Chưa có lịch hẹn nào"
                        description={
                          bookingStatusFilter === "ALL"
                            ? "Bạn chưa có lịch hẹn nào. Hãy tìm kiếm salon và đặt lịch ngay!"
                            : "Không có lịch hẹn nào khớp với trạng thái này."
                        }
                        icon={<Calendar className="h-6 w-6 text-primary" />}
                        action={
                          <Button asChild size="sm" className="mt-2 rounded-xl">
                            <Link to="/user/salons">Khám phá danh sách Salon</Link>
                          </Button>
                        }
                      />
                    ) : (
                      <div className="space-y-3">
                        {filteredBookings.map((b) => {
                          const salon = salonsQuery.data?.find((s) => s.salon_id === b.salon_id);
                          return (
                            <div
                              key={b.booking_id}
                              className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm sm:flex-row sm:items-center"
                            >
                              <div className="flex items-start gap-3.5">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary shrink-0">
                                  <Store className="h-5 w-5" />
                                </div>
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="text-sm font-bold text-foreground">
                                      {salon?.salonname || `Salon #${b.salon_id}`}
                                    </h4>
                                    <BookingStatusBadge status={b.status} />
                                  </div>
                                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <MapPin className="h-3 w-3 text-primary shrink-0" />
                                    {salon?.address || "Địa chỉ salon"}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-3 pt-0.5 text-xs text-foreground font-medium">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                      {formatDateDisplay(b.booking_date)}
                                    </span>
                                    <span className="flex items-center gap-1 font-mono text-primary">
                                      <Clock className="h-3.5 w-3.5" />
                                      {b.booking_time || "09:00"}
                                    </span>
                                  </div>
                                  {b.notes && (
                                    <p className="text-xs text-muted-foreground italic">
                                      "{b.notes}"
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-end gap-2 shrink-0">
                                <Button
                                  asChild
                                  size="sm"
                                  variant="outline"
                                  className="rounded-xl text-xs"
                                >
                                  <Link to="/user/salons">
                                    Xem Salon <ExternalLink className="ml-1 h-3 w-3" />
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ----------------------------------------------------------------------- */}
            {/* TAB 3: BỘ SƯU TẬP TÓC ĐÃ THỬ */}
            {/* ----------------------------------------------------------------------- */}
            {activeTab === "history" && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <Card className="rounded-3xl border-border bg-card shadow-sm">
                  <CardHeader className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" /> Bộ sưu tập tóc đã thử
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Các kiểu tóc bạn đã ghép thử bằng AI Studio và lưu lại.
                      </CardDescription>
                    </div>

                    <Button asChild size="sm" className="rounded-xl text-xs">
                      <Link to="/user/try-on">
                        <Scissors className="mr-1.5 h-3.5 w-3.5" /> Thử kiểu tóc mới
                      </Link>
                    </Button>
                  </CardHeader>

                  <CardContent>
                    {historyQuery.isLoading ? (
                      <LoadingState label="Đang tải bộ sưu tập..." />
                    ) : !historyQuery.data || historyQuery.data.length === 0 ? (
                      <EmptyState
                        title="Chưa có ảnh thử tóc nào"
                        description="Hãy vào AI Studio để thử các kiểu tóc yêu thích lên khuôn mặt của bạn và lưu lại."
                        icon={<Sparkles className="h-6 w-6 text-primary" />}
                        action={
                          <Button asChild size="sm" className="mt-2 rounded-xl">
                            <Link to="/user/try-on">Mở AI Hair Studio</Link>
                          </Button>
                        }
                      />
                    ) : (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {historyQuery.data.map((item) => (
                          <div
                            key={item.history_id}
                            className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-all hover:border-primary/50 hover:shadow-md"
                          >
                            {/* Image Before/After Split */}
                            <div className="relative aspect-square overflow-hidden bg-muted">
                              <img
                                src={item.output_img_url}
                                alt="Try on result"
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              <div className="absolute top-2 left-2 rounded-lg bg-black/60 px-2 py-0.5 text-[10px] text-white backdrop-blur">
                                {formatDateDisplay(item.saved_at)}
                              </div>
                            </div>

                            <div className="flex flex-col justify-between flex-1 p-3.5 space-y-3">
                              <div>
                                <p className="text-xs font-semibold text-foreground">
                                  Kiểu tóc #{item.hair_id}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  Đã lưu vào thư viện cá nhân
                                </p>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 rounded-xl text-xs h-8"
                                  onClick={() => {
                                    const a = document.createElement("a");
                                    a.href = item.output_img_url;
                                    a.download = `ai-hairstyle-${item.history_id}.png`;
                                    a.click();
                                    toast.success("Đã tải ảnh về máy!");
                                  }}
                                >
                                  <Download className="mr-1 h-3.5 w-3.5" /> Tải về
                                </Button>
                                <Button size="sm" asChild className="flex-1 rounded-xl text-xs h-8">
                                  <Link to="/user/salons">
                                    <MapPin className="mr-1 h-3.5 w-3.5" /> Cắt kiểu này
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ----------------------------------------------------------------------- */}
            {/* TAB 4: BẢO MẬT & ĐỔI MẬT KHẨU */}
            {/* ----------------------------------------------------------------------- */}
            {activeTab === "security" && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <Card className="rounded-3xl border-border bg-card shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" /> Bảo mật & Đổi mật khẩu
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Cập nhật mật khẩu định kỳ để bảo vệ tài khoản và lịch hẹn của bạn.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                      <div className="space-y-1.5">
                        <Label htmlFor="curr-pwd" className="text-xs font-semibold">
                          Mật khẩu hiện tại
                        </Label>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="curr-pwd"
                            type="password"
                            placeholder="Nhập mật khẩu hiện tại..."
                            value={currentPwd}
                            onChange={(e) => setCurrentPwd(e.target.value)}
                            className="rounded-xl pl-9"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="new-pwd" className="text-xs font-semibold">
                          Mật khẩu mới
                        </Label>
                        <div className="relative">
                          <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="new-pwd"
                            type="password"
                            placeholder="Tối thiểu 6 ký tự..."
                            value={newPwd}
                            onChange={(e) => setNewPwd(e.target.value)}
                            className="rounded-xl pl-9"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="confirm-pwd" className="text-xs font-semibold">
                          Xác nhận mật khẩu mới
                        </Label>
                        <div className="relative">
                          <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="confirm-pwd"
                            type="password"
                            placeholder="Nhập lại mật khẩu mới..."
                            value={confirmPwd}
                            onChange={(e) => setConfirmPwd(e.target.value)}
                            className="rounded-xl pl-9"
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={isChangingPwd || !currentPwd || !newPwd}
                        className="rounded-xl text-xs font-semibold"
                      >
                        {isChangingPwd ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                      </Button>
                    </form>

                    <Separator />

                    {/* Security tips */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" /> Trạng thái bảo mật
                      </h4>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-border/80 bg-muted/20 p-3 text-xs space-y-1">
                          <p className="font-semibold text-foreground">Tài khoản xác thực</p>
                          <p className="text-muted-foreground">
                            Tài khoản được liên kết với email: {currentUser.email}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-border/80 bg-muted/20 p-3 text-xs space-y-1">
                          <p className="font-semibold text-foreground">Phiên đăng nhập an toàn</p>
                          <p className="text-muted-foreground">
                            Dữ liệu được mã hóa và lưu trữ cục bộ bảo mật.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
