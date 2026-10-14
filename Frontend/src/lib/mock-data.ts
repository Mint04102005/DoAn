import type {
  AdminLog,
  Booking,
  FaceShapeRow,
  HairFaceRule,
  Hairstyle,
  PendingApproval,
  Salon,
  SalonOwner,
  TryOnHistory,
  User,
} from "@/types";

// Curated Unsplash photos for visual fidelity. Stable IDs.
const HAIR_IMG = (seed: string) =>
  `https://images.unsplash.com/${seed}?w=600&h=600&fit=crop&auto=format`;

const SALON_IMG = (seed: string) =>
  `https://images.unsplash.com/${seed}?w=800&h=600&fit=crop&auto=format`;

const AVATAR = (seed: number) => `https://i.pravatar.cc/150?img=${seed}`;

// Mock Business License / Certificate image URLs for Document preview
export const MOCK_LICENSE_IMAGES = [
  "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=900&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=900&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=900&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=900&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=900&auto=format&fit=crop&q=80",
];

// Regular users (role_id: 2) -> 25 users
const REGULAR_USERS: User[] = Array.from({ length: 25 }, (_, i) => ({
  user_id: i + 1,
  username: `user${i + 1}`,
  email: `user${i + 1}@ai-hairstyle-recommendation.app`,
  gender: i % 2 === 0 ? "female" : "male",
  phone: `09${String(10000000 + (i + 1) * 12345).slice(0, 8)}`,
  role_id: 2,
  created_at: new Date(Date.now() - (i + 1) * 86400000 * 2.5).toISOString(),
  // Frontend mock field: is_locked
  is_locked: i === 6 || i === 13 || i === 21,
  avatar_url: AVATAR(i + 1),
  fullname: [
    "Nguyễn Thị Mai",
    "Trần Văn Hùng",
    "Lê Phương Thảo",
    "Phạm Minh Tuấn",
    "Hoàng Bích Ngọc",
    "Vũ Đình Khang",
    "Đặng Thu Trang",
    "Bùi Quốc Bảo",
    "Đỗ Hải Yến",
    "Ngô Thanh Tùng",
    "Dương Cẩm Ly",
    "Hồ Gia Huy",
    "Trịnh Kim Chi",
    "Lý Thành Nam",
    "Phan Thúy An",
    "Lương Hoàng Long",
    "Mai Tuyết Nhung",
    "Cao Đức Trọng",
    "Tô Diệu Huyền",
    "Đinh Tiến Dũng",
    "Võ Ngọc Hà",
    "Tạ Quang Minh",
    "Chu Khánh Linh",
    "Ân Hoàng Quân",
    "Huỳnh Diễm My",
  ][i] || `Khách hàng ${i + 1}`,
  dob: new Date(Date.now() - (20 + i) * 365.25 * 86400000).toISOString().split("T")[0],
  address: `${100 + (i + 1) * 7} Đường ${["Lê Lợi", "Nguyễn Huệ", "Pasteur", "Điện Biên Phủ", "Cách Mạng Tháng 8"][i % 5]}, Q.${(i % 10) + 1}, TP. Hồ Chí Minh`,
}));

// Admin accounts (role_id: 1)
const ADMIN_USERS: User[] = [
  {
    user_id: 100,
    username: "admin",
    email: "admin@ai-hairstyle-recommendation.app",
    gender: "male",
    phone: "0900000001",
    role_id: 1,
    created_at: "2026-01-01T00:00:00.000Z",
    is_locked: false,
    avatar_url: AVATAR(60),
    fullname: "Quản trị viên Trưởng (Admin Lead)",
    dob: "1994-05-15",
    address: "123 Đường Điện Biên Phủ, Quận Bình Thạnh, TP. Hồ Chí Minh",
  },
  {
    user_id: 102,
    username: "admin_manager",
    email: "manager@ai-hairstyle-recommendation.app",
    gender: "female",
    phone: "0900000003",
    role_id: 1,
    created_at: "2026-02-15T00:00:00.000Z",
    is_locked: false,
    avatar_url: AVATAR(65),
    fullname: "Quản trị viên Kiểm duyệt (Auditor)",
    dob: "1996-10-22",
    address: "88 Đường Nam Kỳ Khởi Nghĩa, Quận 1, TP. Hồ Chí Minh",
  },
];

