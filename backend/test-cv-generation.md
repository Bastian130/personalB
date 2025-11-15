# Test de la génération de CV en PDF

## Routes disponibles

### 1. POST `/api/cv/generate-pdf`
Génère un CV professionnel en PDF à partir des données JSON et de la photo de profil.

**Prérequis :**
- Utilisateur authentifié (token JWT)
- CV avec données créé (via `/api/cv/manual` ou `/api/cv/upload`)
- Photo de profil uploadée (optionnel mais recommandé)

**Headers :**
```
Authorization: Bearer <votre_token_jwt>
```

**Réponse :**
- Télécharge directement le fichier PDF
- Nom du fichier : `CV_<nom>.pdf`

**Exemple avec curl :**
```bash
curl -X POST http://localhost:3001/api/cv/generate-pdf \
  -H "Authorization: Bearer <votre_token>" \
  --output mon_cv.pdf
```

**Exemple avec fetch :**
```javascript
const response = await fetch('http://localhost:3001/api/cv/generate-pdf', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'mon_cv.pdf';
a.click();
```

---

### 2. GET `/api/cv/latex`
Génère uniquement le code LaTeX sans le compiler (utile pour debug ou preview).

**Prérequis :**
- Utilisateur authentifié (token JWT)
- CV avec données créé

**Headers :**
```
Authorization: Bearer <votre_token_jwt>
```

**Réponse :**
- Content-Type: `text/plain; charset=utf-8`
- Corps : code LaTeX complet

**Exemple avec curl :**
```bash
curl -X GET http://localhost:3001/api/cv/latex \
  -H "Authorization: Bearer <votre_token>"
```

---

## Workflow complet de test

### 1. Inscription / Connexion
```bash
# Inscription
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Jean Dupont"
  }'

# Connexion
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }' | jq -r '.token')

echo "Token: $TOKEN"
```

### 2. Upload de la photo de profil
```bash
curl -X POST http://localhost:3001/api/user/photo \
  -H "Authorization: Bearer $TOKEN" \
  -F "photo=@/chemin/vers/votre/photo.jpg"
```

### 3. Créer ou mettre à jour les données du CV
```bash
curl -X POST http://localhost:3001/api/cv/manual \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jean Dupont",
    "email": "jean.dupont@example.com",
    "phone": "+33 6 12 34 56 78",
    "summary": "Développeur Full Stack passionné avec 5 ans d'\''expérience dans la création d'\''applications web modernes et scalables.",
    "experiences": [
      {
        "title": "Développeur Full Stack Senior",
        "company": "TechCorp",
        "startDate": "2021-01",
        "endDate": "2024-11",
        "description": "Développement d'\''applications web avec React, Node.js et PostgreSQL. Amélioration des performances de 40%.",
        "current": true
      },
      {
        "title": "Développeur Frontend",
        "company": "WebAgency",
        "startDate": "2019-06",
        "endDate": "2020-12",
        "description": "Création d'\''interfaces utilisateur modernes et responsives avec React et TypeScript."
      }
    ],
    "education": [
      {
        "degree": "Master en Informatique",
        "school": "Université Paris-Saclay",
        "startDate": "2017-09",
        "endDate": "2019-06",
        "description": "Spécialisation en développement web et architecture logicielle"
      }
    ],
    "skills": [
      "JavaScript/TypeScript",
      "React",
      "Node.js",
      "PostgreSQL",
      "Docker",
      "Git",
      "CI/CD",
      "REST APIs",
      "GraphQL"
    ],
    "projects": [
      {
        "name": "E-Commerce Platform",
        "description": "Plateforme e-commerce complète avec gestion des paiements et inventaire",
        "technologies": ["React", "Node.js", "Stripe", "PostgreSQL"],
        "link": "https://github.com/username/project"
      }
    ],
    "passions": [
      "Open Source",
      "Photographie",
      "Randonnée",
      "Lecture de blogs tech"
    ]
  }'
```

### 4. Générer le CV en PDF
```bash
# Télécharger le PDF
curl -X POST http://localhost:3001/api/cv/generate-pdf \
  -H "Authorization: Bearer $TOKEN" \
  --output cv_generated.pdf

echo "✅ CV généré : cv_generated.pdf"

# Ou obtenir uniquement le code LaTeX
curl -X GET http://localhost:3001/api/cv/latex \
  -H "Authorization: Bearer $TOKEN" \
  > cv_generated.tex

echo "✅ Code LaTeX généré : cv_generated.tex"
```

---

## Notes techniques

### Fonctionnalités
- ✅ Génération LaTeX avec Gemini 2.0 Flash
- ✅ Intégration de la photo professionnelle
- ✅ Format ATS-friendly (Applicant Tracking System)
- ✅ Style professionnel et moderne
- ✅ Sections : résumé, expériences, formation, compétences, projets, passions
- ✅ Format CAR (Contexte-Action-Résultat) pour les expériences
- ✅ Compilation automatique en PDF

### Limitations actuelles
- `latex.js` peut avoir des limitations avec certaines fonctionnalités LaTeX avancées
- Pour une production complète, considérez l'utilisation de `pdflatex` via `child_process`
- Les fichiers générés sont conservés dans `uploads/generated-cvs/` (possibilité de les nettoyer)

### Fichiers générés
Les fichiers sont stockés dans : `/backend/uploads/generated-cvs/`
- `cv_<userId>_<timestamp>.pdf` - Le CV en PDF
- `cv_<userId>_<timestamp>.tex` - Le code LaTeX source (pour référence)

---

## Dépannage

### Erreur : "Aucun CV trouvé ou données de CV manquantes"
- Assurez-vous d'avoir créé un CV avec `/api/cv/manual` ou `/api/cv/upload` avant de générer le PDF

### Erreur : "Échec de la compilation PDF"
- Le code LaTeX a été généré mais la compilation a échoué
- Vérifiez le fichier `.tex` sauvegardé pour identifier les problèmes
- `latex.js` peut ne pas supporter toutes les fonctionnalités LaTeX

### La photo n'apparaît pas
- Vérifiez que la photo a bien été uploadée avec `/api/user/photo`
- La photo doit être au format JPG, PNG, GIF ou WebP
- Le fichier doit exister dans `/backend/uploads/photos/`
