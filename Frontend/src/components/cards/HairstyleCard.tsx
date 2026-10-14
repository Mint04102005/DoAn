import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Hairstyle } from "@/types";

interface Props {
  hair: Hairstyle;
  score?: number;
}

export function HairstyleCard({ hair, score }: Props) {
  const navigate = useNavigate();
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
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
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-4">
          <p className="text-xs uppercase tracking-wider text-white/80">
            {hair.gender === "female" ? "Nữ" : "Nam"}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">{hair.hair_name}</h3>
        </div>
      </div>
      <div className="flex items-center justify-between p-4">
        <p className="line-clamp-2 text-xs text-muted-foreground">{hair.description}</p>
        <Button
          size="sm"
          onClick={() => navigate({ to: "/user/try-on", search: { hair_id: hair.hair_id } })}
        >
          <Wand2 className="mr-1.5 h-3.5 w-3.5" />
          Thử ngay
        </Button>
      </div>
    </motion.div>
  );
}
