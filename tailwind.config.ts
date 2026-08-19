import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#172026",
        muted: "#64748b",
        line: "#d7dde5",
        paper: "#f7f8fa",
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          600: "#2563eb",
          700: "#1d4ed8"
        },
        success: "#147a4a",
        warning: "#b7791f",
        danger: "#b42318"
      },
      boxShadow: {
        soft: "0 10px 28px rgba(23, 32, 38, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
