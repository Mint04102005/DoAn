import { randomDelay } from "@/lib/delay";
import { MOCK_BOOKINGS, MOCK_USERS, getStorageData, setStorageData } from "@/lib/mock-data";
import type {
  Booking,
  BookingFilters,
  BookingStatus,
  EnrichedBooking,
  SalonBookingsResponse,
  User,
} from "@/types";

const STORAGE_KEY_BOOKINGS = "ai_hairstyle_bookings";

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://localhost:5000/api";

function extractTimeFromDate(dateValue?: string | Date | null, fallback = "09:00"): string {
  if (!dateValue) return fallback;
  try {
    const d = new Date(dateValue);
    if (!isNaN(d.getTime())) {
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      return `${hours}:${minutes}`;
    }
  } catch {
    // ignore
  }
  return fallback;
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

function getStoredBookings(): Booking[] {
  return getStorageData<Booking[]>(STORAGE_KEY_BOOKINGS, MOCK_BOOKINGS);
}

function saveStoredBookings(bookings: Booking[]): void {
  setStorageData(STORAGE_KEY_BOOKINGS, bookings);
}

interface CreateBookingPayload {
  user_id: number;
  salon_id: number;
  booking_date: string;
  booking_time?: string;
  notes: string;
}

export const bookingService = {
  /**
   * BE-07.6: Fetch all bookings for the authenticated salon owner from real Backend API
   * GET /api/bookings/salon
   */
  async getSalonBookings(
    salonId?: number,
    filters: BookingFilters = {},
  ): Promise<SalonBookingsResponse> {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Vui lòng đăng nhập với tài khoản Chủ Salon để xem danh sách lịch hẹn.");
    }

    const params = new URLSearchParams();
    if (filters.status && filters.status !== "ALL") {
      params.append("status", filters.status);
    }
    if (filters.date) {
      params.append("date", filters.date);
    } else if (filters.dateFilter && filters.dateFilter !== "all") {
      const now = new Date();
      if (filters.dateFilter === "today") {
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        params.append("date", `${year}-${month}-${day}`);
      } else if (filters.dateFilter === "tomorrow") {
        const tomorrow = new Date(Date.now() + 86400000);
        const year = tomorrow.getFullYear();
        const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
        const day = String(tomorrow.getDate()).padStart(2, "0");
        params.append("date", `${year}-${month}-${day}`);
      }
    }
    if (filters.page) {
      params.append("page", String(filters.page));
    }
    if (filters.limit) {
      params.append("limit", String(filters.limit));
    }

    const res = await fetch(`${API_BASE_URL}/bookings/salon?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const resData = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = Array.isArray(resData.message)
        ? resData.message.join(", ")
        : resData.message || `Lỗi tải danh sách lịch hẹn (${res.status})`;
      throw new Error(msg);
    }

    const rawList = resData.data || [];
    const pagination = resData.pagination || {};
    const backendCounts = resData.counts || { all: 0, p: 0, c: 0, d: 0, x: 0 };

    const mappedData: EnrichedBooking[] = rawList.map((b: any) => {
      const bDate = b.bookingDate ? new Date(b.bookingDate) : new Date();
      const timeStr = `${String(bDate.getHours()).padStart(2, "0")}:${String(bDate.getMinutes()).padStart(2, "0")}`;
      return {
        booking_id: b.id,
        user_id: b.userId ?? b.user?.id,
        salon_id: b.salonId ?? b.salon?.id ?? salonId,
        booking_date: b.bookingDate ? new Date(b.bookingDate).toISOString() : "",
        booking_time: timeStr,
        notes: b.notes || "",
        status: b.status,
        customer: b.user
          ? {
              user_id: b.user.id,
              username: b.user.username || b.user.name || "Khách hàng",
              fullname: b.user.name || b.user.username || "Khách hàng",
              phone: b.user.phone || "",
              email: b.user.email || "",
              avatar_url: b.user.avatarUrl || "",
              role_id: 2,
              gender: b.user.gender || "other",
              created_at: b.createdAt || new Date().toISOString(),
            }
          : undefined,
        salon: b.salon,
      };
    });

    // Client-side quick search filtering if user typed in search box
    let finalData = mappedData;
    if (filters.search && filters.search.trim() !== "") {
      const q = filters.search.trim().toLowerCase();
      finalData = finalData.filter((b) => {
        const customer = b.customer;
        const nameMatch = customer?.fullname?.toLowerCase().includes(q) ?? false;
        const userMatch = customer?.username?.toLowerCase().includes(q) ?? false;
        const phoneMatch = customer?.phone?.toLowerCase().includes(q) ?? false;
        const notesMatch = b.notes.toLowerCase().includes(q);
        return nameMatch || userMatch || phoneMatch || notesMatch;
      });
    }

    return {
      data: finalData,
      total: pagination.total ?? resData.total ?? finalData.length,
      page: pagination.page ?? filters.page ?? 1,
      limit: pagination.limit ?? filters.limit ?? 10,
      totalPages:
        pagination.totalPages ??
        (Math.ceil((pagination.total ?? finalData.length) / (filters.limit || 10)) || 1),
      counts: backendCounts,
    };
  },

  /**
   * BE-07.4: Customer cancels their own booking
   * PATCH /api/bookings/:id/cancel
   */
  async cancelBooking(bookingId: number): Promise<Booking> {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Vui lòng đăng nhập để thực hiện thao tác");
    }

    const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const resData = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = Array.isArray(resData.message)
        ? resData.message.join(", ")
        : resData.message || `Hủy lịch thất bại (${res.status})`;
      throw new Error(msg);
    }

    const raw = resData.data || resData;
    return {
      booking_id: raw.id ?? raw.booking_id ?? bookingId,
      user_id: raw.userId ?? raw.user_id,
      salon_id: raw.salonId ?? raw.salon_id,
      booking_date: raw.bookingDate ? new Date(raw.bookingDate).toISOString() : raw.booking_date,
      booking_time: raw.booking_time || "09:00",
      notes: raw.notes || "",
      status: "X",
    };
  },

  /**
   * BE-07.5: Check booked slots of a salon on a specific date (YYYY-MM-DD)
   * GET /api/bookings/salon/:salonId/availability?date=YYYY-MM-DD
   */
  async getSalonAvailability(
    salonId: number,
    date: string,
  ): Promise<{
    salonId: number;
    date: string;
    bookedSlots: Array<{
      bookingId: number;
      bookingDate: string;
      status: string;
      time: string;
    }>;
  }> {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}/bookings/salon/${salonId}/availability?date=${date}`, {
      headers,
    });

    const resData = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = Array.isArray(resData.message)
        ? resData.message.join(", ")
        : resData.message || `Không thể kiểm tra khung giờ khả dụng (${res.status})`;
      throw new Error(msg);
    }

    const raw = resData.data || resData;
    const bookedSlots = (raw.bookedSlots || []).map((slot: any) => {
      const d = new Date(slot.bookingDate);
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      return {
        bookingId: slot.bookingId ?? slot.id,
        bookingDate: slot.bookingDate,
        status: slot.status,
        time: `${hours}:${minutes}`,
      };
    });

    return {
      salonId: raw.salonId ?? salonId,
      date: raw.date ?? date,
      bookedSlots,
    };
  },

  /**
   * Update the status of a booking with role-based business rules.
   * PATCH /api/bookings/:id/status
   */
  async updateBookingStatus(
    bookingId: number,
    newStatus: BookingStatus,
    salonId?: number,
  ): Promise<Booking> {
    const token = getAuthToken();
    if (token) {
      const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = Array.isArray(resData.message)
          ? resData.message.join(", ")
          : resData.message || `Cập nhật trạng thái thất bại (${res.status})`;
        throw new Error(msg);
      }

      const raw = resData.data || resData;
      const rawDate = raw.bookingDate || raw.booking_date;
      return {
        booking_id: raw.id ?? raw.booking_id ?? bookingId,
        user_id: raw.userId ?? raw.user_id,
        salon_id: raw.salonId ?? raw.salon_id ?? salonId,
        booking_date: rawDate ? new Date(rawDate).toISOString() : "",
        booking_time: extractTimeFromDate(rawDate),
        notes: raw.notes || "",
        status: raw.status || newStatus,
      };
    }

    await randomDelay(400, 700);

    const allBookings = getStoredBookings();
    const index = allBookings.findIndex((b) => b.booking_id === bookingId);

    if (index === -1) {
      throw new Error("Không tìm thấy lịch hẹn");
    }

    const currentBooking = allBookings[index]!;

    if (salonId !== undefined && currentBooking.salon_id !== salonId) {
      throw new Error("Bạn không có quyền chỉnh sửa lịch hẹn của salon khác");
    }

    if (currentBooking.status === "D") {
      throw new Error("Lịch hẹn đã hoàn thành, không thể thay đổi trạng thái");
    }
    if (currentBooking.status === "X") {
      throw new Error("Lịch hẹn đã bị hủy, không thể thay đổi trạng thái");
    }

    const updatedBooking: Booking = {
      ...currentBooking,
      status: newStatus,
    };

    const nextBookings = [...allBookings];
    nextBookings[index] = updatedBooking;
    saveStoredBookings(nextBookings);

    return updatedBooking;
  },

  /**
   * Get single booking detail by ID with customer info
   * GET /api/bookings/:id
   */
  async getBookingById(bookingId: number, salonId?: number): Promise<EnrichedBooking | null> {
    const token = getAuthToken();
    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const raw = await res.json();
          const b = raw.data || raw;
          if (salonId !== undefined && (b.salon_id ?? b.salonId) !== salonId) {
            return null;
          }
          const rawDate = b.bookingDate || b.booking_date;
          return {
            booking_id: b.id ?? b.booking_id,
            user_id: b.userId ?? b.user_id,
            salon_id: b.salonId ?? b.salon_id,
            booking_date: rawDate ? new Date(rawDate).toISOString() : "",
            booking_time: extractTimeFromDate(rawDate, b.booking_time),
            notes: b.notes || "",
            status: b.status || "P",
            customer: b.user
              ? {
                  user_id: b.user.id ?? b.user.user_id,
                  username: b.user.name || b.user.username || "Khách hàng",
                  fullname: b.user.name || b.user.fullname || "Khách hàng",
                  email: b.user.email || "",
                  phone: b.user.phone || "",
                  avatar_url: b.user.avatarUrl || b.user.avatar_url || "",
                  role_id: 2,
                  created_at: new Date().toISOString(),
                }
              : undefined,
            salon: b.salon,
          };
        }
      } catch {
        // Fallback to local storage if network error
      }
    }

    await randomDelay(200, 400);

    const allBookings = getStoredBookings();
    const booking = allBookings.find((b) => b.booking_id === bookingId);

    if (!booking) return null;
    if (salonId !== undefined && booking.salon_id !== salonId) {
      return null;
    }

    const customer = MOCK_USERS.find((u) => u.user_id === booking.user_id);
    return {
      ...booking,
      customer,
    };
  },

  /**
   * Create a new booking
   * POST /api/bookings
   */
  async create(payload: CreateBookingPayload): Promise<Booking> {
    const token = getAuthToken();
    if (token) {
      const res = await fetch(`${API_BASE_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          salonId: payload.salon_id,
          bookingDate: payload.booking_date,
          notes: payload.notes || "Đặt lịch làm tóc",
        }),
      });

      const resData = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMessage = Array.isArray(resData.message)
          ? resData.message.join(", ")
          : resData.message || `Đặt lịch thất bại (${res.status})`;
        throw new Error(errorMessage);
      }

      const raw = resData.data || resData;
      const rawDate = raw.bookingDate || raw.booking_date || payload.booking_date;
      return {
        booking_id: raw.id ?? raw.booking_id,
        user_id: raw.userId ?? raw.user_id ?? payload.user_id,
        salon_id: raw.salonId ?? raw.salon_id ?? payload.salon_id,
        booking_date: rawDate ? new Date(rawDate).toISOString() : payload.booking_date,
        booking_time: extractTimeFromDate(rawDate, payload.booking_time),
        notes: raw.notes || payload.notes,
        status: raw.status || "P",
      };
    }

    await randomDelay(600, 1200);
    const allBookings = getStoredBookings();
    const booking: Booking = {
      ...payload,
      booking_id: Date.now(),
      status: "P",
    };
    const nextBookings = [booking, ...allBookings];
    saveStoredBookings(nextBookings);
    return booking;
  },

  /**
   * List bookings made by a user
   * GET /api/bookings/my-bookings
   */
  async listByUser(user_id: number, status?: string): Promise<Booking[]> {
    const token = getAuthToken();
    if (token) {
      try {
        const url = status
          ? `${API_BASE_URL}/bookings/my-bookings?status=${status}`
          : `${API_BASE_URL}/bookings/my-bookings`;
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const resData = await res.json();
          const list = Array.isArray(resData) ? resData : resData.data || [];
          return list.map((raw: any) => {
            const rawDate = raw.bookingDate || raw.booking_date;
            return {
              booking_id: raw.id ?? raw.booking_id,
              user_id: raw.userId ?? raw.user_id,
              salon_id: raw.salonId ?? raw.salon_id,
              booking_date: rawDate ? new Date(rawDate).toISOString() : "",
              booking_time: extractTimeFromDate(rawDate, raw.booking_time),
              notes: raw.notes || "",
              status: raw.status || "P",
            };
          });
        }
      } catch {
        // Fallback to local storage if network error
      }
    }

    await randomDelay(300, 600);
    const allBookings = getStoredBookings();
    return allBookings
      .filter((b) => b.user_id === user_id)
      .sort((a, b) => +new Date(b.booking_date) - +new Date(a.booking_date));
  },
};
