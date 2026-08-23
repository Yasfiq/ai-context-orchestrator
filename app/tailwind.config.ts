import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#121619",
        surface: "#171C20",
        elevated: "#1B2126",
        primary: {
          DEFAULT: "#4338CA",
          foreground: "#E2E8F0",
        },
        success: {
          DEFAULT: "#10B981",
          foreground: "#FFFFFF",
        },
        foreground: "#E2E8F0",
        muted: {
          DEFAULT: "#1E2328",
          foreground: "#94A3B8",
        },
        border: "#30373D",
        input: "#171C20",
        ring: "#4338CA",
        card: {
          DEFAULT: "#1A1D21",
          foreground: "#E2E8F0",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
      },
      fontFamily: {
        mono: ["IBM Plex Mono", "SFMono-Regular", "Consolas", "monospace"],
        sans: ["IBM Plex Sans", "Noto Sans", "Segoe UI", "sans-serif"],
        editorial: ["IBM Plex Sans", "Noto Sans", "Segoe UI", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.22s ease-out",
        "slide-up": "slideUp 0.28s cubic-bezier(0.22, 1, 0.36, 1)",
        "progress-scan": "progressScan 1.8s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        progressScan: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(300%)" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
