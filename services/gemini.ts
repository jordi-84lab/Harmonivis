import { GoogleGenAI } from "@google/genai";
import { HarmonyExplanation, ProgressionSuggestion } from "../types";

const getAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("Gemini API key no configurada");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const getHarmonyExplanation = async (
  chord: string,
  key: string
): Promise<HarmonyExplanation | null> => {
  try {
    const ai = getAI();
    if (!ai) {
      return {
        analysis: "La IA no está configurada.",
        commonUsage: "",
        suggestedNext: [],
      };
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
Explica la función armónica del acorde ${chord} en la tonalidad de ${key}.
Incluye:
- análisis teórico
- uso común
- 3 acordes siguientes sugeridos con explicación
TODO EN ESPAÑOL.
Devuelve SOLO JSON con:
analysis, commonUsage, suggestedNext[{chord, reason}]
      `,
    });

    const text = response.text;
    if (!text) return null;

    return JSON.parse(text) as HarmonyExplanation;
  } catch (error) {
    console.error("Harmony error:", error);
    return null;
  }
};

export const getProgressionSuggestion = async (
  prompt: string,
  currentKey: string
): Promise<ProgressionSuggestion | null> => {
  try {
    const ai = getAI();
    if (!ai) {
      return {
        text: "IA no configurada.",
        chords: [],
        suggestedKey: currentKey,
      };
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
Petición musical: "${prompt}"
Tonalidad: ${currentKey} Mayor

Sugiere una progresión usando SOLO GRADOS ROMANOS.
Ejemplos: I, ii, V7, vi, bVII, IVm

Devuelve SOLO JSON:
{
  "text": "explicación en español",
  "chords": ["I", "V", "vi", "IV"]
}
      `,
    });

    const text = response.text;
    if (!text) return null;

    return JSON.parse(text) as ProgressionSuggestion;
  } catch (error) {
    console.error("Progression error:", error);
    return null;
  }
};
