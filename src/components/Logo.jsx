export default function Logo({ size = 40, className = "" }) {
    return (
        <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-xl">
                {/* 1. Engrenagem Externa (Preta/Escura) */}
                <path
                    d="M50 2 L54 10 A42 42 0 0 1 65 13 L71 6 L79 11 L77 20 A42 42 0 0 1 87 30 L95 28 L98 37 L90 42 A42 42 0 0 1 90 58 L98 63 L95 72 L87 70 A42 42 0 0 1 77 80 L79 89 L71 94 L65 87 A42 42 0 0 1 54 90 L50 98 L40 98 L36 90 A42 42 0 0 1 25 87 L19 94 L11 89 L13 80 A42 42 0 0 1 3 70 L-5 72 L-8 63 L0 58 A42 42 0 0 1 0 42 L-8 37 L-5 28 L3 30 A42 42 0 0 1 13 20 L11 11 L19 6 L25 13 A42 42 0 0 1 36 10 L40 2 L50 2 Z"
                    fill="#171717"
                />

                {/* 2. Círculo Laranja Interno */}
                <circle cx="50" cy="50" r="35" stroke="#EA580C" strokeWidth="4" />

                {/* 3. Estrada Sinuosa (Laranja) */}
                <path
                    d="M45 80 C 45 80, 75 75, 75 55 C 75 40, 35 55, 35 35 C 35 25, 45 20, 50 20"
                    stroke="#EA580C"
                    strokeWidth="10"
                    strokeLinecap="round"
                    fill="none"
                />

                {/* 4. Estrela no Topo (Laranja) */}
                <path
                    d="M50 5 L53 14 L63 14 L55 20 L58 30 L50 24 L42 30 L45 20 L37 14 L47 14 Z"
                    fill="#EA580C"
                />

                {/* 5. Três Pontos (Escuros) */}
                <circle cx="45" cy="40" r="2.5" fill="#171717" />
                <circle cx="52.5" cy="40" r="2.5" fill="#171717" />
                <circle cx="60" cy="40" r="2.5" fill="#171717" />
            </svg>
        </div>
    );
}
