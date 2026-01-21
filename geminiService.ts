
import { GoogleGenAI } from "@google/genai";

// Initialize the GoogleGenAI client using process.env.API_KEY directly as a named parameter
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateCourseDescription = async (courseName: string) => {
  try {
    // Call generateContent directly from ai.models without creating a model instance first
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gere uma descrição profissional e motivadora de até 3 frases para um curso chamado "${courseName}".`,
    });
    // Access the .text property directly (not a method) as per SDK guidelines
    return response.text || "Sem descrição disponível.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erro ao gerar descrição automática.";
  }
};

export const summarizePatientCase = async (patientName: string, notes: string) => {
  try {
    // Call generateContent directly from ai.models without creating a model instance first
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Resuma brevemente o caso clínico do paciente ${patientName} baseado nestas notas: "${notes}". Foco em pontos chave para o analista.`,
    });
    // Access the .text property directly
    return response.text || "Sem resumo disponível.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erro ao processar resumo.";
  }
};
