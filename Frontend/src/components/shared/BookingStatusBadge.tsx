import { CalendarCheck, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { BookingStatus } from "@/types";

interface BookingStatusBadgeProps {
  status: BookingStatus;
  className?: string;
  showIcon?: boolean;
}

export function BookingStatusBadge({
  status,
  className = "",
  showIcon = true,
}: BookingStatusBadgeProps) {
  switch (status) {
    case "P":
      return (
        <Badge
          variant="outline"
          className={`gap-1.5 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium ${className}`}
        >
          {showIcon && <Clock className="h-3.5 w-3.5" />}
          <span>Chờ xác nhận</span>
        </Badge>
      );
    case "C":
      return (
        <Badge
          variant="outline"
          className={`gap-1.5 border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400 font-medium ${className}`}
        >
          {showIcon && <CalendarCheck className="h-3.5 w-3.5" />}
          <span>Đã xác nhận</span>
        </Badge>
      );
    case "D":
      return (
        <Badge
          variant="outline"
          className={`gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium ${className}`}
        >
          {showIcon && <CheckCircle2 className="h-3.5 w-3.5" />}
          <span>Đã hoàn thành</span>
        </Badge>
      );
    case "X":
      return (
        <Badge
          variant="outline"
          className={`gap-1.5 border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400 font-medium ${className}`}
        >
          {showIcon && <XCircle className="h-3.5 w-3.5" />}
          <span>Đã hủy</span>
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className={className}>
          {status}
        </Badge>
      );
  }
}
