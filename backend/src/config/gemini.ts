import { GoogleGenerativeAI } from '@google/generative-ai';

export const geminiConfig = {
  apiKey: process.env.GEMINI_API_KEY || '',
  model: 'gemini-2.0-flash-exp', // Modèle Gemini 2.0 Flash
};

// Vérifier que la clé API est configurée (seulement si elle est accédée)
let genAIInstance: GoogleGenerativeAI | null = null;

// Obtenir l'instance Gemini (lazy loading)
export const getGenAI = () => {
  if (!genAIInstance) {
    const apiKey = process.env.GEMINI_API_KEY || geminiConfig.apiKey;
    if (!apiKey) {
      console.warn('⚠️  GEMINI_API_KEY is not configured in .env');
    }
    genAIInstance = new GoogleGenerativeAI(apiKey);
  }
  return genAIInstance;
};

// Obtenir le modèle
export const getGeminiModel = () => {
  const genAI = getGenAI();
  return genAI.getGenerativeModel({ 
    model: geminiConfig.model,
  });
};
