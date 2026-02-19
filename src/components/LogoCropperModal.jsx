import { useState, useRef, useEffect } from 'react';
import { X, Check, ZoomIn, ZoomOut, Move } from 'lucide-react';

export default function LogoCropperModal({ isOpen, onClose, imageSrc, onSave }) {
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const imageRef = useRef(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setZoom(1);
            setPosition({ x: 0, y: 0 });
        }
    }, [isOpen, imageSrc]);

    if (!isOpen || !imageSrc) return null;

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY * -0.01;
        const newZoom = Math.min(Math.max(0.5, zoom + delta), 3);
        setZoom(newZoom);
    };

    const handleSave = () => {
        // Here we would typically crop the image using canvas,
        // but since we are saving settings to localStorage for the logo component to use visually,
        // we can save the transform data along with the image base64, OR crop it to a new base64.
        // For simplicity and performance, let's crop it to a new base64 string using canvas.

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = imageRef.current;

        // Set canvas size (e.g., 200x200 for logo)
        canvas.width = 200;
        canvas.height = 200;

        // Fill white background (transparency control) - User asked for white bg round
        // Let's keep it transparent in canvas so user can decide, but our logo component puts a white circle behind anyway.
        // Actually, let's make it fully transparent so it works well on top of the white circle.
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw image with transforms
        // origin is center
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(zoom, zoom);
        ctx.translate(position.x / zoom, position.y / zoom); // Adjust position relative to zoom

        // Draw image centered
        ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

        const croppedImageBase64 = canvas.toDataURL('image/png');
        onSave(croppedImageBase64);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-background-secondary border border-white/10 rounded-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-white/5 flex justify-between items-center">
                    <h3 className="text-white font-bold">Ajustar Logo</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 flex-1 flex flex-col items-center justify-center bg-black/40 relative overflow-hidden select-none">
                    {/* Circular Mask Overlay */}
                    <div className="w-48 h-48 rounded-full border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] z-10 pointer-events-none absolute"></div>

                    <div
                        className="relative w-full h-64 flex items-center justify-center cursor-move"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onWheel={handleWheel} // Capture scroll for zoom
                    >
                        <img
                            ref={imageRef}
                            src={imageSrc}
                            alt="Preview"
                            className="max-w-none origin-center"
                            style={{
                                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                                transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                            }}
                            draggable={false}
                        />
                    </div>
                </div>

                <div className="p-4 border-t border-white/5 space-y-4">
                    {/* Controls */}
                    <div className="flex items-center gap-4 justify-center">
                        <ZoomOut size={16} className="text-gray-400" />
                        <input
                            type="range"
                            min="0.5"
                            max="3"
                            step="0.1"
                            value={zoom}
                            onChange={(e) => setZoom(parseFloat(e.target.value))}
                            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full"
                        />
                        <ZoomIn size={16} className="text-gray-400" />
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 rounded-xl text-sm font-bold bg-primary text-white hover:bg-orange-600 transition-colors flex items-center gap-2"
                        >
                            <Check size={16} />
                            Salvar Logo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

