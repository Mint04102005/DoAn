import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminLogService } from "@/services/admin-log.service";
import { adminService } from "@/services/admin.service";
import { useAuthStore } from "@/stores/auth.store";
import type { ApprovalFilters, LogFilters, UserFilters } from "@/types";

export const adminQueryKeys = {
  approvals: (filters?: ApprovalFilters) => ["admin", "approvals", filters] as const,
  approvalDetail: (id?: number) => ["admin", "approval", id] as const,
  users: (filters?: UserFilters) => ["admin", "users", filters] as const,
  userDetail: (id?: number) => ["admin", "user", id] as const,
  logs: (filters?: LogFilters) => ["admin", "logs", filters] as const,
  summary: () => ["admin", "summary"] as const,
};

/**
 * Hook to query pending salon approvals
 */
export function usePendingApprovals(filters?: ApprovalFilters) {
  return useQuery({
    queryKey: adminQueryKeys.approvals(filters),
    queryFn: () => adminService.getPendingApprovals(filters),
  });
}

/**
 * Hook to query single approval detail
 */
export function useApprovalDetail(approvalId?: number) {
  return useQuery({
    queryKey: adminQueryKeys.approvalDetail(approvalId),
    queryFn: () => (approvalId ? adminService.getApprovalById(approvalId) : null),
    enabled: !!approvalId,
  });
}

/**
 * Hook to approve salon
 */
export function useApproveSalon() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (approvalId: number) => {
      const adminId = currentUser?.user_id || 100;
      return adminService.approveSalon(approvalId, adminId);
    },
    onSuccess: (data) => {
      toast.success(
        `Đã phê duyệt Salon đối tác #${data.owner_id} (${data.salon?.salonname || "Salon"}) thành công!`,
      );
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["admin", "approvals"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "summary"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "logs"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Không thể thực hiện thao tác");
    },
  });
}

/**
 * Hook to reject salon
 */
export function useRejectSalon() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (approvalId: number) => {
      const adminId = currentUser?.user_id || 100;
      return adminService.rejectSalon(approvalId, adminId);
    },
    onSuccess: (data) => {
      toast.success(
        `Đã từ chối yêu cầu xác minh Salon #${data.owner_id} (${data.salon?.salonname || "Salon"})`,
      );
      queryClient.invalidateQueries({ queryKey: ["admin", "approvals"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "summary"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "logs"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Không thể thực hiện thao tác");
    },
  });
}

/**
 * Hook to query system users
 */
export function useUsers(filters?: UserFilters) {
  return useQuery({
    queryKey: adminQueryKeys.users(filters),
    queryFn: () => adminService.getUsers(filters),
  });
}

/**
 * Hook to query single user detail
 */
export function useUserDetail(userId?: number) {
  return useQuery({
    queryKey: adminQueryKeys.userDetail(userId),
    queryFn: () => (userId ? adminService.getUserById(userId) : null),
    enabled: !!userId,
  });
}

/**
 * Hook to lock user account
 */
export function useLockUser() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (userId: number) => {
      const adminId = currentUser?.user_id || 100;
      return adminService.lockUser(userId, adminId);
    },
    onSuccess: (user) => {
      toast.success(`Đã khóa tài khoản @${user.username}`);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "summary"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "logs"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Không thể thực hiện thao tác");
    },
  });
}

/**
 * Hook to unlock user account
 */
export function useUnlockUser() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (userId: number) => {
      const adminId = currentUser?.user_id || 100;
      return adminService.unlockUser(userId, adminId);
    },
    onSuccess: (user) => {
      toast.success(`Đã mở khóa tài khoản @${user.username}`);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "summary"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "logs"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Không thể thực hiện thao tác");
    },
  });
}

/**
 * Hook to query audit logs
 */
export function useAdminLogs(filters?: LogFilters) {
  return useQuery({
    queryKey: adminQueryKeys.logs(filters),
    queryFn: () => adminLogService.getLogs(filters),
  });
}

/**
 * Hook to query dashboard summary
 */
export function useAdminSummary() {
  return useQuery({
    queryKey: adminQueryKeys.summary(),
    queryFn: () => adminService.getDashboardSummary(),
  });
}
