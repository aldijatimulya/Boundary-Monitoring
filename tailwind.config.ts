import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#0B1220",
          900: "#101A2C",
          800: "#16233A",
        },
        brand: {
          blue: "#2563EB",
          teal: "#0EA5A0",
          amber: "#F59E0B",
          coral: "#E4572E",
        },
        status: {
          done: "#16A34A",
          progress: "#F59E0B",
          pending: "#94A3B8",
          risk: "#DC2626",
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
