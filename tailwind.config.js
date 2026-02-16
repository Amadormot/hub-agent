/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: {
                    DEFAULT: '#0A0A0A', // Neutral 950
                    secondary: '#171717', // Neutral 900
                },
                primary: {
                    DEFAULT: '#EA580C', // Orange Moto
                    foreground: '#FFFFFF',
                },
                premium: {
                    DEFAULT: '#EAB308', // Gold
                },
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            borderRadius: {
                'xl': '2.5rem', // 32px for cards/buttons
            }
        },
    },
    plugins: [],
}
