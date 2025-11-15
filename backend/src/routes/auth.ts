import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import { userStore } from '../models/UserStore';
import { User, UserResponse } from '../models/User';
import { jwtConfig, appConfig } from '../config/jwt';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// URL du webhook n8n
const N8N_WEBHOOK_URL = process.env.N8N_PHOTO_WEBHOOK_URL || 'https://fortibnb.app.n8n.cloud/webhook/ajouter-fleur';

// Configuration multer pour les photos de profil
const photoStorage = multer.diskStorage({
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

const photoFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non supporté. Accepté: JPG, PNG, WEBP'));
  }
};

const uploadPhoto = multer({
  storage: photoStorage,
  fileFilter: photoFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Helper function to create user response (without password)
const toUserResponse = (user: User): UserResponse => ({
  id: user.id,
  email: user.email,
  name: user.name,
  cvId: user.cvId,
  photoFilename: user.photoFilename,
  photoUrl: user.photoFilename 
    ? `${appConfig.frontendUrl}/api/users/photo/${user.photoFilename}` 
    : undefined,
});

// POST /api/auth/register
// TODO: Add rate limiting in production (express-rate-limit)
router.post('/register', uploadPhoto.single('photo'), async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await userStore.findByEmail(validatedData.email);
    if (existingUser) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Create user object (photo may be attached below)
    const newUser: User = {
      id: uuidv4(),
      email: validatedData.email,
      password: hashedPassword,
      name: validatedData.name,
      createdAt: new Date(),
    };

    // If a photo was uploaded during registration, process it via the n8n webhook
    if (req.file) {
      try {
        console.log('📸 Photo fournie lors de l\'inscription:', req.file.originalname);

        // Prepare FormData and send to n8n
        const defaultPrompt = `Transforme cette photo en une photo professionnelle de CV parfaite :\n- Ajoute un arrière-plan neutre et professionnel (gris clair, bleu clair ou blanc)\n- Habille la personne de manière formelle et professionnelle (costume, chemise, cravate pour homme / tailleur, chemisier pour femme)\n- Assure-toi que la personne porte des vêtements business appropriés\n- Cadrage professionnel : portrait épaules et tête\n- Éclairage doux et flatteur\n- Expression faciale neutre et confiante, légèrement souriante\n- Photo haute qualité, nette et bien exposée\n- Style : photo d'identité professionnelle LinkedIn\n- Garde les traits du visage naturels et reconnaissables`;

        const prompt = (req.body && (req.body.prompt as string)) || defaultPrompt;

        const formData = new FormData();
        formData.append('file', createReadStream(req.file.path));
        formData.append('prompt', prompt);

        console.log('📤 Envoi de la requête au workflow n8n pour la photo de register...');
        console.log(`   URL: ${N8N_WEBHOOK_URL}`);

        const startTime = Date.now();
        const response = await axios.post(N8N_WEBHOOK_URL, formData, {
          headers: formData.getHeaders(),
          responseType: 'arraybuffer',
          timeout: 60000,
        });

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        const processedFilename = `processed-${uuidv4()}.jpg`;
        const processedPath = path.join(__dirname, '../../uploads/photos', processedFilename);

        await fs.writeFile(processedPath, response.data);
        // remove original
        await fs.unlink(req.file.path);

        // attach to newUser
        newUser.photoFilename = processedFilename;
        newUser.photoOriginalName = req.file.originalname;

        console.log(`✅ Photo traitée et attachée à l'utilisateur: ${processedFilename} (${duration}s)`);
      } catch (err: any) {
        console.error('⚠️ Erreur lors du traitement photo au register:', err.message || err);
        // fallback: keep the original uploaded file and attach it
        try {
          newUser.photoFilename = req.file.filename;
          newUser.photoOriginalName = req.file.originalname;
        } catch (attachErr) {
          console.error('Erreur fallback attachement photo:', attachErr);
        }
      }
    }

    await userStore.create(newUser);

    // Generate JWT token
    const signOptions: SignOptions = {
      expiresIn: jwtConfig.expiresIn as any,
    };
    const token = jwt.sign({ userId: newUser.id }, jwtConfig.secret, signOptions);

    res.status(201).json({
      token,
      user: toUserResponse(newUser),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
// TODO: Add rate limiting in production (express-rate-limit)
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData = loginSchema.parse(req.body);

    // Find user
    const user = await userStore.findByEmail(validatedData.email);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(validatedData.password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Generate JWT token
    const signOptions: SignOptions = {
      expiresIn: jwtConfig.expiresIn as any,
    };
    const token = jwt.sign({ userId: user.id }, jwtConfig.secret, signOptions);

    res.json({
      token,
      user: toUserResponse(user),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me - Protected route
// TODO: Add rate limiting in production (express-rate-limit)
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await userStore.findById(req.userId!);
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(toUserResponse(user));
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/upload-photo - Upload photo de profil
router.post(
  '/upload-photo',
  authMiddleware,
  uploadPhoto.single('photo'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Aucune photo fournie' });
        return;
      }

      const userId = (req as AuthRequest).userId;
      if (!userId) {
        res.status(401).json({ error: 'Non authentifié' });
        return;
      }

      const user = await userStore.findById(userId);
      if (!user) {
        await fs.unlink(req.file.path);
        res.status(404).json({ error: 'Utilisateur non trouvé' });
        return;
      }

      // Supprimer l'ancienne photo si elle existe
      if (user.photoFilename) {
        try {
          const oldPhotoPath = path.join(__dirname, '../../uploads/photos', user.photoFilename);
          await fs.unlink(oldPhotoPath);
        } catch (error) {
          console.error('Erreur lors de la suppression de l\'ancienne photo:', error);
        }
      }

      // Prompt détaillé pour n8n/Gemini
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

        // Supprimer l'image originale
        await fs.unlink(req.file.path);

        // Mettre à jour l'utilisateur avec la photo traitée
        const updatedUser = await userStore.update(userId, {
          photoFilename: processedFilename,
          photoOriginalName: req.file.originalname,
        });

        if (!updatedUser) {
          res.status(500).json({ error: 'Erreur lors de la mise à jour' });
          return;
        }

        res.json({
          message: 'Photo uploadée et traitée avec succès',
          user: toUserResponse(updatedUser),
          photo: {
            originalFilename: req.file.filename,
            originalName: req.file.originalname,
            processedFilename,
            photoUrl: `/api/auth/photo/${processedFilename}`,
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

        // Mettre à jour l'utilisateur avec la photo originale (non traitée)
        const updatedUser = await userStore.update(userId, {
          photoFilename: req.file.filename,
          photoOriginalName: req.file.originalname,
        });

        if (!updatedUser) {
          await fs.unlink(req.file.path);
          res.status(500).json({ error: 'Erreur lors de la mise à jour' });
          return;
        }

        res.json({
          message: 'Photo uploadée (traitement n8n échoué)',
          warning: 'Le traitement automatique n\'a pas pu être effectué',
          user: toUserResponse(updatedUser),
          photo: {
            originalFilename: req.file.filename,
            originalName: req.file.originalname,
            photoUrl: `/api/auth/photo/${req.file.filename}`,
            size: req.file.size,
            prompt,
          },
        });
      }
    } catch (error: any) {
      console.error('Erreur upload photo:', error);
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Erreur suppression fichier:', unlinkError);
        }
      }
      res.status(500).json({ error: error.message || 'Erreur lors de l\'upload' });
    }
  }
);

// GET /api/auth/photo/:filename - Servir les photos de profil
router.get('/photo/:filename', async (req: Request, res: Response): Promise<void> => {
  try {
    const { filename } = req.params;
    const photoPath = path.join(__dirname, '../../uploads/photos', filename);
    
    // Vérifier si le fichier existe
    try {
      await fs.access(photoPath);
      res.sendFile(photoPath);
    } catch {
      res.status(404).json({ error: 'Photo non trouvée' });
    }
  } catch (error) {
    console.error('Erreur récupération photo:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
