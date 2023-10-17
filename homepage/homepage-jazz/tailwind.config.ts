import type { Config } from 'tailwindcss'
import harmonyPalette from "@evilmartians/harmony/tailwind";
import typography from '@tailwindcss/typography';
import tailwindCSSAnimate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './codeSamples/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    colors: {...harmonyPalette,
      "stone": {
        "50": "oklch(0.988281 0.002 75 / <alpha-value>)",
        "100": "oklch(0.964844 0.002 75 / <alpha-value>)",
        "200": "oklch(0.917969 0.002 75 / <alpha-value>)",
        "300": "oklch(0.853516 0.002 75 / <alpha-value>)",
        "400": "oklch(0.789063 0.002 75 / <alpha-value>)",
        "500": "oklch(0.726563 0.002 75 / <alpha-value>)",
        "600": "oklch(0.613281 0.002 75 / <alpha-value>)",
        "700": "oklch(0.523438 0.002 75 / <alpha-value>)",
        "800": "oklch(0.412109 0.002 75 / <alpha-value>)",
        "900": "oklch(0.302734 0.002 75 / <alpha-value>)",
        "925": "oklch(0.220000 0.002 75 / <alpha-value>)",
        "950": "oklch(0.193359 0.002 75 / <alpha-value>)"
      },
    },
    extend: {
      fontFamily: {
        display: ['var(--font-manrope)'],
        mono: ['var(--font-ppr)'],
      },
      // shadcn-ui
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
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
    }
  },
  plugins: [
    tailwindCSSAnimate,
    typography(),
  ],
}
export default config
