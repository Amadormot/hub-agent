import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCcw } from 'lucide-react';

export default function PullToRefresh({ onRefresh, isRefreshing, children }) {
    const [pullDistance, setPullDistance] = useState(0);
    const [isPulling, setIsPulling] = useState(false);
    const startY = useRef(0);
    const containerRef = useRef(null);

    const handleTouchStart = (e) => {
        if (window.scrollY === 0) {
            startY.current = e.touches[0].pageY;
            setIsPulling(true);
        }
    };

    const handleTouchMove = (e) => {
        if (!isPulling) return;

        const currentY = e.touches[0].pageY;
        const diff = currentY - startY.current;

        if (diff > 0 && window.scrollY === 0) {
            // Apply resistance
            const dampedDiff = Math.pow(diff, 0.8);
            setPullDistance(dampedDiff);

            // Prevent scrolling when pulling
            if (diff > 10 && e.cancelable) {
                // e.preventDefault(); // Sometimes problematic in some browsers
            }
        } else {
            setPullDistance(0);
        }
    };

    const handleTouchEnd = () => {
        if (pullDistance > 60) {
            onRefresh();
        }
        setPullDistance(0);
        setIsPulling(false);
    };

    return (
        <div
            ref={containerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative min-h-screen"
        >
            {/* Refresh Indicator */}
            <div
                className="absolute left-0 right-0 flex justify-center pointer-events-none z-[100]"
                style={{
                    top: -40,
                    transform: `translateY(${Math.min(pullDistance, 100)}px)`,
                    opacity: Math.min(pullDistance / 60, 1)
                }}
            >
                <div className={`
                    w-12 h-12 rounded-full bg-primary text-black flex items-center justify-center shadow-2xl border-2 border-white/20
                    ${isRefreshing ? 'animate-spin' : ''}
                `}>
                    <RefreshCcw size={20} style={{ transform: `rotate(${pullDistance * 2}deg)` }} />
                </div>
            </div>

            {/* Content Display while refreshing */}
            <AnimatePresence>
                {isRefreshing && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 60, opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="w-full flex items-center justify-center overflow-hidden"
                    >
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Sincronizando Radar...</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {children}
        </div>
    );
}
