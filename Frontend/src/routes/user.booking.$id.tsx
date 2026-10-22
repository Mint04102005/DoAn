import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowLeft, CalendarPlus, Loader2, MapPin, Star } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState, LoadingState } from "@/components/shared/StateViews";
import { bookingService } from "@/services/booking.service";
import { salonService } from "@/services/salon.service";
import { useAuthStore } from "@/stores/auth.store";

export const Route = createFileRoute("/user/booking/$id")({
  head: () => ({ meta: [{ title: "Đặt lịch — AI Hairstyle Recommendation System" }] }),
  component: BookingPage,
});

const schema = z.object({
  date: z.string().min(1, "Chọn ngày"),
  time: z.string().min(1, "Chọn giờ"),
  notes: z.string().max(300).optional(),
});
type FormValues = z.infer<typeof schema>;

const QUICK_TIME_SLOTS = [
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
];

function BookingPage() {
  const { id } = Route.useParams();
  const salonId = Number(id);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const salonQuery = useQuery({
    queryKey: ["salon", salonId],
    queryFn: () => salonService.getById(salonId),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      time: "10:00",
      notes: "",
    },
  });

  const selectedDate = form.watch("date");
  const selectedTime = form.watch("time");

  // BE-07.5: Kiểm tra các khung giờ đã được đặt của salon
  const availabilityQuery = useQuery({
    queryKey: ["salon-availability", salonId, selectedDate],
    queryFn: () => bookingService.getSalonAvailability(salonId, selectedDate),
    enabled: !!salonId && !!selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate),
    staleTime: 1000 * 30, // 30 seconds
  });

  const bookedSlots = availabilityQuery.data?.bookedSlots || [];
  const bookedTimeMap = new Map<string, { status: string; bookingId: number }>();
  bookedSlots.forEach((slot) => {
    bookedTimeMap.set(slot.time, slot);
  });

  const isCurrentTimeBooked = Boolean(selectedTime && bookedTimeMap.has(selectedTime));

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      if (bookedTimeMap.has(values.time)) {
        throw new Error(`Khung giờ ${values.time} đã có khách đặt lịch. Vui lòng chọn khung giờ khác.`);
      }
      return bookingService.create({
        user_id: user!.user_id,
        salon_id: salonId,
        booking_date: new Date(`${values.date}T${values.time}`).toISOString(),
        notes: values.notes ?? "",
      });
    },
    onSuccess: () => {
      toast.success("Đặt lịch thành công! Đang chờ salon xác nhận.");
      navigate({ to: "/user/profile" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Đặt lịch thất bại"),
  });

  if (salonQuery.isLoading) return <LoadingState />;
  if (salonQuery.isError || !salonQuery.data) {
    return (
      <div className="mx-auto max-w-3xl p-10">
        <ErrorState title="Không tìm thấy salon" />
        <div className="mt-4 text-center">
          <Button asChild variant="outline">
            <Link to="/user/salons">Quay lại danh sách</Link>
          </Button>
        </div>
      </div>
    );
  }

  const salon = salonQuery.data;
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/user/salons">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Quay lại
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <img
            src={salon.image_url}
            alt={salon.salonname}
            className="aspect-[5/3] w-full object-cover"
          />
          <div className="space-y-3 p-6">
            <h1 className="text-2xl font-semibold tracking-tight">{salon.salonname}</h1>
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1 text-warning">
                <Star className="h-4 w-4 fill-warning" /> {salon.rating.toFixed(1)}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" /> {salon.address}
              </span>
            </div>
            {salon.tag ? (
              <div className="flex flex-wrap gap-1">
                {salon.tag
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean)
                  .map((t) => (
                    <Badge key={t} variant="secondary" className="text-xs">
                      {t}
                    </Badge>
                  ))}
              </div>
            ) : null}
          </div>
        </div>

        <form
          onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
          className="space-y-5 rounded-3xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Đặt lịch cắt tóc</h2>
            {availabilityQuery.isLoading && (
              <span className="flex items-center text-xs text-muted-foreground">
                <Loader2 className="mr-1 h-3 w-3 animate-spin text-primary" /> Kiểm tra lịch...
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Ngày hẹn</Label>
              <Input
                id="date"
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                className="mt-1.5 font-mono text-sm"
                {...form.register("date")}
              />
              {form.formState.errors.date ? (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.date.message}
                </p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="time">Giờ hẹn cụ thể</Label>
              <Input
                id="time"
                type="time"
                className={`mt-1.5 font-mono text-sm ${isCurrentTimeBooked ? "border-destructive text-destructive" : ""}`}
                {...form.register("time")}
              />
              {form.formState.errors.time ? (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.time.message}
                </p>
              ) : null}
            </div>
          </div>

          {/* BE-07.5: Khung giờ nhanh & Tình trạng khả dụng */}
          <div className="space-y-2 rounded-2xl border border-border/80 bg-muted/20 p-3.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground">
                Khung giờ khả dụng trong ngày
              </Label>
              {availabilityQuery.isError ? (
                <span className="text-[11px] text-destructive">Không thể kiểm tra khung giờ</span>
              ) : bookedSlots.length === 0 && !availabilityQuery.isLoading ? (
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  ✓ Tất cả giờ đều trống
                </span>
              ) : (
                <span className="text-[11px] text-amber-600 dark:text-amber-400">
                  {bookedSlots.length} khung giờ đã bận
                </span>
              )}
            </div>

            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
              {QUICK_TIME_SLOTS.map((slot) => {
                const isBooked = bookedTimeMap.has(slot);
                const isSelected = selectedTime === slot;
                const slotInfo = bookedTimeMap.get(slot);

                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={isBooked}
                    onClick={() => {
                      if (!isBooked) {
                        form.setValue("time", slot, { shouldValidate: true });
                      }
                    }}
                    title={
                      isBooked
                        ? `Giờ ${slot} đã có khách đặt (${slotInfo?.status === "P" ? "Chờ duyệt" : "Đã xác nhận"})`
                        : `Chọn giờ ${slot}`
                    }
                    className={`relative rounded-xl border px-2 py-1.5 text-xs font-mono transition-all ${
                      isBooked
                        ? "cursor-not-allowed border-dashed border-destructive/40 bg-destructive/10 text-destructive line-through opacity-70"
                        : isSelected
                          ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                          : "border-border/70 bg-card hover:border-primary/50 hover:bg-accent text-foreground"
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>

            {isCurrentTimeBooked && (
              <p className="mt-2 text-xs font-medium text-destructive flex items-center gap-1">
                ⚠️ Khung giờ <span className="font-mono font-bold">{selectedTime}</span> đã có khách đặt lịch ({bookedTimeMap.get(selectedTime)?.status === "P" ? "Chờ duyệt" : "Đã xác nhận"}). Vui lòng chọn giờ khác!
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Yêu cầu / Ghi chú</Label>
            <Textarea
              id="notes"
              placeholder="VD: muốn cắt layer + gội đầu, yêu cầu uốn nhẹ..."
              className="mt-1.5 min-h-[90px]"
              {...form.register("notes")}
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={mutation.isPending || isCurrentTimeBooked}
          >
            {mutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CalendarPlus className="mr-2 h-4 w-4" />
            )}
            {isCurrentTimeBooked ? "Giờ này đã bận — Chọn giờ khác" : "Xác nhận đặt lịch"}
          </Button>
        </form>
      </div>
    </div>
  );
}
