import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MapPin, RefreshCw, RotateCcw, Search, Sparkles, X } from "lucide-react";
import { SalonCard } from "@/components/cards/SalonCard";
import { CardSkeletonGrid, EmptyState, ErrorState } from "@/components/shared/StateViews";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { salonService } from "@/services/salon.service";

export const Route = createFileRoute("/user/salons")({
  head: () => ({ meta: [{ title: "Khám phá salon — AI Hairstyle Recommendation System" }] }),
  component: SalonsPage,
});

const FACE_SHAPE_OPTIONS = [
  { value: "ALL", label: "Tất cả dáng mặt" },
  { value: "Tròn", label: "Mặt Tròn" },
  { value: "Oval", label: "Mặt Oval" },
  { value: "Vuông", label: "Mặt Vuông" },
  { value: "Trái tim", label: "Mặt Trái tim" },
  { value: "Dài", label: "Mặt Dài" },
];

const POPULAR_CITIES = [
  { value: "ALL", label: "Tất cả khu vực" },
  { value: "Hà Nội", label: "Hà Nội" },
  { value: "Hồ Chí Minh", label: "TP. Hồ Chí Minh" },
  { value: "Đà Nẵng", label: "Đà Nẵng" },
];

function SalonsPage() {
  const [search, setSearch] = useState("");
  const [address, setAddress] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("ALL");

  const activeTag = selectedTag === "ALL" ? "" : selectedTag;

  const query = useQuery({
    queryKey: ["salons", { search, address, tag: activeTag }],
    queryFn: () =>
      salonService.list({
        search,
        address,
        tag: activeTag,
      }),
  });

  const hasFilters = Boolean(search || address || selectedTag !== "ALL");

  const handleResetFilters = () => {
    setSearch("");
    setAddress("");
    setSelectedTag("ALL");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Tiêu đề & Giới thiệu */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl text-foreground">
          Khám phá Salon làm tóc
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Danh sách salon chính thức đã được hệ thống xác thực. Tìm kiếm theo tên salon, khu vực hoặc dáng mặt thế mạnh.
        </p>
      </div>

      {/* Thanh bộ lọc đa tiêu chí (Search + Address + Tag) */}
      <div className="mt-8 rounded-3xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
          {/* 1. Ô tìm kiếm theo tên salon */}
          <div className="relative sm:col-span-1 lg:col-span-5">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên salon (VD: Studio hair...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-8"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* 2. Bộ lọc địa chỉ / khu vực */}
          <div className="relative sm:col-span-1 lg:col-span-4">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Lọc địa chỉ (VD: Hà Nội, Lê Thanh Nghị...)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="pl-9 pr-8"
            />
            {address && (
              <button
                type="button"
                onClick={() => setAddress("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* 3. Dropdown lọc thẻ thế mạnh dáng mặt */}
          <div className="sm:col-span-2 lg:col-span-3">
            <Select value={selectedTag} onValueChange={(val) => setSelectedTag(val)}>
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2 truncate">
                  <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                  <SelectValue placeholder="Chọn dáng mặt" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {FACE_SHAPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Thanh quick filters & Nút xóa bộ lọc */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-border/60">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-muted-foreground font-medium mr-1">Khu vực nhanh:</span>
            {POPULAR_CITIES.slice(1).map((city) => (
              <Badge
                key={city.value}
                variant={address.toLowerCase().includes(city.value.toLowerCase()) ? "default" : "outline"}
                className="cursor-pointer transition-colors"
                onClick={() => setAddress(address === city.value ? "" : city.value)}
              >
                {city.label}
              </Badge>
            ))}
          </div>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Xóa bộ lọc
            </Button>
          )}
        </div>
      </div>

      {/* Danh sách Salon / Trạng thái tương ứng */}
      <div className="mt-8">
        {query.isLoading ? (
          <CardSkeletonGrid count={6} />
        ) : query.isError ? (
          <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
            <ErrorState
              title="Lỗi tải danh sách salon"
              description={
                query.error instanceof Error
                  ? query.error.message
                  : "Không thể kết nối đến máy chủ. Vui lòng thử lại sau."
              }
              onRetry={() => query.refetch()}
            />
            <Button className="mt-4" onClick={() => query.refetch()}>
              <RefreshCw className="mr-1.5 h-4 w-4" /> Thử lại
            </Button>
          </div>
        ) : query.data!.length === 0 ? (
          <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-sm">
            <EmptyState
              title="Không tìm thấy salon nào phù hợp"
              description={
                hasFilters
                  ? "Không có salon đã xác thực nào thỏa mãn tất cả điều kiện tìm kiếm hiện tại."
                  : "Hiện chưa có salon nào được phê duyệt công khai trên hệ thống."
              }
            />
            {hasFilters && (
              <div className="mt-6">
                <Button variant="outline" onClick={handleResetFilters}>
                  <RotateCcw className="mr-1.5 h-4 w-4" /> Xóa bộ lọc và tải lại
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Tìm thấy {query.data!.length} salon đã xác thực</span>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {query.data!.map((s) => (
                <SalonCard key={s.salon_id} salon={s} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
