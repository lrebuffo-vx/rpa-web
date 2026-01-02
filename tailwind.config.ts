import type { Config } from "tailwindcss";

const config: Config = {
    content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    200: '#bce3fb', // Added for better gradients
                    300: '#7dd3fc',
                    400: '#38bdf8', // Added
                    500: '#06b6d4',
                    600: '#0891b2',
                    700: '#0e7490',
                },
                dark: '#0a0a0f',
                'glass-bg': 'rgba(255, 255, 255, 0.05)',
                'glass-border': 'rgba(255, 255, 255, 0.1)',
            },
            backdropBlur: {
                xs: '2px',
            },
            fontFamily: {
                outfit: ['Outfit', 'sans-serif'],
            },
            animation: {
                'float': 'float 10s ease-in-out infinite',
                'in': 'fade-in 0.2s ease-out',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                }
            },
        },
    },
    plugins: [],
};
export default config;
