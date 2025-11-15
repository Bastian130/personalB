# 🐳 Docker - Personal B

Ce projet utilise Docker Compose pour orchestrer le backend et le frontend.

## 📋 Prérequis

- Docker Engine 20.10+
- Docker Compose 2.0+

## 🚀 Démarrage rapide

### 1. Configuration des variables d'environnement

Créez un fichier `.env` à la racine du projet :

```bash
# Backend
JWT_SECRET=votre-secret-jwt-securise-changez-moi
JWT_EXPIRES_IN=24h

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 2. Lancer l'application

```bash
# Construire et démarrer tous les services
docker-compose up --build

# Ou en arrière-plan
docker-compose up -d --build
```

### 3. Accéder à l'application

- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:3001
- **Health Check** : http://localhost:3001/health

## 🛠️ Commandes utiles

```bash
# Arrêter les services
docker-compose down

# Arrêter et supprimer les volumes
docker-compose down -v

# Voir les logs
docker-compose logs -f

# Voir les logs d'un service spécifique
docker-compose logs -f backend
docker-compose logs -f frontend

# Reconstruire un service spécifique
docker-compose build backend
docker-compose build frontend

# Redémarrer un service
docker-compose restart backend
docker-compose restart frontend

# Voir l'état des services
docker-compose ps

# Exécuter une commande dans un conteneur
docker-compose exec backend sh
docker-compose exec frontend sh
```

## 📦 Architecture

```
┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │
│   Frontend      │────────▶│    Backend      │
│   (Next.js)     │  API    │   (Express)     │
│   Port: 3000    │         │   Port: 3001    │
│                 │         │                 │
└─────────────────┘         └─────────────────┘
`