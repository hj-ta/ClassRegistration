import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dbe6ff",
          500: "#3b6cf7",
          600: "#2c54d6",
          700: "#2243a8",
        },
      },
    },
  },
  plugins: [],
};

export default config;
