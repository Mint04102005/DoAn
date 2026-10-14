import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  FileCheck2,
  Filter,
  History,
  Lock,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Table as TableIcon,
  Unlock,
  UserCheck,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminLogs } from "@/hooks/use-admin";
import type { AdminLog } from "@/types";

export const Route = createFileRoute("/admin/logs")({
  head: () => ({
    meta: [{ title: "Nhật ký Hệ thống — AI Hairstyle Admin Dashboard" }],
  }),
  component: AdminLogsPage,
});

function getActionStyle(action: string) {
  const lower = action.toLowerCase();
  if (lower.includes("phê duyệt") || lower.includes("approved")) {
    return {
      icon: CheckCircle,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      dotBg: "bg-emerald-500/10 text-emerald-600",
      badgeVariant: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      tag: "Phê duyệt",
    };
  }
  if (lower.includes("từ chối") || lower.includes("rejected")) {
    return {
      icon: XCircle,
      iconColor: "text-rose-600 dark:text-rose-400",
      dotBg: "bg-rose-500/10 text-rose-600",
      badgeVariant: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
      tag: "Từ chối",
    };
  }
  if (lower.includes("khóa tài khoản") || lower.includes("locked")) {
    return {
      icon: Lock,
      iconColor: "text-amber-600 dark:text-amber-400",
      dotBg: "bg-amber-500/10 text-amber-600",
      badgeVariant: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      tag: "Khóa tài khoản",
    };
  }
  if (lower.includes("mở khóa") || lower.includes("unlocked")) {
    return {
      icon: Unlock,
      iconColor: "text-sky-600 dark:text-sky-400",
      dotBg: "bg-sky-500/10 text-sky-600",
      badgeVariant: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
      tag: "Mở khóa",
    };
  }
  return {
    icon: Activity,
    iconColor: "text-primary",
    dotBg: "bg-primary/10 text-primary",
    badgeVariant: "border-primary/30 bg-primary/10 text-primary",
    tag: "Hệ thống",
  };
}

