import typography from "@tailwindcss/typography";
import tailwindCSSAnimate from "tailwindcss-animate";
import { generateClampSize } from "./src/lib/generate-clamp-size";

const lineHeight = {
  body: `${24 / 17}`,
  heading: "1.333",
  title: "1.2",
  super: "0.98",
};
const letterSpacing = {
  meta: "0.02em",
  body: "0",
  heading: "-0.01em",
  super: "-0.03em",
};

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
      canvas: "var(--color-gray-base)", // avoids name clash with text-base
      "background-subtle": "var(--color-gray-bg-subtle)",
      background: "var(--color-gray-bg)",
      "background-hover": "var(--color-gray-bg-hover)",
      "background-active": "var(--color-gray-bg-active)",
      "border-light": "var(--color-gray-border-light)",
      border: "var(--color-gray-border)",
      "border-hover": "var(--color-gray-border-hover)",
      line: "var(--color-gray-line)",
      "solid-light": "var(--color-gray-light)",
      solid: "var(--color-gray-solid)",
      "solid-hover": "var(--color-gray-solid-hover)",
      "fill-tint": "var(--color-gray-fill)",
      fill: "var(--color-gray-fill-contrast)",

      // ACCENT SPECTRUM
      accent: "var(--color-accent-fill)",
    },
    fontSize: {
      xs: [
        generateClampSize(500, 1200, 9, 11),
        { lineHeight: lineHeight.body, letterSpacing: letterSpacing.body },
      ],
      fine: [
        generateClampSize(500, 1200, 9, 11),
        { lineHeight: lineHeight.body, letterSpacing: letterSpacing.body },
      ],
      meta: [
        generateClampSize(500, 1200, 11, 13),
        { lineHeight: lineHeight.body, letterSpacing: letterSpacing.body },
      ],
      small: [
        generateClampSize(500, 1200, 12, 14),
        { lineHeight: lineHeight.body, letterSpacing: letterSpacing.body },
      ],
      base: [
        generateClampSize(500, 1200, 14, 16),
        { lineHeight: lineHeight.body, letterSpacing: letterSpacing.body },
      ],
      large: [
        generateClampSize(500, 1200, 15, 17),
        { lineHeight: lineHeight.body, letterSpacing: letterSpacing.body },
      ],
      lead: [
        generateClampSize(500, 1200, 17, 20),
        {
          lineHeight: lineHeight.body,
          letterSpacing: letterSpacing.heading,
        },
      ],
      subheading: [
        generateClampSize(500, 1200, 18, 24),
        {
          lineHeight: lineHeight.heading,
          letterSpacing: letterSpacing.heading,
        },
      ],
      heading: [
        generateClampSize(500, 1200, 20, 27),
        { lineHeight: lineHeight.title, letterSpacing: letterSpacing.heading },
      ],
      subtitle: [
        generateClampSize(500, 1200, 22, 36),
        { lineHeight: lineHeight.title, letterSpacing: letterSpacing.heading },
      ],
      title: [
        generateClampSize(500, 1200, 27, 42),
        { lineHeight: lineHeight.title, letterSpacing: letterSpacing.heading },
      ],
      subsuper: [
        generateClampSize(500, 1200, 32, 48),
        { lineHeight: lineHeight.super, letterSpacing: letterSpacing.super },
      ],
      super: [
        generateClampSize(500, 1200, 39, 60),
        { lineHeight: lineHeight.super, letterSpacing: letterSpacing.super },
      ],
      display: [
        generateClampSize(500, 1200, 39, 60),
        { lineHeight: lineHeight.super, letterSpacing: letterSpacing.super },
      ],
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
