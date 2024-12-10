import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
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
  plugins: [require("@tailwindcss/forms")],
};
export default config;
