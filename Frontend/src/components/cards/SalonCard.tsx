import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CalendarPlus, MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Salon } from "@/types";

export function SalonCard({ salon }: { salon: Salon }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      <div className="relative aspect-[5/3] overflow-hidden bg-muted">
        <img
          src={salon.image_url}
          alt={salon.salonname}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium shadow">
          <Star className="h-3 w-3 fill-warning text-warning" />
          {salon.rating.toFixed(1)}
        </div>
      </div>
      <div className="space-y-3 p-4">
        <h3 className="text-base font-semibold text-foreground">{salon.salonname}</h3>
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p className="line-clamp-2">{salon.address}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {salon.tag.split(",").map((t) => (
            <Badge key={t} variant="secondary" className="text-[10px]">
              {t.trim()}
            </Badge>
          ))}
        </div>
        <Button asChild size="sm" className="w-full">
          <Link to="/user/booking/$id" params={{ id: String(salon.salon_id) }}>
            <CalendarPlus className="mr-1.5 h-3.5 w-3.5" />
            Đặt lịch
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}
