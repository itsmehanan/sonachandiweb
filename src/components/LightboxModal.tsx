import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface LightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
  title: string;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  isOpen,
  onClose,
  images,
  currentIndex,
  onSelectIndex,
  title,
}) => {
  if (!isOpen || images.length === 0) return null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectIndex((currentIndex - 1 + images.length) % images.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectIndex((currentIndex + 1) % images.length);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image gallery lightbox"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2 text-white/80 hover:text-white bg-white/10 rounded-full transition-colors z-20"
        aria-label="Close lightbox"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Main Image Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-4xl max-h-[85vh] flex flex-col items-center"
      >
        <img
          src={images[currentIndex]}
          alt={`${title} - view ${currentIndex + 1}`}
          className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
          referrerPolicy="no-referrer"
        />

        {/* Caption */}
        <div className="mt-4 text-center">
          <p className="text-white text-sm font-medium">{title}</p>
          <p className="text-white/60 text-xs mt-0.5">
            Image {currentIndex + 1} of {images.length}
          </p>
        </div>

        {/* Prev / Next controls */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-[-20px] sm:left-[-50px] top-1/2 -translate-y-1/2 p-2.5 text-white bg-white/10 hover:bg-white/20 rounded-full transition-all"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-[-20px] sm:right-[-50px] top-1/2 -translate-y-1/2 p-2.5 text-white bg-white/10 hover:bg-white/20 rounded-full transition-all"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
