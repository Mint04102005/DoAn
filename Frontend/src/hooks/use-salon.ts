import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { bookingService } from "@/services/booking.service";
import { salonService } from "@/services/salon.service";
import type { BookingFilters, BookingStatus, ChangeSalonPasswordInput, UpdateSalonProfileInput } from "@/types";

export function useSalonProfile(userId?: number) {
  return useQuery({
    queryKey: ["salon-profile", userId],
    queryFn: () => {
      return salonService.getOwnerSalon();
    },
    enabled: !!userId,
  });
}

export function useSalonBookings(salonId?: number, filters: BookingFilters = {}) {
  return useQuery({
    queryKey: ["salon-bookings", salonId, filters],
    queryFn: () => {
      if (!salonId) throw new Error("Salon ID is required");
      return bookingService.getSalonBookings(salonId, filters);
    },
    enabled: !!salonId,
  });
}

export function useUpdateBookingStatus(salonId?: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, status }: { bookingId: number; status: BookingStatus }) =>
      bookingService.updateBookingStatus(bookingId, status, salonId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["salon-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["salon-profile"] });

      if (variables.status === "C") {
        toast.success("Đã xác nhận lịch hẹn");
      } else if (variables.status === "D") {
        toast.success("Đã hoàn thành lịch hẹn");
      } else if (variables.status === "X") {
        toast.success("Đã hủy lịch hẹn");
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || "Không thể cập nhật trạng thái lịch hẹn");
    },
  });
}

export function useUpdateSalonProfile(salonId?: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateSalonProfileInput) => {
      return salonService.updateOwnerSalon(data);
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["salon-profile"] });
      queryClient.invalidateQueries({ queryKey: ["salons"] });
      if (salonId) {
        queryClient.setQueryData(["salon", salonId], updated);
      }
      toast.success("Đã cập nhật thông tin Salon thành công");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Cập nhật hồ sơ thất bại");
    },
  });
}

export function useChangeSalonPassword() {
  return useMutation({
    mutationFn: (data: ChangeSalonPasswordInput) => salonService.changePassword(data),
    onSuccess: (res) => {
      toast.success(res.message || "Đổi mật khẩu thành công");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Đổi mật khẩu thất bại. Vui lòng thử lại.");
    },
  });
}

