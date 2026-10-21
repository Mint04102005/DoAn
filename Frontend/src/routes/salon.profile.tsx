import { useEffect, useMemo, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  AlertCircle,
  Building2,
  Camera,
  Check,
  Clock,
  FileBadge,
  FileText,
  Image as ImageIcon,
  Loader2,
  MapPin,
  MessageSquareQuote,
  Phone,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Tag,
  Upload,
  User as UserIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ErrorState, LoadingState } from "@/components/shared/StateViews";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useSalonProfile, useUpdateSalonProfile } from "@/hooks/use-salon";
import { useAuthStore } from "@/stores/auth.store";
import type { Salon, SalonOwner, User } from "@/types";

export const Route = createFileRoute("/salon/profile")({
  head: () => ({
    meta: [
      { title: "Hồ sơ Salon — Salon Dashboard" },
      {
        name: "description",
        content: "Xem và cập nhật thông tin cửa hàng, ảnh đại diện, địa chỉ và thế mạnh phục vụ.",
      },
    ],
  }),
  component: SalonProfilePage,
});

const PRESET_SALON_AVATARS = [
  {
    url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&auto=format&fit=crop&q=80",
    label: "Modern Studio",
  },
  {
    url: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=600&auto=format&fit=crop&q=80",
    label: "Luxury Boutique",
  },
  {
    url: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&auto=format&fit=crop&q=80",
    label: "Minimalist",
  },
  {
    url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop&q=80",
    label: "Vintage Classic",
  },
  {
    url: "https://images.unsplash.com/photo-1599387737877-5d3b0a2dbd1c?w=600&auto=format&fit=crop&q=80",
    label: "Warm Lighting",
  },
  {
    url: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&auto=format&fit=crop&q=80",
    label: "Creative Atelier",
  },
];