// Salon Owner accounts (role_id: 3) -> 10 owners
const SALON_OWNER_USERS: User[] = [
  {
    user_id: 101,
    username: "salon",
    email: "salon@ai-hairstyle-recommendation.app",
    gender: "female",
    phone: "0900000002",
    role_id: 3,
    created_at: "2026-03-01T08:00:00.000Z",
    is_locked: false,
    avatar_url: AVATAR(45),
    fullname: "Nguyễn Thu Hà (Maison Studio)",
    dob: "1998-08-20",
    address: "456 Đường Nguyễn Trãi, Quận 5, TP. Hồ Chí Minh",
  },
  ...Array.from({ length: 9 }, (_, i) => ({
    user_id: 201 + i,
    username: `salon_owner_${i + 2}`,
    email: `owner${i + 2}@salonhub.vn`,
    gender: (i % 2 === 0 ? "male" : "female") as "male" | "female",
    phone: `093${String(8000000 + i * 23456).slice(0, 7)}`,
    role_id: 3 as const,
    created_at: new Date(Date.now() - (i + 2) * 86400000 * 3).toISOString(),
    is_locked: i === 3,
    avatar_url: AVATAR(46 + i),
    fullname: [
      "Trần Đức Mạnh",
      "Lê Hoàng Long",
      "Phạm Quốc Liêm",
      "Bobby Nguyễn",
      "Đặng Hà My",
      "Jean-Pierre Belle",
      "Kenjiro Takahashi",
      "Vũ Hải Đăng",
      "Bùi Thùy Dung",
    ][i]!,
    dob: new Date(Date.now() - (28 + i) * 365.25 * 86400000).toISOString().split("T")[0],
    address: `${200 + i * 15} Đường ${["Trần Hưng Đạo", "Nguyễn Thị Minh Khai", "Hai Bà Trưng", "Võ Văn Tần"][i % 4]}, TP. Hồ Chí Minh`,
  })),
];

// Total 37 users
export const MOCK_USERS: User[] = [...ADMIN_USERS, ...SALON_OWNER_USERS, ...REGULAR_USERS];

export const MOCK_SALON_OWNERS: SalonOwner[] = [
  { owner_id: 1, user_id: 101, license_no: "BL-2025-1001", is_verified: false },
  { owner_id: 2, user_id: 201, license_no: "BL-2025-1002", is_verified: false },
  { owner_id: 3, user_id: 202, license_no: "BL-2025-1003", is_verified: true },
  { owner_id: 4, user_id: 203, license_no: "BL-2025-1004", is_verified: false },
  { owner_id: 5, user_id: 204, license_no: "BL-2025-1005", is_verified: false },
  { owner_id: 6, user_id: 205, license_no: "BL-2025-1006", is_verified: false },
  { owner_id: 7, user_id: 206, license_no: "BL-2025-1007", is_verified: true },
  { owner_id: 8, user_id: 207, license_no: "BL-2025-1008", is_verified: false },
  { owner_id: 9, user_id: 208, license_no: "BL-2025-1009", is_verified: false },
  { owner_id: 10, user_id: 209, license_no: "BL-2025-1010", is_verified: false },
];

export const MOCK_APPROVALS: PendingApproval[] = [
  { approval_id: 1, owner_id: 1, status: "P" },
  { approval_id: 2, owner_id: 2, status: "P" },
  { approval_id: 3, owner_id: 3, status: "A" },
  { approval_id: 4, owner_id: 4, status: "P" },
  { approval_id: 5, owner_id: 5, status: "R" },
  { approval_id: 6, owner_id: 6, status: "P" },
  { approval_id: 7, owner_id: 7, status: "A" },
  { approval_id: 8, owner_id: 8, status: "P" },
  { approval_id: 9, owner_id: 9, status: "P" },
  { approval_id: 10, owner_id: 10, status: "R" },
];

