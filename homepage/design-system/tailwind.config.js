import harmonyPalette from "@evilmartians/harmony/tailwind";
import typography from "@tailwindcss/typography";
import tailwindCSSAnimate from "tailwindcss-animate";
const colors = require("tailwindcss/colors");
const plugin = require("tailwindcss/plugin");

const stonePalette = {
  50: "oklch(0.988281 0.002 75)",
  75: "oklch(0.980563 0.002 75)",
  100: "oklch(0.964844 0.002 75)",
  200: "oklch(0.917969 0.002 75)",
  300: "oklch(0.853516 0.002 75)",
  400: "oklch(0.789063 0.002 75)",
  500: "oklch(0.726563 0.002 75)",
  600: "oklch(0.613281 0.002 75)",
  700: "oklch(0.523438 0.002 75)",
  800: "oklch(0.412109 0.002 75)",
  900: "oklch(0.302734 0.002 75)",
  925: "oklch(0.220000 0.002 75)",
  950: "oklch(0.193359 0.002 75)",
};

const stonePaletteWithAlpha = { ...stonePalette };

Object.keys(stonePalette).forEach((key) => {
  stonePaletteWithAlpha[key] = stonePaletteWithAlpha[key].replace(
    ")",
    "/ <alpha-value>)",
  );
});

/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    colors: {
      ...harmonyPalette,
      stone: "stonePaletteWithAlpha",
      blue: {
        ...colors.indigo,
        500: "#5870F1",
        600: "#3651E7",
        700: "#3313F7",
        800: "#2A12BE",
        900: "#12046A",
        DEFAULT: "#3313F7",
      },
      green: "colors.green",
      red: "colors.red",
    },
    extend: {
      fontFamily: {
        display: ["var(--font-manrope)"],
        mono: ["var(--font-commit-mono)"],
      },
      fontSize: {
        "2xs": ["0.75rem", { lineHeight: "1.25rem" }],
      },
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
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      container: {
        center: "true",
        padding: {
          DEFAULT: "0.75rem",
          sm: "1rem",
        },
        screens: {
          md: "960px",
          lg: "1276px",
        },
      },
      screens: {
        md: "960px",
        lg: "1276px",
      },
      typography:
        '(theme) => ({\n        DEFAULT: {\n          css: {\n            "--tw-prose-body": stonePalette[700],\n            "--tw-prose-headings": stonePalette[900],\n            "--tw-prose-bold": stonePalette[900],\n            "--tw-prose-invert-bold": theme("colors.white"),\n            "--tw-prose-invert-body": stonePalette[400],\n            "--tw-prose-invert-headings": theme("colors.white"),\n            "--tw-prose-code": stonePalette[900],\n            "--tw-prose-invert-code": stonePalette[50],\n            "--tw-prose-links": theme("colors.blue.DEFAULT"),\n            "--tw-prose-invert-links": theme("colors.blue.500"),\n            maxWidth: null,\n            strong: {\n              color: "var(--tw-prose-bold)",\n              fontWeight: theme("fontWeight.medium"),\n            },\n            b: {\n              color: "var(--tw-prose-bold)",\n              fontWeight: theme("fontWeight.medium"),\n            },\n            a: {\n              fontWeight: theme("fontWeight.normal"),\n              textUnderlineOffset: "4px",\n            },\n            h1: {\n              fontFamily: theme("fontFamily.display"),\n              letterSpacing: theme("letterSpacing.tight"),\n              fontWeight: theme("fontWeight.semibold"),\n              fontSize: theme("fontSize.4xl"),\n            },\n            h2: {\n              fontFamily: theme("fontFamily.display"),\n              letterSpacing: theme("letterSpacing.tight"),\n              fontWeight: theme("fontWeight.semibold"),\n              fontSize: theme("fontSize.3xl"),\n            },\n            h3: {\n              fontFamily: theme("fontFamily.display"),\n              letterSpacing: theme("letterSpacing.tight"),\n              fontWeight: theme("fontWeight.semibold"),\n              fontSize: theme("fontSize.2xl"),\n            },\n            h4: {\n              fontFamily: theme("fontFamily.display"),\n              letterSpacing: theme("letterSpacing.tight"),\n              fontWeight: theme("fontWeight.semibold"),\n              fontSize: theme("fontSize.xl"),\n            },\n            "code::before": {\n              content: "none",\n            },\n            "code::after": {\n              content: "none",\n            },\n            code: {\n              backgroundColor: stonePalette[100],\n              padding: "0.15rem 0.25rem",\n              borderRadius: "2px",\n              whiteSpace: "nowrap",\n            },\n            p: {\n              marginBottom: theme("spacing.3"),\n              marginTop: theme("spacing.3"),\n            },\n          },\n        },\n        xl: {\n          css: {\n            p: {\n              marginBottom: theme("spacing.3"),\n              marginTop: theme("spacing.3"),\n            },\n          },\n        },\n      })',
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [
    tailwindCSSAnimate,
    typography(),
    plugin(({ addVariant }) => addVariant("label", "& :is(label)")),
    plugin(({ addUtilities }) =>
      addUtilities({
        ".text-reset, .text-reset:hover, .text-reset:focus": {
          color: "inherit",
          textDecoration: "none",
        },
      }),
    ),
    plugin(({ addBase }) =>
      addBase({
        ":root": {
          "--gcmp-border-color": stonePalette[200],
          "--gcmp-invert-border-color": stonePalette[900],
        },
        "*": {
          borderColor: "var(--gcmp-border-color)",
        },
        ".dark *": {
          borderColor: "var(--gcmp-invert-border-color)",
        },
      }),
    ),
    require("tailwindcss-animate"),
  ],
};
export default config;
