import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  AlertCircle,
  AlertTriangle,
  Camera,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  FolderOpen,
  History,
  Image as ImageIcon,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Phone,
  RefreshCw,
  RotateCcw,
  Save,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Upload,
  User as UserIcon,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminProfile,
  useChangeAdminPassword,
  useUpdateAdminProfile,
} from "@/hooks/use-admin-profile";
import { useAuthStore } from "@/stores/auth.store";

export const Route = createFileRoute("/admin/profile")({
  head: () => ({
    meta: [
      { title: "Hồ sơ Quản trị viên — Admin Dashboard" },
      {
        name: "description",
        content: "Quản lý thông tin cá nhân, định danh tài khoản và bảo mật Quản trị viên.",
      },
    ],
  }),
  component: AdminProfilePage,
});

// Curated avatar presets for mock avatar selection
const PRESET_ADMIN_AVATARS = [
  {
    url: "https://i.pravatar.cc/150?img=60",
    label: "Executive Male",
  },
  {
    url: "https://i.pravatar.cc/150?img=65",
    label: "Executive Female",
  },
  {
    url: "https://i.pravatar.cc/150?img=68",
    label: "Senior Male",
  },
  {
    url: "https://i.pravatar.cc/150?img=47",
    label: "Professional Female",
  },
  {
    url: "https://i.pravatar.cc/150?img=12",
    label: "Tech Lead",
  },
  {
    url: "https://i.pravatar.cc/150?img=32",
    label: "Auditor Lead",
  },
];