const FACE_SHAPE_OPTIONS: Array<{
  value: string;
  label: string;
  desc: string;
  badgeColor: string;
}> = [
  {
    value: "Tròn",
    label: "Khuôn mặt tròn",
    desc: "Thế mạnh cắt tỉa layer, tạo phồng đỉnh đầu giúp mặt thon gọn",
    badgeColor: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
  {
    value: "Oval",
    label: "Khuôn mặt oval",
    desc: "Tạo kiểu đa dạng, uốn sóng lơi, mái thưa thanh thoát",
    badgeColor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  },
  {
    value: "Vuông",
    label: "Khuôn mặt vuông",
    desc: "Kỹ thuật bo viền mềm mại, cắt uốn che góc cạnh xương hàm",
    badgeColor: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30",
  },
  {
    value: "Trái tim",
    label: "Khuôn mặt trái tim",
    desc: "Cân đối trán rộng và cằm nhọn với kiểu tóc bồng bềnh",
    badgeColor: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
  },
  {
    value: "Dài",
    label: "Khuôn mặt dài",
    desc: "Cắt mái ngang, uốn cụp hai bên giúp thu ngắn tỷ lệ khuôn mặt",
    badgeColor: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30",
  },
];

const profileSchema = z.object({
  salonname: z
    .string()
    .min(2, "Tên salon phải có ít nhất 2 ký tự")
    .max(100, "Tên salon không được vượt quá 100 ký tự"),
  address: z
    .string()
    .min(5, "Địa chỉ salon phải có ít nhất 5 ký tự")
    .max(255, "Địa chỉ không được vượt quá 255 ký tự"),
  tag: z.array(z.string()).min(1, "Vui lòng chọn ít nhất 1 dáng mặt thế mạnh"),
  description: z.string().max(500, "Mô tả không được vượt quá 500 ký tự").optional(),
  image_url: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function parseTags(tagStr: string): string[] {
  if (!tagStr) return [];
  return tagStr
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function SalonProfilePage() {
  const user = useAuthStore((s) => s.user);
  const profileQuery = useSalonProfile(user?.user_id);

  if (profileQuery.isLoading) {
    return <LoadingState label="Đang tải thông tin hồ sơ Salon..." />;
  }

  if (user && user.role !== "SALON_OWNER" && user.role_id !== 3) {
    return (
      <ErrorState
        title="Không có quyền truy cập"
        description="Trang quản lý hồ sơ này chỉ dành riêng cho tài khoản đối tác Chủ Salon."
      />
    );
  }

  if (profileQuery.isError) {
    return (
      <ErrorState
        title="Không thể tải thông tin Salon"
        description={
          profileQuery.error instanceof Error
            ? profileQuery.error.message
            : "Đã xảy ra lỗi khi tải hồ sơ salon của bạn. Vui lòng thử lại sau."
        }
        onRetry={() => profileQuery.refetch()}
      />
    );
  }

  if (!profileQuery.data?.salon || !user) {
    return (
      <ErrorState
        title="Chưa có thông tin Salon"
        description="Tài khoản này chưa có thông tin Salon trên hệ thống. Vui lòng đăng ký hoặc liên hệ ban quản trị để được hỗ trợ."
        onRetry={() => profileQuery.refetch()}
      />
    );
  }

  return (
    <SalonProfileContent
      key={`${profileQuery.data.salon.salon_id}_${profileQuery.data.salon.salonname}_${profileQuery.data.salon.tag}`}
      salon={profileQuery.data.salon}
      owner={profileQuery.data.owner}
      user={user}
    />
  );
}

function SalonProfileContent({
  salon,
  owner,
  user,
}: {
  salon: Salon;
  owner?: SalonOwner;
  user: User;
}) {
  const updateProfileMutation = useUpdateSalonProfile(salon.salon_id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialTags = useMemo(() => parseTags(salon.tag), [salon.tag]);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      salonname: salon.salonname,
      address: salon.address,
      tag: initialTags,
      description: salon.description || "",
      image_url: salon.image_url || "",
    },
  });

  const isDirty = form.formState.isDirty;
  const selectedTags = form.watch("tag") || [];
  const currentDescription = form.watch("description") || "";
  const currentImageUrl = form.watch("image_url") || salon.image_url || "";

  const handleToggleTag = (tagValue: string) => {
    const current = form.getValues("tag") || [];
    const exists = current.some((t) => t.toLowerCase() === tagValue.toLowerCase());
    let next: string[];
    if (exists) {
      next = current.filter((t) => t.toLowerCase() !== tagValue.toLowerCase());
    } else {
      next = [...current, tagValue];
    }
    form.setValue("tag", next, { shouldDirty: true, shouldValidate: true });
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn tệp định dạng hình ảnh hợp lệ");
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
        form.setValue("image_url", dataUrl, { shouldDirty: true, shouldValidate: true });
        toast.success("Đã tải ảnh lên thành công. Nhấn 'Lưu thay đổi' để hoàn tất.");
      }
    };
    reader.onerror = () => {
      toast.error("Không thể đọc tệp ảnh. Vui lòng thử lại.");
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (url: string) => {
    form.setValue("image_url", url, { shouldDirty: true, shouldValidate: true });
    toast.success("Đã chọn ảnh mẫu. Nhấn 'Lưu thay đổi' để áp dụng.");
  };

  const handleResetAvatar = () => {
    form.setValue("image_url", salon.image_url || "", { shouldDirty: true, shouldValidate: true });
    toast.info("Đã đặt lại ảnh đại diện ban đầu");
  };

  const onSubmit = async (values: ProfileFormValues) => {
    await updateProfileMutation.mutateAsync({
      salonname: values.salonname,
      address: values.address,
      tag: values.tag,
      description: values.description,
      image_url: values.image_url,
    });
  };

  return (
    <div className="space-y-6">
      {/* Hidden File Input for uploading avatar */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleFileUpload(file);
            e.target.value = "";
          }
        }}
      />

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Hồ sơ Salon
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quản lý thông tin thương hiệu, ảnh đại diện, địa chỉ tiếp khách, dáng mặt thế mạnh và mô tả chuyên môn
          của Salon.
        </p>
      </div>

      {/* Header Overview Hero Card */}
      <Card className="overflow-hidden rounded-3xl border-border bg-card shadow-sm">
        {/* Banner Graphic Header */}
        <div className="relative h-44 w-full bg-gradient-to-r from-primary/30 via-secondary/40 to-primary/20">
          <div className="absolute inset-0 bg-[radial-gradient(#00000010_1px,transparent_1px)] [background-size:16px_16px]" />
          {currentImageUrl && (
            <img
              src={currentImageUrl}
              alt={salon.salonname}
              className="h-full w-full object-cover opacity-20"
            />
          )}
        </div>

        <CardContent className="relative px-6 pb-6 pt-0">
          {/* Main Info Row */}
          <div className="-mt-16 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              {/* Large Avatar with Quick Change Trigger */}
              <div className="group relative">
                <Avatar className="h-28 w-28 rounded-3xl border-4 border-card shadow-xl transition-all duration-300 group-hover:scale-105">
                  <AvatarImage src={currentImageUrl} className="object-cover" />
                  <AvatarFallback className="rounded-3xl bg-primary text-2xl font-bold text-primary-foreground">
                    {salon.salonname.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Thay đổi ảnh đại diện Salon"
                  className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-background/90 text-foreground shadow-md backdrop-blur-xs transition-all hover:bg-primary hover:text-primary-foreground hover:scale-110 active:scale-95"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              {/* Title & Status */}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                    {salon.salonname}
                  </h2>

                  {/* Verification Badge */}
                  {owner?.is_verified ? (
                    <Badge
                      variant="outline"
                      className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400"
                    >
                      <ShieldCheck className="h-4 w-4" /> Đã xác minh
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="gap-1.5 border-amber-500/30 bg-amber-500/10 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400"
                    >
                      <Clock className="h-4 w-4" /> Đang chờ xác minh
                    </Badge>
                  )}
                </div>

                <p className="flex items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
                  <MapPin className="h-4 w-4 shrink-0 text-primary" />
                  {salon.address}
                </p>
              </div>
            </div>

            {/* Read-only Rating Display */}
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold text-foreground">
                    {salon.rating.toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">/ 5.0</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Điểm đánh giá (Read-only)</p>
              </div>
            </div>
          </div>

          {/* Salon Tag & Custom Bio Description Preview */}
          <div className="mt-6 rounded-2xl border border-border/80 bg-muted/20 p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 text-xs font-semibold text-foreground">
                <Tag className="h-3.5 w-3.5 text-primary" /> Dáng mặt thế mạnh:
              </span>
              {initialTags.length > 0 ? (
                initialTags.map((t) => {
                  const option = FACE_SHAPE_OPTIONS.find(
                    (o) => o.value.toLowerCase() === t.toLowerCase(),
                  );
                  return (
                    <Badge
                      key={t}
                      variant="outline"
                      className={`text-xs ${
                        option?.badgeColor || "border-primary/30 bg-primary/10 text-primary"
                      }`}
                    >
                      {t}
                    </Badge>
                  );
                })
              ) : (
                <span className="text-xs text-muted-foreground italic">Chưa chọn tag</span>
              )}
            </div>

            {salon.description && (
              <div className="flex items-start gap-2.5 pt-1 text-xs text-muted-foreground">
                <MessageSquareQuote className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                <p className="italic leading-relaxed">"{salon.description}"</p>
              </div>
            )}
          </div>

          <Separator className="my-5" />

          {/* Metadata Badges */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-2xl bg-muted/40 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileBadge className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground">Giấy phép kinh doanh</p>
                <p className="truncate font-mono text-xs font-semibold text-foreground">
                  {owner?.license_no || "BL-2025-1001"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-muted/40 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UserIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground">Chủ sở hữu</p>
                <p className="truncate text-xs font-semibold text-foreground">
                  {user.fullname || user.username} (@{user.username})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-muted/40 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Phone className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground">Số điện thoại liên hệ</p>
                <p className="truncate font-mono text-xs font-semibold text-foreground">
                  {user.phone || "Chưa cập nhật"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form Card */}
      <Card className="rounded-3xl border-border bg-card shadow-sm">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Store className="h-5 w-5 text-primary" /> Chỉnh sửa thông tin Salon
            </CardTitle>
            <CardDescription className="text-xs">
              Cập nhật tên hiển thị, địa chỉ tiếp khách, các dáng mặt thế mạnh và mô tả chuyên môn
              để hệ thống AI gợi ý chính xác tới khách hàng.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Dirty State Banner */}
            {isDirty && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-700 dark:text-amber-400"
              >
                <span className="flex items-center gap-2 font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Bạn có thay đổi chưa lưu. Hãy nhấn "Lưu thay đổi" để áp dụng.
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-amber-700 hover:bg-amber-500/20 dark:text-amber-400"
                  onClick={() => form.reset()}
                >
                  <RotateCcw className="mr-1 h-3 w-3" /> Hoàn tác
                </Button>
              </motion.div>
            )}

            {/* Input: Salon Avatar / Brand Image */}
            <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <Label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <ImageIcon className="h-4 w-4 text-primary" />
                    Ảnh đại diện Salon (Avatar thương hiệu)
                  </Label>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Hình ảnh đại diện sẽ hiển thị trên kết quả tìm kiếm, trang đặt lịch và banner hồ sơ.
                  </p>
                </div>
                {form.watch("image_url") && form.watch("image_url") !== salon.image_url && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground hover:text-foreground w-fit"
                    onClick={handleResetAvatar}
                  >
                    <RotateCcw className="mr-1 h-3 w-3" /> Hoàn tác ảnh
                  </Button>
                )}
              </div>

              {/* Avatar Preview & Actions Row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="relative group shrink-0">
                  <Avatar className="h-20 w-20 rounded-2xl border-2 border-border shadow-md">
                    <AvatarImage src={currentImageUrl} className="object-cover" />
                    <AvatarFallback className="rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
                      {salon.salonname.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Tải ảnh mới từ máy"
                    className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Camera className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 space-y-2 w-full">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-xl text-xs h-8 shadow-xs"
                    >
                      <Upload className="mr-1.5 h-3.5 w-3.5 text-primary" /> Tải ảnh từ thiết bị
                    </Button>
                    <span className="text-[11px] text-muted-foreground">
                      Hỗ trợ JPG, PNG, WebP (Tối đa 5MB, khuyến nghị tỉ lệ 1:1)
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Bạn có thể tải lên ảnh chụp mặt tiền hoặc không gian bên trong salon để tăng độ uy tín và thu hút khách hàng.
                  </p>
                </div>
              </div>

              {/* Preset Avatar Selection Gallery */}
              <div className="space-y-2 pt-2 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-amber-500" /> Hoặc chọn nhanh ảnh phong cách mẫu:
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {PRESET_SALON_AVATARS.map((preset, idx) => {
                    const isSelected = currentImageUrl === preset.url;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPreset(preset.url)}
                        className={`group relative aspect-square w-full overflow-hidden rounded-xl border-2 transition-all hover:scale-102 ${
                          isSelected
                            ? "border-primary ring-2 ring-primary/40 shadow-xs"
                            : "border-border/60 opacity-75 hover:opacity-100 hover:border-border"
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1">
                          <p className="truncate text-[10px] font-medium text-white text-center">
                            {preset.label}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
                            <Check className="h-2.5 w-2.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Input: Salon Name */}
            <div className="space-y-1.5">
              <Label htmlFor="salonname" className="text-xs font-semibold">
                Tên Salon <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="salonname"
                  placeholder="Ví dụ: Maison Hair Studio"
                  className="rounded-xl pl-9"
                  {...form.register("salonname")}
                />
              </div>
              {form.formState.errors.salonname && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.salonname.message}
                </p>
              )}
            </div>

            {/* Input: Address */}
            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-xs font-semibold">
                Địa chỉ Salon <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="address"
                  placeholder="Ví dụ: 100 Nguyễn Văn Linh, Q.1, TP.HCM"
                  className="rounded-xl pl-9"
                  {...form.register("address")}
                />
              </div>
              {form.formState.errors.address && (
                <p className="text-xs text-destructive">{form.formState.errors.address.message}</p>
              )}
            </div>

            {/* Face Shape Strengths (Tags) */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-semibold">
                  Dáng mặt thế mạnh phục vụ <span className="text-destructive">*</span>
                </Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Chọn các dáng mặt mà salon của bạn có kinh nghiệm và chuyên môn tư vấn, cắt tạo
                  kiểu xuất sắc nhất.
                </p>
              </div>

              {/* Tag Checkbox / Interactive Cards */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {FACE_SHAPE_OPTIONS.map((option) => {
                  const isChecked = selectedTags.some(
                    (t) => t.toLowerCase() === option.value.toLowerCase(),
                  );
                  return (
                    <div
                      key={option.value}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleToggleTag(option.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleToggleTag(option.value);
                        }
                      }}
                      className={`cursor-pointer select-none rounded-2xl border p-3.5 transition-all ${
                        isChecked
                          ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/40"
                          : "border-border bg-card hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors ${
                              isChecked
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted-foreground/40 bg-transparent"
                            }`}
                          >
                            {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                          <span className="text-xs font-semibold text-foreground">
                            {option.label}
                          </span>
                        </div>
                        {isChecked && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                        {option.desc}
                      </p>
                    </div>
                  );
                })}
              </div>

              {form.formState.errors.tag && (
                <p className="text-xs text-destructive">{form.formState.errors.tag.message}</p>
              )}
            </div>

            {/* Custom Salon Tag Description Field (Salon tự viết) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="description"
                  className="flex items-center gap-1.5 text-xs font-semibold"
                >
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  Mô tả chi tiết thế mạnh & phong cách Salon (Salon tự viết)
                </Label>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {currentDescription.length} / 500 ký tự
                </span>
              </div>
              <Textarea
                id="description"
                rows={4}
                placeholder="Ví dụ: Salon chuyên sâu về uốn sóng lơi chuẩn Hàn, kỹ thuật cắt Layer bay định hình gương mặt tròn/vuông và phục hồi Keratin chuyên sâu..."
                className="rounded-2xl resize-none text-xs leading-relaxed"
                maxLength={500}
                {...form.register("description")}
              />
              <p className="text-[11px] text-muted-foreground">
                Đoạn mô tả này sẽ xuất hiện trên trang thông tin salon của bạn để khách hàng hiểu rõ
                hơn về kỹ thuật sở trường và phong cách phục vụ.
              </p>
              {form.formState.errors.description && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col-reverse items-center justify-between gap-3 border-t border-border/60 bg-muted/20 px-6 py-4 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              Thông tin sau khi lưu sẽ hiển thị ngay cho khách hàng đặt lịch.
            </p>
            <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl sm:w-auto"
                onClick={() => form.reset()}
                disabled={!isDirty || updateProfileMutation.isPending}
              >
                Đặt lại
              </Button>
              <Button
                type="submit"
                className="w-full rounded-xl sm:w-auto"
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu thay đổi...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Lưu thay đổi
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
