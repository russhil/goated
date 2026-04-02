import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        coral: "#E8533A",
        dark: "#0D0D0D",
        muted: "#999999",
        light: "#F5F5F5",
      },
      fontFamily: {
        serif: ["var(--font-serif)", '"Playfair Display"', "Georgia", "serif"],
        sans: ["var(--font-sans)", '"DM Sans"', "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", '"JetBrains Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