function AdminLogsPage() {
  const [viewMode, setViewMode] = useState<"timeline" | "table">("timeline");
  const [search, setSearch] = useState("");
  const [adminFilter, setAdminFilter] = useState<number | "ALL">("ALL");
  const [dateFilter, setDateFilter] = useState<"today" | "7d" | "30d" | "ALL">("ALL");

  const logsQuery = useAdminLogs({
    search: search.trim() || undefined,
    admin_id: adminFilter,
    dateRange: dateFilter,
  });

  return (
    <div className="space-y-6 pb-12 text-foreground">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Nhật ký Hoạt động Hệ thống
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lịch sử kiểm toán toàn diện (Audit Trail) ghi nhận mọi quyết định phê duyệt và thao tác quản trị.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Switcher on Desktop */}
          <div className="hidden sm:block">
            <Tabs
              value={viewMode}
              onValueChange={(v) => setViewMode(v as "timeline" | "table")}
            >
              <TabsList className="border border-border bg-card p-1">
                <TabsTrigger
                  value="timeline"
                  className="data-[state=active]:bg-muted data-[state=active]:text-foreground text-xs"
                >
                  <History className="mr-1.5 h-3.5 w-3.5" /> Timeline
                </TabsTrigger>
                <TabsTrigger
                  value="table"
                  className="data-[state=active]:bg-muted data-[state=active]:text-foreground text-xs"
                >
                  <TableIcon className="mr-1.5 h-3.5 w-3.5" /> Bảng dữ liệu
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => logsQuery.refetch()}
            disabled={logsQuery.isRefetching}
            className="border-border bg-card hover:bg-muted"
          >
            <RefreshCw
              className={`mr-2 h-3.5 w-3.5 ${logsQuery.isRefetching ? "animate-spin" : ""}`}
            />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:grid-cols-12">
        {/* Search Input */}
        <div className="relative sm:col-span-6">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo hành động, mã Log ID, Admin ID..."
            className="bg-background pl-10 text-sm focus-visible:border-primary"
          />
        </div>

        {/* Admin Select */}
        <div className="sm:col-span-3">
          <Select
            value={String(adminFilter)}
            onValueChange={(val) => setAdminFilter(val === "ALL" ? "ALL" : Number(val))}
          >
            <SelectTrigger className="bg-background border-input">
              <SelectValue placeholder="Chọn Quản trị viên" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả Quản trị viên</SelectItem>
              <SelectItem value="100">Admin Lead (#100)</SelectItem>
              <SelectItem value="102">Admin Auditor (#102)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Select */}
        <div className="sm:col-span-3">
          <Select
            value={dateFilter}
            onValueChange={(val) => setDateFilter(val as "today" | "7d" | "30d" | "ALL")}
          >
            <SelectTrigger className="bg-background border-input">
              <SelectValue placeholder="Thời gian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Toàn bộ thời gian</SelectItem>
              <SelectItem value="today">Hôm nay (24h qua)</SelectItem>
              <SelectItem value="7d">7 ngày gần nhất</SelectItem>
              <SelectItem value="30d">30 ngày gần nhất</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content Area */}
      {logsQuery.isLoading ? (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <Skeleton className="h-6 w-48" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : logsQuery.isError ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 py-12 px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Không thể tải nhật ký hệ thống</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {logsQuery.error instanceof Error ? logsQuery.error.message : "Vui lòng thử lại."}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => logsQuery.refetch()}>
            Thử lại
          </Button>
        </div>
      ) : logsQuery.data?.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 py-16 px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <History className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Chưa có nhật ký hệ thống</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {search || adminFilter !== "ALL" || dateFilter !== "ALL"
                ? "Không tìm thấy nhật ký phù hợp với bộ lọc hiện tại."
                : "Các hành động phê duyệt và quản trị sẽ xuất hiện tự động tại đây."}
            </p>
          </div>
          {(search || adminFilter !== "ALL" || dateFilter !== "ALL") && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSearch("");
                setAdminFilter("ALL");
                setDateFilter("ALL");
              }}
            >
              Đặt lại bộ lọc
            </Button>
          )}
        </div>
      ) : viewMode === "timeline" ? (
        /* Vertical Timeline View */
        <div className="relative rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="absolute bottom-10 left-9 top-10 w-0.5 bg-border sm:left-11" />

          <div className="space-y-6">
            {logsQuery.data?.map((log, index) => {
              const meta = getActionStyle(log.action);
              const Icon = meta.icon;

              return (
                <motion.div
                  key={log.log_id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
                  className="relative flex items-start gap-4 sm:gap-6"
                >
                  {/* Timeline Dot Icon */}
                  <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-background bg-card shadow-sm">
                    <Icon className={`h-4 w-4 ${meta.iconColor}`} />
                  </div>

                  {/* Card Content */}
                  <div className="flex-1 rounded-xl border border-border bg-muted/20 p-4 transition-colors hover:border-primary/40 hover:bg-muted/40">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-xs ${meta.badgeVariant}`}>
                          {meta.tag}
                        </Badge>
                        <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                          <UserCheck className="h-3.5 w-3.5" />
                          {log.admin_id === 100
                            ? "Admin Lead (#100)"
                            : log.admin_id === 102
                              ? "Admin Auditor (#102)"
                              : `Admin #${log.admin_id}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {new Date(log.created_at).toLocaleString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    <p className="mt-2 text-sm font-medium leading-relaxed text-foreground">
                      {log.action}
                    </p>

                    <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
                      <span className="font-mono font-medium">Log ID: #{log.log_id}</span>
                      <span>Verified Audit Trail</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Data Table View */
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-foreground">
              <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3.5">Log ID</th>
                  <th className="px-4 py-3.5">Thời gian</th>
                  <th className="px-4 py-3.5">Quản trị viên</th>
                  <th className="px-4 py-3.5">Loại hành động</th>
                  <th className="px-4 py-3.5">Chi tiết hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logsQuery.data?.map((log) => {
                  const meta = getActionStyle(log.action);
                  return (
                    <tr key={log.log_id} className="transition-colors hover:bg-muted/30">
                      <td className="px-4 py-4 font-mono font-medium text-primary">
                        #{log.log_id}
                      </td>
                      <td className="px-4 py-4 text-xs font-mono text-muted-foreground">
                        {new Date(log.created_at).toLocaleString("vi-VN")}
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-medium text-foreground">
                          {log.admin_id === 100
                            ? "Admin Lead (#100)"
                            : log.admin_id === 102
                              ? "Admin Auditor (#102)"
                              : `Admin #${log.admin_id}`}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant="outline" className={`text-xs ${meta.badgeVariant}`}>
                          {meta.tag}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-foreground">
                        {log.action}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
