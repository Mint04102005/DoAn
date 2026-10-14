import type { Booking, BookingStatus, FaceShape, Salon, SalonOwner, User } from "./index";

export type FaceShapeTag = "Tròn" | "Oval" | "Vuông" | "Trái tim" | "Dài";

export interface BookingFilters {
  search?: string;
  status?: BookingStatus | "ALL";
  dateFilter?: "all" | "today" | "tomorrow" | "this_week";
  sortBy?: "date_desc" | "date_asc";
  page?: number;
  limit?: number;
}

export interface EnrichedBooking extends Booking {
  customer?: User;
  salon?: Salon;
}

export interface BookingCounts {
  all: number;
  p: number;
  c: number;
  d: number;
  x: number;
}

export interface SalonBookingsResponse {
  data: EnrichedBooking[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  counts: BookingCounts;
}

export interface SalonWithDetails {
  salon: Salon;
  owner: SalonOwner;
  user: User;
}

export interface UpdateSalonProfileInput {
  salonname: string;
  address: string;
  tag: string[] | string;
  description?: string;
  image_url?: string;
}
