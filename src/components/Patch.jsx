import { motion } from 'framer-motion';
import { Shield, Baby, Bike, Map, TrendingUp, Sunrise, BatteryCharging, CloudRain, Users, Tent, Crown } from 'lucide-react';

const iconMap = {
    Shield, Baby, Bike, Map, TrendingUp, Sunrise, BatteryCharging, CloudRain, Users, Tent, Crown
};

export default function Patch({ name, iconName, image, level, size = 'md' }) {
    const IconComponent = iconMap[iconName] || Shield;

    const sizes = {
        sm: 'w-16 h-16',
        md: 'w-24 h-24',
        lg: 'w-32 h-32'
    };

    const iconSizes = {
        sm: 24,
        md: 40,
        lg: 56
    };

    // Define colors based on level tiers
    const getTierColors = (lvl) => {
        if (lvl >= 10) return 'from-yellow-600 to-yellow-900 border-yellow-400 text-yellow-100 shadow-yellow-900/40';
        if (lvl >= 7) return 'from-blue-600 to-blue-900 border-blue-400 text-blue-100 shadow-blue-900/40';
        if (lvl >= 4) return 'from-red-600 to-red-900 border-red-400 text-red-100 shadow-red-900/40';
        return 'from-gray-700 to-gray-950 border-gray-500 text-gray-200 shadow-black/40';
    };

    return (
        <motion.div
            whileHover={{ scale: 1.05, rotate: 2 }}
            className={`relative ${sizes[size]} flex flex-col items-center justify-center group`}
        >
            {/* Outer Border (Stitching effect) */}
            <div className={`absolute inset-0 rounded-full border-4 border-dashed opacity-40 animate-[spin_20s_linear_infinite] ${getTierColors(level)}`}></div>

            {/* Main Patch Body */}
            <div className={`
        relative w-full h-full rounded-full 
        bg-gradient-to-br ${getTierColors(level)} 
        border-[3px] shadow-xl 
        flex flex-center items-center justify-center
        overflow-hidden
      `}>
                {/* Fabric Texture Overlay */}
                <div className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '3px 3px' }}></div>

                {/* Inner shadow for depth */}
                <div className="absolute inset-0 shadow-[inset_0_4px_12px_rgba(0,0,0,0.5)] rounded-full"></div>

                {/* Content: Image or Icon */}
                {image ? (
                    <div className="relative z-10 w-full h-full p-1">
                        <img
                            src={image}
                            alt={name}
                            className="w-full h-full object-cover rounded-full drop-shadow-md filter brightness-110"
                        />
                    </div>
                ) : (
                    <div className="relative z-10 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] filter brightness-110">
                        <IconComponent size={iconSizes[size]} strokeWidth={2.5} />
                    </div>
                )}


                {/* Level text at bottom */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 px-2 py-0.5 rounded text-[8px] font-black tracking-tighter uppercase whitespace-nowrap border border-white/10 z-20">
                    LVL {level}
                </div>

                {/* Shine highlight */}
                <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-gradient-to-tr from-transparent via-white/5 to-transparent rotate-45 pointer-events-none"></div>
            </div>

            {/* Label (Visible on hover or below) */}
            <div className="mt-2 text-center">
                <p className="text-[10px] font-black uppercase tracking-tight text-gray-400 group-hover:text-white transition-colors leading-none">
                    {name}
                </p>
            </div>
        </motion.div>
    );
}
