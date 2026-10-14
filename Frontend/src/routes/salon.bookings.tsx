import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Calendar,
  CalendarCheck2,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Filter,
  Phone,
  RotateCcw,
  Search,
  Sparkles,
  User as UserIcon,
  X,
  XCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { BookingStatusBadge } from "@/components/shared/BookingStatusBadge";
import { EmptyState, ErrorState } from "@/components/shared/StateViews";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSalonBookings, useSalonProfile, useUpdateBookingStatus } from "@/hooks/use-salon";
import { useAuthStore } from "@/stores/auth.store";
import type { BookingFilters, BookingStatus, EnrichedBooking } from "@/types";

export const Route = createFileRoute("/salon/bookings")({
  head: () => ({
    meta: [
      { title: "Quản lý Lịch hẹn — Salon Dashboard" },
      {
        name: "description",
        content: "Theo dõi và quản lý các lịch hẹn làm tóc tại salon của bạn.",
      },
    ],
  }),
  component: SalonBookingsPage,
});

type ActionType = "CONFIRM" | "COMPLETE" | "CANCEL";

interface ConfirmModalState {
  open: boolean;
  type: ActionType;
  booking: EnrichedBooking | null;
}

function formatDateDisplay(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

function SalonBookingsPage() {
  const user = useAuthStore((s) => s.user);
  const profileQuery = useSalonProfile(user?.user_id);
  const salon = profileQuery.data?.salon;

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "ALL">("ALL");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "tomorrow" | "this_week">("all");
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc">("date_desc");
  const [page, setPage] = useState(1);

  const filters: BookingFilters = {
    search: searchTerm,
    status: statusFilter,
    dateFilter,
    sortBy,
    page,
    limit: 10,
  };

  const bookingsQuery = useSalonBookings(salon?.salon_id, filters);
  const updateStatusMutation = useUpdateBookingStatus(salon?.salon_id);

  // Detail Modal State
  const [selectedBooking, setSelectedBooking] = useState<EnrichedBooking | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Confirm Action Modal State
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    open: false,
    type: "CONFIRM",
    booking: null,
  });

  const handleOpenDetail = (booking: EnrichedBooking) => {
    setSelectedBooking(booking);
    setDetailOpen(true);
  };

  const handleOpenActionConfirm = (booking: EnrichedBooking, type: ActionType) => {
    setConfirmModal({
      open: true,
      type,
      booking,
    });
  };

  const handleExecuteAction = async () => {
    if (!confirmModal.booking) return;

    let targetStatus: BookingStatus = "C";
    if (confirmModal.type === "COMPLETE") targetStatus = "D";
    if (confirmModal.type === "CANCEL") targetStatus = "X";

    await updateStatusMutation.mutateAsync({
      bookingId: confirmModal.booking.booking_id,
      status: targetStatus,
    });

    setConfirmModal({ open: false, type: "CONFIRM", booking: null });
    if (selectedBooking?.booking_id === confirmModal.booking.booking_id) {
      setSelectedBooking((prev) => (prev ? { ...prev, status: targetStatus } : null));
    }
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setDateFilter("all");
    setSortBy("date_desc");
    setPage(1);
  };

  const hasActiveFilters = searchTerm !== "" || statusFilter !== "ALL" || dateFilter !== "all";

  const counts = bookingsQuery.data?.counts || {
    all: 0,
    p: 0,
    c: 0,
    d: 0,
    x: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header & Overview Title */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Quản lý Lịch hẹn
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Theo dõi, lọc và xử lý các yêu cầu đặt lịch làm tóc từ khách hàng tại{" "}
            <span className="font-semibold text-foreground">
              {salon?.salonname || "Salon của bạn"}
            </span>
          </p>
        </div>
      </div>

      {/* KPI Stats Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${
            statusFilter === "ALL" ? "border-primary ring-1 ring-primary" : ""
          }`}
          onClick={() => {
            setStatusFilter("ALL");
            setPage(1);
          }}
        >
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Tổng lịch</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{counts.all}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarDays className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${
            statusFilter === "P" ? "border-amber-500 ring-1 ring-amber-500" : ""
          }`}
          onClick={() => {
            setStatusFilter("P");
            setPage(1);
          }}
        >
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Chờ xác nhận</p>
              <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
                {counts.p}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${
            statusFilter === "C" ? "border-sky-500 ring-1 ring-sky-500" : ""
          }`}
          onClick={() => {
            setStatusFilter("C");
            setPage(1);
          }}
        >
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Đã xác nhận</p>
              <p className="mt-1 text-2xl font-bold text-sky-600 dark:text-sky-400">{counts.c}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <CalendarCheck2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${
            statusFilter === "D" ? "border-emerald-500 ring-1 ring-emerald-500" : ""
          }`}
          onClick={() => {
            setStatusFilter("D");
            setPage(1);
          }}
        >
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Đã hoàn thành</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {counts.d}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${
            statusFilter === "X" ? "border-rose-500 ring-1 ring-rose-500" : ""
          }`}
          onClick={() => {
            setStatusFilter("X");
            setPage(1);
          }}
        >
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Đã hủy</p>
              <p className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">{counts.x}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <XCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="rounded-2xl border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4">
          {/* Status Tabs Pills */}
          <div className="overflow-x-auto pb-1">
            <Tabs
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as BookingStatus | "ALL");
                setPage(1);
              }}
              className="w-full"
            >
              <TabsList className="h-10 w-full justify-start rounded-xl bg-muted/60 p-1 sm:w-auto">
                <TabsTrigger value="ALL" className="rounded-lg text-xs font-medium">
                  Tất cả ({counts.all})
                </TabsTrigger>
                <TabsTrigger value="P" className="rounded-lg text-xs font-medium">
                  Chờ xác nhận ({counts.p})
                </TabsTrigger>
                <TabsTrigger value="C" className="rounded-lg text-xs font-medium">
                  Đã xác nhận ({counts.c})
                </TabsTrigger>
                <TabsTrigger value="D" className="rounded-lg text-xs font-medium">
                  Đã hoàn thành ({counts.d})
                </TabsTrigger>
                <TabsTrigger value="X" className="rounded-lg text-xs font-medium">
                  Đã hủy ({counts.x})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Search, Date Filter & Sorting Controls */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
            {/* Search Input */}
            <div className="relative lg:col-span-5">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên khách, SĐT hoặc ghi chú..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="rounded-xl pl-9"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Date Quick Filter */}
            <div className="lg:col-span-3">
              <Select
                value={dateFilter}
                onValueChange={(v: "all" | "today" | "tomorrow" | "this_week") => {
                  setDateFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="rounded-xl">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Lọc theo ngày" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Tất cả ngày</SelectItem>
                  <SelectItem value="today">Hôm nay</SelectItem>
                  <SelectItem value="tomorrow">Ngày mai</SelectItem>
                  <SelectItem value="this_week">Trong tuần này</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Select */}
            <div className="lg:col-span-3">
              <Select
                value={sortBy}
                onValueChange={(v: "date_desc" | "date_asc") => {
                  setSortBy(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="rounded-xl">
                  <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="date_desc">Mới nhất (Ngày giảm dần)</SelectItem>
                  <SelectItem value="date_asc">Cũ nhất (Ngày tăng dần)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reset Filter Button */}
            {hasActiveFilters && (
              <div className="lg:col-span-1">
                <Button
                  variant="outline"
                  onClick={handleResetFilters}
                  className="w-full rounded-xl"
                  title="Đặt lại bộ lọc"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Main List Section */}
      {bookingsQuery.isLoading ? (
        <TableSkeleton />
      ) : bookingsQuery.isError ? (
        <ErrorState
          title="Không thể tải lịch hẹn"
          description={
            bookingsQuery.error?.message ||
            "Đã có lỗi xảy ra khi kết nối máy chủ. Vui lòng thử lại."
          }
          onRetry={() => bookingsQuery.refetch()}
        />
      ) : !bookingsQuery.data || bookingsQuery.data.data.length === 0 ? (
        <EmptyState
          title="Chưa có lịch hẹn nào"
          description={
            hasActiveFilters
              ? "Không tìm thấy lịch hẹn nào khớp với bộ lọc hiện tại. Thử xóa hoặc thay đổi điều kiện tìm kiếm."
              : "Hiện chưa có lịch đặt nào từ khách hàng. Các lịch đặt mới sẽ xuất hiện tại đây."
          }
          icon={<CalendarDays className="h-6 w-6 text-primary" />}
          action={
            hasActiveFilters ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="mt-2 rounded-xl"
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Xóa bộ lọc
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden rounded-2xl border border-border bg-card shadow-sm md:block overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-[200px] font-semibold">Khách hàng</TableHead>
                  <TableHead className="w-[100px] font-semibold">Giới tính</TableHead>
                  <TableHead className="w-[140px] font-semibold">Số điện thoại</TableHead>
                  <TableHead className="w-[120px] font-semibold">Ngày hẹn</TableHead>
                  <TableHead className="w-[100px] font-semibold">Khung giờ</TableHead>
                  <TableHead className="font-semibold">Yêu cầu / Ghi chú</TableHead>
                  <TableHead className="w-[140px] font-semibold">Trạng thái</TableHead>
                  <TableHead className="w-[180px] text-right font-semibold">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookingsQuery.data.data.map((booking) => {
                  const customer = booking.customer;
                  return (
                    <TableRow
                      key={booking.booking_id}
                      className="cursor-pointer transition-colors hover:bg-muted/30"
                      onClick={() => handleOpenDetail(booking)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8 border border-border">
                            <AvatarImage src={customer?.avatar_url} />
                            <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                              {customer?.fullname?.charAt(0) ||
                                customer?.username?.charAt(0) ||
                                "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-foreground">
                              {customer?.fullname ||
                                customer?.username ||
                                `Khách hàng #${booking.user_id}`}
                            </p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              @{customer?.username}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="text-[11px] font-normal">
                          {customer?.gender === "female" ? "Nữ" : "Nam"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-xs text-foreground font-mono">
                        {customer?.phone || "—"}
                      </TableCell>

                      <TableCell className="text-xs font-medium text-foreground">
                        {formatDateDisplay(booking.booking_date)}
                      </TableCell>

                      <TableCell>
                        <Badge variant="secondary" className="gap-1 font-mono text-xs">
                          <Clock className="h-3 w-3" />
                          {booking.booking_time || "09:00"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <p
                          className="line-clamp-1 max-w-xs text-xs text-muted-foreground"
                          title={booking.notes}
                        >
                          {booking.notes || "Không có ghi chú"}
                        </p>
                      </TableCell>

                      <TableCell>
                        <BookingStatusBadge status={booking.status} />
                      </TableCell>

                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {booking.status === "P" && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                className="h-7 rounded-lg bg-sky-600 px-2.5 text-xs text-white hover:bg-sky-700"
                                onClick={() => handleOpenActionConfirm(booking, "CONFIRM")}
                                title="Xác nhận lịch hẹn"
                              >
                                <Check className="mr-1 h-3.5 w-3.5" /> Xác nhận
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 rounded-lg px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => handleOpenActionConfirm(booking, "CANCEL")}
                                title="Hủy lịch hẹn"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}

                          {booking.status === "C" && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                className="h-7 rounded-lg bg-emerald-600 px-2.5 text-xs text-white hover:bg-emerald-700"
                                onClick={() => handleOpenActionConfirm(booking, "COMPLETE")}
                                title="Đánh dấu hoàn thành"
                              >
                                <CheckCheck className="mr-1 h-3.5 w-3.5" /> Hoàn thành
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 rounded-lg px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => handleOpenActionConfirm(booking, "CANCEL")}
                                title="Hủy lịch hẹn"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 rounded-lg p-0 text-muted-foreground hover:bg-muted"
                            onClick={() => handleOpenDetail(booking)}
                            title="Xem chi tiết"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card List View */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {bookingsQuery.data.data.map((booking) => {
              const customer = booking.customer;
              return (
                <motion.div
                  key={booking.booking_id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card
                    className="cursor-pointer rounded-2xl border-border bg-card p-4 transition-all hover:border-primary/50"
                    onClick={() => handleOpenDetail(booking)}
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-10 w-10 border border-border">
                          <AvatarImage src={customer?.avatar_url} />
                          <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                            {customer?.fullname?.charAt(0) || customer?.username?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {customer?.fullname ||
                              customer?.username ||
                              `Khách hàng #${booking.user_id}`}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {customer?.phone || `@${customer?.username}`}
                          </p>
                        </div>
                      </div>
                      <BookingStatusBadge status={booking.status} />
                    </div>

                    {/* Card Body */}
                    <div className="space-y-2 py-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5 text-primary" /> Ngày hẹn:
                        </span>
                        <span className="font-semibold text-foreground">
                          {formatDateDisplay(booking.booking_date)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5 text-primary" /> Giờ hẹn:
                        </span>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {booking.booking_time || "09:00"}
                        </Badge>
                      </div>

                      {booking.notes && (
                        <div className="mt-1 rounded-xl bg-muted/40 p-2.5 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">Ghi chú: </span>
                          {booking.notes}
                        </div>
                      )}
                    </div>

                    {/* Card Actions Footer */}
                    <div
                      className="flex items-center justify-end gap-2 border-t border-border/60 pt-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {booking.status === "P" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-xl text-xs text-destructive hover:bg-destructive/10"
                            onClick={() => handleOpenActionConfirm(booking, "CANCEL")}
                          >
                            Hủy
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 rounded-xl bg-sky-600 text-xs text-white hover:bg-sky-700"
                            onClick={() => handleOpenActionConfirm(booking, "CONFIRM")}
                          >
                            <Check className="mr-1 h-3.5 w-3.5" /> Xác nhận
                          </Button>
                        </>
                      )}

                      {booking.status === "C" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-xl text-xs text-destructive hover:bg-destructive/10"
                            onClick={() => handleOpenActionConfirm(booking, "CANCEL")}
                          >
                            Hủy
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 rounded-xl bg-emerald-600 text-xs text-white hover:bg-emerald-700"
                            onClick={() => handleOpenActionConfirm(booking, "COMPLETE")}
                          >
                            <CheckCheck className="mr-1 h-3.5 w-3.5" /> Hoàn thành
                          </Button>
                        </>
                      )}

                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 rounded-xl text-xs"
                        onClick={() => handleOpenDetail(booking)}
                      >
                        Chi tiết
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {bookingsQuery.data.totalPages > 1 && (
            <div className="flex flex-col items-center justify-between gap-3 pt-2 sm:flex-row">
              <p className="text-xs text-muted-foreground">
                Hiển thị trang{" "}
                <span className="font-semibold text-foreground">{bookingsQuery.data.page}</span> /{" "}
                <span className="font-semibold text-foreground">
                  {bookingsQuery.data.totalPages}
                </span>{" "}
                (Tổng cộng {bookingsQuery.data.total} lịch hẹn)
              </p>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-xl"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Trước
                </Button>
                {Array.from({ length: bookingsQuery.data.totalPages }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    variant={p === page ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 rounded-xl p-0 text-xs"
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-xl"
                  onClick={() => setPage((p) => Math.min(bookingsQuery.data.totalPages, p + 1))}
                  disabled={page >= bookingsQuery.data.totalPages}
                >
                  Sau <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Booking Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg rounded-3xl p-6 sm:rounded-3xl">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <DialogTitle className="text-lg font-bold">Chi tiết Lịch hẹn</DialogTitle>
              {selectedBooking && <BookingStatusBadge status={selectedBooking.status} />}
            </div>
            <DialogDescription className="text-xs">
              Mã lịch hẹn: #{selectedBooking?.booking_id}
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4 py-2">
              {/* Customer Box */}
              <div className="rounded-2xl border border-border bg-muted/30 p-3.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Thông tin khách hàng
                </p>
                <div className="mt-2.5 flex items-center gap-3">
                  <Avatar className="h-11 w-11 border border-border">
                    <AvatarImage src={selectedBooking.customer?.avatar_url} />
                    <AvatarFallback className="bg-primary/20 text-sm font-bold text-primary">
                      {selectedBooking.customer?.fullname?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 text-xs space-y-0.5">
                    <p className="font-semibold text-foreground text-sm">
                      {selectedBooking.customer?.fullname || selectedBooking.customer?.username}
                    </p>
                    <p className="text-muted-foreground">
                      @{selectedBooking.customer?.username} • Giới tính:{" "}
                      {selectedBooking.customer?.gender === "female" ? "Nữ" : "Nam"}
                    </p>
                    <p className="font-mono text-primary flex items-center gap-1">
                      <Phone className="h-3 w-3" />{" "}
                      {selectedBooking.customer?.phone || "Chưa có SĐT"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Schedule Info Box */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border bg-card p-3">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-primary" /> Ngày hẹn
                  </span>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {formatDateDisplay(selectedBooking.booking_date)}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-3">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-primary" /> Khung giờ
                  </span>
                  <p className="mt-1 text-sm font-semibold text-foreground font-mono">
                    {selectedBooking.booking_time || "09:00"}
                  </p>
                </div>
              </div>

              {/* Notes Box */}
              <div className="rounded-2xl border border-border bg-card p-3.5">
                <p className="text-[11px] font-semibold text-muted-foreground">
                  Ghi chú & Yêu cầu của khách hàng
                </p>
                <p className="mt-1 text-xs text-foreground whitespace-pre-wrap">
                  {selectedBooking.notes || "Khách hàng không để lại ghi chú bổ sung."}
                </p>
              </div>

              {/* Business Constraint Notice */}
              <div className="rounded-xl bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
                ℹ️ Chủ Salon chỉ có quyền thay đổi trạng thái xác nhận / hoàn tất / hủy lịch. Không
                được sửa thông tin khách hoặc ngày giờ đặt.
              </div>
            </div>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            {selectedBooking?.status === "P" && (
              <>
                <Button
                  variant="outline"
                  className="rounded-xl text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setDetailOpen(false);
                    handleOpenActionConfirm(selectedBooking, "CANCEL");
                  }}
                >
                  Hủy lịch hẹn
                </Button>
                <Button
                  className="rounded-xl bg-sky-600 text-white hover:bg-sky-700"
                  onClick={() => {
                    setDetailOpen(false);
                    handleOpenActionConfirm(selectedBooking, "CONFIRM");
                  }}
                >
                  <Check className="mr-1.5 h-4 w-4" /> Xác nhận lịch
                </Button>
              </>
            )}

            {selectedBooking?.status === "C" && (
              <>
                <Button
                  variant="outline"
                  className="rounded-xl text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setDetailOpen(false);
                    handleOpenActionConfirm(selectedBooking, "CANCEL");
                  }}
                >
                  Hủy lịch hẹn
                </Button>
                <Button
                  className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => {
                    setDetailOpen(false);
                    handleOpenActionConfirm(selectedBooking, "COMPLETE");
                  }}
                >
                  <CheckCheck className="mr-1.5 h-4 w-4" /> Hoàn thành dịch vụ
                </Button>
              </>
            )}

            <Button variant="secondary" className="rounded-xl" onClick={() => setDetailOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Alert Dialog */}
      <AlertDialog
        open={confirmModal.open}
        onOpenChange={(open) => setConfirmModal((prev) => ({ ...prev, open }))}
      >
        <AlertDialogContent className="rounded-3xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">
              {confirmModal.type === "CONFIRM" && "Xác nhận lịch hẹn?"}
              {confirmModal.type === "COMPLETE" && "Hoàn thành lịch hẹn?"}
              {confirmModal.type === "CANCEL" && "Xác nhận hủy lịch hẹn?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              {confirmModal.type === "CONFIRM" && (
                <>
                  Bạn có chắc muốn xác nhận lịch hẹn của khách hàng{" "}
                  <span className="font-semibold text-foreground">
                    {confirmModal.booking?.customer?.fullname ||
                      confirmModal.booking?.customer?.username}
                  </span>{" "}
                  vào lúc{" "}
                  <span className="font-semibold text-foreground">
                    {confirmModal.booking?.booking_time || "09:00"}
                  </span>{" "}
                  ngày{" "}
                  <span className="font-semibold text-foreground">
                    {formatDateDisplay(confirmModal.booking?.booking_date || "")}
                  </span>
                  ?
                </>
              )}
              {confirmModal.type === "COMPLETE" && (
                <>
                  Đánh dấu lịch hẹn của khách hàng{" "}
                  <span className="font-semibold text-foreground">
                    {confirmModal.booking?.customer?.fullname ||
                      confirmModal.booking?.customer?.username}
                  </span>{" "}
                  là đã hoàn thành dịch vụ?
                </>
              )}
              {confirmModal.type === "CANCEL" && (
                <>
                  Bạn có chắc muốn hủy lịch hẹn này? Thao tác này sẽ chuyển lịch sang trạng thái{" "}
                  <span className="font-semibold text-destructive">Đã hủy</span> và không thể hoàn
                  tác.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction
              className={`rounded-xl ${
                confirmModal.type === "CANCEL"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : confirmModal.type === "COMPLETE"
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-sky-600 text-white hover:bg-sky-700"
              }`}
              onClick={handleExecuteAction}
              disabled={updateStatusMutation.isPending}
            >
              {confirmModal.type === "CONFIRM" && "Xác nhận lịch"}
              {confirmModal.type === "COMPLETE" && "Hoàn thành"}
              {confirmModal.type === "CANCEL" && "Đồng ý hủy"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 py-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
