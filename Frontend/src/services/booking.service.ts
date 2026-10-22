import type {
  BackendSalonItem,
  Booking,
  BookingCounts,
  BookingFilters,
  BookingStatus,
  EnrichedBooking,
  SalonBookingsResponse,
} from "@/types";
import { apiJson, ApiError, type Page } from "./api";
import { transformBackendSalon } from "./salon.service";
import { transformBackendUser } from "./auth.service";

interface BackendBooking {
  id: number;
  userId: number;
  salonId: number;
  bookingDate: string;
  bookingTime?: string;
  booking_time?: string;
  notes: string;
  status: BookingStatus;
  user?: {
    id: number;
    name: string;
    email: string;
    phone: string;
    avatarUrl?: string;
    gender?: string;
  };
  salon?: BackendSalonItem;
}
interface CreateBookingPayload {
  user_id: number;
  salon_id: number;
  booking_date: string;
  booking_time?: string;
  notes: string;
}

function transform(raw: BackendBooking): EnrichedBooking {
  const date = raw.bookingDate || raw.bookingTime;
  const local = date
    ? new Date(new Date(date).getTime() + 7 * 3600000).toISOString().slice(11, 16)
    : "";
  return {
    booking_id: raw.id,
    user_id: raw.userId,
    salon_id: raw.salonId,
    booking_date: date ?? "",
    booking_time: raw.booking_time || local,
    notes: raw.notes || "",
    status: raw.status,
    customer: raw.user ? transformBackendUser(raw.user) : undefined,
    salon: raw.salon ? transformBackendSalon(raw.salon) : undefined,
  };
}

export const bookingService = {
  async getSalonBookings(
    _salonId?: number,
    filters: BookingFilters = {},
  ): Promise<SalonBookingsResponse> {
    const params = new URLSearchParams({
      page: String(filters.page ?? 1),
      limit: String(filters.limit ?? 10),
    });
    if (filters.status && filters.status !== "ALL") params.set("status", filters.status);
    let date = filters.date;
    if (!date && (filters.dateFilter === "today" || filters.dateFilter === "tomorrow"))
      date = new Date(Date.now() + 7 * 3600000 + (filters.dateFilter === "tomorrow" ? 86400000 : 0))
        .toISOString()
        .slice(0, 10);
    if (date) params.set("date", date);
    const result = await apiJson<Page<BackendBooking> & { counts: BookingCounts }>(
      `/bookings/salon?${params}`,
    );
    const term = filters.search?.trim().toLocaleLowerCase();
    let data = result.data.map(transform);
    if (term)
      data = data.filter((item) =>
        [item.customer?.fullname, item.customer?.phone, item.notes].some((value) =>
          value?.toLocaleLowerCase().includes(term),
        ),
      );
    if (filters.sortBy === "date_desc") data.reverse();
    return {
      data,
      total: result.pagination.total,
      page: result.pagination.page,
      limit: result.pagination.limit,
      totalPages: result.pagination.totalPages,
      counts: result.counts,
    };
  },
  async cancelBooking(id: number): Promise<Booking> {
    const result = await apiJson<{ data: BackendBooking }>(`/bookings/${id}/cancel`, {
      method: "PATCH",
    });
    return transform(result.data);
  },
  async getSalonAvailability(salonId: number, date: string) {
    return apiJson<{
      salonId: number;
      date: string;
      bookedSlots: { bookingId: number; bookingDate: string; status: string; time: string }[];
    }>(`/bookings/salon/${salonId}/availability?${new URLSearchParams({ date })}`, {
      public: true,
    });
  },
  async updateBookingStatus(
    id: number,
    status: BookingStatus,
    _salonId?: number,
  ): Promise<Booking> {
    const result = await apiJson<{ data?: BackendBooking } & Partial<BackendBooking>>(
      `/bookings/${id}/status`,
      { method: "PATCH", body: JSON.stringify({ status }) },
    );
    return transform(result.data ?? (result as BackendBooking));
  },
  async getBookingById(id: number, salonId?: number): Promise<EnrichedBooking | null> {
    try {
      const raw = await apiJson<BackendBooking>(`/bookings/${id}`);
      if (salonId && raw.salonId !== salonId) return null;
      return transform(raw);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },
  async create(payload: CreateBookingPayload): Promise<Booking> {
    const result = await apiJson<{ data?: BackendBooking } & Partial<BackendBooking>>("/bookings", {
      method: "POST",
      body: JSON.stringify({
        salonId: payload.salon_id,
        bookingDate: payload.booking_date,
        notes: payload.notes || "Đặt lịch làm tóc",
      }),
    });
    return transform(result.data ?? (result as BackendBooking));
  },
  async listByUser(_userId: number, status?: string): Promise<Booking[]> {
    const params = new URLSearchParams({ limit: "100" });
    if (status && status !== "ALL") params.set("status", status);
    const rows: Booking[] = [];
    for (let page = 1; ; page++) {
      params.set("page", String(page));
      const result = await apiJson<{ data: BackendBooking[]; totalPages: number }>(
        `/bookings/my-bookings?${params}`,
      );
      rows.push(...result.data.map(transform));
      if (page >= result.totalPages) return rows;
    }
  },
};
