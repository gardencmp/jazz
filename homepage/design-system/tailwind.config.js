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
    container: {
      center: true,
      padding: "var(--space-inset)",
      screens: {
        // lg: "var(--container-text)", doesn't take vars WTF?
        xl: "1280px",
      },
    },
    spacing: {
      // new default used to mtach icons to font-size
      em: "1em",

      // insets & heights
      navH: "var(--height-nav)",
      tabH: "var(--height-tab)",
      inset: "var(--space-inset)",
      "inset-2x": "var(--space-inset-2x)",

      // horizontal containers
      "text-px": "var(--container-text-px)",
      text: "var(--container-text)",
      "hero-px": "var(--container-hero-px)",
      hero: "var(--container-hero)",
      mobile: "639px",
      "inset-full": "var(--inset-full)",
      "inset-hero": "var(--inset-hero)",
      "inset-text": "var(--inset-text)",

      // lower value is 2/3 of upper value
      d4: generateClampSize(500, 1200, 10.5, 16),
      d6: generateClampSize(500, 1200, 16, 24),
      d8: generateClampSize(500, 1200, 21, 32),
      d12: generateClampSize(500, 1200, 32, 48),
      d16: generateClampSize(500, 1200, 43, 64),
      d20: generateClampSize(500, 1200, 54, 80),
      d24: generateClampSize(500, 1200, 64, 96),
      d28: generateClampSize(500, 1200, 75, 112),
      d32: generateClampSize(500, 1200, 85, 128),
      d36: generateClampSize(500, 1200, 96, 144),
      d42: generateClampSize(500, 1200, 112, 168),
      d48: generateClampSize(500, 1200, 128, 192),
      d64: generateClampSize(500, 1200, 171, 256),
      d72: generateClampSize(500, 1200, 192, 288),
      d96: generateClampSize(500, 1200, 256, 384),

      // Tailwind defaults: we need to import these here because we're creating a new theme, not extending it
      px: "1px",
      0: "0px",
      0.5: "0.125rem",
      1: "0.25rem",
      1.5: "0.375rem",
      2: "0.5rem",
      2.5: "0.625rem",
      3: "0.75rem",
      3.5: "0.875rem",
      4: "1rem",
      5: "1.25rem",
      6: "1.5rem",
      7: "1.75rem",
      8: "2rem",
      9: "2.25rem",
      10: "2.5rem",
      11: "2.75rem",
      12: "3rem",
      14: "3.5rem",
      16: "4rem",
      20: "5rem",
      24: "6rem",
      28: "7rem",
      32: "8rem",
      36: "9rem",
      40: "10rem",
      44: "11rem",
      48: "12rem",
      52: "13rem",
      56: "14rem",
      60: "15rem",
      64: "16rem",
      72: "18rem",
      80: "20rem",
      96: "24rem",
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
