// https://uicolors.app/create
// #006885
const calypso = {
  hex: {
    50: "#e5ffff",
    100: "#c7fffe",
    200: "#94fffd",
    300: "#47fffc",
    400: "#00fbff",
    500: "#00ddff",
    600: "#00abd6",
    700: "#0088ad",
    800: "#006885",
    900: "#055976",
    950: "#003c52",
  },
  oklch: {
    50: "oklch(98.12% 0.03 196.72)",
    100: "oklch(96.17% 0.06 194.89)",
    200: "oklch(93.51% 0.10 194.02)",
    300: "oklch(91.11% 0.14 193.29)",
    400: "oklch(89.60% 0.15 196.84)",
    500: "oklch(82.54% 0.15 214.09)",
    600: "oklch(68.88% 0.13 224.11)",
    700: "oklch(58.34% 0.11 225.57)",
    800: "oklch(48.15% 0.09 225.47)",
    900: "oklch(43.45% 0.08 229.47)",
    950: "oklch(33.37% 0.07 230.34)",
  },
  hsl: {
    50: "hsl(180, 100%, 95%)",
    100: "hsl(179, 100%, 89%)",
    200: "hsl(179, 100%, 79%)",
    300: "hsl(179, 100%, 64%)",
    400: "hsl(181, 100%, 50%)",
    500: "hsl(188, 100%, 50%)",
    600: "hsl(192, 100%, 42%)",
    700: "hsl(193, 100%, 34%)",
    800: "hsl(193, 100%, 26%)",
    900: "hsl(195, 92%, 24%)",
    950: "hsl(196, 100%, 8%)",
  },
  "tints.dev": {
    50: "oklch(97.61% 0 NaN / <alpha-value>)",
    100: "oklch(95.51% 0 NaN / <alpha-value>)",
    200: "oklch(90.38% 0.011 219.6 / <alpha-value>)",
    300: "oklch(85.28% 0.035 215.06 / <alpha-value>)",
    400: "oklch(78.07% 0.075 216.86 / <alpha-value>)",
    500: "oklch(70.72% 0.121 221.5 / <alpha-value>)",
    600: "oklch(61.05% 0.11 222.94 / <alpha-value>)",
    700: "oklch(48.15% 0.092 225.47 / <alpha-value>)",
    800: "oklch(43.14% 0.076 222.23 / <alpha-value>)",
    900: "oklch(33.22% 0.053 220.83 / <alpha-value>)",
    950: "oklch(27.19% 0.036 219.89 / <alpha-value>)",
  },
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,vue}"],
  darkMode: "selector",
  theme: {
    extend: {
      colors: {
        calypso: calypso["tints.dev"],
      },
      animation: {
        marquee: "marquee var(--marquee-duration, 10s) linear infinite",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};
