import { getGeminiModel } from '../config/gemini';
import { CVData } from '../models/CV';
import fs from 'fs/promises';
import path from 'path';

/**
 * Service d'extraction de données CV via Gemini AI
 */
export class CVExtractor {
  /**
   * Extrait les données structurées d'un fichier CV
   * @param filePath Chemin absolu vers le fichier CV
   * @param mimeType Type MIME du fichier
   * @returns Données structurées du CV
   */
  async extractFromFile(
    filePath: string,
    mimeType: string
  ): Promise<CVData> {
    try {
      const model = getGeminiModel();

      // Lire le fichier
      const fileBuffer = await fs.readFile(filePath);
      const fileBase64 = fileBuffer.toString('base64');

      // Préparer le prompt pour Gemini
      const prompt = this.buildExtractionPrompt();

      // Préparer les données du fichier pour Gemini
      const filePart = {
        inlineData: {
          data: fileBase64,
          mimeType: mimeType,
        },
      };

      // Appeler Gemini pour extraire les données
      console.log('🔄 Envoi de la requête à Gemini...');
      const result = await model.generateContent([prompt, filePart]);
      const response = await result.response;
      const text = response.text();

      // Parser la réponse JSON
      const cvData = this.parseGeminiResponse(text);

      return cvData;
    } catch (error: any) {
      console.error('Erreur lors de l\'extraction du CV:', error);
      
      // Messages d'erreur plus détaillés
      if (error.status === 403) {
        throw new Error('Clé API Gemini invalide ou API non activée. Vérifiez votre configuration.');
      } else if (error.status === 429) {
        throw new Error('Quota API Gemini dépassé. Veuillez réessayer plus tard.');
      } else if (error.status === 400) {
        throw new Error('Requête invalide. Vérifiez le format du fichier.');
      }
      
      throw new Error('Impossible d\'extraire les données du CV');
    }
  }

  /**
   * Extrait les données d'un texte brut
   * @param text Texte du CV
   * @returns Données structurées du CV
   */
  async extractFromText(text: string): Promise<CVData> {
    try {
      const model = getGeminiModel();
      const prompt = this.buildExtractionPrompt();

      console.log('🔄 Envoi de la requête à Gemini...');
      const result = await model.generateContent([
        prompt,
        `\n\nContenu du CV:\n${text}`,
      ]);
      const response = await result.response;
      const responseText = response.text();

      const cvData = this.parseGeminiResponse(responseText);
      return cvData;
    } catch (error: any) {
      console.error('Erreur lors de l\'extraction du CV:', error);
      
      // Messages d'erreur plus détaillés
      if (error.status === 403) {
        throw new Error('Clé API Gemini invalide ou API non activée. Vérifiez votre configuration.');
      } else if (error.status === 429) {
        throw new Error('Quota API Gemini dépassé. Veuillez réessayer plus tard.');
      } else if (error.status === 400) {
        throw new Error('Requête invalide. Vérifiez le format du texte.');
      }
      
      throw new Error('Impossible d\'extraire les données du CV');
    }
  }

  /**
   * Construit le prompt d'extraction pour Gemini
   */
  private buildExtractionPrompt(): string {
    return `Tu es un expert en analyse de CV. Ton rôle est d'extraire et structurer les informations d'un CV de manière précise et complète.

Analyse le CV fourni et extrais les informations suivantes au format JSON strict (sans markdown, sans balises de code):

{
  "name": "Nom complet de la personne",
  "email": "Adresse email",
  "phone": "Numéro de téléphone",
  "summary": "Résumé professionnel ou objectif de carrière (2-3 phrases)",
  "experiences": [
    {
      "title": "Titre du poste",
      "company": "Nom de l'entreprise",
      "startDate": "Date de début (format: YYYY-MM ou YYYY)",
      "endDate": "Date de fin (format: YYYY-MM ou YYYY) ou null si en cours",
      "description": "Description détaillée des responsabilités et réalisations",
      "current": false
    }
  ],
  "education": [
    {
      "degree": "Diplôme obtenu",
      "school": "Nom de l'établissement",
      "startDate": "Date de début (format: YYYY-MM ou YYYY)",
      "endDate": "Date de fin (format: YYYY-MM ou YYYY)",
      "description": "Description ou mention éventuelle"
    }
  ],
  "skills": ["Compétence 1", "Compétence 2", "..."],
  "passions": ["Passion 1", "Passion 2", "..."],
  "projects": [
    {
      "name": "Nom du projet",
      "description": "Description du projet",
      "technologies": ["Tech 1", "Tech 2"],
      "link": "URL du projet si disponible"
    }
  ]
}

Instructions importantes:
1. Extrais TOUTES les informations disponibles dans le CV
2. Si une information n'est pas présente, utilise null ou un tableau vide []
3. Pour les dates, utilise le format YYYY-MM si le mois est précisé, sinon YYYY
4. Pour les expériences en cours, mets "endDate": null et "current": true
5. Dans la description des expériences, structure les informations de manière claire (responsabilités, réalisations, contexte)
6. Identifie et catégorise correctement les hard skills (techniques) et soft skills
7. Extrais les passions, hobbies ou centres d'intérêt s'ils sont mentionnés
8. Retourne UNIQUEMENT le JSON, sans texte explicatif avant ou après
9. Assure-toi que le JSON est valide et peut être parsé directement

Réponds UNIQUEMENT avec le JSON, rien d'autre.`;
  }

  /**
   * Parse la réponse de Gemini et extrait le JSON
   */
  private parseGeminiResponse(response: string): CVData {
    try {
      // Nettoyer la réponse (enlever les balises markdown si présentes)
      let cleanedResponse = response.trim();
      
      // Enlever les balises ```json et ``` si présentes
      cleanedResponse = cleanedResponse.replace(/```json\s*/g, '');
      cleanedResponse = cleanedResponse.replace(/```\s*/g, '');
      cleanedResponse = cleanedResponse.trim();

      // Parser le JSON
      const cvData: CVData = JSON.parse(cleanedResponse);

      // Validation basique
      if (typeof cvData !== 'object') {
        throw new Error('La réponse n\'est pas un objet valide');
      }

      // Nettoyer les valeurs null/undefined dans les tableaux
      if (cvData.experiences) {
        cvData.experiences = cvData.experiences.filter(exp => exp && exp.title && exp.company);
      }
      if (cvData.education) {
        cvData.education = cvData.education.filter(edu => edu && edu.degree && edu.school);
      }
      if (cvData.skills) {
        cvData.skills = cvData.skills.filter(skill => skill && skill.trim() !== '');
      }
      if (cvData.passions) {
        cvData.passions = cvData.passions.filter(passion => passion && passion.trim() !== '');
      }
      if (cvData.projects) {
        cvData.projects = cvData.projects.filter(project => project && project.name && project.description);
      }

      return cvData;
    } catch (error) {
      console.error('Erreur lors du parsing de la réponse Gemini:', error);
      console.error('Réponse brute:', response);
      throw new Error('Impossible de parser la réponse de Gemini');
    }
  }
}

// Export une instance singleton
export const cvExtractor = new CVExtractor();
