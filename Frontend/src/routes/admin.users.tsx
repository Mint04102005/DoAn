import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle,
  Eye,
  FileCheck,
  Filter,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  Store,
  Unlock,
  User as UserIcon,
  Users as UsersIcon,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useLockUser, useUnlockUser, useUsers } from "@/hooks/use-admin";
import { useAuthStore } from "@/stores/auth.store";
import type { EnrichedUser, RoleId } from "@/types";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [{ title: "Quản lý Người dùng — AI Hairstyle Admin Dashboard" }],
  }),
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const currentUser = useAuthStore((s) => s.user);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleId | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<"active" | "locked" | "ALL">("ALL");

  const [selectedUser, setSelectedUser] = useState<EnrichedUser | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmLockOpen, setConfirmLockOpen] = useState(false);
  const [confirmUnlockOpen, setConfirmUnlockOpen] = useState(false);

  // Queries & Mutations
  const usersQuery = useUsers({
    search: search.trim() || undefined,
    role_id: roleFilter,
    status: statusFilter,
  });
  const lockMutation = useLockUser();
  const unlockMutation = useUnlockUser();

  const handleOpenDetail = (user: EnrichedUser) => {
    setSelectedUser(user);
    setDetailOpen(true);
  };

  const handleLockConfirm = async () => {
    if (!selectedUser) return;
    try {
      await lockMutation.mutateAsync(selectedUser.user_id);
      setConfirmLockOpen(false);
      setDetailOpen(false);
    } catch {
      // Toast handled by mutation
    }
  };

  const handleUnlockConfirm = async () => {
    if (!selectedUser) return;
    try {
      await unlockMutation.mutateAsync(selectedUser.user_id);
      setConfirmUnlockOpen(false);
      setDetailOpen(false);
    } catch {
      // Toast handled by mutation
    }
  };

  const handleQuickToggleLock = (user: EnrichedUser, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedUser(user);
    if (user.is_locked) {
      setConfirmUnlockOpen(true);
    } else {
      setConfirmLockOpen(true);
    }
  };

  return (
    <div className="space-y-6 pb-12 text-foreground">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Quản lý Tài khoản Người dùng
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Giám sát, phân quyền và kiểm soát trạng thái hoạt động của mọi tài khoản trong hệ thống.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => usersQuery.refetch()}
            disabled={usersQuery.isRefetching}
            className="border-border bg-card hover:bg-muted"
          >
            <RefreshCw
              className={`mr-2 h-3.5 w-3.5 ${usersQuery.isRefetching ? "animate-spin" : ""}`}
            />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:grid-cols-12">
        {/* Search input */}
        <div className="relative sm:col-span-6">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo ID, Username, Tên, Email, SĐT, Salon..."
            className="bg-background pl-10 text-sm focus-visible:border-primary"
          />
        </div>

        {/* Role Filter */}
        <div className="sm:col-span-3">
          <Select
            value={String(roleFilter)}
            onValueChange={(val) => setRoleFilter(val === "ALL" ? "ALL" : (Number(val) as RoleId))}
          >
            <SelectTrigger className="bg-background border-input">
              <SelectValue placeholder="Chọn vai trò" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả vai trò</SelectItem>
              <SelectItem value="1">Quản trị viên (Admin)</SelectItem>
              <SelectItem value="2">Khách hàng (User)</SelectItem>
              <SelectItem value="3">Chủ Salon (Salon Owner)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="sm:col-span-3">
          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val as "active" | "locked" | "ALL")}
          >
            <SelectTrigger className="bg-background border-input">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
              <SelectItem value="active">Đang hoạt động</SelectItem>
              <SelectItem value="locked">Đã khóa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content Area: Data Table & Mobile Cards */}
      {usersQuery.isLoading ? (
        <div className="space-y-3 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-24" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : usersQuery.isError ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 py-12 px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Không thể tải dữ liệu người dùng
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {usersQuery.error instanceof Error ? usersQuery.error.message : "Vui lòng thử lại."}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => usersQuery.refetch()}>
            Thử lại
          </Button>
        </div>
      ) : usersQuery.data?.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 py-16 px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <UsersIcon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Không tìm thấy tài khoản</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {search
                ? `Không tìm thấy tài khoản người dùng phù hợp với "${search}".`
                : "Không có tài khoản nào theo bộ lọc đã chọn."}
            </p>
          </div>
          {(search || roleFilter !== "ALL" || statusFilter !== "ALL") && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSearch("");
                setRoleFilter("ALL");
                setStatusFilter("ALL");
              }}
            >
              Đặt lại bộ lọc
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {/* Desktop Table */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-sm text-foreground">
              <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3.5">User ID</th>
                  <th className="px-4 py-3.5">Tài khoản & Họ tên</th>
                  <th className="px-4 py-3.5">Email</th>
                  <th className="px-4 py-3.5">Số điện thoại</th>
                  <th className="px-4 py-3.5">Vai trò</th>
                  <th className="px-4 py-3.5">Ngày tham gia</th>
                  <th className="px-4 py-3.5 text-center">Trạng thái</th>
                  <th className="px-4 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {usersQuery.data?.map((user) => {
                  const isCurrentAdmin = currentUser?.user_id === user.user_id;

                  return (
                    <tr
                      key={user.user_id}
                      onClick={() => handleOpenDetail(user)}
                      className="group cursor-pointer transition-colors hover:bg-muted/40"
                    >
                      {/* User ID */}
                      <td className="px-4 py-4 font-mono font-semibold text-primary">
                        #{String(user.user_id).padStart(3, "0")}
                      </td>

                      {/* Username & Avatar */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-border">
                            <AvatarImage src={user.avatar_url} alt={user.username} />
                            <AvatarFallback className="bg-primary/20 text-xs font-semibold text-primary">
                              {user.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="flex items-center gap-1.5 truncate font-semibold text-foreground">
                              {user.fullname || user.username}
                              {isCurrentAdmin && (
                                <span className="rounded bg-primary/15 px-1.5 py-0.2 text-[10px] font-semibold text-primary">
                                  (Bạn)
                                </span>
                              )}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              @{user.username}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-4 font-mono text-xs text-muted-foreground">
                        {user.email}
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-4 font-mono text-xs text-muted-foreground">
                        {user.phone}
                      </td>

                      {/* Role Badge */}
                      <td className="px-4 py-4">
                        {user.role_id === 1 ? (
                          <Badge
                            variant="outline"
                            className="border-primary/40 bg-primary/10 text-primary font-semibold"
                          >
                            <Shield className="mr-1 h-3 w-3" /> Admin
                          </Badge>
                        ) : user.role_id === 3 ? (
                          <Badge
                            variant="outline"
                            className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium"
                          >
                            <Store className="mr-1 h-3 w-3" /> Chủ Salon
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-400 font-medium"
                          >
                            <UserIcon className="mr-1 h-3 w-3" /> Khách hàng
                          </Badge>
                        )}
                      </td>

                      {/* Created At */}
                      <td className="px-4 py-4 text-xs text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString("vi-VN")}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 text-center">
                        {user.is_locked ? (
                          <Badge
                            variant="outline"
                            className="border-rose-500/40 bg-rose-500/15 text-rose-700 dark:text-rose-400 font-medium"
                          >
                            <Lock className="mr-1 h-3 w-3" /> Đã khóa
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-medium"
                          >
                            <CheckCircle className="mr-1 h-3 w-3" /> Hoạt động
                          </Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => handleOpenDetail(user)}
                          >
                            <Eye className="mr-1 h-3.5 w-3.5" /> Xem
                          </Button>

                          {/* Lock / Unlock Toggle Button */}
                          {user.is_locked ? (
                            <Button
                              size="sm"
                              className="h-8 border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20"
                              onClick={(e) => handleQuickToggleLock(user, e)}
                              disabled={unlockMutation.isPending}
                            >
                              <Unlock className="mr-1 h-3.5 w-3.5" /> Mở khóa
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className={`h-8 text-xs text-muted-foreground hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-600 ${
                                isCurrentAdmin ? "cursor-not-allowed opacity-50" : ""
                              }`}
                              onClick={(e) => {
                                if (isCurrentAdmin) return;
                                handleQuickToggleLock(user, e);
                              }}
                              disabled={isCurrentAdmin || lockMutation.isPending}
                              title={
                                isCurrentAdmin
                                  ? "Không thể khóa tài khoản Admin đang đăng nhập"
                                  : "Khóa tài khoản"
                              }
                            >
                              <Lock className="mr-1 h-3.5 w-3.5" /> Khóa
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile & Tablet Card View (Screen < 1024px) */}
          <div className="divide-y divide-border lg:hidden">
            {usersQuery.data?.map((user) => {
              const isCurrentAdmin = currentUser?.user_id === user.user_id;

              return (
                <div
                  key={user.user_id}
                  onClick={() => handleOpenDetail(user)}
                  className="p-4 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-border">
                        <AvatarImage src={user.avatar_url} alt={user.username} />
                        <AvatarFallback className="bg-primary/20 text-xs font-semibold text-primary">
                          {user.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">
                            {user.fullname || user.username}
                          </p>
                          <span className="font-mono text-xs font-semibold text-primary">
                            #{String(user.user_id).padStart(3, "0")}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {user.role_id === 1 ? (
                        <Badge
                          variant="outline"
                          className="border-primary/40 bg-primary/10 text-primary text-[10px]"
                        >
                          Admin
                        </Badge>
                      ) : user.role_id === 3 ? (
                        <Badge
                          variant="outline"
                          className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px]"
                        >
                          Chủ Salon
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-400 text-[10px]"
                        >
                          Khách hàng
                        </Badge>
                      )}

                      {user.is_locked ? (
                        <span className="text-[10px] text-rose-600 font-medium">Đã khóa</span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-medium">Hoạt động</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="truncate font-mono">{user.email}</div>
                    <div className="truncate text-right font-mono">{user.phone}</div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                    <span className="text-[11px] text-muted-foreground">
                      Tham gia: {new Date(user.created_at).toLocaleDateString("vi-VN")}
                    </span>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleOpenDetail(user)}
                      >
                        <Eye className="mr-1 h-3 w-3" /> Xem
                      </Button>

                      {user.is_locked ? (
                        <Button
                          size="sm"
                          className="h-7 border border-emerald-500/30 bg-emerald-500/10 px-2 text-xs text-emerald-700 dark:text-emerald-400"
                          onClick={(e) => handleQuickToggleLock(user, e)}
                        >
                          Mở khóa
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          disabled={isCurrentAdmin}
                          onClick={(e) => {
                            if (isCurrentAdmin) return;
                            handleQuickToggleLock(user, e);
                          }}
                        >
                          Khóa
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* User Detail Dialog Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-xl sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <UserIcon className="h-5 w-5 text-primary" />
              Hồ sơ Người dùng #{String(selectedUser?.user_id).padStart(3, "0")}
            </DialogTitle>
            <DialogDescription>
              Chi tiết thông tin cá nhân, định danh tài khoản và phân quyền hệ thống.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-5">
              {/* Profile Card Summary */}
              <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/30 p-4">
                <Avatar className="h-16 w-16 border-2 border-primary/40">
                  <AvatarImage src={selectedUser.avatar_url} alt={selectedUser.username} />
                  <AvatarFallback className="bg-primary/20 text-lg font-bold text-primary">
                    {selectedUser.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-foreground">
                      {selectedUser.fullname || selectedUser.username}
                    </h3>
                    {selectedUser.is_locked ? (
                      <Badge
                        variant="outline"
                        className="border-rose-500/40 bg-rose-500/15 text-rose-700 dark:text-rose-400 text-xs"
                      >
                        Đã khóa
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-xs"
                      >
                        Hoạt động
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">@{selectedUser.username}</p>
                  <p className="mt-1 text-xs text-primary font-semibold">
                    {selectedUser.role_id === 1
                      ? "Quản trị viên Hệ thống (Admin)"
                      : selectedUser.role_id === 3
                        ? "Chủ cơ sở Salon đối tác"
                        : "Khách hàng người dùng"}
                  </p>
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-xs">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Địa chỉ Email</p>
                    <p className="font-mono font-medium text-foreground">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-xs">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Số điện thoại</p>
                    <p className="font-mono font-medium text-foreground">{selectedUser.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-xs">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Ngày sinh & Giới tính</p>
                    <p className="text-foreground font-medium">
                      {selectedUser.dob || "Chưa cập nhật"} (
                      {selectedUser.gender === "female" || selectedUser.gender === "Nữ"
                        ? "Nữ"
                        : selectedUser.gender === "male" || selectedUser.gender === "Nam"
                          ? "Nam"
                          : "Chưa cập nhật"}
                      )
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-xs">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-muted-foreground">Địa chỉ</p>
                    <p className="truncate text-foreground font-medium">
                      {selectedUser.address || "Chưa cập nhật"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Extra Salon Information if role === 3 */}
              {selectedUser.role_id === 3 && (
                <div className="rounded-xl border border-border bg-muted/30 p-4 text-xs">
                  <h4 className="flex items-center gap-2 font-bold uppercase tracking-wider text-primary">
                    <Store className="h-4 w-4" /> Thông tin Salon quản lý
                  </h4>
                  <div className="mt-3 space-y-2">
                    <p className="flex justify-between">
                      <span className="text-muted-foreground">Tên Salon:</span>
                      <span className="font-semibold text-foreground">
                        {selectedUser.salon?.salonname || "Chưa thiết lập"}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-muted-foreground">Mã giấy phép kinh doanh:</span>
                      <span className="font-mono font-medium text-foreground">
                        {selectedUser.owner?.license_no || "Chưa cung cấp"}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-muted-foreground">Trạng thái xác minh:</span>
                      <span
                        className={
                          selectedUser.owner?.is_verified
                            ? "text-emerald-600 font-medium"
                            : "text-amber-600 font-medium"
                        }
                      >
                        {selectedUser.owner?.is_verified
                          ? "Đã xác minh đối tác"
                          : "Đang chờ phê duyệt"}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 border-t border-border pt-4 sm:justify-between">
            <Button variant="outline" onClick={() => setDetailOpen(false)}>
              Đóng
            </Button>

            {selectedUser && (
              <div>
                {selectedUser.user_id === currentUser?.user_id ? (
                  <span className="text-xs text-muted-foreground italic">
                    Tài khoản của bạn (Không thể tự khóa)
                  </span>
                ) : selectedUser.is_locked ? (
                  <Button
                    className="border border-emerald-500/30 bg-emerald-600 text-white hover:bg-emerald-500"
                    onClick={() => setConfirmUnlockOpen(true)}
                  >
                    <Unlock className="mr-1.5 h-4 w-4" /> Mở khóa tài khoản
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    className="bg-rose-600 hover:bg-rose-500"
                    onClick={() => setConfirmLockOpen(true)}
                  >
                    <Lock className="mr-1.5 h-4 w-4" /> Khóa tài khoản
                  </Button>
                )}
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog: Lock User */}
      <Dialog open={confirmLockOpen} onOpenChange={setConfirmLockOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-600">
              <Lock className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-lg font-bold">
              Khóa tài khoản người dùng?
            </DialogTitle>
            <DialogDescription className="text-center">
              Bạn có chắc muốn khóa tài khoản{" "}
              <strong className="text-foreground">
                @{selectedUser?.username} ({selectedUser?.fullname || "User"})
              </strong>
              ? Người dùng này sẽ ngay lập tức bị vô hiệu hóa quyền đăng nhập vào hệ thống.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:justify-center">
            <Button variant="outline" onClick={() => setConfirmLockOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              className="bg-rose-600 hover:bg-rose-500"
              onClick={handleLockConfirm}
              disabled={lockMutation.isPending}
            >
              {lockMutation.isPending ? "Đang xử lý..." : "Xác nhận Khóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog: Unlock User */}
      <Dialog open={confirmUnlockOpen} onOpenChange={setConfirmUnlockOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <Unlock className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-lg font-bold">Mở khóa tài khoản?</DialogTitle>
            <DialogDescription className="text-center">
              Bạn có chắc muốn mở khóa tài khoản{" "}
              <strong className="text-foreground">
                @{selectedUser?.username} ({selectedUser?.fullname || "User"})
              </strong>
              ? Người dùng sẽ có thể đăng nhập và sử dụng dịch vụ bình thường.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:justify-center">
            <Button variant="outline" onClick={() => setConfirmUnlockOpen(false)}>
              Hủy
            </Button>
            <Button
              className="bg-emerald-600 text-white hover:bg-emerald-500"
              onClick={handleUnlockConfirm}
              disabled={unlockMutation.isPending}
            >
              {unlockMutation.isPending ? "Đang xử lý..." : "Xác nhận Mở khóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
