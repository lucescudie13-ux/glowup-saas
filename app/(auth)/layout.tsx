import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-shell">
      <Link href="/" style={{ textDecoration: "none", marginBottom: 24 }} aria-label="Glow Up RPG">
        <Logo size={48} />
      </Link>
      {children}
    </div>
  );
}
