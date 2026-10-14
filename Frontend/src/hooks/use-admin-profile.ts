import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminProfileService } from "@/services/admin-profile.service";
import { useAuthStore } from "@/stores/auth.store";
import type { ChangeAdminPasswordInput, UpdateAdminProfileInput } from "@/types";

export const adminProfileQueryKeys = {
  profile: (adminId?: number) => ["admin", "profile", adminId] as const,
};

/**
 * Hook to query admin profile details
 */
export function useAdminProfile(adminId?: number) {
  const authUser = useAuthStore((s) => s.user);
  const targetId = adminId ?? authUser?.user_id;

  return useQuery({
    queryKey: adminProfileQueryKeys.profile(targetId),
    queryFn: () => (targetId ? adminProfileService.getAdminProfile(targetId) : null),
    enabled: !!targetId,
  });
}

/**
 * Hook to update admin profile
 */
export function useUpdateAdminProfile() {
  const queryClient = useQueryClient();
  const { user: authUser, setUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: UpdateAdminProfileInput) => {
      const adminId = authUser?.user_id || 100;
      return adminProfileService.updateAdminProfile(adminId, data);
    },
    onSuccess: (updatedUser) => {
      toast.success("Cập nhật thông tin hồ sơ thành công!");
      // Update local auth store so avatar, fullname in topbar & sidebar update immediately
      setUser({
        ...authUser,
        ...updatedUser,
      });
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["admin", "profile"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Cập nhật hồ sơ thất bại");
    },
  });
}

/**
 * Hook to change admin password
 */
export function useChangeAdminPassword() {
  const authUser = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (data: ChangeAdminPasswordInput) => {
      const adminId = authUser?.user_id || 100;
      return adminProfileService.changeAdminPassword(adminId, data);
    },
    onSuccess: () => {
      toast.success("Đổi mật khẩu thành công!");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Đổi mật khẩu thất bại");
    },
  });
}
