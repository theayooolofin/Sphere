import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sphere: {
          blue: "#1f4da5",
          dark: "#143984",
          page: "#cfd8e8",
          card: "#d9e3f2",
          soft: "#d0dbed",
        },
      },
      boxShadow: {
        card: "0 8px 20px rgba(23, 36, 70, 0.12)",
      },
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
