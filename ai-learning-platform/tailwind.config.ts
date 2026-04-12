import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#f0f4ff",
          100: "#e0e9ff",
          200: "#c7d7fe",
          300: "#a5bbfc",
          400: "#8194f8",
          500: "#6270f1",
          600: "#4b52e5",
          700: "#3d42ca",
          800: "#3338a3",
          900: "#1a2744",
          950: "#0f1729",
        },
        gold: {
          50: "#fdfaee",
          100: "#f9f0ce",
          200: "#f3de98",
          300: "#ebc85c",
          400: "#e4b333",
          500: "#c9a84c",
          600: "#b8891c",
          700: "#986619",
          800: "#7d501b",
          900: "#69421a",
          950: "#3c220b",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