const HAIR_SEEDS_FEMALE = [
  "photo-1605497788044-5a32c7078486",
  "photo-1595959183082-7b570b7e08e2",
  "photo-1522337360788-8b13dee7a37e",
  "photo-1554519515-242161756769",
  "photo-1492106087820-71f1a00d2b11",
  "photo-1502323777036-f29e3972d82f",
  "photo-1487412947147-5cebf100ffc2",
  "photo-1531123897727-8f129e1688ce",
  "photo-1517841905240-472988babdf9",
  "photo-1524504388940-b1c1722653e1",
];
const HAIR_SEEDS_MALE = [
  "photo-1500648767791-00dcc994a43e",
  "photo-1506794778202-cad84cf45f1d",
  "photo-1507003211169-0a1dd7228f2d",
  "photo-1519085360753-af0119f7cbe7",
  "photo-1463453091185-61582044d556",
  "photo-1531891437562-4301cf35b7e4",
  "photo-1542327897-d73f4005b533",
  "photo-1488161628813-04466f872be2",
  "photo-1542178243-bc20204b769f",
  "photo-1534308143481-c55f00be8bd7",
];

const HAIR_NAMES_FEMALE = [
  "Layered Bob Hàn Quốc",
  "Tóc Mái Thưa Air",
  "Long Wave Lãng Mạn",
  "Bob Ngắn Cá Tính",
  "Tóc Xoăn Sóng Pháp",
  "Ponytail Cao Thanh Lịch",
  "Tóc Pixie Năng Động",
  "Lob Uốn Cụp Hiện Đại",
  "Tóc Dài Ép Thẳng",
  "Half-up Half-down",
];
const HAIR_NAMES_MALE = [
  "Two Block Hàn Quốc",
  "Undercut Cổ Điển",
  "Side Part Lịch Lãm",
  "Pompadour Cao",
  "Quiff Hiện Đại",
  "Mid Fade Texture",
  "Crop Top Năng Động",
  "Mullet Cá Tính",
  "Slick Back Sang Trọng",
  "Buzz Cut Tối Giản",
];

export const MOCK_HAIRSTYLES: Hairstyle[] = [
  ...HAIR_NAMES_FEMALE.map<Hairstyle>((name, i) => ({
    hair_id: i + 1,
    hair_name: name,
    image_url: HAIR_IMG(HAIR_SEEDS_FEMALE[i]!),
    gender: "female",
    description: "Phù hợp khuôn mặt thanh thoát, dễ tạo kiểu hằng ngày.",
  })),
  ...HAIR_NAMES_MALE.map<Hairstyle>((name, i) => ({
    hair_id: i + 11,
    hair_name: name,
    image_url: HAIR_IMG(HAIR_SEEDS_MALE[i]!),
    gender: "male",
    description: "Phong cách hiện đại, dễ chăm sóc, hợp môi trường công sở.",
  })),
];

export const MOCK_FACE_SHAPES: FaceShapeRow[] = [
  { shape_id: 1, shape_name: "Tròn" },
  { shape_id: 2, shape_name: "Oval" },
  { shape_id: 3, shape_name: "Vuông" },
  { shape_id: 4, shape_name: "Trái Tim" },
  { shape_id: 5, shape_name: "Dài" },
];

export const MOCK_HAIR_FACE: HairFaceRule[] = (() => {
  const rules: HairFaceRule[] = [];
  let id = 1;
  for (const hair of MOCK_HAIRSTYLES) {
    for (const shape of MOCK_FACE_SHAPES) {
      const base = 50 + ((hair.hair_id * 7 + shape.shape_id * 13) % 50);
      rules.push({
        rule_id: id++,
        hair_id: hair.hair_id,
        shape_id: shape.shape_id,
        suitability_score: base,
      });
    }
  }
  return rules;
})();

const SALON_TAGS = ["Tròn,Oval", "Oval,Trái Tim", "Vuông,Dài", "Trái Tim,Oval", "Oval,Dài,Vuông"];

