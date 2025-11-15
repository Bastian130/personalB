import { getGeminiModel } from '../config/gemini';
import { CVData } from '../models/CV';
import fs from 'fs/promises';
import path from 'path';

class CVGenerator {
  /**
   * Génère un CV en LaTeX à partir des données JSON et d'une photo
   */
  async generateLatex(cvData: CVData, photoPath?: string, photoFilename?: string): Promise<string> {
    try {
      const model = getGeminiModel();

      // Préparer les parties du prompt
      const parts: any[] = [];

      // Si une photo est fournie, l'ajouter au contexte
      if (photoPath && photoFilename) {
        try {
          const photoData = await fs.readFile(photoPath);
          const photoBase64 = photoData.toString('base64');
          const mimeType = this.getMimeType(photoPath);

          parts.push({
            inlineData: {
              data: photoBase64,
              mimeType,
            },
          });

          parts.push({
            text: `Voici la photo professionnelle à intégrer dans le CV.
Le fichier photo sera nommé "${photoFilename}" dans le même répertoire que le fichier LaTeX.
Utilise donc \\includegraphics{${photoFilename}} pour l'inclure (sans chemin, juste le nom du fichier).\n\n`,
          });
        } catch (error) {
          console.warn('⚠️ Impossible de charger la photo:', error);
        }
      }

      // Ajouter les données du CV et les instructions
      parts.push({
        text: `Tu es un expert en création de CV professionnels. Tu dois générer un CV au format LaTeX moderne, élégant et optimisé ATS (Applicant Tracking System).

**DONNÉES DU CV :**
${JSON.stringify(cvData, null, 2)}

**INSTRUCTIONS :**

1. **Format LaTeX professionnel** :
   - Utilise une classe de document moderne (article avec geometry)
   - Design épuré et professionnel
   - Utilise des sections claires (\section, \subsection)
   - Intègre la photo si elle est fournie (en haut à droite)

2. **Sections obligatoires** (dans cet ordre) :
   - En-tête avec nom, email, téléphone
   - Photo professionnelle (si fournie)
   - Résumé professionnel (summary)
   - Expériences professionnelles (experiences)
   - Formations (education)
   - Compétences techniques (skills)
   - Projets (projects, si fournis)
   - Passions/Centres d'intérêt (passions)

3. **Optimisation ATS** :
   - Titres de section standards et reconnaissables
   - Utilise des bullet points (\item) pour les listes
   - Format CAR (Contexte-Action-Résultat) pour les expériences
   - Mots-clés pertinents mis en évidence
   - Pas de tableaux complexes ou d'images décoratives (sauf la photo de profil)

4. **Style et formatage** :
   - Police professionnelle (helvet ou similar)
   - Utilise \textbf{} pour le gras
   - Utilise \textit{} pour l'italique
   - Dates au format "Mois AAAA - Mois AAAA"
   - Espacement cohérent

5. **Image (si photo fournie)** :
   - Place la photo en haut à droite
   - Utilise un cadre circulaire ou carré avec bords arrondis
   - Taille appropriée (environ 3cm x 3.5cm)
   - Utilise le package graphicx

**CONTRAINTES :**
- Le code LaTeX doit être COMPLET et COMPILABLE immédiatement
- Inclus TOUS les packages nécessaires dans le préambule
- N'ajoute AUCUN commentaire ou explication, juste le code LaTeX pur
- Si une donnée manque, crée un contenu professionnel générique approprié
- Le document doit être en français
- Utilise UTF-8 encoding

**OUTPUT :**
Retourne UNIQUEMENT le code LaTeX complet, sans aucun markdown, sans \`\`\`latex, sans commentaire.
Commence directement par \\documentclass et termine par \\end{document}.`,
      });

      console.log('🎨 Génération du CV LaTeX avec Gemini...');
      const result = await model.generateContent(parts);
      const response = result.response;
      let latexCode = response.text();

      // Nettoyer le code LaTeX (enlever les balises markdown si présentes)
      latexCode = latexCode.replace(/```latex\n?/g, '').replace(/```\n?/g, '').trim();

      console.log('✅ CV LaTeX généré avec succès');
      return latexCode;
    } catch (error: any) {
      console.error('❌ Erreur lors de la génération LaTeX:', error);
      throw new Error(`Échec de la génération du CV : ${error.message}`);
    }
  }

