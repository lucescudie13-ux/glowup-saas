import type { Metadata, Viewport } from "next";
import { Inter, Chakra_Petch } from "next/font/google";
import "./globals.css";

// Body / numbers: Inter — one of the most legible UI faces, keeps stats and
// long text ergonomic. Titles: Chakra Petch — a semi-squared "game HUD / RPG"
// display face that still reads cleanly. Both self-hosted by next/font.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
const chakraPetch = Chakra_Petch({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

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
    <html lang="fr" className={`${inter.variable} ${chakraPetch.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