export const MOCK_SALONS: Salon[] = Array.from({ length: 20 }, (_, i) => ({
  salon_id: i + 1,
  owner_id: (i % 10) + 1,
  salonname: [
    "Maison Hair Studio",
    "Seoul Beauty Lab",
    "30Shine Premium",
    "Liêm Barber",
    "Bobby Salon",
    "Hà Nội Hair Atelier",
    "La Belle Coiffure",
    "Tokyo Hair House",
    "Urban Cuts",
    "Glow & Go Salon",
    "Velvet Hair Bar",
    "Mint Salon",
    "Lumière Studio",
    "Saigon Sharp",
    "Artisan Hair",
    "Noir Salon",
    "Aurora Hair Lounge",
    "Studio 21",
    "Hue Hair Co.",
    "Atelier Coupe",
  ][i]!,
  address: `${100 + i * 3} Nguyễn Văn Linh, Q.${(i % 12) + 1}, TP.HCM`,
  rating: Math.round((3.8 + ((i * 13) % 12) / 10) * 10) / 10,
  tag: i === 0 ? "Tròn,Oval,Trái tim" : SALON_TAGS[i % SALON_TAGS.length]!,
  description:
    i === 0
      ? "Chuyên tư vấn định hình phong cách tóc chuẩn theo dáng mặt với kỹ thuật cắt Layer bay, uốn phồng chân tóc và nhuộm xu hướng cá nhân hóa. Đội ngũ Master Stylist trên 8 năm kinh nghiệm."
      : "Không gian làm đẹp cao cấp, chuyên sâu tạo kiểu tóc hiện đại và phục hồi tóc chuyên sâu.",
  image_url: SALON_IMG(
    [
      "photo-1521590832167-7bcbfaa6381f",
      "photo-1560066984-138dadb4c035",
      "photo-1622286342621-4bd786c2447c",
      "photo-1503951914875-452162b0f3f1",
      "photo-1599387737877-5d3b0a2dbd1c",
    ][i % 5]!,
  ),
}));

// Format date helper (YYYY-MM-DD)
const offsetDate = (days: number): string => {
  const d = new Date(Date.now() + days * 86400000);
  return d.toISOString().split("T")[0]!;
};

export const MOCK_BOOKINGS: Booking[] = [
  {
    booking_id: 1001,
    user_id: 1,
    salon_id: 1,
    booking_date: offsetDate(0),
    booking_time: "09:00",
    notes: "Cắt tóc Layer Hàn Quốc + Uốn cụp nhẹ đuôi tóc",
    status: "P",
  },
  {
    booking_id: 1002,
    user_id: 2,
    salon_id: 1,
    booking_date: offsetDate(0),
    booking_time: "11:00",
    notes: "Cắt Side Part 7/3 vuốt sáp + cạo viền sắc nét",
    status: "C",
  },
  {
    booking_id: 1003,
    user_id: 3,
    salon_id: 1,
    booking_date: offsetDate(0),
    booking_time: "16:30",
    notes: "Nhuộm highlight nâu trà sữa + hấp dầu phục hồi",
    status: "C",
  },
  {
    booking_id: 1004,
    user_id: 4,
    salon_id: 1,
    booking_date: offsetDate(1),
    booking_time: "10:00",
    notes: "Tư vấn kiểu tóc hợp mặt vuông + Uốn textured crop",
    status: "P",
  },
  {
    booking_id: 1005,
    user_id: 5,
    salon_id: 1,
    booking_date: offsetDate(1),
    booking_time: "14:30",
    notes: "Cắt ngắn Pixie cá tính + Nhuộm nâu lạnh",
    status: "P",
  },
  {
    booking_id: 1006,
    user_id: 6,
    salon_id: 1,
    booking_date: offsetDate(1),
    booking_time: "17:00",
    notes: "Cắt tạo kiểu Two Block Hàn Quốc",
    status: "C",
  },
  {
    booking_id: 1007,
    user_id: 7,
    salon_id: 1,
    booking_date: offsetDate(2),
    booking_time: "09:30",
    notes: "Uốn sóng lơi nhẹ nhàng + Cắt mái bay",
    status: "P",
  },
  {
    booking_id: 1008,
    user_id: 8,
    salon_id: 1,
    booking_date: offsetDate(3),
    booking_time: "15:00",
    notes: "Cắt Undercut hiện đại + Gội massage",
    status: "C",
  },
  {
    booking_id: 1009,
    user_id: 9,
    salon_id: 1,
    booking_date: offsetDate(-1),
    booking_time: "10:30",
    notes: "Cắt Bob ngang vai + Phục hồi Collagen",
    status: "D",
  },
  {
    booking_id: 1010,
    user_id: 10,
    salon_id: 1,
    booking_date: offsetDate(-2),
    booking_time: "14:00",
    notes: "Cắt Mullet Layer cá tính",
    status: "D",
  },
  {
    booking_id: 1011,
    user_id: 11,
    salon_id: 1,
    booking_date: offsetDate(-3),
    booking_time: "18:00",
    notes: "Gội dưỡng sinh thảo dược + Tạo kiểu dự tiệc",
    status: "D",
  },
  {
    booking_id: 1012,
    user_id: 12,
    salon_id: 1,
    booking_date: offsetDate(-4),
    booking_time: "09:00",
    notes: "Khách bận việc đột xuất nên xin hủy lịch",
    status: "X",
  },
  {
    booking_id: 1013,
    user_id: 13,
    salon_id: 1,
    booking_date: offsetDate(-5),
    booking_time: "15:30",
    notes: "Hủy do đổi kế hoạch công tác",
    status: "X",
  },
  ...Array.from({ length: 20 }, (_, i) => ({
    booking_id: 2000 + i + 1,
    user_id: (i % 25) + 1,
    salon_id: ((i + 1) % 19) + 2,
    booking_date: offsetDate(i - 10),
    booking_time: `${String(9 + (i % 9)).padStart(2, "0")}:00`,
    notes: ["Cắt + gội", "Uốn nhẹ", "Nhuộm nâu trà sữa", "Cắt nam undercut", ""][i % 5]!,
    status: (["P", "C", "D", "X", "P"] as const)[i % 5]!,
  })),
];

