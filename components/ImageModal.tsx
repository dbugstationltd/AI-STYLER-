import React, { useEffect, useState } from 'react';
import { CloseIcon, DownloadIcon, ShareIcon } from './icons';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  title: string | null;
}

export const ImageModal: React.FC<ImageModalProps> = ({ isOpen, onClose, imageUrl, title }) => {
  const [showCopied, setShowCopied] = useState(false);
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleDownload = () => {
    if (!imageUrl || !title) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    // Sanitize title for filename
    const fileName = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `${fileName}_styled.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!imageUrl || !title) return;

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], `${title}.png`, { type: blob.type });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `AI Styled Image: ${title}`,
          text: 'Check out this image I created with the AI Cultural Stylist!',
          files: [file],
        });
      } else {
        // Fallback for browsers that don't support sharing files
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob })
        ]);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
      }
    } catch (err) {
      console.error('Share/Copy failed:', err);
      alert('Action failed. Please try downloading the image instead.');
    }
  };


  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-modal-title"
    >
      <div
        className="bg-gray-800/50 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 id="image-modal-title" className="text-2xl font-bold text-gray-200">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>

        <div className="p-4 flex-1 flex items-center justify-center overflow-hidden">
            <img
                src={imageUrl}
                alt={title ?? 'Styled image'}
                className="max-w-full max-h-full object-contain"
            />
        </div>

        <footer className="flex flex-col sm:flex-row items-center justify-center gap-4 p-4 border-t border-gray-700">
            <button
                onClick={handleDownload}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 font-semibold text-white bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
                <DownloadIcon className="w-5 h-5" />
                Download
            </button>
            <button
                onClick={handleShare}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors relative"
            >
                <ShareIcon className="w-5 h-5" />
                {showCopied ? 'Copied!' : (navigator.share ? 'Share' : 'Copy Image')}
            </button>
        </footer>
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};