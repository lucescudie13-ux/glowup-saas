import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return (
    <div className="auth-card">
      <h1>Bon retour 👋</h1>
      <p className="sub">Connecte-toi pour reprendre ta progression.</p>
      <AuthForm mode="login" />
    </div>
  );
}
