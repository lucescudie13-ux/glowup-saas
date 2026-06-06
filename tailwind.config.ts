import type { Config } from "tailwindcss";

// We preserve the original design system via CSS variables (see app/globals.css).
// Tailwind is used for layout glue; brand colors map to the existing variables.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg0: "var(--bg-0)",
        bg1: "var(--bg-1)",
        bg2: "var(--bg-2)",
        bg3: "var(--bg-3)",
        line: "var(--line)",
        cyan: "var(--cyan)",
        text: "var(--text)",
        muted: "var(--muted)",
        danger: "var(--danger)",
        success: "var(--success)",
        warn: "var(--warn)",
      },
    },
  },
  plugins: [],
};
export default config;
