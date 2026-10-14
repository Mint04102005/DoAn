import { Link } from "@tanstack/react-router";
import { Scissors } from "lucide-react";

export function Logo({
  to = "/",
  variant = "auto",
  className = "",
}: {
  to?: string;
  variant?: "auto" | "dark" | "light";
  className?: string;
}) {
  const isDark = variant === "dark";
  const isLight = variant === "light";

  return (
    <Link to={to} className={`group flex items-center gap-2.5 ${className}`}>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
        <Scissors className="h-4 w-4" />
      </div>
      <div className="flex flex-col leading-tight">
        <span
          className={`text-base font-semibold tracking-tight ${
            isDark
              ? "text-white"
              : isLight
                ? "text-slate-900"
                : "text-foreground group-hover:text-primary transition-colors"
          }`}
        >
          AI Hairstyle Recommendation System
        </span>
        <span
          className={`text-[10px] uppercase tracking-[0.18em] ${
            isDark ? "text-slate-400" : isLight ? "text-slate-500" : "text-muted-foreground"
          }`}
        >
          AI Studio
        </span>
      </div>
    </Link>
  );
}
