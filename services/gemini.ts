import { GoogleGenAI, Type } from "@google/genai";
import type { HarmonyExplanation, ProgressionSuggestion } from "../types";

const getAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("Gemini API key no configurada (VITE_GEMINI_API_KEY).");
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
        analysis: "La IA no está configurada correctamente (falta VITE_GEMINI_API_KEY).",
        commonUsage: "",
        suggestedNext: [],
      };
    }

    const response = await ai.models.generateContent({
      // ✅ modelo recomendado (más estable)
      model: "gemini-1.5-flash",
      contents: `Explica la función armónica del acorde ${chord} en el contexto de ${key}. Proporciona un análisis teórico, su uso común en la música popular y 3 acordes siguientes sugeridos con razones breves. TODO EL CONTENIDO DEBE ESTAR EN ESPAÑOL.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING, description: "Análisis teórico en español." },
            commonUsage: { type: Type.STRING, description: "Uso común en la música en español." },
            suggestedNext: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  chord: { type: Type.STRING },
                  reason: { type: Type.STRING, description: "Razón del acorde sugerido en español." },
                },
                required: ["chord", "reason"],
              },
            },
          },
          required: ["analysis", "commonUsage", "suggestedNext"],
        },
      },
    });

    const text = response.text;
    if (!text) return null;

    return JSON.parse(text) as HarmonyExplanation;
  } catch (error) {
    console.error("Error fetching harmony explanation:", error);
    return null;
  }
};

export const getProgressionSuggestion = async (
  prompt: string,
  currentKey: string
): Promise<ProgressionSuggestion | null> => {
  try {
    const ai = getAI(); // ✅ ESTO FALTABA
    if (!ai) {
      return {
        text: "La IA no está configurada correctamente (falta VITE_GEMINI_API_KEY).",
        chords: [],
      };
    }

    const response = await ai.models.generateContent({
      // ✅ modelo recomendado (más estable)
      model: "gemini-1.5-flash",
      contents: `Se solicita consejo de armonía musical: "${prompt}".
Contexto: tonalidad de ${currentKey} Mayor.
Sugiere una progresión usando estrictamente GRADOS ROMANOS (relativos a cualquier tonalidad Mayor).
Ejemplos: 'I', 'ii', 'V7', 'vi', 'bVII', 'IVm', 'ii7b5'.
Devuelve un JSON con una explicación en ESPAÑOL y una lista de estos grados relativos en 'chords'.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING, description: "Contexto musical de la sugerencia en ESPAÑOL." },
            chords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Secuencia de GRADOS ROMANOS relativos a la tónica.",
            },
            suggestedKey: { type: Type.STRING, description: "Nueva tonalidad si se recomienda modulación." },
          },
          required: ["text", "chords"],
        },
      },
    });

    const result = response.text;
    if (!result) return null;

    return JSON.parse(result) as ProgressionSuggestion;
  } catch (error) {
    console.error("Error fetching progression suggestion:", error);
    return null;
  }
};
