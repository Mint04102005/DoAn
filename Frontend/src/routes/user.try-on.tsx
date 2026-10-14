import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import {
  ArrowRight,
  Camera,
  Check,
  Download,
  Eye,
  ImagePlus,
  Loader2,
  MapPin,
  RefreshCw,
  Save,
  Scissors,
  Sparkles,
  Upload,
  Wand2,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { HairstyleCard } from "@/components/cards/HairstyleCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { hairstyleService } from "@/services/hairstyle.service";
import { recommendationService } from "@/services/recommendation.service";
import { tryOnService } from "@/services/try-on.service";
import { useAuthStore } from "@/stores/auth.store";
import type { Gender, Hairstyle, RecommendationResult } from "@/types";

const searchSchema = z.object({
  tab: z.enum(["recommend", "try-on"]).optional(),
  hair_id: z.coerce.number().optional(),
});

export const Route = createFileRoute("/user/try-on")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      {
        title: "AI Studio — Gợi ý & Thử tóc ảo",
      },
      {
        name: "description",
        content: "Phân tích khuôn mặt bằng AI, nhận diện dáng mặt và ghép thử kiểu tóc trực tiếp.",
      },
    ],
  }),
  component: UnifiedAiStudioPage,
});

export function UnifiedAiStudioPage({
  initialTab = "recommend",
}: {
  initialTab?: "recommend" | "try-on";
}) {
  const search = Route.useSearch();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  // Active Tab state
  const [activeTab, setActiveTab] = useState<"recommend" | "try-on">(
    search.tab || (search.hair_id ? "try-on" : initialTab),
  );

  // Shared User Face Image (Uploaded once, used in both Recommend and Try-On)
  const [sharedImage, setSharedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // === RECOMMENDATION STATE ===
  const [description, setDescription] = useState("");
  const [gender, setGender] = useState<Gender>(user?.gender ?? "female");
  const [recResult, setRecResult] = useState<RecommendationResult | null>(null);

  // === TRY-ON STATE ===
  const [selectedHairId, setSelectedHairId] = useState<number | null>(search.hair_id ?? null);
  const [tryOnOutput, setTryOnOutput] = useState<string | null>(null);

  // Query all hairstyles
  const hairsQuery = useQuery({
    queryKey: ["hairstyles-all"],
    queryFn: () => hairstyleService.list(),
  });

  useEffect(() => {
    if (search.hair_id) {
      setSelectedHairId(search.hair_id);
      setActiveTab("try-on");
    }
  }, [search.hair_id]);

  useEffect(() => {
    if (search.tab) {
      setActiveTab(search.tab);
    }
  }, [search.tab]);

  const selectedHair = hairsQuery.data?.find((h) => h.hair_id === selectedHairId);

  // --- Recommendation Mutation ---
  const analyzeMutation = useMutation({
    mutationFn: () =>
      recommendationService.analyzeFace({
        imageDataUrl: sharedImage ?? "",
        description,
        gender,
      }),
    onSuccess: (res) => {
      setRecResult(res);
      toast.success(`Nhận diện thành công dáng mặt: ${res.detectedShape}`);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Phân tích khuôn mặt thất bại"),
  });

  // --- Try-on Merge Mutation ---
  const tryOnMutation = useMutation({
    mutationFn: async () => {
      if (!sharedImage || !selectedHair) {
        throw new Error("Vui lòng cung cấp ảnh khuôn mặt và chọn một kiểu tóc.");
      }
      return tryOnService.merge({
        user_id: user?.user_id || 1,
        hair_id: selectedHair.hair_id,
        input_img_url: sharedImage,
        hair_img_url: selectedHair.image_url,
      });
    },
    onSuccess: (url) => {
      setTryOnOutput(url);
      toast.success("Đã ghép thử kiểu tóc thành công!");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Ghép tóc ảo thất bại"),
  });

  // --- Save to Collection Mutation ---
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!tryOnOutput || !selectedHair || !user) {
        throw new Error("Chưa có kết quả ghép tóc để lưu");
      }
      return tryOnService.save({
        user_id: user.user_id,
        hair_id: selectedHair.hair_id,
        input_img_url: sharedImage!,
        output_img_url: tryOnOutput,
      });
    },
    onSuccess: () => {
      toast.success("Đã lưu kiểu tóc vào bộ sưu tập của bạn!");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Lưu vào bộ sưu tập thất bại"),
  });

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setSharedImage(dataUrl);
      setTryOnOutput(null);
    };
    reader.readAsDataURL(file);
  };

  // Workflow bridge: Click "Thử ngay kiểu tóc này" from recommendation results
  const handleSelectRecommendedHairstyle = (hair: Hairstyle) => {
    setSelectedHairId(hair.hair_id);
    setActiveTab("try-on");
    setTryOnOutput(null);
    toast.info(`Đã chọn kiểu tóc: ${hair.hair_name}. Bạn có thể bấm "Ghép tóc AI" ngay!`);
  };

  const handleDownloadOutput = () => {
    if (!tryOnOutput) return;
    const a = document.createElement("a");
    a.href = tryOnOutput;
    a.download = `ai-hairstyle-${selectedHair?.hair_name || "tryon"}-${Date.now()}.png`;
    a.click();
    toast.success("Đã tải ảnh về thiết bị!");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Studio Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1.5 px-3 py-1 font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> AI Hair Studio
            </Badge>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
            Gợi ý dáng mặt & Thử tóc ảo AI
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Trải nghiệm toàn diện: Phân tích dáng mặt để nhận đề xuất chuẩn xác và ghép tóc trực
            tiếp lên ảnh của bạn.
          </p>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="mt-8">
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as "recommend" | "try-on")}
          className="w-full space-y-6"
        >
          <TabsList className="grid h-12 w-full max-w-md grid-cols-2 rounded-2xl bg-muted/60 p-1.5">
            <TabsTrigger
              value="recommend"
              className="flex items-center gap-2 rounded-xl text-xs font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm sm:text-sm"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              1. AI Gợi ý kiểu tóc
            </TabsTrigger>
            <TabsTrigger
              value="try-on"
              className="flex items-center gap-2 rounded-xl text-xs font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm sm:text-sm"
            >
              <Scissors className="h-4 w-4 text-primary" />
              2. Thử tóc ảo (Try-On)
            </TabsTrigger>
          </TabsList>

          {/* ========================================================================= */}
          {/* TAB 1: AI RECOMMENDATION */}
          {/* ========================================================================= */}
          <TabsContent value="recommend" className="space-y-6 animate-in fade-in-50 duration-300">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Left Column: Image Upload & Form */}
              <div className="space-y-5 rounded-3xl border border-border bg-card p-6 shadow-sm lg:col-span-5">
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Ảnh khuôn mặt của bạn</Label>
                    {sharedImage && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        Đổi ảnh khác
                      </button>
                    )}
                  </div>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`mt-2.5 flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-all ${
                      sharedImage
                        ? "border-primary/60 bg-muted/20"
                        : "border-border bg-muted/30 hover:border-primary hover:bg-muted/50"
                    }`}
                  >
                    {sharedImage ? (
                      <img
                        src={sharedImage}
                        alt="Face input preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2.5 p-6 text-center text-muted-foreground">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <ImagePlus className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            Tải ảnh khuôn mặt rõ nét
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Chụp chính diện, ánh sáng đều, vén tóc gọn gàng
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileUpload(f);
                    }}
                  />

                  <div className="mt-2.5 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 rounded-xl"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-1.5 h-3.5 w-3.5" /> Tải ảnh từ máy
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => toast.info("Camera trực tiếp sẽ được kích hoạt")}
                    >
                      <Camera className="mr-1.5 h-3.5 w-3.5" /> Chụp ảnh
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="rec-desc" className="text-xs font-semibold">
                    Mô tả phong cách mong muốn (Tùy chọn)
                  </Label>
                  <Textarea
                    id="rec-desc"
                    placeholder="VD: Phong cách thanh lịch công sở, uốn nhẹ bồng bềnh, che gò má cao, dễ chăm sóc..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[85px] rounded-xl text-xs leading-relaxed resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Giới tính phù hợp</Label>
                  <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="female">Nữ giới</SelectItem>
                      <SelectItem value="male">Nam giới</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full rounded-xl py-6 font-semibold"
                  disabled={!sharedImage || analyzeMutation.isPending}
                  onClick={() => analyzeMutation.mutate()}
                >
                  {analyzeMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      AI đang phân tích khuôn mặt...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Phân tích dáng mặt & Nhận gợi ý
                    </>
                  )}
                </Button>
              </div>

              {/* Right Column: Analysis Results */}
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm lg:col-span-7">
                {analyzeMutation.isPending ? (
                  <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-4 text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"
                    >
                      <Sparkles className="h-8 w-8" />
                    </motion.div>
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-foreground">
                        Đang quét tỷ lệ nhân trắc học khuôn mặt...
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Nhận diện dáng trán, xương hàm, cằm và đối chiếu với 20+ quy tắc kiểu tóc
                        chuẩn.
                      </p>
                    </div>
                    <Progress value={75} className="h-2 w-3/4 max-w-sm" />
                  </div>
                ) : recResult ? (
                  <div className="space-y-6 animate-in fade-in-50 duration-300">
                    {/* Face Shape Result Banner */}
                    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-secondary/20 to-card p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Dáng mặt của bạn
                          </p>
                          <h2 className="mt-0.5 text-3xl font-bold text-foreground">
                            Khuôn mặt {recResult.detectedShape}
                          </h2>
                        </div>
                        <div className="rounded-xl bg-background/80 px-3 py-2 text-right shadow-xs">
                          <p className="text-[10px] uppercase font-semibold text-muted-foreground">
                            Độ tương thích
                          </p>
                          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            {recResult.confidence}%
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                        {recResult.explanation}
                      </p>
                    </div>

                    {/* Recommendations List */}
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-foreground">
                          Top kiểu tóc đề xuất cho bạn
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {recResult.recommendations.length} kiểu tóc gợi ý
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {recResult.recommendations.map((item) => (
                          <div
                            key={item.hairstyle.hair_id}
                            className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-3 shadow-xs transition-all hover:border-primary/50 hover:shadow-md"
                          >
                            <div className="space-y-3">
                              <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                                <img
                                  src={item.hairstyle.image_url}
                                  alt={item.hairstyle.hair_name}
                                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                <Badge className="absolute top-2 right-2 bg-black/70 font-mono text-xs text-white backdrop-blur">
                                  Match {item.score}%
                                </Badge>
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm text-foreground">
                                  {item.hairstyle.hair_name}
                                </h4>
                                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                                  {item.hairstyle.description || "Phù hợp phong cách hiện đại."}
                                </p>
                              </div>
                            </div>

                            <Button
                              size="sm"
                              className="mt-3 w-full rounded-xl bg-primary text-primary-foreground font-medium text-xs"
                              onClick={() => handleSelectRecommendedHairstyle(item.hairstyle)}
                            >
                              <Scissors className="mr-1.5 h-3.5 w-3.5" /> Thử kiểu tóc này ngay →
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full min-h-[420px] flex-col items-center justify-center p-6 text-center text-muted-foreground">
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                      <Sparkles className="h-8 w-8" />
                    </div>
                    <h3 className="mt-4 text-base font-bold text-foreground">
                      Chưa có kết quả phân tích
                    </h3>
                    <p className="mt-1.5 max-w-sm text-xs text-muted-foreground">
                      Hãy tải ảnh chân dung của bạn ở cột bên trái và bấm{" "}
                      <strong className="text-foreground">Phân tích dáng mặt</strong> để xem các
                      kiểu tóc đẹp nhất.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ========================================================================= */}
          {/* TAB 2: VIRTUAL TRY-ON */}
          {/* ========================================================================= */}
          <TabsContent value="try-on" className="space-y-6 animate-in fade-in-50 duration-300">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Left Column: Try-on Controls */}
              <div className="space-y-5 rounded-3xl border border-border bg-card p-6 shadow-sm lg:col-span-5">
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">1. Ảnh gốc của bạn</Label>
                    {sharedImage && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        Đổi ảnh
                      </button>
                    )}
                  </div>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`mt-2 flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-all ${
                      sharedImage
                        ? "border-primary/60 bg-muted/20"
                        : "border-border bg-muted/30 hover:border-primary hover:bg-muted/50"
                    }`}
                  >
                    {sharedImage ? (
                      <img
                        src={sharedImage}
                        alt="Source user"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 p-6 text-center text-muted-foreground">
                        <ImagePlus className="h-8 w-8 text-primary" />
                        <p className="text-xs font-medium text-foreground">
                          Bấm để tải ảnh khuôn mặt
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Select Hairstyle */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">2. Chọn kiểu tóc muốn thử</Label>
                  <Select
                    value={selectedHairId ? String(selectedHairId) : ""}
                    onValueChange={(val) => {
                      setSelectedHairId(Number(val));
                      setTryOnOutput(null);
                    }}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Chọn kiểu tóc từ danh sách..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-72 rounded-xl">
                      {hairsQuery.data?.map((hair) => (
                        <SelectItem key={hair.hair_id} value={String(hair.hair_id)}>
                          {hair.hair_name} ({hair.gender === "female" ? "Nữ" : "Nam"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Selected Hairstyle Preview */}
                  {selectedHair && (
                    <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-3">
                      <img
                        src={selectedHair.image_url}
                        alt={selectedHair.hair_name}
                        className="h-14 w-14 rounded-xl object-cover"
                      />
                      <div className="min-w-0 flex-1 text-xs">
                        <p className="font-semibold text-foreground truncate">
                          {selectedHair.hair_name}
                        </p>
                        <p className="text-muted-foreground line-clamp-1">
                          {selectedHair.description || "Phong cách thời thượng"}
                        </p>
                        <Badge variant="outline" className="mt-1 text-[10px]">
                          {selectedHair.gender === "female" ? "Dành cho Nữ" : "Dành cho Nam"}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>

                {/* Merge Action Button */}
                <Button
                  className="w-full rounded-xl py-6 font-semibold shadow-md"
                  disabled={!sharedImage || !selectedHair || tryOnMutation.isPending}
                  onClick={() => tryOnMutation.mutate()}
                >
                  {tryOnMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang xử lý ghép tóc AI...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Bắt đầu ghép tóc AI
                    </>
                  )}
                </Button>
              </div>

              {/* Right Column: Try-on Result & Actions */}
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm lg:col-span-7">
                {tryOnMutation.isPending ? (
                  <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-4 text-center">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"
                    >
                      <Wand2 className="h-8 w-8" />
                    </motion.div>
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-foreground">
                        AI đang hòa trộn kiểu tóc lên gương mặt...
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Khử viền, căn chỉnh góc nghiêng và phối màu tóc tự nhiên.
                      </p>
                    </div>
                    <Progress value={65} className="h-2 w-3/4 max-w-sm" />
                  </div>
                ) : tryOnOutput ? (
                  <div className="space-y-6 animate-in fade-in-50 duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-foreground">
                          Kết quả ghép tóc ảo AI
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Kiểu tóc:{" "}
                          <span className="font-semibold text-foreground">
                            {selectedHair?.hair_name}
                          </span>
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      >
                        <Check className="h-3 w-3" /> Hoàn thành
                      </Badge>
                    </div>

                    {/* Result Comparison Display */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-muted-foreground">Ảnh gốc</span>
                        <div className="aspect-square overflow-hidden rounded-2xl border border-border bg-muted">
                          <img
                            src={sharedImage!}
                            alt="Original"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-primary">
                          Ảnh sau khi thử tóc
                        </span>
                        <div className="aspect-square overflow-hidden rounded-2xl border-2 border-primary bg-muted shadow-md">
                          <img
                            src={tryOnOutput}
                            alt="Try on result"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Post-result Actions */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={handleDownloadOutput}
                      >
                        <Download className="mr-1.5 h-4 w-4" /> Tải ảnh về
                      </Button>
                      <Button
                        variant="secondary"
                        className="rounded-xl"
                        disabled={saveMutation.isPending}
                        onClick={() => saveMutation.mutate()}
                      >
                        <Save className="mr-1.5 h-4 w-4" />
                        {saveMutation.isPending ? "Đang lưu..." : "Lưu bộ sưu tập"}
                      </Button>
                      <Button asChild className="rounded-xl">
                        <Link to="/user/salons">
                          <MapPin className="mr-1.5 h-4 w-4" /> Tìm Salon cắt kiểu này
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full min-h-[420px] flex-col items-center justify-center p-6 text-center text-muted-foreground">
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                      <Scissors className="h-8 w-8" />
                    </div>
                    <h3 className="mt-4 text-base font-bold text-foreground">
                      Sẵn sàng thử tóc ảo
                    </h3>
                    <p className="mt-1.5 max-w-sm text-xs text-muted-foreground">
                      Chọn ảnh chân dung và kiểu tóc yêu thích ở cột bên trái rồi nhấn{" "}
                      <strong className="text-foreground">Bắt đầu ghép tóc AI</strong>.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
