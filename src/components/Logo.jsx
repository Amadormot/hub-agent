export default function Logo({ size = 40, className = "" }) {
    return (
        <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-xl">
                <defs>
                    <linearGradient id="logoGradient" x1="0" y1="0" x2="100" y2="100">
                        <stop offset="0%" stopColor="#EA580C" />
                        <stop offset="100%" stopColor="#C2410C" />
                    </linearGradient>
                </defs>

                {/* Background Shape - Aerodynamic Shield */}
                <path
                    d="M50 5 L90 25 L85 80 L50 95 L15 80 L10 25 L50 5 Z"
                    fill="#171717"
                    stroke="url(#logoGradient)"
                    strokeWidth="3"
                />

                {/* Stylized M - Resembling front cowl/handlebars */}
                <path
                    d="M25 40 L45 40 L50 55 L55 40 L75 40 L70 70 L30 70 Z"
                    fill="url(#logoGradient)"
                />

                {/* Speed Accent */}
                <path d="M50 20 L50 30" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" />
            </svg>
        </div>
    );
}
