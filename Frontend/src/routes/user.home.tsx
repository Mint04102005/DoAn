import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Camera, MapPin, Sparkles } from "lucide-react";
import { HairstyleCard } from "@/components/cards/HairstyleCard";
import { CardSkeletonGrid, ErrorState } from "@/components/shared/StateViews";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { hairstyleService } from "@/services/hairstyle.service";
import type { Gender } from "@/types";

export const Route = createFileRoute("/user/home")({
  head: () => ({
    meta: [
      { title: "AI Hairstyle Recommendation System — Trang chủ" },
      {
        name: "description",
        content: "Khám phá kiểu tóc nổi bật và thử ngay bằng AI.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const [gender, setGender] = useState<Gender>("female");
  const query = useQuery({
    queryKey: ["hairstyles", gender],
    queryFn: () => hairstyleService.list({ gender }),
  });

  return (
    <div>
      <Hero />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Kiểu tóc nổi bật</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Lựa chọn được yêu thích nhất tuần này.
            </p>
          </div>
          <Tabs value={gender} onValueChange={(v) => setGender(v as Gender)}>
            <TabsList>
              <TabsTrigger value="female">Nữ</TabsTrigger>
              <TabsTrigger value="male">Nam</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="mt-6">
          {query.isLoading ? (
            <CardSkeletonGrid count={8} />
          ) : query.isError ? (
            <ErrorState onRetry={() => query.refetch()} />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {query.data!.map((h) => (
                <HairstyleCard key={h.hair_id} hair={h} />
              ))}
            </div>
          )}
        </div>
      </section>

      <FeatureBand />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-secondary/60 via-background to-background" />
      <div className="absolute -right-32 -top-32 -z-10 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" /> AI Hairstyle Recommendation
          </span>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Thử tóc bằng AI,
            <br />
            <span className="text-primary">tự tin hơn mỗi ngày.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground">
            Tải ảnh khuôn mặt, để AI gợi ý kiểu tóc phù hợp nhất với bạn — rồi thử ngay và đặt lịch
            tại salon yêu thích.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/user/recommendation">
                <Sparkles className="mr-2 h-4 w-4" />
                Thử tóc bằng AI
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/user/salons">
                <MapPin className="mr-2 h-4 w-4" />
                Tìm salon
              </Link>
            </Button>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
            <img
              src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=900&h=900&fit=crop&auto=format"
              alt="Hairstyle hero"
              className="aspect-square w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-4 -left-4 hidden rounded-2xl border border-border bg-card p-3 shadow-lg sm:flex sm:items-center sm:gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="text-sm">
              <p className="font-semibold">Match 94%</p>
              <p className="text-xs text-muted-foreground">Layered Bob Hàn Quốc</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function FeatureBand() {
  const items = [
    {
      icon: Camera,
      title: "Phân tích khuôn mặt",
      desc: "AI nhận diện dáng mặt và đề xuất kiểu tóc phù hợp.",
      to: "/user/recommendation" as const,
    },
    {
      icon: Sparkles,
      title: "Thử tóc ảo",
      desc: "Ghép kiểu tóc lên ảnh của bạn ngay trong vài giây.",
      to: "/user/try-on" as const,
    },
    {
      icon: MapPin,
      title: "Đặt lịch salon",
      desc: "Tìm salon phù hợp và đặt lịch chỉ với 1 chạm.",
      to: "/user/salons" as const,
    },
  ];
  return (
    <section className="border-t border-border bg-card/40">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:grid-cols-3 sm:px-6 lg:px-8">
        {items.map((it) => (
          <Link
            key={it.title}
            to={it.to}
            className="group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <it.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">{it.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{it.desc}</p>
            <span className="mt-4 inline-flex items-center text-sm font-medium text-primary">
              Khám phá{" "}
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
