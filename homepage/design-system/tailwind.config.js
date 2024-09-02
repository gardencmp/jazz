import typography from "@tailwindcss/typography";
import tailwindCSSAnimate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "selector",
  theme: {
    colors: {
      // DARK SPECTRUM
      canvas: "var(--color-gray-base)",
      "background-subtle": "var(--color-gray-bg-subtle)",
      background: "var(--color-gray-bg)",
      "background-hover": "var(--color-gray-bg-hover)",
      "background-active": "var(--color-gray-bg-active)",
      line: "var(--color-gray-line)",
      border: "var(--color-gray-border)",
      "border-hover": "var(--color-gray-border-hover)",
      "solid-lite": "var(--color-gray-lite)",
      solid: "var(--color-gray-solid)",
      "solid-hover": "var(--color-gray-solid-hover)",
      fill: "var(--color-gray-fill-contrast)",
      "fill-tint": "var(--color-gray-fill)",

      // ACCENT SPECTRUM
      accent: "var(--color-accent-fill)",
    },
    extend: {
      fontFamily: {
        display: ["var(--font-manrope)"],
        mono: ["var(--font-ppr)"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindCSSAnimate, typography()],
};
export default config;
