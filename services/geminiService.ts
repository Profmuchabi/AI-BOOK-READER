
import { GoogleGenAI, Modality } from "@google/genai";

// Ensure the API key is available from environment variables
if (!process.env.API_KEY) {
  // In a real app, you might show a more user-friendly error or disable features.
  // For this context, we throw an error to make the dependency clear.
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generates speech from text using the Gemini API, with retry logic.
 * @param text The text to convert to speech.
 * @param voiceName The pre-built voice to use for the narration.
 * @param abortSignal An optional AbortSignal to cancel the operation.
 * @returns A promise that resolves to the base64 encoded audio data.
 */
export const generateSpeech = async (text: string, voiceName: string, abortSignal?: AbortSignal): Promise<string> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (abortSignal?.aborted) {
      throw new DOMException('Aborted by user', 'AbortError');
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (!base64Audio) {
        throw new Error("No audio data received from API.");
      }
      
      return base64Audio;
    } catch (error: any) {
      lastError = error;
      console.warn(`Gemini API call attempt ${attempt + 1} failed:`, error);
      
      if (attempt === MAX_RETRIES - 1) break;

      if (error.name === 'AbortError') {
          throw error;
      }

      const backoffTime = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
      await sleep(backoffTime);
    }
  }

  console.error("Error calling Gemini API after all retries:", lastError);
  // Re-throw a more specific error to be handled by the UI
  throw new Error("Failed to generate speech. Please check your API key and network connection.");
};