  /**
   * Détermine le MIME type d'une image à partir de son extension
   */
  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };
    return mimeTypes[ext] || 'image/jpeg';
  }

  /**
   * Compile le code LaTeX en PDF
   * Utilise pdflatex si disponible, sinon latex.js
   */
  async compileToPDF(latexCode: string, outputPath: string, photoPath?: string): Promise<void> {
    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);

      // Vérifier si pdflatex est disponible
      let hasPdflatex = false;
      try {
        await execPromise('pdflatex --version');
        hasPdflatex = true;
      } catch {
        hasPdflatex = false;
      }

      if (hasPdflatex) {
        console.log('📄 Compilation du LaTeX en PDF avec pdflatex...');
        
        // Sauvegarder le fichier .tex
        const texPath = outputPath.replace('.pdf', '.tex');
        await fs.writeFile(texPath, latexCode);
        
        // Obtenir le répertoire de sortie
        const outputDir = path.dirname(outputPath);
        const baseName = path.basename(texPath);
        
        // Copier la photo dans le répertoire de sortie si elle existe
        if (photoPath) {
          try {
            const photoExtension = path.extname(photoPath);
            const photoDestName = 'profile-photo' + photoExtension;
            const photoDestPath = path.join(outputDir, photoDestName);
            await fs.copyFile(photoPath, photoDestPath);
            console.log('📷 Photo copiée pour la compilation:', photoDestName);
          } catch (photoError) {
            console.warn('⚠️ Impossible de copier la photo:', photoError);
          }
        }
        
        // Compiler avec pdflatex (2 passes pour les références)
        try {
          await execPromise(
            `cd "${outputDir}" && pdflatex -interaction=nonstopmode "${baseName}"`,
            { maxBuffer: 10 * 1024 * 1024 } // 10MB buffer
          );
          
          // Nettoyer TOUS les fichiers temporaires générés par pdflatex
          const baseNameWithoutExt = path.basename(outputPath, '.pdf');
          const tempFiles = [
            '.aux',      // Fichier auxiliaire
            '.log',      // Log de compilation
            '.out',      // Fichier de sortie hyperref
            '.toc',      // Table des matières
            '.nav',      // Navigation (beamer)
            '.snm',      // Snippets (beamer)
            '.vrb',      // Verbatim (beamer)
            '.fls',      // File list
            '.fdb_latexmk',  // Latexmk database
            '.synctex.gz',   // SyncTeX
          ].map(ext => path.join(outputDir, baseNameWithoutExt + ext));
          
          // Ajouter la photo copiée à nettoyer
          if (photoPath) {
            const photoExtension = path.extname(photoPath);
            const photoDestName = 'profile-photo' + photoExtension;
            tempFiles.push(path.join(outputDir, photoDestName));
          }
          
          console.log('🧹 Nettoyage des fichiers temporaires...');
          let cleanedCount = 0;
          for (const file of tempFiles) {
            try {
              await fs.unlink(file);
              cleanedCount++;
            } catch {}
          }
          
          if (cleanedCount > 0) {
            console.log(`✨ ${cleanedCount} fichier(s) temporaire(s) supprimé(s)`);
          }
          
          console.log('✅ PDF généré avec succès avec pdflatex:', outputPath);
          console.log('📦 Fichiers conservés: PDF + LaTeX source');
          return;
        } catch (pdflatexError: any) {
          console.error('⚠️ Erreur pdflatex:', pdflatexError.message);
          throw new Error(`Échec de la compilation avec pdflatex: ${pdflatexError.message}`);
        }
      }

      // Fallback: utiliser latex.js (moins fiable)
      console.log('⚠️ pdflatex non disponible, tentative avec latex.js...');
      const latex = require('latex.js');
      
      console.log('📄 Compilation du LaTeX en PDF avec latex.js...');
      
      const generator = latex.parse(latexCode, { generator: latex.PDFGenerator });
      const pdf = generator.generate();
      
      await fs.writeFile(outputPath, pdf);
      
      console.log('✅ PDF généré avec succès:', outputPath);
    } catch (error: any) {
      console.error('❌ Erreur lors de la compilation PDF:', error);
      
      // Sauvegarder le code LaTeX pour debug
      const latexPath = outputPath.replace('.pdf', '.tex');
      await fs.writeFile(latexPath, latexCode);
      console.log('💾 Code LaTeX sauvegardé pour debug:', latexPath);
      
      throw new Error(
        `Échec de la compilation PDF : ${error.message}. Le code LaTeX a été sauvegardé et peut être compilé manuellement avec pdflatex.`
      );
    }
  }

  /**
   * Génère un CV complet (LaTeX + PDF) en une seule opération
   */
  async generateCV(
    cvData: CVData,
    photoPath: string | undefined,
    outputPdfPath: string
  ): Promise<{ latexCode: string; pdfPath: string }> {
    try {
      // Déterminer le nom de fichier pour la photo si elle existe
      let photoFilename: string | undefined;
      if (photoPath) {
        const photoExtension = path.extname(photoPath);
        photoFilename = 'profile-photo' + photoExtension;
      }

      // Générer le code LaTeX
      const latexCode = await this.generateLatex(cvData, photoPath, photoFilename);

      // Compiler en PDF
      await this.compileToPDF(latexCode, outputPdfPath, photoPath);

      return {
        latexCode,
        pdfPath: outputPdfPath,
      };
    } catch (error: any) {
      console.error('❌ Erreur lors de la génération complète du CV:', error);
      throw error;
    }
  }
}

export const cvGenerator = new CVGenerator();
