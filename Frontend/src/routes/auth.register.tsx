import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_HOME } from "@/constants";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import type { Gender } from "@/types";

export const Route = createFileRoute("/auth/register")({
  head: () => ({ meta: [{ title: "Đăng ký — AI Hairstyle Recommendation System" }] }),
  component: RegisterPage,
});

const baseSchema = z.object({
  username: z.string().min(2, "Tên đăng nhập tối thiểu 2 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  phone: z.string().min(8, "Số điện thoại không hợp lệ"),
  gender: z.enum(["male", "female"]),
});

const salonSchema = baseSchema.extend({
  license_no: z.string().min(3, "License không hợp lệ"),
  salonname: z.string().min(2, "Tên salon không hợp lệ"),
  address: z.string().min(4, "Địa chỉ không hợp lệ"),
});

type UserValues = z.infer<typeof baseSchema>;
type SalonValues = z.infer<typeof salonSchema>;

function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/40 via-background to-background">
      <div className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full rounded-3xl border border-border bg-card p-8 shadow-xl"
        >
          <Logo />
          <h2 className="mt-6 text-2xl font-semibold tracking-tight">Tạo tài khoản</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Chọn loại tài khoản phù hợp để bắt đầu trải nghiệm AI Hairstyle Recommendation System.
          </p>

          <Tabs defaultValue="user" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="user">Người dùng</TabsTrigger>
              <TabsTrigger value="salon">Chủ salon</TabsTrigger>
            </TabsList>
            <TabsContent value="user" className="mt-6">
              <UserForm />
            </TabsContent>
            <TabsContent value="salon" className="mt-6">
              <SalonForm />
            </TabsContent>
          </Tabs>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Đã có tài khoản?{" "}
            <Link to="/auth/login" className="font-medium text-primary hover:underline">
              Đăng nhập
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function GenderSelect({ value, onChange }: { value: Gender; onChange: (v: Gender) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Gender)}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="female">Nữ</SelectItem>
        <SelectItem value="male">Nam</SelectItem>
      </SelectContent>
    </Select>
  );
}

function UserForm() {
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const form = useForm<UserValues>({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      phone: "",
      gender: "female",
    },
  });

  const onSubmit = async (values: UserValues) => {
    setLoading(true);
    try {
      const user = await authService.registerUser(values);
      setUser(user);
      toast.success("Đăng ký thành công!");
      navigate({ to: ROLE_HOME[user.role_id] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Tên đăng nhập" error={form.formState.errors.username?.message}>
        <Input {...form.register("username")} />
      </Field>
      <Field label="Email" error={form.formState.errors.email?.message}>
        <Input type="email" {...form.register("email")} />
      </Field>
      <Field label="Số điện thoại" error={form.formState.errors.phone?.message}>
        <Input {...form.register("phone")} />
      </Field>
      <Field label="Giới tính">
        <GenderSelect value={form.watch("gender")} onChange={(v) => form.setValue("gender", v)} />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Mật khẩu" error={form.formState.errors.password?.message}>
          <Input type="password" {...form.register("password")} />
        </Field>
      </div>
      <Button type="submit" className="sm:col-span-2" disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Tạo tài khoản người dùng
      </Button>
    </form>
  );
}

function SalonForm() {
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const form = useForm<SalonValues>({
    resolver: zodResolver(salonSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      phone: "",
      gender: "female",
      license_no: "",
      salonname: "",
      address: "",
    },
  });

  const onSubmit = async (values: SalonValues) => {
    setLoading(true);
    try {
      const user = await authService.registerSalonOwner(values);
      setUser(user);
      toast.success("Đăng ký salon thành công — đang chờ duyệt.");
      navigate({ to: ROLE_HOME[user.role_id] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Tên đăng nhập" error={form.formState.errors.username?.message}>
        <Input {...form.register("username")} />
      </Field>
      <Field label="Email" error={form.formState.errors.email?.message}>
        <Input type="email" {...form.register("email")} />
      </Field>
      <Field label="Số điện thoại" error={form.formState.errors.phone?.message}>
        <Input {...form.register("phone")} />
      </Field>
      <Field label="Giới tính">
        <GenderSelect value={form.watch("gender")} onChange={(v) => form.setValue("gender", v)} />
      </Field>
      <Field label="Tên salon" error={form.formState.errors.salonname?.message}>
        <Input {...form.register("salonname")} />
      </Field>
      <Field label="License Number" error={form.formState.errors.license_no?.message}>
        <Input {...form.register("license_no")} />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Địa chỉ salon" error={form.formState.errors.address?.message}>
          <Input {...form.register("address")} />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="Mật khẩu" error={form.formState.errors.password?.message}>
          <Input type="password" {...form.register("password")} />
        </Field>
      </div>
      <Button type="submit" className="sm:col-span-2" disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Đăng ký chủ salon
      </Button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
