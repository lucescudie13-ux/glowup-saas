import Link from "next/link";

const FEATURES = [
  { icon: "📊", title: "Statistiques de vie", text: "8 caractéristiques qui montent et descendent selon tes actions réelles." },
  { icon: "⚔️", title: "Quêtes & routines", text: "Coche tes habitudes et tes quêtes, fais avancer tes jauges." },
  { icon: "🎯", title: "Objectifs & projets", text: "Objectifs du mois et de l’année, projets suivis point par point." },
  { icon: "💰", title: "Finance & nutrition", text: "Suis ton argent, tes calories et tes macros au quotidien." },
];

export default function LandingPage() {
  return (
    <main className="landing">
      <p style={{ color: "var(--cyan-soft)", letterSpacing: 1, fontSize: 13, marginBottom: 12 }}>
        GLOW UP RPG
      </p>
      <h1>Transforme ta vie réelle en jeu de rôle.</h1>
      <p className="lede">
        Enregistre tes actions, fais monter tes statistiques, accomplis tes quêtes et
        garde le cap sur tes objectifs — dans un tableau de bord unique.
      </p>
      <div className="landing-cta">
        <Link href="/signup" className="main-btn" style={{ textDecoration: "none" }}>
          Créer mon personnage
        </Link>
        <Link href="/login" className="secondary-btn" style={{ textDecoration: "none" }}>
          Se connecter
        </Link>
      </div>

      <div className="landing-grid">
        {FEATURES.map((f) => (
          <div className="card" key={f.title}>
            <div style={{ fontSize: 28 }}>{f.icon}</div>
            <h3 style={{ margin: "8px 0 4px" }}>{f.title}</h3>
            <p className="card-sub" style={{ margin: 0 }}>{f.text}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