export const MOCK_TRY_ON_HISTORY: TryOnHistory[] = Array.from({ length: 20 }, (_, i) => ({
  history_id: i + 1,
  user_id: (i % 25) + 1,
  hair_id: (i % MOCK_HAIRSTYLES.length) + 1,
  input_img_url: AVATAR((i % 70) + 1),
  output_img_url: MOCK_HAIRSTYLES[i % MOCK_HAIRSTYLES.length]!.image_url,
  saved_at: new Date(Date.now() - i * 3600000).toISOString(),
}));

// Admin Audit Logs matching ERD (ADMIN table: log_id, admin_id, action, created_at) -> 35 entries
export const MOCK_ADMIN_LOGS: AdminLog[] = [
  {
    log_id: 1,
    admin_id: 100,
    action: "Phê duyệt Salon #3 (30Shine Premium) - Giấy phép BL-2025-1003",
    created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    log_id: 2,
    admin_id: 100,
    action: "Khóa tài khoản người dùng #7 (@user7) - Vi phạm quy định",
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    log_id: 3,
    admin_id: 102,
    action: "Phê duyệt Salon #7 (La Belle Coiffure) - Giấy phép BL-2025-1007",
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
  },
  {
    log_id: 4,
    admin_id: 100,
    action: "Từ chối yêu cầu xác minh Salon #5 (Bobby Salon) - Thiếu giấy phép kinh doanh",
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    log_id: 5,
    admin_id: 102,
    action: "Mở khóa tài khoản người dùng #14 (@user14)",
    created_at: new Date(Date.now() - 86400000 * 1.5).toISOString(),
  },
  {
    log_id: 6,
    admin_id: 100,
    action: "Khóa tài khoản Salon Owner #204 (Chủ salon Bobby)",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    log_id: 7,
    admin_id: 102,
    action: "Kiểm duyệt tài liệu pháp lý Salon #1 (Maison Hair Studio)",
    created_at: new Date(Date.now() - 86400000 * 2.5).toISOString(),
  },
  {
    log_id: 8,
    admin_id: 100,
    action: "Khóa tài khoản người dùng #14 (@user14) - Khiếu nại spam",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    log_id: 9,
    admin_id: 100,
    action: "Từ chối yêu cầu xác minh Salon #10 (Glow & Go) - Hình ảnh chứng chỉ không rõ nét",
    created_at: new Date(Date.now() - 86400000 * 3.8).toISOString(),
  },
  {
    log_id: 10,
    admin_id: 102,
    action: "Cập nhật chính sách kiểm duyệt Salon đối tác năm 2026",
    created_at: new Date(Date.now() - 86400000 * 4.2).toISOString(),
  },
  {
    log_id: 11,
    admin_id: 100,
    action: "Khóa tài khoản người dùng #22 (@user22)",
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    log_id: 12,
    admin_id: 102,
    action: "Xem xét hồ sơ Salon #4 (Liêm Barber) - Đang bổ sung hồ sơ",
    created_at: new Date(Date.now() - 86400000 * 5.5).toISOString(),
  },
  {
    log_id: 13,
    admin_id: 100,
    action: "Mở khóa tài khoản người dùng #3 (@user3)",
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
  {
    log_id: 14,
    admin_id: 100,
    action: "Phê duyệt tài liệu hành nghề của Salon #3",
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    log_id: 15,
    admin_id: 102,
    action: "Rà soát danh sách 10 salon đối tác mới đăng ký",
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
  {
    log_id: 16,
    admin_id: 100,
    action: "Khóa tài khoản người dùng #19 (@user19)",
    created_at: new Date(Date.now() - 86400000 * 9).toISOString(),
  },
  {
    log_id: 17,
    admin_id: 102,
    action: "Mở khóa tài khoản người dùng #19 (@user19) sau khi xác minh CMND/CCCD",
    created_at: new Date(Date.now() - 86400000 * 9.5).toISOString(),
  },
  {
    log_id: 18,
    admin_id: 100,
    action: "Đồng bộ danh mục kiểu tóc AI Recommendation System",
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    log_id: 19,
    admin_id: 100,
    action: "Phê duyệt chứng chỉ tay nghề Master Stylist #BL-2025-1007",
    created_at: new Date(Date.now() - 86400000 * 11).toISOString(),
  },
  {
    log_id: 20,
    admin_id: 102,
    action: "Kiểm tra hệ thống đánh giá salon và báo cáo gian lận",
    created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
  {
    log_id: 21,
    admin_id: 100,
    action: "Khóa tài khoản @user11 do nghi vấn tài khoản bot",
    created_at: new Date(Date.now() - 86400000 * 13).toISOString(),
  },
  {
    log_id: 22,
    admin_id: 100,
    action: "Mở khóa tài khoản @user11 sau kiểm tra tính hợp lệ",
    created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
  },
  {
    log_id: 23,
    admin_id: 102,
    action: "Xem xét báo cáo vi phạm lịch hẹn salon #2",
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
  {
    log_id: 24,
    admin_id: 100,
    action: "Cập nhật phân quyền Quản trị viên Kiểm duyệt #102",
    created_at: new Date(Date.now() - 86400000 * 16).toISOString(),
  },
  {
    log_id: 25,
    admin_id: 100,
    action: "Kiểm tra sao lưu dữ liệu hệ thống tự động",
    created_at: new Date(Date.now() - 86400000 * 17).toISOString(),
  },
  {
    log_id: 26,
    admin_id: 102,
    action: "Từ chối hồ sơ đăng ký đối tác không đủ điều kiện PCCC",
    created_at: new Date(Date.now() - 86400000 * 18).toISOString(),
  },
  {
    log_id: 27,
    admin_id: 100,
    action: "Khóa tạm thời 2 tài khoản vi phạm chính sách thanh toán",
    created_at: new Date(Date.now() - 86400000 * 19).toISOString(),
  },
  {
    log_id: 28,
    admin_id: 102,
    action: "Phê duyệt giấy phép kinh doanh Salon số 7",
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
  {
    log_id: 29,
    admin_id: 100,
    action: "Khởi tạo hệ thống kiểm duyệt Salon tự động",
    created_at: new Date(Date.now() - 86400000 * 22).toISOString(),
  },
  {
    log_id: 30,
    admin_id: 100,
    action: "Xác thực danh sách 30 tài khoản người dùng ban đầu",
    created_at: new Date(Date.now() - 86400000 * 24).toISOString(),
  },
  {
    log_id: 31,
    admin_id: 102,
    action: "Thiết lập quy trình phê duyệt Salon đa cấp",
    created_at: new Date(Date.now() - 86400000 * 25).toISOString(),
  },
  {
    log_id: 32,
    admin_id: 100,
    action: "Kiểm tra bảo mật và ghi vết đăng nhập",
    created_at: new Date(Date.now() - 86400000 * 26).toISOString(),
  },
  {
    log_id: 33,
    admin_id: 102,
    action: "Cập nhật chứng thực SSL và chứng chỉ số",
    created_at: new Date(Date.now() - 86400000 * 27).toISOString(),
  },
  {
    log_id: 34,
    admin_id: 100,
    action: "Kích hoạt mô-đun Quản trị hệ thống (Phase 3)",
    created_at: new Date(Date.now() - 86400000 * 28).toISOString(),
  },
  {
    log_id: 35,
    admin_id: 100,
    action: "Khởi tạo nhật ký hệ thống Quản trị viên (Audit Logging)",
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
];

// LocalStorage Persistence Helpers
export function getStorageData<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

export function setStorageData<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error("Failed to save to localStorage", err);
  }
}
