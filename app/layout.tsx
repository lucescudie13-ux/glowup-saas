import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Glow Up RPG — SaaS Dashboard",
  description:
    "Fais progresser ton personnage de vie réelle : statistiques, quêtes, routines, objectifs, finance, nutrition et entraînement.",
  applicationName: "Glow Up RPG",
  manifest: "/manifest.webmanifest",
  // Enables install-to-home-screen on iOS (required there for web push).
  appleWebApp: { capable: true, title: "Glow Up", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0b0f16",
};

// Applies the saved theme before first paint to avoid a flash. Defaults to dark.
const themeInit = `(function(){try{var t=localStorage.getItem('theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
