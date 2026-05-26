import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#F8FAFC", // Clean slate/white background
                surface: "#FFFFFF",    // Pure white for cards
                primary: "#0077B6",    // Medical Teal/Blue
                secondary: "#48CAE4",  // Lighter accent teal
                accent: "#03045E",     // Deep navy for text/headings
                success: "#10B981",    // Green for normal/clean data
                danger: "#EF4444",     // Red for anomalies/critical alerts
                warning: "#F59E0B",    // Amber for warnings
                muted: "#64748B",      // Slate gray for secondary text
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
        },
    },
    plugins: [],
};
export default config;