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

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      bookingService.create({
        user_id: user!.user_id,
        salon_id: salonId,
        booking_date: new Date(`${values.date}T${values.time}`).toISOString(),
        notes: values.notes ?? "",
      }),
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
            <div className="flex flex-wrap gap-1">
              {salon.tag.split(",").map((t) => (
                <Badge key={t} variant="secondary" className="text-xs">
                  {t.trim()}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <form
          onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
          className="space-y-5 rounded-3xl border border-border bg-card p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold">Đặt lịch cắt tóc</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Ngày</Label>
              <Input id="date" type="date" className="mt-1.5" {...form.register("date")} />
              {form.formState.errors.date ? (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.date.message}
                </p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="time">Giờ</Label>
              <Input id="time" type="time" className="mt-1.5" {...form.register("time")} />
              {form.formState.errors.time ? (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.time.message}
                </p>
              ) : null}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea
              id="notes"
              placeholder="VD: muốn cắt + gội, có yêu cầu uốn nhẹ..."
              className="mt-1.5 min-h-[100px]"
              {...form.register("notes")}
            />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CalendarPlus className="mr-2 h-4 w-4" />
            )}
            Xác nhận đặt lịch
          </Button>
        </form>
      </div>
    </div>
  );
}
