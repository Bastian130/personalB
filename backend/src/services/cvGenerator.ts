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
        text: `Tu es un expert en création de CV professionnels optimisés pour les systèmes ATS (Applicant Tracking System). Tu dois générer un CV au format LaTeX qui sera parfaitement scannable par les ATS tout en restant visuellement attractif.

**DONNÉES DU CV :**
${JSON.stringify(cvData, null, 2)}

**RÈGLES CRITIQUES ATS :**

1. **Structure et hiérarchie du document** :
   - Utilise UNIQUEMENT la classe \\documentclass[11pt,a4paper]{article}
   - ÉVITE les classes fancy comme moderncv, altacv qui ne sont pas ATS-friendly
   - Structure simple et linéaire : en-tête → sections → contenu
   - Marges standard : geometry avec margin=2cm
   - Police standard : \\usepackage{helvet} + \\renewcommand{\\familydefault}{\\sfdefault}

2. **Titres de sections ATS-compatibles** (utilise EXACTEMENT ces noms en français) :
   - PROFIL ou RÉSUMÉ PROFESSIONNEL
   - EXPÉRIENCE PROFESSIONNELLE
   - FORMATION
   - COMPÉTENCES TECHNIQUES
   - PROJETS (si applicable)
   - CENTRES D'INTÉRÊT

3. **Formatage du contenu** :
   - Une seule colonne principale pour le texte (la photo peut être en flottant)
   - AUCUN tableau pour le contenu principal (les ATS ne les lisent pas bien)
   - Utilise des listes simples avec \\begin{itemize} et \\item
   - Évite les minipage imbriquées complexes
   - Chaque expérience doit suivre ce format strict :
     * Ligne 1: \\textbf{Titre du poste} -- Entreprise, Ville
     * Ligne 2: \\textit{Date début - Date fin}
     * Lignes suivantes: \\begin{itemize} avec réalisations

4. **Mots-clés et contenu ATS** :
   - Utilise des verbes d'action au début de chaque bullet point
   - Incorpore des mots-clés techniques directement dans le texte (pas en graphiques)
   - Format CAR pour chaque réalisation : Contexte + Action + Résultat quantifié
   - Inclus des chiffres et métriques pour quantifier les résultats
   - Les compétences doivent être en texte pur, séparées par des virgules ou en liste simple

5. **Photo professionnelle (si fournie)** :
   - Utilise \\usepackage{graphicx} et \\usepackage{wrapfig}
   - Place la photo avec \\begin{wrapfigure}{r}{3.5cm} en haut du document
   - Forme : carrée ou rectangulaire simple (évite les formes complexes pour l'ATS)
   - Taille : 3cm x 3.5cm maximum
   - La photo ne doit PAS perturber le flux de lecture du texte pour l'ATS

6. **Packages autorisés et recommandés** :
   - \\usepackage[utf8]{inputenc}
   - \\usepackage[T1]{fontenc}
   - \\usepackage[french]{babel}
   - \\usepackage[margin=2cm]{geometry}
   - \\usepackage{helvet}
   - \\usepackage{graphicx} (pour la photo)
   - \\usepackage{wrapfig} (pour la photo)
   - \\usepackage{enumitem} (pour contrôler les listes)
   - \\usepackage{hyperref} (pour email/téléphone cliquables, mais liens simples)
   - \\usepackage{xcolor} (pour couleurs subtiles, pas trop de couleurs)

7. **En-tête du document** :
   - Nom en grand : \\textbf{\\Large NOM Prénom}
   - Email et téléphone sur une ligne : \\href{mailto:email}{email} | Téléphone
   - Format simple et clair, pas de design fantaisiste
   - Tout doit être extractible en texte brut par l'ATS

8. **Éléments à ÉVITER absolument** :
   - ❌ Colonnes multiples pour le contenu principal
   - ❌ Tableaux pour organiser les expériences ou compétences
   - ❌ Graphiques, barres de progression, ou représentations visuelles des compétences
   - ❌ Polices fantaisistes ou trop de variations de polices
   - ❌ Headers/footers complexes
   - ❌ Zones de texte ou boîtes colorées pour le contenu
   - ❌ Images décoratives (seule la photo de profil est acceptée)
   - ❌ Acronymes sans les définir la première fois

**CONTRAINTES TECHNIQUES :**
- Le code LaTeX doit être COMPLET, VALIDE et COMPILABLE immédiatement
- Inclus TOUS les packages nécessaires dans le préambule
- N'ajoute AUCUN commentaire LaTeX, juste du code pur
- Si une donnée manque, crée un contenu professionnel générique approprié
- Document en français avec encodage UTF-8
- Maximum 2 pages (préférablement 1 page si possible)

**STRUCTURE TYPE DU DOCUMENT :**
\`\`\`
\\documentclass[11pt,a4paper]{article}
[préambule avec packages]
\\begin{document}
[Photo en wrapfigure si fournie]
[En-tête : nom + contacts]
[Section PROFIL]
[Section EXPÉRIENCE PROFESSIONNELLE]
[Section FORMATION]
[Section COMPÉTENCES TECHNIQUES]
[Section PROJETS si applicable]
[Section CENTRES D'INTÉRÊT]
\\end{document}
\`\`\`

**OUTPUT ATTENDU :**
Retourne UNIQUEMENT le code LaTeX complet et prêt à compiler.
- Commence directement par \\documentclass
- Termine par \\end{document}
- Aucun markdown, aucun \`\`\`latex, aucune explication
- Code propre et indenté correctement`,
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
