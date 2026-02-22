/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{tsx,ts}",
    "./components/**/*.{tsx,ts}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        display: ["PlayfairDisplaySC_400Regular"],
        "display-bold": ["PlayfairDisplaySC_700Bold"],
        sans: ["Karla_400Regular"],
        "sans-light": ["Karla_300Light"],
        "sans-medium": ["Karla_500Medium"],
        "sans-semibold": ["Karla_600SemiBold"],
        "sans-bold": ["Karla_700Bold"],
      },
      colors: {
        primary: "#DC2626",
        "primary-light": "#F87171",
        cta: "#CA8A04",
        background: "#FEF2F2",
        surface: "#FFFFFF",
        "text-primary": "#450A0A",
        "text-secondary": "#991B1B",
        "text-muted": "#6B7280",
        border: "#FECACA",
        success: "#16A34A",
        warning: "#F59E0B",
        "dark-surface": "#1C1917",
        "dark-card": "#292524",
      },
    },
  },
  plugins: [],
};
