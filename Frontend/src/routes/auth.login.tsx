import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import { Loader2, Lock, User } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLE_HOME } from "@/constants";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";

export const Route = createFileRoute("/auth/login")({
  head: () => ({
    meta: [{ title: "Đăng nhập — AI Hairstyle Recommendation System" }],
  }),
  component: LoginPage,
});

const schema = z.object({
  username: z.string().min(2, "Tên đăng nhập tối thiểu 2 ký tự"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});
type FormValues = z.infer<typeof schema>;

function LoginPage() {
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const user = await authService.login(values);
      setUser(user);
      toast.success(`Chào mừng ${user.username}!`);
      navigate({ to: ROLE_HOME[user.role_id] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/40 via-background to-background">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-10 px-4 py-12 lg:flex-row lg:gap-16">
        <div className="hidden flex-1 lg:block">
          <Logo />
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 text-5xl font-semibold tracking-tight text-foreground"
          >
            Tóc đẹp hôm nay,
            <br />
            <span className="text-primary">bắt đầu từ AI.</span>
          </motion.h1>
          <p className="mt-4 max-w-md text-base text-muted-foreground">
            Phân tích khuôn mặt, gợi ý kiểu tóc và đặt lịch salon — tất cả trong một nền tảng.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 text-sm">
            {[
              { k: "20+", v: "Kiểu tóc" },
              { k: "20+", v: "Salon" },
              { k: "AI", v: "Recommendation" },
            ].map((s) => (
              <div key={s.v} className="rounded-2xl border border-border bg-card p-4">
                <p className="text-2xl font-semibold text-primary">{s.k}</p>
                <p className="text-xs text-muted-foreground">{s.v}</p>
              </div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-xl"
        >
          <div className="lg:hidden">
            <Logo />
          </div>
          <h2 className="mt-6 text-2xl font-semibold tracking-tight">Đăng nhập</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Dùng tài khoản demo: <code className="font-mono text-primary">user1</code> /{" "}
            <code className="font-mono text-primary">admin</code> /{" "}
            <code className="font-mono text-primary">salon</code> (mật khẩu bất kỳ).
          </p>

          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Tên đăng nhập</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="username"
                  autoComplete="username"
                  className="pl-9"
                  {...form.register("username")}
                />
              </div>
              {form.formState.errors.username ? (
                <p className="text-xs text-destructive">{form.formState.errors.username.message}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className="pl-9"
                  {...form.register("password")}
                />
              </div>
              {form.formState.errors.password ? (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              ) : null}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Đăng nhập
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Chưa có tài khoản?{" "}
            <Link to="/auth/register" className="font-medium text-primary hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
