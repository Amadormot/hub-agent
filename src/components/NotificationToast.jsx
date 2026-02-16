import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-react';
import { clsx } from 'clsx';

export default function NotificationToast({ message, type, onClose }) {
    const icons = {
        success: <CheckCircle className="text-green-500" size={20} />,
        error: <XCircle className="text-red-500" size={20} />,
        warning: <AlertCircle className="text-yellow-500" size={20} />,
        info: <Info className="text-blue-500" size={20} />
    };

    const colors = {
        success: 'border-green-500/50 bg-green-500/10',
        error: 'border-red-500/50 bg-red-500/10',
        warning: 'border-yellow-500/50 bg-yellow-500/10',
        info: 'border-blue-500/50 bg-blue-500/10'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={clsx(
                "pointer-events-auto flex items-center gap-3 p-4 rounded-2xl border backdrop-blur-md shadow-2xl",
                colors[type] || colors.info
            )}
        >
            <div className="flex-shrink-0">
                {icons[type] || icons.info}
            </div>
            <p className="text-sm font-medium text-white flex-1 leading-tight">
                {message}
            </p>
            <button
                onClick={onClose}
                className="flex-shrink-0 text-white/40 hover:text-white transition-colors"
            >
                <X size={16} />
            </button>
        </motion.div>
    );
}
