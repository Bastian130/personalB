import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { userStore } from '../models/UserStore';
import { User } from '../models/User';
import fs from 'fs/promises';
import axios from 'axios';
import FormData from 'form-data';
import { createReadStream } from 'fs';

const router = express.Router();

// Configuration du stockage multer pour les photos
const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/photos');
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

// Filtre pour accepter uniquement les images
const imageFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non supporté. Accepté: JPEG, JPG, PNG, WEBP'));
  }
};

const upload = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

// URL du webhook n8n
const N8N_WEBHOOK_URL = process.env.N8N_PHOTO_WEBHOOK_URL || 'https://fortibnb.app.n8n.cloud/webhook/ajouter-fleur';

/**
 * Route pour uploader une photo de profil
 * L'image est envoyée au workflow n8n pour traitement
 */
router.post(
  '/photo',
  authMiddleware,
  upload.single('photo'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Aucune image fournie' });
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
        await fs.unlink(req.file.path);
        res.status(404).json({ error: 'Utilisateur non trouvé' });
        return;
      }

      // Récupérer le prompt optionnel ou utiliser le prompt détaillé par défaut
      const defaultPrompt = `Transforme cette photo en une photo professionnelle de CV parfaite :
- Ajoute un arrière-plan neutre et professionnel (gris clair, bleu clair ou blanc)
- Habille la personne de manière formelle et professionnelle (costume, chemise, cravate pour homme / tailleur, chemisier pour femme)
- Assure-toi que la personne porte des vêtements business appropriés
- Cadrage professionnel : portrait épaules et tête
- Éclairage doux et flatreur
- Expression faciale neutre et confiante, légèrement souriante
- Photo haute qualité, nette et bien exposée
- Style : photo d'identité professionnelle LinkedIn
- Garde les traits du visage naturels et reconnaissables`;

      const prompt = req.body.prompt || defaultPrompt;

      console.log('📸 Traitement de la photo de profil...');
      console.log(`   Image: ${req.file.originalname}`);
      console.log(`   Prompt: "${prompt.substring(0, 100)}..."`);
      console.log(`   URL: ${N8N_WEBHOOK_URL}`);

      // Préparer FormData pour envoyer au webhook n8n
      const formData = new FormData();
      formData.append('file', createReadStream(req.file.path));
      formData.append('prompt', prompt);

      console.log('📤 Envoi de la requête au workflow n8n...');
      const startTime = Date.now();

      try {
        // Envoyer au webhook n8n
        console.log('🔄 Envoi de la requête au webhook n8n...');
        console.log(`   URL: ${N8N_WEBHOOK_URL}`);
        console.log(`   Headers:`, formData.getHeaders());
        
        const response = await axios.post(N8N_WEBHOOK_URL, formData, {
          headers: formData.getHeaders(),
          responseType: 'arraybuffer',
          timeout: 60000, // 60 secondes
        });

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ Photo traitée avec succès! (${duration}s)`);

        // Sauvegarder l'image résultante
        const processedFilename = `processed-${uuidv4()}.jpg`;
        const processedPath = path.join(__dirname, '../../uploads/photos', processedFilename);
        
        await fs.writeFile(processedPath, response.data);
        
        console.log('📊 Résultat:');
        console.log(`   Status: ${response.status}`);
        console.log(`   Taille: ${(response.data.length / 1024).toFixed(2)} Ko`);
        console.log(`   Fichier: ${processedFilename}`);

        // Supprimer l'image originale (optionnel - on garde les deux pour l'instant)
        // await fs.unlink(req.file.path);

        // Mettre à jour le profil utilisateur avec le nom de la photo traitée
        await userStore.update(userId, {
          photoFilename: processedFilename,
          photoOriginalName: req.file.originalname,
        });

        // Retourner les informations
        res.status(200).json({
          message: 'Photo de profil uploadée et traitée avec succès',
          photo: {
            originalFilename: req.file.filename,
            originalName: req.file.originalname,
            processedFilename,
            photoUrl: `/api/user/photo/${processedFilename}`,
            size: response.data.length,
            prompt,
            processingTime: duration,
          },
        });

      } catch (webhookError: any) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.error(`❌ Erreur webhook (${duration}s):`, webhookError.message);
        console.error('📋 Détails de l\'erreur:');
        console.error(`   Code: ${webhookError.code || 'N/A'}`);
        console.error(`   Status: ${webhookError.response?.status || 'N/A'}`);
        console.error(`   Response: ${webhookError.response?.data ? webhookError.response.data.toString().substring(0, 200) : 'N/A'}`);
        
        // En cas d'erreur du webhook, on garde quand même l'image originale
        console.log('⚠️  Le workflow n8n a échoué, conservation de l\'image originale');

        // Mettre à jour le profil utilisateur avec la photo originale (non traitée)
        await userStore.update(userId, {
          photoFilename: req.file.filename,
          photoOriginalName: req.file.originalname,
        });

        res.status(200).json({
          message: 'Photo uploadée (traitement n8n échoué)',
          warning: 'Le traitement automatique n\'a pas pu être effectué',
          photo: {
            originalFilename: req.file.filename,
            originalName: req.file.originalname,
            photoUrl: `/api/user/photo/${req.file.filename}`,
            size: req.file.size,
            prompt,
          },
        });
      }

    } catch (error: any) {
      console.error('Erreur lors de l\'upload de la photo:', error);
      
      // Supprimer le fichier en cas d'erreur
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Erreur lors de la suppression du fichier:', unlinkError);
        }
      }

      res.status(500).json({
        error: error.message || 'Erreur lors de l\'upload de la photo',
      });
    }
  }
);

/**
 * Route pour récupérer le profil utilisateur
 */
router.get(
  '/profile',
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as AuthRequest).userId;
      if (!userId) {
        res.status(401).json({ error: 'Non authentifié' });
        return;
      }

      const user = await userStore.findById(userId);
      if (!user) {
        res.status(404).json({ error: 'Utilisateur non trouvé' });
        return;
      }

      // Préparer la réponse
      const userResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        cvId: user.cvId,
        photoFilename: user.photoFilename,
        photoUrl: user.photoFilename ? `/api/user/photo/${user.photoFilename}` : undefined,
      };

      res.json(userResponse);

    } catch (error: any) {
      console.error('Erreur lors de la récupération du profil:', error);
      res.status(500).json({
        error: error.message || 'Erreur lors de la récupération du profil',
      });
    }
  }
);

/**
 * Route pour mettre à jour les informations du profil utilisateur
 */
router.put(
  '/profile',
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as AuthRequest).userId;
      if (!userId) {
        res.status(401).json({ error: 'Non authentifié' });
        return;
      }

      const user = await userStore.findById(userId);
      if (!user) {
        res.status(404).json({ error: 'Utilisateur non trouvé' });
        return;
      }

      // Récupérer les données à mettre à jour
      const { name, email } = req.body;

      // Valider les données
      if (email && typeof email !== 'string') {
        res.status(400).json({ error: 'Email invalide' });
        return;
      }

      if (name && typeof name !== 'string') {
        res.status(400).json({ error: 'Nom invalide' });
        return;
      }

      // Vérifier que l'email n'est pas déjà utilisé par un autre utilisateur
      if (email && email !== user.email) {
        const existingUser = await userStore.findByEmail(email);
        if (existingUser && existingUser.id !== userId) {
          res.status(400).json({ error: 'Cet email est déjà utilisé' });
          return;
        }
      }

      // Préparer les données à mettre à jour
      const updateData: Partial<User> = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;

      // Mettre à jour l'utilisateur
      const updatedUser = await userStore.update(userId, updateData);

      if (!updatedUser) {
        res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
        return;
      }

      // Préparer la réponse
      const userResponse = {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        cvId: updatedUser.cvId,
        photoFilename: updatedUser.photoFilename,
        photoUrl: updatedUser.photoFilename ? `/api/user/photo/${updatedUser.photoFilename}` : undefined,
      };

      res.json({
        message: 'Profil mis à jour avec succès',
        user: userResponse,
      });

    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      res.status(500).json({
        error: error.message || 'Erreur lors de la mise à jour du profil',
      });
    }
  }
);

/**
 * Route pour récupérer la photo de profil
 */
router.get(
  '/photo/:filename',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { filename } = req.params;

      // Sécurité: vérifier que le filename ne contient pas de path traversal
      if (filename.includes('..') || filename.includes('/')) {
        res.status(400).json({ error: 'Nom de fichier invalide' });
        return;
      }

      const photoPath = path.join(__dirname, '../../uploads/photos', filename);

      // Vérifier si le fichier existe
      try {
        await fs.access(photoPath);
      } catch {
        res.status(404).json({ error: 'Photo non trouvée' });
        return;
      }

      // Envoyer le fichier
      res.sendFile(photoPath);

    } catch (error: any) {
      console.error('Erreur lors de la récupération de la photo:', error);
      res.status(500).json({
        error: error.message || 'Erreur lors de la récupération de la photo',
      });
    }
  }
);

/**
 * Route pour supprimer une photo
 */
router.delete(
  '/photo/:filename',
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as AuthRequest).userId;
      if (!userId) {
        res.status(401).json({ error: 'Non authentifié' });
        return;
      }

      const { filename } = req.params;

      // Sécurité: vérifier que le filename ne contient pas de path traversal
      if (filename.includes('..') || filename.includes('/')) {
        res.status(400).json({ error: 'Nom de fichier invalide' });
        return;
      }

      const photoPath = path.join(__dirname, '../../uploads/photos', filename);

      // Vérifier si le fichier existe
      try {
        await fs.access(photoPath);
      } catch {
        res.status(404).json({ error: 'Photo non trouvée' });
        return;
      }

      // Supprimer le fichier
      await fs.unlink(photoPath);

      res.json({ message: 'Photo supprimée avec succès' });

    } catch (error: any) {
      console.error('Erreur lors de la suppression de la photo:', error);
      res.status(500).json({
        error: error.message || 'Erreur lors de la suppression de la photo',
      });
    }
  }
);

export default router;
