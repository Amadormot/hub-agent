export default function Logo({ size = 40, className = "" }) {
    return (
        <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-xl">
                <defs>
                    <linearGradient id="logoGradient" x1="0" y1="0" x2="100" y2="100">
                        <stop offset="0%" stopColor="#EA580C" />
                        <stop offset="100%" stopColor="#C2410C" />
                    </linearGradient>
                    <mask id="shieldMask">
                        <path d="M50 5 L90 25 L85 80 L50 95 L15 80 L10 25 Z" fill="white" />
                    </mask>
                </defs>

                {/* Shield Border */}
                <path
                    d="M50 5 L90 25 L85 80 L50 95 L15 80 L10 25 Z"
                    fill="#101010"
                    stroke="url(#logoGradient)"
                    strokeWidth="4"
                />

                <g mask="url(#shieldMask)">
                    {/* 1. NOTÍCIAS (Signal waves in background) */}
                    <path d="M70 30 Q80 40 70 50" stroke="white" strokeWidth="2" strokeOpacity="0.1" fill="none" />
                    <path d="M75 25 Q90 40 75 55" stroke="white" strokeWidth="2" strokeOpacity="0.05" fill="none" />

                    {/* 2. OFICINA (Bottom-right gear segment) */}
                    <circle cx="85" cy="85" r="15" stroke="url(#logoGradient)" strokeWidth="8" strokeDasharray="4 4" strokeOpacity="0.2" />

                    {/* 3. ROTAS (Winding Road) */}
                    <path
                        d="M20 70 C 35 70, 35 30, 50 30 C 65 30, 65 70, 80 70"
                        stroke="url(#logoGradient)"
                        strokeWidth="6"
                        strokeLinecap="round"
                        fill="none"
                    />

                    {/* 4. EVENTOS (Central Highlight Star) */}
                    <path
                        d="M50 20 L53 35 L68 38 L53 41 L50 55 L47 41 L32 38 L47 35 Z"
                        fill="white"
                        className="animate-pulse"
                    />
                </g>

                {/* Accent Point */}
                <circle cx="50" cy="30" r="2" fill="white" />
            </svg>
        </div>
    );
}
