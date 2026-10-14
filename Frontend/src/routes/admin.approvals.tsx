import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileCheck2,
  Filter,
  Lock,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Star,
  Store,
  User,
  Users,
  XCircle,
  ZoomIn,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAdminSummary,
  useApproveSalon,
  usePendingApprovals,
  useRejectSalon,
} from "@/hooks/use-admin";
import type { ApprovalStatus, EnrichedApproval } from "@/types";

export const Route = createFileRoute("/admin/approvals")({
  head: () => ({
    meta: [{ title: "Phê duyệt Salon — AI Hairstyle Admin Dashboard" }],
  }),
  component: AdminApprovalsPage,
});

function AdminApprovalsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | "ALL">("P");
  const [selectedApproval, setSelectedApproval] = useState<EnrichedApproval | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);
  const [confirmRejectOpen, setConfirmRejectOpen] = useState(false);
  const [imageZoomOpen, setImageZoomOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Queries & Mutations
  const summaryQuery = useAdminSummary();
  const approvalsQuery = usePendingApprovals({
    search: search.trim() || undefined,
    status: statusFilter,
  });
  const approveMutation = useApproveSalon();
  const rejectMutation = useRejectSalon();

  const handleOpenDetail = (approval: EnrichedApproval) => {
    setSelectedApproval(approval);
    setImageError(false);
    setDetailOpen(true);
  };

  const handleApproveConfirm = async () => {
    if (!selectedApproval) return;
    try {
      await approveMutation.mutateAsync(selectedApproval.approval_id);
      setConfirmApproveOpen(false);
      setDetailOpen(false);
    } catch {
      // Error handled by mutation toast
    }
  };

  const handleRejectConfirm = async () => {
    if (!selectedApproval) return;
    try {
      await rejectMutation.mutateAsync(selectedApproval.approval_id);
      setConfirmRejectOpen(false);
      setDetailOpen(false);
    } catch {
      // Error handled by mutation toast
    }
  };

  const handleQuickApprove = (approval: EnrichedApproval, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedApproval(approval);
    setConfirmApproveOpen(true);
  };

  const handleQuickReject = (approval: EnrichedApproval, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedApproval(approval);
    setConfirmRejectOpen(true);
  };

  const summary = summaryQuery.data;

  return (
    <div className="space-y-6 pb-12 text-foreground">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Quản lý Phê duyệt Salon
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Xác minh chứng nhận pháp lý và phê duyệt các cơ sở salon đăng ký tham gia mạng lưới.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              approvalsQuery.refetch();
              summaryQuery.refetch();
            }}
            disabled={approvalsQuery.isRefetching}
            className="border-border bg-card hover:bg-muted"
          >
            <RefreshCw
              className={`mr-2 h-3.5 w-3.5 ${approvalsQuery.isRefetching ? "animate-spin" : ""}`}
            />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Pending Approvals */}
        <div className="rounded-2xl border border-amber-500/20 bg-card p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Yêu cầu chờ duyệt</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            {summaryQuery.isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                {summary?.pendingApprovalsCount ?? 0}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">Cần xác minh chứng chỉ</p>
          </div>
        </div>

        {/* Total Users */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground">Tổng người dùng</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            {summaryQuery.isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold tracking-tight text-foreground">
                {summary?.totalUsersCount ?? 0}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">Tài khoản toàn hệ thống</p>
          </div>
        </div>

        {/* Total Salons */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground">Tổng Salon đối tác</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Store className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            {summaryQuery.isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {summary?.totalSalonsCount ?? 0}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">Điểm liên kết trên ứng dụng</p>
          </div>
        </div>

        {/* Locked Accounts */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground">Tài khoản bị khóa</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Lock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            {summaryQuery.isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                {summary?.lockedUsersCount ?? 0}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">Tạm dừng quyền đăng nhập</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo Owner ID, Username, Email, Giấy phép, Tên Salon..."
            className="bg-background pl-10 text-sm focus-visible:border-primary"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2">
          <Filter className="hidden h-4 w-4 text-muted-foreground sm:block" />
          <Tabs
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val as ApprovalStatus | "ALL")}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid w-full grid-cols-4 bg-muted/60 p-1 text-xs sm:w-auto">
              <TabsTrigger
                value="P"
                className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-800 dark:data-[state=active]:text-amber-300 font-medium"
              >
                Chờ duyệt
              </TabsTrigger>
              <TabsTrigger
                value="A"
                className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-800 dark:data-[state=active]:text-emerald-300 font-medium"
              >
                Đã duyệt
              </TabsTrigger>
              <TabsTrigger
                value="R"
                className="data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-800 dark:data-[state=active]:text-rose-300 font-medium"
              >
                Từ chối
              </TabsTrigger>
              <TabsTrigger value="ALL" className="data-[state=active]:bg-card font-medium">
                Tất cả
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content Area: Data Table & Mobile Cards */}
      {approvalsQuery.isLoading ? (
        <div className="space-y-3 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-24" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : approvalsQuery.isError ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 py-12 px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Không thể tải dữ liệu</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {approvalsQuery.error instanceof Error
                ? approvalsQuery.error.message
                : "Vui lòng thử lại."}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => approvalsQuery.refetch()}>
            Thử lại
          </Button>
        </div>
      ) : approvalsQuery.data?.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 py-16 px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Không có yêu cầu phê duyệt nào</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {search
                ? `Không tìm thấy kết quả phù hợp với từ khóa "${search}".`
                : "Hiện tại không có hồ sơ salon nào trong trạng thái này."}
            </p>
          </div>
          {search ? (
            <Button size="sm" variant="outline" onClick={() => setSearch("")}>
              Xóa bộ lọc tìm kiếm
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {/* Desktop Table */}
          <div className="hidden overflow-x-auto xl:block">
            <table className="w-full text-left text-sm text-foreground">
              <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3.5">Mã Approval</th>
                  <th className="px-4 py-3.5">Chủ Salon</th>
                  <th className="px-4 py-3.5">Liên hệ</th>
                  <th className="px-4 py-3.5">License No.</th>
                  <th className="px-4 py-3.5">Tên Salon</th>
                  <th className="px-4 py-3.5">Ngày đăng ký</th>
                  <th className="px-4 py-3.5 text-center">Trạng thái</th>
                  <th className="px-4 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {approvalsQuery.data?.map((item) => {
                  const isPending = item.status === "P";
                  const isApproved = item.status === "A";

                  return (
                    <tr
                      key={item.approval_id}
                      onClick={() => handleOpenDetail(item)}
                      className="group cursor-pointer transition-colors hover:bg-muted/40"
                    >
                      {/* Mã Approval */}
                      <td className="px-4 py-4 font-mono font-medium text-primary">
                        #APP-{String(item.approval_id).padStart(2, "0")}
                      </td>

                      {/* Chủ Salon */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-border">
                            <AvatarImage src={item.user?.avatar_url} alt={item.user?.username} />
                            <AvatarFallback className="bg-primary/20 text-xs text-primary font-semibold">
                              {item.user?.username.slice(0, 2).toUpperCase() || "SO"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground">
                              {item.user?.fullname || item.user?.username || `Owner #${item.owner_id}`}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              @{item.user?.username || `owner_${item.owner_id}`} • ID #{item.owner_id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Liên hệ */}
                      <td className="px-4 py-4">
                        <div className="text-xs">
                          <p className="truncate font-medium text-foreground">{item.user?.email || "N/A"}</p>
                          <p className="text-muted-foreground">{item.user?.phone || "N/A"}</p>
                        </div>
                      </td>

                      {/* License No */}
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2 py-0.5 font-mono text-xs font-semibold text-foreground">
                          <FileCheck2 className="h-3 w-3 text-primary" />
                          {item.owner?.license_no || "N/A"}
                        </span>
                      </td>

                      {/* Tên Salon */}
                      <td className="px-4 py-4">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">
                            {item.salon?.salonname || "Chưa thiết lập"}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {item.salon?.address || "Đang cập nhật địa chỉ"}
                          </p>
                        </div>
                      </td>

                      {/* Ngày đăng ký */}
                      <td className="px-4 py-4 text-xs text-muted-foreground">
                        {item.applied_at
                          ? new Date(item.applied_at).toLocaleDateString("vi-VN")
                          : "Gần đây"}
                      </td>

                      {/* Trạng thái */}
                      <td className="px-4 py-4 text-center">
                        {isPending ? (
                          <Badge
                            variant="outline"
                            className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium"
                          >
                            <Clock className="mr-1 h-3 w-3" /> Chờ duyệt
                          </Badge>
                        ) : isApproved ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium"
                          >
                            <CheckCircle2 className="mr-1 h-3 w-3" /> Đã duyệt
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400 font-medium"
                          >
                            <XCircle className="mr-1 h-3 w-3" /> Từ chối
                          </Badge>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => handleOpenDetail(item)}
                          >
                            <Eye className="mr-1 h-3.5 w-3.5" /> Chi tiết
                          </Button>
                          {isPending && (
                            <>
                              <Button
                                size="sm"
                                className="h-8 bg-emerald-600 px-2.5 text-xs text-white hover:bg-emerald-500"
                                onClick={(e) => handleQuickApprove(item, e)}
                                disabled={approveMutation.isPending}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" /> Duyệt
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 border-rose-500/30 bg-rose-500/10 px-2.5 text-xs text-rose-600 hover:bg-rose-500/20"
                                onClick={(e) => handleQuickReject(item, e)}
                                disabled={rejectMutation.isPending}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile & Tablet Card View (Screen < 1280px) */}
          <div className="divide-y divide-border xl:hidden">
            {approvalsQuery.data?.map((item) => {
              const isPending = item.status === "P";
              const isApproved = item.status === "A";

              return (
                <div
                  key={item.approval_id}
                  onClick={() => handleOpenDetail(item)}
                  className="p-4 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-border">
                        <AvatarImage src={item.user?.avatar_url} alt={item.user?.username} />
                        <AvatarFallback className="bg-primary/20 text-xs font-semibold text-primary">
                          {item.user?.username.slice(0, 2).toUpperCase() || "SO"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">
                            {item.salon?.salonname || "Chưa đặt tên"}
                          </p>
                          <span className="font-mono text-xs text-primary font-semibold">
                            #APP-{String(item.approval_id).padStart(2, "0")}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Chủ: {item.user?.fullname || item.user?.username} (@{item.user?.username})
                        </p>
                      </div>
                    </div>

                    {isPending ? (
                      <Badge
                        variant="outline"
                        className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px]"
                      >
                        Chờ duyệt
                      </Badge>
                    ) : isApproved ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px]"
                      >
                        Đã duyệt
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400 text-[11px]"
                      >
                        Từ chối
                      </Badge>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-foreground">
                    <div className="flex items-center gap-1.5 truncate">
                      <FileCheck2 className="h-3.5 w-3.5 text-primary" />
                      <span className="font-mono font-medium">{item.owner?.license_no || "N/A"}</span>
                    </div>
                    <div className="truncate text-right text-muted-foreground">
                      {item.user?.phone || item.user?.email || "N/A"}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                    <span className="text-[11px] text-muted-foreground">
                      Đăng ký:{" "}
                      {item.applied_at
                        ? new Date(item.applied_at).toLocaleDateString("vi-VN")
                        : "Gần đây"}
                    </span>
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleOpenDetail(item)}
                      >
                        <Eye className="mr-1 h-3 w-3" /> Xem
                      </Button>
                      {isPending && (
                        <>
                          <Button
                            size="sm"
                            className="h-7 bg-emerald-600 px-2 text-xs text-white hover:bg-emerald-500"
                            onClick={(e) => handleQuickApprove(item, e)}
                          >
                            Duyệt
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 border-rose-500/30 bg-rose-500/10 px-2 text-xs text-rose-600"
                            onClick={(e) => handleQuickReject(item, e)}
                          >
                            Từ chối
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Approval Detail Modal Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl sm:max-w-3xl">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Chi tiết Hồ sơ Xác minh Salon #APP-
                {String(selectedApproval?.approval_id).padStart(2, "0")}
              </DialogTitle>
            </div>
            <DialogDescription>
              Kiểm tra thông tin định danh chủ sở hữu, địa điểm kinh doanh và tài liệu giấy phép hành nghề.
            </DialogDescription>
          </DialogHeader>

          {selectedApproval && (
            <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
              {/* Status Banner */}
              <div
                className={`flex items-center justify-between rounded-xl border p-3.5 ${
                  selectedApproval.status === "P"
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                    : selectedApproval.status === "A"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                      : "border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-300"
                }`}
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  {selectedApproval.status === "P" && <Clock className="h-4 w-4 text-amber-600" />}
                  {selectedApproval.status === "A" && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                  {selectedApproval.status === "R" && <XCircle className="h-4 w-4 text-rose-600" />}
                  Trạng thái hiện tại:{" "}
                  {selectedApproval.status === "P"
                    ? "Chờ duyệt hồ sơ"
                    : selectedApproval.status === "A"
                      ? "Đã phê duyệt hoạt động"
                      : "Đã từ chối xác minh"}
                </div>
                <span className="text-xs opacity-80 font-mono font-semibold">
                  Owner ID: #{selectedApproval.owner_id}
                </span>
              </div>

              {/* Grid 2 Columns: Owner & Salon info */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Thông tin chủ Salon */}
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                    <User className="h-3.5 w-3.5" /> Thông tin chủ Salon
                  </h4>
                  <div className="mt-3 flex items-center gap-3">
                    <Avatar className="h-12 w-12 border border-border">
                      <AvatarImage
                        src={selectedApproval.user?.avatar_url}
                        alt={selectedApproval.user?.username}
                      />
                      <AvatarFallback className="bg-primary/20 text-primary font-bold">
                        {selectedApproval.user?.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground">
                        {selectedApproval.user?.fullname || "Chưa cập nhật tên"}
                      </p>
                      <p className="text-xs text-muted-foreground">@{selectedApproval.user?.username}</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-1.5 text-xs">
                    <p className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-mono text-foreground font-medium">
                        {selectedApproval.user?.email}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-muted-foreground">Số điện thoại:</span>
                      <span className="font-mono text-foreground font-medium">
                        {selectedApproval.user?.phone}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-muted-foreground">Giới tính:</span>
                      <span className="text-foreground">{selectedApproval.user?.gender === "female" ? "Nữ" : "Nam"}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-muted-foreground">Ngày sinh:</span>
                      <span className="text-foreground">{selectedApproval.user?.dob || "1995-01-01"}</span>
                    </p>
                  </div>
                </div>

                {/* Thông tin Salon */}
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                    <Building2 className="h-3.5 w-3.5" /> Thông tin Salon
                  </h4>
                  <div className="mt-3">
                    <p className="font-bold text-foreground text-base">
                      {selectedApproval.salon?.salonname || "Chưa thiết lập"}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-600">
                      <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                      <span className="font-semibold">{selectedApproval.salon?.rating ?? 4.8} / 5.0</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">Salon liên kết</span>
                    </div>
                  </div>
                  <div className="mt-4 space-y-1.5 text-xs">
                    <p>
                      <span className="text-muted-foreground block mb-0.5">Địa chỉ cơ sở:</span>
                      <span className="text-foreground font-medium">
                        {selectedApproval.salon?.address || "Đang cập nhật"}
                      </span>
                    </p>
                    <div className="pt-1">
                      <span className="text-muted-foreground block mb-1">Dịch vụ thế mạnh:</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedApproval.salon?.tag.split(",").map((t, i) => (
                          <span
                            key={i}
                            className="rounded-md border border-border bg-card px-2 py-0.5 text-[11px] font-medium text-foreground"
                          >
                            {t.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thông tin giấy phép & Tài liệu xác minh */}
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                    <FileCheck2 className="h-3.5 w-3.5" /> Giấy phép kinh doanh & Chứng chỉ hành nghề
                  </h4>
                  <span className="font-mono text-xs font-bold text-foreground">
                    Số: {selectedApproval.owner?.license_no}
                  </span>
                </div>

                <p className="mt-2 text-xs text-muted-foreground">
                  Tài liệu đăng ký kinh doanh và chứng chỉ đào tạo Master Stylist được tải lên bởi chủ salon.
                </p>

                {/* License Document Preview Box */}
                <div className="mt-3 overflow-hidden rounded-xl border border-border bg-card">
                  {imageError ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                      <AlertCircle className="h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 text-sm font-medium">Không thể tải tài liệu</p>
                      <p className="text-xs">
                        Hình ảnh giấy phép không khả dụng hoặc bị lỗi đường truyền.
                      </p>
                    </div>
                  ) : (
                    <div className="group relative aspect-video w-full overflow-hidden bg-muted">
                      <img
                        src={selectedApproval.license_image_url}
                        alt={`License ${selectedApproval.owner?.license_no}`}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={() => setImageError(true)}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="bg-card text-foreground shadow-md hover:bg-muted"
                          onClick={() => setImageZoomOpen(true)}
                        >
                          <ZoomIn className="mr-1.5 h-4 w-4" /> Phóng to tài liệu
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
                    <span className="font-mono">
                      Chứng nhận: {selectedApproval.owner?.license_no || "BL-2025-XXXX"}
                    </span>
                    <button
                      type="button"
                      className="flex items-center gap-1 font-semibold text-primary hover:underline"
                      onClick={() => setImageZoomOpen(true)}
                    >
                      <ExternalLink className="h-3 w-3" /> Xem toàn màn hình
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 border-t border-border pt-4 sm:justify-between">
            <Button variant="outline" onClick={() => setDetailOpen(false)}>
              Đóng
            </Button>

            {selectedApproval?.status === "P" ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  className="bg-rose-600 hover:bg-rose-500"
                  onClick={() => setConfirmRejectOpen(true)}
                  disabled={rejectMutation.isPending || approveMutation.isPending}
                >
                  <XCircle className="mr-1.5 h-4 w-4" /> Từ chối hồ sơ
                </Button>
                <Button
                  className="bg-emerald-600 text-white hover:bg-emerald-500"
                  onClick={() => setConfirmApproveOpen(true)}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                >
                  <CheckCircle2 className="mr-1.5 h-4 w-4" /> Phê duyệt Salon
                </Button>
              </div>
            ) : selectedApproval?.status === "A" ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <CheckCircle2 className="h-4 w-4" /> Salon đã được xác minh chính thức
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                <XCircle className="h-4 w-4" /> Yêu cầu đã bị từ chối trước đó
              </span>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog: Approve Salon */}
      <Dialog open={confirmApproveOpen} onOpenChange={setConfirmApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-lg font-bold">
              Phê duyệt Salon đối tác?
            </DialogTitle>
            <DialogDescription className="text-center">
              Bạn có chắc muốn phê duyệt Salon{" "}
              <strong className="text-foreground">
                {selectedApproval?.salon?.salonname || `Owner #${selectedApproval?.owner_id}`}
              </strong>
              ? Chủ salon sẽ được cấp quyền nhận lịch hẹn trực tiếp từ khách hàng.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:justify-center">
            <Button variant="outline" onClick={() => setConfirmApproveOpen(false)}>
              Hủy
            </Button>
            <Button
              className="bg-emerald-600 text-white hover:bg-emerald-500"
              onClick={handleApproveConfirm}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? "Đang xử lý..." : "Xác nhận Phê duyệt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog: Reject Salon */}
      <Dialog open={confirmRejectOpen} onOpenChange={setConfirmRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-600">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-lg font-bold">
              Từ chối yêu cầu xác minh?
            </DialogTitle>
            <DialogDescription className="text-center">
              Bạn có chắc muốn từ chối yêu cầu xác minh của Salon{" "}
              <strong className="text-foreground">
                {selectedApproval?.salon?.salonname || `Owner #${selectedApproval?.owner_id}`}
              </strong>
              ? Salon này sẽ không thể xuất hiện trong danh sách đối tác nhận lịch.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:justify-center">
            <Button variant="outline" onClick={() => setConfirmRejectOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              className="bg-rose-600 hover:bg-rose-500"
              onClick={handleRejectConfirm}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? "Đang xử lý..." : "Xác nhận Từ chối"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* License Document Fullscreen Zoom Modal */}
      <Dialog open={imageZoomOpen} onOpenChange={setImageZoomOpen}>
        <DialogContent className="max-w-4xl p-2">
          <div className="relative overflow-hidden rounded-lg">
            <img
              src={selectedApproval?.license_image_url}
              alt="License Full preview"
              className="max-h-[85vh] w-full object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
