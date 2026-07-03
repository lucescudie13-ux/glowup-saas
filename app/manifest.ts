import type { MetadataRoute } from "next";

/**
 * Web app manifest — makes Glow Up installable ("Ajouter à l'écran d'accueil").
 * On iOS/iPadOS this installed PWA is a prerequisite for web push notifications.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Glow Up RPG",
    short_name: "Glow Up",
    description: "Fais progresser ton personnage de vie réelle : quêtes, routines, objectifs, finance et santé.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b0f16",
    theme_color: "#0b0f16",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
