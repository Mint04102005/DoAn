import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Wand2, CheckCircle2, Tag, Scissors } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { hairstyleService } from "@/services/hairstyle.service";

interface Props {
  hairId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function HairstyleDetailModal({ hairId, isOpen, onClose }: Props) {
  const navigate = useNavigate();

  const { data: detail, isLoading } = useQuery({
    queryKey: ["hairstyle-detail", hairId],
    queryFn: () => (hairId ? hairstyleService.getDetail(hairId) : null),
    enabled: isOpen && !!hairId,
  });

  const handleTryOn = () => {
    if (hairId) {
      onClose();
      navigate({ to: "/user/try-on", search: { hair_id: hairId } });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-7">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Đang tải thông tin chi tiết kiểu tóc...</p>
          </div>
        ) : detail ? (
          <div className="space-y-6">
            <DialogHeader className="text-left space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs font-semibold">
                  {detail.gender === "Nữ" || detail.gender === "female" ? "Dành cho Nữ" : "Dành cho Nam"}
                </Badge>
                {detail.hairType && (
                  <Badge variant="secondary" className="text-xs">
                    <Scissors className="mr-1 h-3 w-3" />
                    Chất tóc: {detail.hairType}
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight">
                {detail.name}
              </DialogTitle>
              <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 text-sm text-foreground leading-relaxed">
                <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider block mb-1">
                  Mô tả kiểu tóc
                </span>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {detail.description || "Mẫu tóc hiện đại, phong cách tự nhiên tôn đường nét khuôn mặt."}
                </p>
              </div>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 items-start">
              {/* Ảnh mẫu tóc tách nền */}
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-border bg-gradient-to-b from-muted/50 to-muted shadow-inner">
                <img
                  src={detail.imageUrl}
                  alt={detail.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-2 left-2 right-2 bg-background/80 backdrop-blur-sm rounded-lg p-2 text-center text-xs text-muted-foreground">
                  Ảnh mẫu chuẩn tách nền AI
                </div>
              </div>

              {/* Danh sách dáng mặt phù hợp & Độ tương thích */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Độ phù hợp với các dáng mặt
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Được tính toán dựa trên cấu trúc khuôn mặt và tỉ lệ hình học.
                  </p>
                </div>

                {detail.hairFace && detail.hairFace.length > 0 ? (
                  <div className="space-y-3">
                    {detail.hairFace.map((hf) => {
                      const scorePercent = Math.round(
                        hf.suitabilityScore > 1
                          ? hf.suitabilityScore
                          : hf.suitabilityScore * 100,
                      );
                      const isHigh = scorePercent >= 90;
                      return (
                        <div
                          key={hf.id}
                          className="rounded-lg border border-border bg-card/60 p-3 space-y-1.5 transition-colors hover:bg-card"
                        >
                          <div className="flex items-center justify-between text-xs font-medium">
                            <span className="flex items-center gap-1 text-foreground font-semibold">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                              Mặt {hf.faceShape.name}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                isHigh
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : "bg-primary/10 text-primary"
                              }`}
                            >
                              {scorePercent}%
                            </span>
                          </div>
                          <Progress value={scorePercent} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic py-3">
                    Chưa có dữ liệu độ phù hợp dáng mặt cụ thể cho mẫu tóc này.
                  </p>
                )}

                {/* Tags */}
                {detail.tags && detail.tags.length > 0 && (
                  <div className="pt-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1.5">
                      <Tag className="h-3 w-3" /> Từ khóa phong cách:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {detail.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[11px] font-normal">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer action buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Button variant="outline" size="sm" onClick={onClose}>
                Đóng
              </Button>
              <Button size="sm" onClick={handleTryOn} className="gap-1.5 font-medium">
                <Wand2 className="h-4 w-4" />
                Thử kiểu tóc này ngay
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Không tìm thấy thông tin kiểu tóc.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
