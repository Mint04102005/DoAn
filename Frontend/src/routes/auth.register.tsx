import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import { Loader2, Mail, Lock, User as UserIcon, Phone, Store, MapPin } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";

export const Route = createFileRoute("/auth/register")({
  head: () => ({ meta: [{ title: "Đăng ký tài khoản — Curl Curator AI" }] }),
  component: RegisterPage,
});

// Schema cho Khách hàng (USER)
const userSchema = z.object({
  name: z.string().min(2, "Họ và tên tối thiểu 2 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().min(9, "Số điện thoại tối thiểu 9 số").optional().or(z.literal("")),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

// Schema cho Chủ Salon (SALON_OWNER)
const salonSchema = z.object({
  name: z.string().min(2, "Họ và tên chủ salon tối thiểu 2 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().min(9, "Số điện thoại tối thiểu 9 số"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  salonName: z.string().min(2, "Tên salon tối thiểu 2 ký tự"),
  salonAddress: z.string().min(5, "Địa chỉ salon tối thiểu 5 ký tự"),
  salonPhone: z.string().min(9, "Số điện thoại salon tối thiểu 9 số").optional().or(z.literal("")),
});

type UserFormValues = z.infer<typeof userSchema>;
type SalonFormValues = z.infer<typeof salonSchema>;

function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/40 via-background to-background">
      <div className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xl"
        >
          <Logo />
          <h2 className="mt-6 text-2xl font-semibold tracking-tight">Tạo tài khoản mới</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Chọn loại tài khoản phù hợp để bắt đầu trải nghiệm hệ thống Curl Curator AI.
          </p>

          <Tabs defaultValue="user" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="user">Khách hàng (User)</TabsTrigger>
              <TabsTrigger value="salon">Chủ Salon đối tác</TabsTrigger>
            </TabsList>

            <TabsContent value="user" className="mt-6">
              <UserRegisterForm />
            </TabsContent>

            <TabsContent value="salon" className="mt-6">
              <SalonRegisterForm />
            </TabsContent>
          </Tabs>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Đã có tài khoản?{" "}
            <Link to="/auth/login" className="font-medium text-primary hover:underline">
              Đăng nhập ngay
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function UserRegisterForm() {
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
    },
  });

  const onSubmit = async (values: UserFormValues) => {
    setLoading(true);
    try {
      const user = await authService.register({
        name: values.name,
        email: values.email,
        phone: values.phone || undefined,
        password: values.password,
        role: "USER",
      });

      setUser(user);
      toast.success("Đăng ký tài khoản khách hàng thành công!");
      navigate({ to: "/user/home" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="user-name">Họ và tên</Label>
        <div className="relative">
          <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="user-name"
            placeholder="Nguyễn Văn A"
            className="pl-9"
            {...form.register("name")}
          />
        </div>
        {form.formState.errors.name && (
          <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="user-email">Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="user-email"
            type="email"
            placeholder="name@example.com"
            className="pl-9"
            {...form.register("email")}
          />
        </div>
        {form.formState.errors.email && (
          <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="user-phone">Số điện thoại (tùy chọn)</Label>
        <div className="relative">
          <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="user-phone"
            placeholder="0912345678"
            className="pl-9"
            {...form.register("phone")}
          />
        </div>
        {form.formState.errors.phone && (
          <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="user-password">Mật khẩu</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="user-password"
            type="password"
            placeholder="Tối thiểu 6 ký tự"
            className="pl-9"
            {...form.register("password")}
          />
        </div>
        {form.formState.errors.password && (
          <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full mt-2" disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Đăng ký tài khoản Khách hàng
      </Button>
    </form>
  );
}

function SalonRegisterForm() {
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const form = useForm<SalonFormValues>({
    resolver: zodResolver(salonSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      salonName: "",
      salonAddress: "",
      salonPhone: "",
    },
  });

  const onSubmit = async (values: SalonFormValues) => {
    setLoading(true);
    try {
      const user = await authService.register({
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
        role: "SALON_OWNER",
        salonName: values.salonName,
        salonAddress: values.salonAddress,
        salonPhone: values.salonPhone || values.phone,
      });

      setUser(user);
      toast.success("Đăng ký thành công! Salon đối tác của bạn đã được tạo ở trạng thái chờ duyệt.");
      navigate({ to: "/salon/bookings" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="rounded-xl bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
        💡 Khi đăng ký, hồ sơ Salon của bạn sẽ tự động được gửi lên hệ thống ở trạng thái{" "}
        <strong>Chờ phê duyệt (PENDING)</strong> bởi Quản trị viên.
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="salon-owner-name">Họ và tên chủ Salon</Label>
          <div className="relative">
            <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="salon-owner-name"
              placeholder="Trần Văn Chủ"
              className="pl-9"
              {...form.register("name")}
            />
          </div>
          {form.formState.errors.name && (
            <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="salon-owner-email">Email tài khoản</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="salon-owner-email"
              type="email"
              placeholder="owner@salon.com"
              className="pl-9"
              {...form.register("email")}
            />
          </div>
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="salon-owner-phone">SĐT chủ Salon</Label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="salon-owner-phone"
              placeholder="0987654321"
              className="pl-9"
              {...form.register("phone")}
            />
          </div>
          {form.formState.errors.phone && (
            <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="salon-password">Mật khẩu</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="salon-password"
              type="password"
              placeholder="Tối thiểu 6 ký tự"
              className="pl-9"
              {...form.register("password")}
            />
          </div>
          {form.formState.errors.password && (
            <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
          )}
        </div>
      </div>

      <div className="border-t border-border pt-4 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
          <Store className="h-4 w-4 text-primary" /> Thông tin cơ sở Salon
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="salon-name">Tên Salon</Label>
            <div className="relative">
              <Store className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="salon-name"
                placeholder="Curl Curator Studio"
                className="pl-9"
                {...form.register("salonName")}
              />
            </div>
            {form.formState.errors.salonName && (
              <p className="text-xs text-destructive">{form.formState.errors.salonName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="salon-phone">SĐT Hotline Salon</Label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="salon-phone"
                placeholder="0281234567 (hoặc để trống)"
                className="pl-9"
                {...form.register("salonPhone")}
              />
            </div>
            {form.formState.errors.salonPhone && (
              <p className="text-xs text-destructive">{form.formState.errors.salonPhone.message}</p>
            )}
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="salon-address">Địa chỉ Salon</Label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="salon-address"
                placeholder="Số 123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh"
                className="pl-9"
                {...form.register("salonAddress")}
              />
            </div>
            {form.formState.errors.salonAddress && (
              <p className="text-xs text-destructive">{form.formState.errors.salonAddress.message}</p>
            )}
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full mt-4" disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Đăng ký đối tác Salon
      </Button>
    </form>
  );
}
