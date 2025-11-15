# Backend Authentication Service

Backend d'authentification avec JWT (JSON Web Tokens) pour le projet PersonalB.

## 🚀 Fonctionnalités

- ✅ Inscription d'utilisateurs avec hashage de mot de passe (bcrypt)
- ✅ Connexion avec génération de JWT
- ✅ Middleware d'authentification pour routes protégées
- ✅ Validation des données avec Zod
- ✅ CORS configuré pour Next.js frontend
- ✅ TypeScript pour la sécurité des types
- ✅ Stockage en mémoire (à remplacer par DB en production)

## 📦 Technologies

- **Express**: Framework web Node.js
- **TypeScript**: Sécurité des types
- **JWT**: Authentification stateless
- **bcrypt**: Hashage sécurisé des mots de passe
- **Zod**: Validation des schémas de données
- **CORS**: Gestion des requêtes cross-origin

## 🛠️ Installation

```bash
# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env

# Modifier JWT_SECRET dans .env avec une valeur sécurisée
```

## 🚦 Démarrage

### Mode développement
```bash
npm run dev
```

### Mode production
```bash
npm run build
npm start
```

Le serveur démarre sur http://localhost:3001

## 📚 API Endpoints

### POST /api/auth/register
Inscription d'un nouvel utilisateur

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### POST /api/auth/login
Connexion d'un utilisateur existant

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### GET /api/auth/me
Récupérer les informations de l'utilisateur connecté (route protégée)

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe"
}
```

## 🔒 Sécurité

- Les mots de passe sont hashés avec bcrypt (10 rounds)
- Les tokens JWT expirent après 24 heures (configurable)
- Validation stricte des entrées avec Zod
- CORS configuré pour autoriser uniquement le frontend

## ⚠️ Notes de production

**IMPORTANT**: Ce backend utilise un stockage en mémoire pour le hackathon.
Pour la production, il faut:

- [ ] Implémenter une vraie base de données (PostgreSQL, MongoDB, etc.)
- [ ] Ajouter un système de refresh tokens
- [ ] Implémenter la limitation de débit (rate limiting)
- [ ] Ajouter des logs structurés
- [ ] Configurer HTTPS
- [ ] Implémenter la vérification d'email
- [ ] Ajouter la réinitialisation de mot de passe
- [ ] Tests unitaires et d'intégration

## 🔧 Configuration

Variables d'environnement dans `.env`:

```env
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=24h
FRONTEND_URL=http://localhost:3000
```

## 📝 Structure du projet

```
backend/
├── src/
│   ├── config/
│   │   └── jwt.ts         # Configuration JWT
│   ├── middleware/
│   │   └── auth.ts        # Middleware d'authentification
│   ├── models/
│   │   ├── User.ts        # Modèle utilisateur
│   │   └── UserStore.ts   # Stockage en mémoire
│   ├── routes/
│   │   └── auth.ts        # Routes d'authentification
│   └── index.ts           # Point d'entrée
├── package.json
├── tsconfig.json
└── .env.example
```

## 🧪 Tests

```bash
# Tester l'inscription
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'

# Tester la connexion
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Tester la route protégée
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <your-token>"
```

## 📄 License

MIT
