import { AuthForm } from "@/components/auth/auth-form";

export default function SignupPage() {
  return (
    <div className="auth-card">
      <h1>Crée ton personnage</h1>
      <p className="sub">Commence ton glow up dès aujourd’hui.</p>
      <AuthForm mode="signup" />
    </div>
  );
}
