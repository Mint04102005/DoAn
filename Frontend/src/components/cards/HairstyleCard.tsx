import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Info, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HairstyleDetailModal } from "@/components/modals/HairstyleDetailModal";
import type { Hairstyle } from "@/types";

interface Props {
  hair: Hairstyle;
  score?: number;
}

export function HairstyleCard({ hair, score }: Props) {
  const navigate = useNavigate();
  const [showDetail, setShowDetail] = useState(false);

  return (
    <>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
        onClick={() => setShowDetail(true)}
        className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm cursor-pointer hover:border-primary/50 transition-colors"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-muted">
          <img
            src={hair.image_url}
            alt={hair.hair_name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {typeof score === "number" ? (
            <Badge className="absolute right-3 top-3 bg-success text-success-foreground shadow">
              <Sparkles className="mr-1 h-3 w-3" />
              {score}%
            </Badge>
          ) : null}

          {/* Hover hint */}
          <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-1 text-[11px] font-medium text-white shadow">
              <Info className="h-3 w-3" /> Chi tiết
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/35 to-transparent p-4">
            <p className="text-xs uppercase tracking-wider text-white/80">
              {hair.gender === "female" ? "Nữ" : "Nam"}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-white group-hover:text-primary-foreground transition-colors">
              {hair.hair_name}
            </h3>
          </div>
        </div>
        <div className="flex items-center justify-between p-4 gap-2">
          <p
            className="line-clamp-2 text-xs text-muted-foreground flex-1 hover:text-foreground transition-colors cursor-pointer"
            title={hair.description}
            onClick={() => setShowDetail(true)}
          >
            {hair.description || "Nhấp để xem chi tiết & dáng mặt phù hợp."}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                setShowDetail(true);
              }}
            >
              <Info className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                navigate({ to: "/user/try-on", search: { hair_id: hair.hair_id } });
              }}
            >
              <Wand2 className="mr-1.5 h-3.5 w-3.5" />
              Thử ngay
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Modal chi tiết mẫu tóc & độ phù hợp */}
      <HairstyleDetailModal
        hairId={hair.hair_id}
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
      />
    </>
  );
}
