import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";
const colors = require("tailwindcss/colors");

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
} as const;

const stonePaletteWithAlpha = { ...stonePalette };

Object.keys(stonePalette).forEach((key) => {
  stonePaletteWithAlpha[key] = stonePaletteWithAlpha[key].replace(
    ")",
    "/ <alpha-value>)",
  );
});

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        stone: stonePaletteWithAlpha,
        blue: {
          ...colors.indigo,
          500: "#5870F1",
          DEFAULT: "#3313F7",
        },
      },
      container: {
        center: true,
        padding: {
          DEFAULT: "0.75rem",
          sm: "1rem",
        },
        screens: {
          md: "500px",
          lg: "500px",
          xl: "500px",
        },
      },
    },
  },
  plugins: [
    plugin(({ addBase }) =>
      addBase({
        ":root": {
          "--gcmp-border-color": stonePalette[200],
          "--gcmp-invert-border-color": stonePalette[900],
        },
        "*": {
          borderColor: "var(--gcmp-border-color)",
        },
        "@media (prefers-color-scheme: dark)": {
          "*": {
            borderColor: "var(--gcmp-invert-border-color)",
          },
        },
        "*:focus": {
          outline: "none",
        },
      }),
    ),
  ],
} as const;

export default config;
