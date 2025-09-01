import { GoogleGenAI, Modality } from "@google/genai";
// FIX: Replaced deprecated type 'GenerativePart' with 'Part'.
import type { GenerateContentResponse, Part } from '@google/genai';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

interface EditResult {
  image: string | null;
  text: string | null;
}

export const editImageWithGemini = async (
  // FIX: Replaced deprecated type 'GenerativePart' with 'Part'.
  imagePart: Part,
  prompt: string
): Promise<EditResult> => {
  if (!prompt.trim()) {
    throw new Error('Prompt cannot be empty.');
  }
  if (!imagePart) {
    throw new Error('Image part is missing.');
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          imagePart,
          { text: prompt },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    let editedImage: string | null = null;
    let textResponse: string | null = null;

    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64ImageBytes: string = part.inlineData.data;
          const mimeType = part.inlineData.mimeType;
          editedImage = `data:${mimeType};base64,${base64ImageBytes}`;
        } else if (part.text) {
          textResponse = part.text;
        }
      }
    }

    if (!editedImage && !textResponse) {
       throw new Error("The API returned an empty response. The prompt may have been blocked.");
    }

    return { image: editedImage, text: textResponse };
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw new Error('Failed to generate image. Please check your prompt and try again.');
  }
};
