import { Logo } from "@/components/shared/Logo";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-card/50">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="space-y-3">
          <Logo to="/user/home" />
          <p className="max-w-xs text-sm text-muted-foreground">
            Nền tảng tư vấn kiểu tóc bằng AI — phân tích khuôn mặt, thử tóc ảo và đặt lịch salon chỉ
            trong vài giây.
          </p>
        </div>
        <FooterCol
          title="Sản phẩm"
          items={[
            { label: "AI Gợi ý", to: "/recommendation" },
            { label: "Thử tóc ảo", to: "/try-on" },
            { label: "Tìm salon", to: "/salons" },
          ]}
        />
        <FooterCol
          title="Tài khoản"
          items={[
            { label: "Hồ sơ", to: "/profile" },
            { label: "Đăng nhập", to: "/auth/login" },
            { label: "Đăng ký", to: "/auth/register" },
          ]}
        />
        <FooterCol
          title="Liên hệ"
          items={[
            { label: "hello@ai-hairstyle-recommendation.app" },
            { label: "+84 28 1234 5678" },
            { label: "TP. Hồ Chí Minh" },
          ]}
        />
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-7xl px-4 py-4 text-center text-xs text-muted-foreground sm:px-6 lg:px-8">
          © {new Date().getFullYear()} AI Hairstyle Recommendation System Studio. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; to?: string }>;
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {items.map((it) => (
          <li key={it.label}>
            {it.to ? (
              <a href={it.to} className="hover:text-foreground">
                {it.label}
              </a>
            ) : (
              it.label
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
