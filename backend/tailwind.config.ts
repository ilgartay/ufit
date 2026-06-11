import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#f97316",
          dark: "#ea580c",
          light: "#fb923c",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
