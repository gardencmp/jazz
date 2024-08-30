import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";
import tailwindCSSAnimate from "tailwindcss-animate";
import { generateClampSize } from "./src/lib/generate-clamp-size";
import harmonyPalette from "@evilmartians/harmony/tailwind";
import customStoneColor from "./src/styles/color-custom-stone";

// https://github.com/tailwindlabs/tailwindcss/blob/master/stubs/config.full.js
// screens
// sm: '640px',
// md: '768px',
// lg: '1024px',
// xl: '1280px',
// '2xl': '1536px',

const bodyLineHeight = 24 / 17;
const letterSpacing = {
  meta: "0.02em",
  heading: "-0.01em",
  super: "-0.03em",
};

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "var(--space-inset)",
      screens: {
        // lg: "var(--container-text)", doesn't take vars WTF?
        lg: "1024px",
      },
    },
    fontFamily: {
      sans: ["var(--font-inter)"],
      display: ["var(--font-manrope)"],
      mono: ["var(--font-ppr)"],
    },
    colors: {
      // ...harmonyPalette,
      // ...customStoneColor,
      // GRAY
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

      // ACCENTS
      "accent-background": "var(--color-accent-bg)",
      accent: "var(--color-accent-solid)",
      "accent-hover": "var(--color-accent-solid-hover)",
    },
    fontSize: {
      fine: [
        generateClampSize(500, 1200, 9, 11),
        { lineHeight: `${bodyLineHeight}` },
      ],
      meta: [
        generateClampSize(500, 1200, 11, 13),
        { lineHeight: `${bodyLineHeight}` },
      ],
      small: [
        generateClampSize(500, 1200, 12, 14),
        { lineHeight: `${bodyLineHeight}` },
      ],
      base: [
        generateClampSize(500, 1200, 14, 16),
        { lineHeight: `${bodyLineHeight}` },
      ],
      large: [
        generateClampSize(500, 1200, 15, 17),
        { lineHeight: `${bodyLineHeight}` },
      ],
      xlarge: [
        generateClampSize(500, 1200, 17, 20),
        {
          lineHeight: `${bodyLineHeight}`,
          letterSpacing: letterSpacing.heading,
        },
      ],
      subheading: [
        generateClampSize(500, 1200, 18, 24),
        { lineHeight: "1.333", letterSpacing: letterSpacing.heading },
      ],
      heading: [
        generateClampSize(500, 1200, 20, 27),
        { lineHeight: "1.25", letterSpacing: letterSpacing.heading },
      ],
      subtitle: [
        generateClampSize(500, 1200, 22, 33),
        { lineHeight: "1.2", letterSpacing: letterSpacing.heading },
      ],
      title: [
        generateClampSize(500, 1200, 27, 42),
        { lineHeight: "1.2", letterSpacing: letterSpacing.heading },
      ],
      subsuper: [
        generateClampSize(500, 1200, 32, 48),
        { lineHeight: "0.98", letterSpacing: letterSpacing.super },
      ],
      super: [
        generateClampSize(500, 1200, 39, 60),
        { lineHeight: "0.98", letterSpacing: letterSpacing.super },
      ],
      display: [
        generateClampSize(500, 1200, 39, 60),
        { lineHeight: "0.98", letterSpacing: letterSpacing.super },
      ],
    },
    letterSpacing: {
      meta: letterSpacing.meta,
      heading: letterSpacing.heading,
      super: letterSpacing.super,
    },
    borderRadius: {
      xl: "calc(var(--radius) * 2)",
      lg: "var(--radius)",
      md: "calc(var(--radius) - 2px)",
      sm: "calc(var(--radius) - 4px)",
    },
    spacing: {
      navH: "var(--height-nav)",
      tabH: "var(--height-tab)",
      inset: "var(--space-inset)",
      "inset-2x": "var(--space-inset-2x)",
      em: "1em",

      // these can be used in w-* and max-w-*
      "text-px": "var(--container-text-px)",
      text: "var(--container-text)",
      "hero-px": "var(--container-hero-px)",
      hero: "var(--container-hero)",
      mobile: "639px",

      "inset-full": "var(--inset-full)",
      "inset-hero": "var(--inset-hero)",
      "inset-text": "var(--inset-text)",

      // lower value is 2/3 of upper value
      w4: generateClampSize(500, 1200, 10.5, 16),
      w6: generateClampSize(500, 1200, 16, 24),
      w8: generateClampSize(500, 1200, 21, 32),
      w12: generateClampSize(500, 1200, 32, 48),
      w16: generateClampSize(500, 1200, 43, 64),
      w20: generateClampSize(500, 1200, 54, 80),
      w24: generateClampSize(500, 1200, 64, 96),
      w28: generateClampSize(500, 1200, 75, 112),
      w32: generateClampSize(500, 1200, 85, 128),
      w36: generateClampSize(500, 1200, 96, 144),
      w42: generateClampSize(500, 1200, 112, 168),
      w48: generateClampSize(500, 1200, 128, 192),
      w64: generateClampSize(500, 1200, 171, 256),
      w72: generateClampSize(500, 1200, 192, 288),
      w96: generateClampSize(500, 1200, 256, 384),

      // Tailwind defaults
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
  plugins: [tailwindCSSAnimate, typography()],
};
export default config;
