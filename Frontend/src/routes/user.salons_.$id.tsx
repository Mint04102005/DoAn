import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarPlus,
  Clock,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Sparkles,
  Star,
  User as UserIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/StateViews";
import { salonService } from "@/services/salon.service";

export const Route = createFileRoute("/user/salons_/$id")({
  head: () => ({ meta: [{ title: "Chi tiết salon — AI Hairstyle Recommendation System" }] }),
  component: SalonDetailPage,
});

function SalonDetailPage() {
  const { id } = Route.useParams();
  const salonId = Number(id);

  const query = useQuery({
    queryKey: ["salon-detail", salonId],
    queryFn: () => salonService.getById(salonId),
    retry: 1,
  });

  if (query.isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <LoadingState label="Đang tải thông tin salon..." />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <ErrorState
          title="Lỗi khi tải thông tin salon"
          description={
            query.error instanceof Error
              ? query.error.message
              : "Đã xảy ra lỗi khi kết nối đến máy chủ. Vui lòng thử lại."
          }
          onRetry={() => query.refetch()}
        />
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="outline" asChild>
            <Link to="/user/salons">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Quay lại danh sách
            </Link>
          </Button>
          <Button onClick={() => query.refetch()}>
            <RefreshCw className="mr-1.5 h-4 w-4" /> Thử lại
          </Button>
        </div>
      </div>
    );
  }

  if (!query.data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <EmptyState
          title="Salon không tồn tại"
          description="Salon này không tồn tại hoặc chưa được quản trị viên duyệt công khai."
        />
        <div className="mt-6">
          <Button asChild>
            <Link to="/user/salons">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Quay lại danh sách salon
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const salon = query.data;
  const tags = salon.tag
    ? salon.tag
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const mainImage =
    salon.image_url ||
    (salon.images && salon.images.length > 0 ? salon.images[0] : "") ||
    "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Nút quay lại */}
      <div className="mb-6 flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/user/salons">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Quay lại danh sách
          </Link>
        </Button>
        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          Đã xác thực bởi hệ thống
        </span>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Cột trái: Ảnh chính, mô tả & thông tin chi tiết */}
        <div className="space-y-6">
          <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-border bg-muted shadow-sm">
            <img
              src={mainImage}
              alt={salon.name}
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
            />
            <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-sm font-semibold shadow backdrop-blur">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span>{salon.rating.toFixed(1)}</span>
            </div>
          </div>

          {/* Danh sách ảnh bổ sung (nếu có) */}
          {salon.images && salon.images.length > 1 && (
            <div className="grid grid-cols-3 gap-3">
              {salon.images.map((img, idx) => (
                <div
                  key={idx}
                  className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted"
                >
                  <img
                    src={img}
                    alt={`${salon.name} ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Chi tiết nội dung Salon */}
          <div className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
                {salon.name}
              </h1>
              <div className="mt-2.5 flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p>{salon.address || "Chưa cập nhật địa chỉ"}</p>
              </div>
            </div>

            {salon.operatingHours && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0 text-primary" />
                <span>Giờ mở cửa: {salon.operatingHours}</span>
              </div>
            )}

            {tags.length > 0 && (
              <div className="pt-2">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Dáng mặt thế mạnh:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <Badge key={t} variant="secondary" className="px-2.5 py-0.5 text-xs">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-foreground">Giới thiệu salon</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {salon.description ||
                  "Salon chuyên nghiệp, đội ngũ tạo kiểu giàu kinh nghiệm sẵn sàng tư vấn và mang đến phong cách tóc hoàn hảo nhất cho bạn."}
              </p>
            </div>
          </div>
        </div>

        {/* Cột phải: Thông tin liên hệ chủ tiệm & Nút Đặt lịch */}
        <div className="space-y-6">
          <div className="space-y-5 rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Thông tin liên hệ & đặt lịch</h2>

            <div className="space-y-3.5 text-sm">
              {salon.owner && (
                <div className="flex items-center gap-3 rounded-2xl bg-muted/50 p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                    {salon.owner.avatarUrl ? (
                      <img
                        src={salon.owner.avatarUrl}
                        alt={salon.owner.name}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <UserIcon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Chủ salon</p>
                    <p className="truncate font-medium text-foreground">{salon.owner.name}</p>
                  </div>
                </div>
              )}

              {/* Số điện thoại */}
              <div className="flex items-center justify-between rounded-xl border border-border p-3">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>Hotline / SĐT:</span>
                </div>
                <a
                  href={`tel:${salon.phone || salon.owner?.phone || ""}`}
                  className="font-medium text-primary hover:underline"
                >
                  {salon.phone || salon.owner?.phone || "Đang cập nhật"}
                </a>
              </div>

              {/* Email */}
              {salon.owner?.email && (
                <div className="flex items-center justify-between rounded-xl border border-border p-3">
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Mail className="h-4 w-4 text-primary" />
                    <span>Email:</span>
                  </div>
                  <a
                    href={`mailto:${salon.owner.email}`}
                    className="truncate max-w-[180px] font-medium text-primary hover:underline"
                    title={salon.owner.email}
                  >
                    {salon.owner.email}
                  </a>
                </div>
              )}
            </div>

            <Button asChild size="lg" className="w-full text-base font-semibold shadow-md">
              <Link to="/user/booking/$id" params={{ id: String(salon.id) }}>
                <CalendarPlus className="mr-2 h-5 w-5" />
                Đặt lịch tại salon này
              </Link>
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Đặt lịch trực tuyến nhanh chóng, không cần thanh toán trước.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
