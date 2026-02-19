import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

export default function CitySearchInput({
    cities = [],
    value = '',
    onChange,
    placeholder = "Digite o nome da cidade...",
    disabled = false,
    label = "",
    icon: Icon = MapPin
}) {
    const [query, setQuery] = useState(value);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const containerRef = useRef(null);

    const filteredCities = query.length >= 2
        ? cities.filter(city =>
            city.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                .includes(query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
        ).slice(0, 10)
        : [];

    useEffect(() => {
        setQuery(value);
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (city) => {
        setQuery(city);
        onChange(city);
        setIsOpen(false);
        setSelectedIndex(-1);
    };

    const handleKeyDown = (e) => {
        if (!isOpen) {
            if (e.key === 'ArrowDown' && filteredCities.length > 0) {
                setIsOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => (prev < filteredCities.length - 1 ? prev + 1 : prev));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0) {
                    handleSelect(filteredCities[selectedIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                break;
        }
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            {label && <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{label}</label>}

            <div className="relative group">
                <Icon size={16} className={clsx(
                    "absolute left-3 top-1/2 -translate-y-1/2 transition-colors",
                    isOpen ? "text-primary" : "text-gray-500"
                )} />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        const newVal = e.target.value;
                        setQuery(newVal);
                        setIsOpen(true);
                        setSelectedIndex(-1);
                        onChange(newVal);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    placeholder={placeholder}
                    className={clsx(
                        "w-full bg-black/20 border border-white/10 rounded-lg p-3 pl-10 pr-10 text-sm text-white focus:border-primary focus:outline-none transition-all placeholder:text-gray-600",
                        disabled && "opacity-50 cursor-not-allowed"
                    )}
                />

                {query && (
                    <button
                        type="button"
                        onClick={() => {
                            setQuery('');
                            onChange('');
                            setIsOpen(false);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            <AnimatePresence>
                {isOpen && filteredCities.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-[110] left-0 right-0 mt-2 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto no-scrollbar"
                    >
                        {filteredCities.map((city, index) => (
                            <button
                                key={city}
                                type="button"
                                onClick={() => handleSelect(city)}
                                onMouseEnter={() => setSelectedIndex(index)}
                                className={clsx(
                                    "w-full text-left px-4 py-3 text-sm transition-colors flex items-center gap-3",
                                    index === selectedIndex ? "bg-primary text-black font-bold" : "text-gray-300 hover:bg-white/5"
                                )}
                            >
                                <MapPin size={14} className={index === selectedIndex ? "text-black" : "text-primary"} />
                                <span>{city}</span>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
