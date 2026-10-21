import { useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarPlus,
  Clock,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Sparkles,
  Star,
  User as UserIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { salonService } from "@/services/salon.service";

interface Props {
  salonId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SalonDetailModal({ salonId, isOpen, onClose }: Props) {
  const navigate = useNavigate();

  const {
    data: salon,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["salon-detail-modal", salonId],
    queryFn: () => (salonId ? salonService.getById(salonId) : null),
    enabled: isOpen && !!salonId,
  });

  const handleBooking = () => {
    if (salonId) {
      onClose();
      navigate({ to: "/user/booking/$id", params: { id: String(salonId) } });
    }
  };

  const tags = salon?.tag
    ? salon.tag
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const mainImage =
    salon?.image_url ||
    (salon?.images && salon.images.length > 0 ? salon.images[0] : "") ||
    "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-7">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Đang tải thông tin chi tiết salon...</p>
          </div>
        ) : isError ? (
          <div className="text-center py-10 space-y-4">
            <p className="text-sm text-destructive font-medium">
              {error instanceof Error ? error.message : "Không thể tải thông tin salon"}
            </p>
            <div className="flex justify-center gap-2">
              <Button size="sm" variant="outline" onClick={onClose}>
                Đóng
              </Button>
              <Button size="sm" onClick={() => refetch()}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Thử lại
              </Button>
            </div>
          </div>
        ) : !salon ? (
          <div className="text-center py-10 space-y-3">
            <h3 className="text-base font-semibold text-foreground">Salon không tồn tại</h3>
            <p className="text-sm text-muted-foreground">
              Salon này chưa được xác thực hoặc không còn công khai.
            </p>
            <Button size="sm" variant="outline" onClick={onClose}>
              Đóng
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <DialogHeader className="text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  Đã xác thực
                </span>
                <div className="flex items-center gap-1 text-sm font-semibold text-amber-500">
                  <Star className="h-4 w-4 fill-amber-400" />
                  <span>{salon.rating.toFixed(1)}</span>
                </div>
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
                {salon.name}
              </DialogTitle>
              <DialogDescription className="flex items-start gap-1.5 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{salon.address || "Chưa cập nhật địa chỉ"}</span>
              </DialogDescription>
            </DialogHeader>

            {/* Ảnh đại diện salon */}
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-border bg-muted">
              <img
                src={mainImage}
                alt={salon.name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800";
                }}
              />
            </div>

            {/* Giờ hoạt động & Thẻ thế mạnh */}
            <div className="space-y-3 rounded-2xl bg-muted/40 p-4 text-sm">
              {salon.operatingHours && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 text-primary shrink-0" />
                  <span>Giờ mở cửa: {salon.operatingHours}</span>
                </div>
              )}

              {tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground mr-1">
                    <Sparkles className="h-3 w-3 text-primary" /> Thế mạnh:
                  </span>
                  {tags.map((t) => (
                    <Badge key={t} variant="secondary" className="text-xs">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Mô tả */}
            <div>
              <h4 className="text-sm font-semibold text-foreground">Giới thiệu</h4>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                {salon.description ||
                  "Salon chuyên nghiệp, đội ngũ tạo kiểu giàu kinh nghiệm sẵn sàng tư vấn và mang đến kiểu tóc phù hợp nhất với khuôn mặt bạn."}
              </p>
            </div>

            {/* Thông tin chủ salon & Liên hệ */}
            <div className="rounded-2xl border border-border p-4 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Thông tin chủ tiệm & liên hệ
              </h4>

              {salon.owner && (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {salon.owner.avatarUrl ? (
                      <img
                        src={salon.owner.avatarUrl}
                        alt={salon.owner.name}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <UserIcon className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Chủ salon</p>
                    <p className="truncate text-sm font-medium text-foreground">
                      {salon.owner.name}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2 text-xs">
                <a
                  href={`tel:${salon.phone || salon.owner?.phone || ""}`}
                  className="flex items-center gap-2 rounded-lg border border-border/80 p-2.5 hover:bg-muted transition-colors text-foreground"
                >
                  <Phone className="h-3.5 w-3.5 text-primary" />
                  <span className="truncate">{salon.phone || salon.owner?.phone || "Chưa có SĐT"}</span>
                </a>
                {salon.owner?.email && (
                  <a
                    href={`mailto:${salon.owner.email}`}
                    className="flex items-center gap-2 rounded-lg border border-border/80 p-2.5 hover:bg-muted transition-colors text-foreground"
                    title={salon.owner.email}
                  >
                    <Mail className="h-3.5 w-3.5 text-primary" />
                    <span className="truncate">{salon.owner.email}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-2">
              <Button asChild variant="outline" size="sm" onClick={onClose}>
                <Link to="/user/salons/$id" params={{ id: String(salon.id) }}>
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  Mở trang chi tiết
                </Link>
              </Button>
              <Button size="sm" onClick={handleBooking}>
                <CalendarPlus className="mr-1.5 h-4 w-4" />
                Đặt lịch tại salon này
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
