import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        numeric: ["var(--font-mono)"],
        serif: ["var(--font-playfair)", "ui-serif", "Georgia", "serif"],
      },
      boxShadow: {
        "pos-glow": "0 0 0 1px color-mix(in oklab, var(--pos-accent) 40%, transparent), 0 10px 30px -10px color-mix(in oklab, var(--pos-accent) 35%, transparent)",
      },
      colors: {
        "pos-accent": "var(--pos-accent)",
        "pos-amber": "var(--pos-amber)",
      },
    },
  },
  plugins: [],
};

export default config;
