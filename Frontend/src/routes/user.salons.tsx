import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { SalonCard } from "@/components/cards/SalonCard";
import { CardSkeletonGrid, EmptyState, ErrorState } from "@/components/shared/StateViews";
import { Input } from "@/components/ui/input";
import { salonService } from "@/services/salon.service";

export const Route = createFileRoute("/user/salons")({
  head: () => ({ meta: [{ title: "Tìm salon — AI Hairstyle Recommendation System" }] }),
  component: SalonsPage,
});

function SalonsPage() {
  const [q, setQ] = useState("");
  const query = useQuery({
    queryKey: ["salons", q],
    queryFn: () => salonService.search(q),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Tìm salon</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Tìm theo tên, địa chỉ hoặc dáng mặt phù hợp.
          </p>
        </div>
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="VD: Quận 1, Oval, Maison..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="mt-8">
        {query.isLoading ? (
          <CardSkeletonGrid count={6} />
        ) : query.isError ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : query.data!.length === 0 ? (
          <EmptyState title="Không tìm thấy salon" description="Thử từ khóa khác xem nhé." />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {query.data!.map((s) => (
              <SalonCard key={s.salon_id} salon={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
