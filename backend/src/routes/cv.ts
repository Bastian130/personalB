import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { cvStore } from '../models/CVStore';
import { userStore } from '../models/UserStore';
import { CV, CVResponse } from '../models/CV';
import fs from 'fs/promises';

const router = express.Router();

// Configuration du stockage multer
const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// Filtre pour accepter uniquement les PDFs et fichiers texte
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = [
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non supporté. Accepté: PDF, TXT, DOC, DOCX'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

// Route d'upload de CV
router.post(
  '/upload',
  authMiddleware,
  upload.single('cv'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Aucun fichier fourni' });
        return;
      }

      const userId = (req as AuthRequest).userId;
      if (!userId) {
        res.status(401).json({ error: 'Non authentifié' });
        return;
      }

      // Vérifier si l'utilisateur existe
      const user = await userStore.findById(userId);
      if (!user) {
        // Supprimer le fichier uploadé si l'utilisateur n'existe pas
        await fs.unlink(req.file.path);
        res.status(404).json({ error: 'Utilisateur non trouvé' });
        return;
      }

      // Supprimer l'ancien CV si il existe
      const existingCV = await cvStore.findByUserId(userId);
      if (existingCV) {
        try {
          await fs.unlink(existingCV.path);
        } catch (error) {
          console.error('Erreur lors de la suppression de l\'ancien CV:', error);
        }
        await cvStore.deleteById(existingCV.id);
      }

      // Créer l'entrée CV
      const cv: CV = {
        id: uuidv4(),
        userId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadDate: new Date(),
      };

      await cvStore.create(cv);

      // Mettre à jour l'utilisateur avec le cvId
      await userStore.update(userId, { cvId: cv.id });

      // Préparer la réponse (sans le path pour des raisons de sécurité)
      const cvResponse: CVResponse = {
        id: cv.id,
        userId: cv.userId,
        filename: cv.filename,
        originalName: cv.originalName,
        mimeType: cv.mimeType,
        size: cv.size,
        uploadDate: cv.uploadDate,
        extractedData: cv.extractedData,
      };

      res.status(201).json({
        message: 'CV uploadé avec succès',
        cv: cvResponse,
      });
    } catch (error: any) {
      console.error('Erreur lors de l\'upload:', error);
      
      // Supprimer le fichier en cas d'erreur
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Erreur lors de la suppression du fichier:', unlinkError);
        }
      }

      res.status(500).json({
        error: error.message || 'Erreur lors de l\'upload du CV',
      });
    }
  }
);

// Route pour récupérer le CV de l'utilisateur connecté
router.get('/me', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      res.status(401).json({ error: 'Non authentifié' });
      return;
    }

    const cv = await cvStore.findByUserId(userId);
    if (!cv) {
      res.status(404).json({ error: 'Aucun CV trouvé' });
      return;
    }

    const cvResponse: CVResponse = {
      id: cv.id,
      userId: cv.userId,
      filename: cv.filename,
      originalName: cv.originalName,
      mimeType: cv.mimeType,
      size: cv.size,
      uploadDate: cv.uploadDate,
      extractedData: cv.extractedData,
    };

    res.json(cvResponse);
  } catch (error: any) {
    console.error('Erreur lors de la récupération du CV:', error);
    res.status(500).json({
      error: error.message || 'Erreur lors de la récupération du CV',
    });
  }
});

// Route pour télécharger le CV
router.get(
  '/download',
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as AuthRequest).userId;
      if (!userId) {
        res.status(401).json({ error: 'Non authentifié' });
        return;
      }

      const cv = await cvStore.findByUserId(userId);
      if (!cv) {
        res.status(404).json({ error: 'Aucun CV trouvé' });
        return;
      }

      res.download(cv.path, cv.originalName);
    } catch (error: any) {
      console.error('Erreur lors du téléchargement:', error);
      res.status(500).json({
        error: error.message || 'Erreur lors du téléchargement du CV',
      });
    }
  }
);

// Route pour supprimer le CV
router.delete('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      res.status(401).json({ error: 'Non authentifié' });
      return;
    }

    const cv = await cvStore.findByUserId(userId);
    if (!cv) {
      res.status(404).json({ error: 'Aucun CV trouvé' });
      return;
    }

    // Supprimer le fichier physique
    try {
      await fs.unlink(cv.path);
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
    }

    // Supprimer l'entrée du store
    await cvStore.deleteById(cv.id);

    // Mettre à jour l'utilisateur
    await userStore.update(userId, { cvId: undefined });

    res.json({ message: 'CV supprimé avec succès' });
  } catch (error: any) {
    console.error('Erreur lors de la suppression:', error);
    res.status(500).json({
      error: error.message || 'Erreur lors de la suppression du CV',
    });
  }
});

export default router;
