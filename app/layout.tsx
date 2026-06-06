import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Glow Up RPG — SaaS Dashboard",
  description:
    "Fais progresser ton personnage de vie réelle : statistiques, quêtes, routines, objectifs, finance, nutrition et entraînement.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
