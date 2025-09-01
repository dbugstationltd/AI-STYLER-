import React from 'react';
import { ImageIcon, LoadingIcon, AlertIcon } from './icons';

interface ImageCardProps {
  title: string;
  imageUrl: string | null;
  isLoading?: boolean;
  error?: string | null;
  onClick?: () => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({ title, imageUrl, isLoading = false, error = null, onClick }) => {
  const isClickable = !!imageUrl && !isLoading && !error && !!onClick && title !== 'Original';

  return (
    <div
      className={`bg-gray-800/50 rounded-2xl p-4 shadow-lg border border-gray-700 flex flex-col ${isClickable ? 'cursor-pointer transition-transform duration-300 hover:scale-105' : ''}`}
      onClick={isClickable ? onClick : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : -1}
      onKeyDown={isClickable ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick() : undefined}
      aria-label={isClickable ? `View ${title} image` : title}
    >
      <h2 className="text-xl font-bold text-center text-gray-300 mb-4 truncate">{title}</h2>
      <div className="aspect-square w-full bg-gray-900 rounded-lg flex items-center justify-center overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
            <LoadingIcon className="w-16 h-16 text-purple-400" />
            <p className="mt-4 text-lg text-gray-300">Styling...</p>
          </div>
        )}
        {error && !isLoading && (
          <div className="absolute inset-0 bg-red-900/30 flex flex-col items-center justify-center z-10 p-4 text-center">
            <AlertIcon className="w-12 h-12 text-red-400" />
            <p className="mt-4 text-sm text-red-300 font-semibold">{error}</p>
          </div>
        )}
        {imageUrl && !error ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-contain transition-opacity duration-500"
            loading="lazy"
          />
        ) : (
          !isLoading && !error && (
            <div className="text-gray-600 flex flex-col items-center">
              <ImageIcon className="w-24 h-24" />
              <p className="mt-2 text-center">{title === 'Original' ? 'Upload an image' : 'Style will appear here'}</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};