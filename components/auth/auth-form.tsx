"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  const isSignup = mode === "signup";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName || "Mon perso" },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        // If email confirmation is enabled, no session yet.
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          router.push("/dashboard");
          router.refresh();
        } else {
          setInfo("Compte créé. Vérifie tes e-mails pour confirmer ton adresse.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {isSignup && (
        <label className="auth-field">
          <span>Nom du personnage</span>
          <input
            className="auth-input"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Mon perso"
            autoComplete="nickname"
          />
        </label>
      )}
      <label className="auth-field">
        <span>E-mail</span>
        <input
          className="auth-input"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </label>
      <label className="auth-field">
        <span>Mot de passe</span>
        <input
          className="auth-input"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={isSignup ? "new-password" : "current-password"}
        />
      </label>

      {error && <p className="auth-error">{error}</p>}
      {info && <p style={{ color: "var(--success)", fontSize: 13 }}>{info}</p>}

      <button className="main-btn" type="submit" disabled={loading} style={{ width: "100%", marginTop: 8 }}>
        {loading ? "Chargement…" : isSignup ? "Créer mon personnage" : "Se connecter"}
      </button>

      <p className="auth-foot">
        {isSignup ? (
          <>Déjà un compte ? <Link href="/login">Se connecter</Link></>
        ) : (
          <>Pas encore de compte ? <Link href="/signup">Créer un personnage</Link></>
        )}
      </p>
    </form>
  );
}
