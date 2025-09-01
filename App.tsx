import React, { useState, useCallback } from 'react';
import { editImageWithGemini } from './services/geminiService';
import { fileToGenerativePart } from './utils/imageUtils';
import { ImageCard } from './components/ImageCard';
import { ImageModal } from './components/ImageModal';
import { MagicWandIcon, UploadIcon } from './components/icons';
import { INITIAL_IMAGE_DATA_URL, STYLES } from './constants';
import type { Part } from '@google/genai';

// Define the state structure for each styled image
interface StyledImageState {
  url: string | null;
  isLoading: boolean;
  error: string | null;
}

// Initialize the state for all styles
const initialStyledImages = STYLES.reduce((acc, style) => {
  acc[style.name] = { url: null, isLoading: false, error: null };
  return acc;
}, {} as Record<string, StyledImageState>);


const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<{ url: string; part: Part | null }>({
    url: INITIAL_IMAGE_DATA_URL,
    part: null,
  });
  const [styledImages, setStyledImages] = useState<Record<string, StyledImageState>>(initialStyledImages);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null); // For global errors like file upload
  const [modalData, setModalData] = useState<{ url: string; title: string } | null>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const generativePart = await fileToGenerativePart(file);
        setOriginalImage({ url: URL.createObjectURL(file), part: generativePart });
        setStyledImages(initialStyledImages); // Reset styled images on new upload
        setError(null);
      } catch (err) {
        setError('Failed to process image file. Please try another one.');
        console.error(err);
      }
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!originalImage.url) {
      setError('Please upload an image first.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    // Set loading state for all cards
    const loadingState = STYLES.reduce((acc, style) => {
      acc[style.name] = { url: null, isLoading: true, error: null };
      return acc;
    }, {} as Record<string, StyledImageState>);
    setStyledImages(loadingState);

    try {
      let imagePartToProcess = originalImage.part;
      if (!imagePartToProcess) {
        // Fallback for initial image
        const response = await fetch(INITIAL_IMAGE_DATA_URL);
        const blob = await response.blob();
        const file = new File([blob], "initial_image.jpeg", { type: blob.type });
        imagePartToProcess = await fileToGenerativePart(file);
        // Also update the part in the state for future regenerations
        setOriginalImage(prev => ({ ...prev, part: imagePartToProcess }));
      }

      if (!imagePartToProcess) {
        throw new Error("Could not create image part from initial data.");
      }

      const generationPromises = STYLES.map(style =>
        editImageWithGemini(imagePartToProcess!, style.prompt)
          .then(result => ({
            styleName: style.name,
            url: result.image,
            error: result.image ? null : (result.text || 'Generation failed.'),
          }))
          .catch(error => ({
            styleName: style.name,
            url: null,
            error: error.message || 'An unexpected error occurred.',
          }))
      );
      
      const results = await Promise.all(generationPromises);
      
      const finalState = results.reduce((acc, result) => {
        acc[result.styleName] = {
          url: result.url,
          isLoading: false,
          error: result.error,
        };
        return acc;
      }, {} as Record<string, StyledImageState>);
      
      setStyledImages(finalState);

    } catch (err: any) {
      console.error(err);
      // Set a global error and reset cards
      setError(err.message || 'An unexpected error occurred. Please try again.');
      setStyledImages(initialStyledImages);
    } finally {
      setIsGenerating(false);
    }
  }, [originalImage]);

  const openModal = (url: string, title: string) => {
    setModalData({ url, title });
  };

  const closeModal = () => {
    setModalData(null);
  };


  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            AI Cultural Stylist
          </h1>
          <p className="mt-2 text-lg text-gray-400">Transform your portrait into different cultural styles.</p>
        </header>

        <main>
          <div className="bg-gray-800/50 rounded-2xl shadow-2xl p-6 backdrop-blur-sm border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div>
                <label htmlFor="file-upload" className="font-semibold text-gray-300 mb-2 block">
                  1. Upload Your Image
                </label>
                <label
                  htmlFor="file-upload"
                  className="mt-1 flex justify-center w-full px-6 py-8 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer hover:border-purple-500 hover:bg-gray-800 transition-all duration-300"
                >
                  <div className="text-center">
                    <UploadIcon className="mx-auto h-12 w-12 text-gray-500" />
                    <p className="mt-2 text-sm text-gray-400">
                      <span className="font-semibold text-purple-400">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 10MB</p>
                  </div>
                  <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageUpload} accept="image/png, image/jpeg, image/webp" />
                </label>
              </div>

              <div className="flex flex-col gap-4">
                 <p className="font-semibold text-gray-300">2. Generate Styles</p>
                 <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !originalImage.url}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 text-lg font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                >
                  {isGenerating ? (
                     <>
                      <div className="w-6 h-6 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
                      Generating Styles...
                    </>
                  ) : (
                    <>
                      <MagicWandIcon className="w-6 h-6" />
                      Generate All Styles
                    </>
                  )}
                </button>
              </div>
            </div>
            {error && (
              <div className="mt-6 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg">
                <p><span className="font-bold">Error:</span> {error}</p>
              </div>
            )}
          </div>
          
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
             <ImageCard title="Original" imageUrl={originalImage.url} />
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {STYLES.map(style => (
                      <ImageCard
                          key={style.name}
                          title={style.name}
                          imageUrl={styledImages[style.name].url}
                          isLoading={styledImages[style.name].isLoading}
                          error={styledImages[style.name].error}
                          onClick={() => {
                            if (styledImages[style.name].url) {
                              openModal(styledImages[style.name].url!, style.name);
                            }
                          }}
                      />
                  ))}
              </div>
          </div>
        </main>
      </div>
      <ImageModal
        isOpen={!!modalData}
        onClose={closeModal}
        imageUrl={modalData?.url ?? null}
        title={modalData?.title ?? null}
      />
    </div>
  );
};

export default App;