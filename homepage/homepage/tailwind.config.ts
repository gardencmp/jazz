import type { Config } from "tailwindcss";
const designSystemConfig = require("../design-system/tailwind.config.ts");

const config: Config = {
    presets: [designSystemConfig],
    darkMode: ["class"],
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./codeSamples/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./node_modules/gcmp-design-system/src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
};
export default config;
