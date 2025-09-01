// FIX: Replaced deprecated type 'GenerativePart' with 'Part'.
import type { Part } from '@google/genai';

// FIX: Replaced deprecated type 'GenerativePart' with 'Part'.
const fileToGenerativePart = (file: File): Promise<Part> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        return reject(new Error('FileReader did not return a string.'));
      }
      // result is a data URL like "data:image/jpeg;base64,..."
      // We need to extract just the base64 part
      const base64String = reader.result.split(',')[1];
      if (!base64String) {
        return reject(new Error('Could not extract base64 string from file.'));
      }
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

export { fileToGenerativePart };
