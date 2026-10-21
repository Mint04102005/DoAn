import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CalendarPlus, Eye, MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SalonDetailModal } from "@/components/modals/SalonDetailModal";
import type { Salon } from "@/types";

export function SalonCard({ salon }: { salon: Salon }) {
  const [showDetail, setShowDetail] = useState(false);

  const tags = salon.tag
    ? salon.tag
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const imageUrl =
    salon.image_url || "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800";

  return (
    <>
      <motion.div
        whileHover={{ y: -3 }}
        className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
      >
        <div
          onClick={() => setShowDetail(true)}
          className="relative aspect-[5/3] overflow-hidden bg-muted block group cursor-pointer"
        >
          <img
            src={imageUrl}
            alt={salon.salonname}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800";
            }}
          />
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium shadow backdrop-blur">
            <Star className="h-3 w-3 fill-warning text-warning" />
            {salon.rating ? salon.rating.toFixed(1) : "5.0"}
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between space-y-3 p-4">
          <div className="space-y-2">
            <h3
              onClick={() => setShowDetail(true)}
              className="text-base font-semibold text-foreground line-clamp-1 cursor-pointer hover:text-primary transition-colors"
            >
              {salon.salonname}
            </h3>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <p className="line-clamp-2">{salon.address || "Chưa cập nhật địa chỉ"}</p>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {tags.map((t) => (
                  <Badge key={t} variant="secondary" className="text-[10px]">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setShowDetail(true)}
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              Chi tiết
            </Button>
            <Button asChild size="sm" className="flex-1">
              <Link to="/user/booking/$id" params={{ id: String(salon.salon_id) }}>
                <CalendarPlus className="mr-1.5 h-3.5 w-3.5" />
                Đặt lịch
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Modal chi tiết Salon */}
      <SalonDetailModal
        salonId={salon.salon_id}
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
      />
    </>
  );
}