// Profile Form Schema
const profileSchema = z.object({
  fullname: z.string().min(2, "Họ và tên tối thiểu 2 ký tự"),
  username: z.string().min(3, "Tên đăng nhập tối thiểu 3 ký tự"),
  email: z.string().email("Địa chỉ email không hợp lệ"),
  phone: z
    .string()
    .refine(
      (val) => !val || /(84|0[3|5|7|8|9])+([0-9]{8})\b/.test(val),
      "Số điện thoại Việt Nam không hợp lệ (VD: 0900000001)",
    )
    .optional(),
  avatar_url: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// Password Form Schema
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    newPassword: z.string().min(8, "Mật khẩu mới phải có tối thiểu 8 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu mới"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không trùng khớp",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

function AdminProfilePage() {
  const currentUser = useAuthStore((s) => s.user);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Queries & Mutations
  const profileQuery = useAdminProfile(currentUser?.user_id);
  const updateProfileMutation = useUpdateAdminProfile();
  const changePasswordMutation = useChangeAdminPassword();

  const profileData = profileQuery.data || currentUser;

  // React Hook Form: Profile
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
      fullname: profileData?.fullname || "Quản trị viên hệ thống",
      username: profileData?.username || "admin",
      email: profileData?.email || "admin@ai-hairstyle-recommendation.app",
      phone: profileData?.phone || "0900000001",
      avatar_url: profileData?.avatar_url || "https://i.pravatar.cc/150?img=60",
    },
  });

  // React Hook Form: Password
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onProfileSubmit = async (values: ProfileFormValues) => {
    try {
      await updateProfileMutation.mutateAsync({
        fullname: values.fullname,
        username: values.username,
        email: values.email,
        phone: values.phone || "",
        avatar_url: values.avatar_url || profileData?.avatar_url,
      });
    } catch {
      // Toast handled by mutation
    }
  };

  const onPasswordSubmit = async (values: PasswordFormValues) => {
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
      passwordForm.reset();
    } catch {
      // Toast handled by mutation
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn tệp định dạng hình ảnh hợp lệ (PNG, JPG, WebP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dung lượng ảnh đại diện không được vượt quá 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        profileForm.setValue("avatar_url", dataUrl, { shouldDirty: true, shouldValidate: true });
        setAvatarDialogOpen(false);
        toast.success("Đã chọn ảnh từ máy tính. Nhấn 'Lưu thay đổi' để hoàn tất.");
      }
    };
    reader.onerror = () => {
      toast.error("Không thể đọc tệp hình ảnh. Vui lòng thử lại.");
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPresetAvatar = (url: string) => {
    profileForm.setValue("avatar_url", url, { shouldDirty: true, shouldValidate: true });
    setAvatarDialogOpen(false);
    toast.success("Đã chọn ảnh đại diện mẫu. Nhấn 'Lưu thay đổi' để hoàn tất.");
  };

  const handleResetAvatar = () => {
    profileForm.setValue("avatar_url", profileData?.avatar_url || "", {
      shouldDirty: true,
      shouldValidate: true,
    });
    toast.info("Đã khôi phục ảnh đại diện ban đầu");
  };

  if (profileQuery.isLoading) {
    return (
      <div className="space-y-6 pb-12">
        <Skeleton className="h-40 w-full rounded-3xl" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Skeleton className="h-96 rounded-2xl lg:col-span-8" />
          <Skeleton className="h-96 rounded-2xl lg:col-span-4" />
        </div>
      </div>
    );
  }

  if (profileQuery.isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 py-16 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <h3 className="text-lg font-bold">Không thể tải thông tin hồ sơ</h3>
        <p className="text-sm text-muted-foreground">
          {profileQuery.error instanceof Error
            ? profileQuery.error.message
            : "Đã xảy ra lỗi khi tải dữ liệu."}
        </p>
        <Button size="sm" variant="outline" onClick={() => profileQuery.refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Thử lại
        </Button>
      </div>
    );
  }

  const currentAvatarUrl = profileForm.watch("avatar_url") || profileData?.avatar_url;

  return (
    <div className="space-y-6 pb-16 text-foreground">
      {/* Profile Header Card */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        {/* Subtle Decorative Background Aura */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
            {/* Avatar with Change Overlay */}
            <div className="group relative">
              <Avatar className="h-24 w-24 border-4 border-card shadow-md sm:h-28 sm:w-28">
                <AvatarImage src={currentAvatarUrl} alt={profileData?.username} />
                <AvatarFallback className="bg-primary/20 text-2xl font-bold text-primary">
                  {profileData?.username.slice(0, 2).toUpperCase() || "AD"}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => setAvatarDialogOpen(true)}
                aria-label="Thay đổi ảnh đại diện"
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Camera className="h-6 w-6 text-white" />
              </button>
            </div>

            {/* Identity Info */}
            <div className="text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {profileForm.watch("fullname") || profileData?.fullname || "Quản trị viên"}
                </h1>
                <Badge
                  variant="outline"
                  className="border-primary/40 bg-primary/10 text-xs font-semibold text-primary"
                >
                  <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Administrator
                </Badge>
              </div>

              <p className="mt-1 font-mono text-sm text-muted-foreground">
                @{profileForm.watch("username") || profileData?.username}
              </p>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground sm:justify-start">
                <span className="flex items-center gap-1 font-mono font-medium text-foreground">
                  <span className="text-primary font-bold">Admin ID:</span> #ADM
                  {String(profileData?.user_id || 100).padStart(3, "0")}
                </span>
                <span>•</span>
                <span>
                  Ngày tham gia:{" "}
                  {profileData?.created_at
                    ? new Date(profileData.created_at).toLocaleDateString("vi-VN")
                    : "01/01/2026"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle2 className="h-3 w-3" /> Đang hoạt động
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="flex justify-center sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAvatarDialogOpen(true)}
              className="border-border bg-background shadow-xs hover:bg-muted"
            >
              <Camera className="mr-1.5 h-4 w-4 text-primary" /> Thay đổi Avatar
            </Button>
          </div>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (8/12): Personal Information Form */}
        <div className="space-y-6 lg:col-span-8">
          {/* Personal Information Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
                <UserIcon className="h-4 w-4" /> Thông tin cá nhân
              </div>
              <CardTitle className="text-xl">Hồ sơ Quản trị viên</CardTitle>
              <CardDescription>
                Cập nhật họ tên hiển thị, tên đăng nhập quản trị và thông tin liên lạc chính thức.
              </CardDescription>
            </CardHeader>

            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
              <CardContent className="space-y-4">
                {/* Fullname */}
                <div className="space-y-1.5">
                  <Label htmlFor="fullname">Họ và tên đầy đủ</Label>
                  <Input
                    id="fullname"
                    placeholder="VD: Quản trị viên Trưởng"
                    {...profileForm.register("fullname")}
                    aria-invalid={!!profileForm.formState.errors.fullname}
                  />
                  {profileForm.formState.errors.fullname && (
                    <p className="text-xs text-destructive">
                      {profileForm.formState.errors.fullname.message}
                    </p>
                  )}
                </div>

                {/* Grid: Username & Email */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="username">Tên đăng nhập (Username)</Label>
                    <div className="relative">
                      <UserCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="username"
                        className="pl-9"
                        placeholder="admin"
                        {...profileForm.register("username")}
                        aria-invalid={!!profileForm.formState.errors.username}
                      />
                    </div>
                    {profileForm.formState.errors.username && (
                      <p className="text-xs text-destructive">
                        {profileForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email">Địa chỉ Email</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        className="pl-9"
                        placeholder="admin@example.com"
                        {...profileForm.register("email")}
                        aria-invalid={!!profileForm.formState.errors.email}
                      />
                    </div>
                    {profileForm.formState.errors.email && (
                      <p className="text-xs text-destructive">
                        {profileForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Phone & Avatar Management Row */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Số điện thoại</Label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="phone"
                        className="pl-9 font-mono"
                        placeholder="0900000001"
                        {...profileForm.register("phone")}
                        aria-invalid={!!profileForm.formState.errors.phone}
                      />
                    </div>
                    {profileForm.formState.errors.phone && (
                      <p className="text-xs text-destructive">
                        {profileForm.formState.errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="flex items-center justify-between">
                      <span>Ảnh đại diện</span>
                      {profileForm.watch("avatar_url") !== profileData?.avatar_url && (
                        <button
                          type="button"
                          onClick={handleResetAvatar}
                          className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-1"
                        >
                          <RotateCcw className="h-3 w-3" /> Hoàn tác
                        </button>
                      )}
                    </Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 rounded-xl text-xs h-9 justify-start font-medium"
                      >
                        <Upload className="mr-2 h-3.5 w-3.5 text-primary" /> Chọn ảnh trong máy
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setAvatarDialogOpen(true)}
                        className="rounded-xl text-xs h-9"
                        title="Xem thư viện avatar mẫu"
                      >
                        <Sparkles className="mr-1.5 h-3.5 w-3.5 text-amber-500" /> Thư viện
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator className="my-2" />

                {/* Read-Only System Fields */}
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Thông tin định danh hệ thống (Read-only)
                  </h4>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                    <div>
                      <span className="text-muted-foreground block">User ID:</span>
                      <span className="font-mono font-bold text-foreground">
                        #{profileData?.user_id || 100}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Role ID:</span>
                      <span className="font-mono font-bold text-foreground">
                        #{profileData?.role_id || 1}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Vai trò:</span>
                      <span className="font-semibold text-primary">Quản trị viên (Admin)</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Quyền hạn:</span>
                      <span className="font-semibold text-emerald-600">Full Access</span>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between border-t border-border pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => profileForm.reset()}
                  disabled={updateProfileMutation.isPending || !profileForm.formState.isDirty}
                >
                  Khôi phục ban đầu
                </Button>
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending || !profileForm.formState.isDirty}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Lưu thay đổi
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Security & Change Password Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
                <KeyRound className="h-4 w-4" /> Bảo mật & Xác thực
              </div>
              <CardTitle className="text-xl">Đổi mật khẩu Quản trị</CardTitle>
              <CardDescription>
                Cập nhật mật khẩu định kỳ giúp bảo vệ cổng quản trị khỏi các truy cập trái phép.
              </CardDescription>
            </CardHeader>

            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
              <CardContent className="space-y-4">
                {/* Current Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pr-10"
                      {...passwordForm.register("currentPassword")}
                      aria-invalid={!!passwordForm.formState.errors.currentPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="text-xs text-destructive">
                      {passwordForm.formState.errors.currentPassword.message}
                    </p>
                  )}
                </div>

                {/* New Password & Confirm */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="newPassword">Mật khẩu mới (Tối thiểu 8 ký tự)</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pr-10"
                        {...passwordForm.register("newPassword")}
                        aria-invalid={!!passwordForm.formState.errors.newPassword}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {passwordForm.formState.errors.newPassword && (
                      <p className="text-xs text-destructive">
                        {passwordForm.formState.errors.newPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pr-10"
                        {...passwordForm.register("confirmPassword")}
                        aria-invalid={!!passwordForm.formState.errors.confirmPassword}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="text-xs text-destructive">
                        {passwordForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-end border-t border-border pt-4">
                <Button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {changePasswordMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang cập nhật...
                    </>
                  ) : (
                    <>
                      <KeyRound className="mr-2 h-4 w-4" /> Đổi mật khẩu
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Right Column (4/12): Account Info & Danger Zone */}
        <div className="space-y-6 lg:col-span-4">
          {/* Account Information Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" /> Thông tin Tài khoản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-border/60">
                <span className="text-muted-foreground">Mã Quản trị viên:</span>
                <span className="font-mono font-bold text-foreground">
                  #ADM{String(profileData?.user_id || 100).padStart(3, "0")}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/60">
                <span className="text-muted-foreground">Phân quyền:</span>
                <Badge
                  variant="outline"
                  className="border-primary/40 bg-primary/10 text-primary text-[10px]"
                >
                  Admin Root
                </Badge>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/60">
                <span className="text-muted-foreground">Trạng thái:</span>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Hoạt động
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/60">
                <span className="text-muted-foreground">Ngày khởi tạo:</span>
                <span className="text-foreground">
                  {profileData?.created_at
                    ? new Date(profileData.created_at).toLocaleDateString("vi-VN")
                    : "01/01/2026"}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">Cơ chế xác thực:</span>
                <span className="text-foreground font-medium">Session + RBAC Guard</span>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone Card */}
          <Card className="border-destructive/20 shadow-sm bg-destructive/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" /> Vùng an toàn (Danger Zone)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground">
              <p>
                Tài khoản Quản trị viên được bảo vệ bởi chính sách an toàn hệ thống. Admin không thể tự khóa, xóa hoặc thay đổi vai trò của chính mình.
              </p>
              <div className="rounded-xl border border-destructive/20 bg-background/80 p-3 text-[11px] text-muted-foreground">
                <p className="font-semibold text-foreground">Chính sách bảo mật:</p>
                <p className="mt-0.5">
                  Mọi thao tác thay đổi phân quyền tối cao phải được thực hiện qua quy trình kiểm soát đa quản trị viên.
                </p>
              </div>
              <Button
                variant="destructive"
                disabled
                className="w-full cursor-not-allowed opacity-50 text-xs"
              >
                Xóa tài khoản Quản trị viên (Đã khóa)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Hidden File Input for Device Upload */}
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

      {/* Avatar Selection Dialog Modal */}
      <Dialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Camera className="h-5 w-5 text-primary" /> Chọn ảnh đại diện Quản trị
            </DialogTitle>
            <DialogDescription>
              Tải ảnh trực tiếp từ máy tính hoặc chọn từ danh sách avatar đề xuất.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Direct Device Upload Dropzone Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  handleFileUpload(file);
                }
              }}
              className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/20 p-6 text-center transition-all hover:border-primary/60 hover:bg-primary/5 active:scale-[0.99]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <Upload className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-semibold text-foreground">
                Tải ảnh từ máy tính / thiết bị
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Nhấn hoặc kéo thả ảnh vào đây (JPG, PNG, WebP tối đa 5MB)
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mt-3 rounded-xl text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <FolderOpen className="mr-1.5 h-3.5 w-3.5 text-primary" /> Duyệt tệp trên máy
              </Button>
            </div>

            <Separator />

            {/* Preset Avatars List */}
            <div>
              <Label className="text-xs font-semibold text-muted-foreground mb-2 block flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Hoặc chọn avatar đề xuất sẵn
              </Label>
              <div className="grid grid-cols-3 gap-2.5">
                {PRESET_ADMIN_AVATARS.map((preset, index) => {
                  const isSelected = currentAvatarUrl === preset.url;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelectPresetAvatar(preset.url)}
                      className={`group relative flex flex-col items-center gap-1.5 rounded-2xl border p-2 text-center transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-xs"
                          : "border-border hover:border-primary/40 hover:bg-muted/40"
                      }`}
                    >
                      <Avatar className="h-12 w-12 border border-border">
                        <AvatarImage src={preset.url} alt={preset.label} />
                        <AvatarFallback>AD</AvatarFallback>
                      </Avatar>
                      <span className="text-[11px] font-medium text-foreground">{preset.label}</span>
                      {isSelected && (
                        <div className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-2.5 w-2.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAvatarDialogOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
