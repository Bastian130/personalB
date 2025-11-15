# Personal B - Workflow n8n Assistant de Coaching

## 📋 Vue d'ensemble

Ce workflow n8n crée un assistant de coaching carrière personnalisé qui :
1. Reçoit une question utilisateur + résumé de CV via webhook
2. Interroge Google Gemini pour obtenir une réponse personnalisée
3. Convertit la réponse en audio via ElevenLabs
4. Renvoie le texte et l'audio au frontend

## 🏗️ Architecture du Workflow

```
Webhook (POST)
    ↓
Gemini - Génération Réponse
    ↓
Extraire Texte Gemini
    ↓
ElevenLabs - Text-to-Speech
    ↓
Convertir Audio Binary
    ↓
Préparer Réponse Finale
    ↓
Respond to Webhook
```

## 🔧 Configuration des Variables d'Environnement

Dans votre instance n8n, vous devez configurer les variables d'environnement suivantes :

### 1. API Gemini
```bash
GEMINI_API_KEY=votre_clé_api_gemini_ici
```
📌 **Obtenir votre clé** : https://makersuite.google.com/app/apikey

### 2. API ElevenLabs
```bash
ELEVENLABS_API_KEY=votre_clé_api_elevenlabs_ici
ELEVENLABS_VOICE_ID=votre_voice_id_ici
```
📌 **Obtenir votre clé** : https://elevenlabs.io/app/settings/api-keys  
📌 **Trouver Voice IDs** : https://elevenlabs.io/app/voice-library

### Voix ElevenLabs recommandées pour un coach :
- **Rachel** (Calme, professionnelle) : `21m00Tcm4TlvDq8ikWAM`
- **Adam** (Voix masculine confiante) : `pNInz6obpgDQGcFmaJgB`
- **Antoni** (Voix masculine chaleureuse) : `ErXwobaYiN019PkySvjV`
- **Bella** (Voix féminine énergique) : `EXAOdMALHpo7E7Ps4iUv`

## 📝 Détails de Configuration de Chaque Nœud

### 1️⃣ Webhook
**Type** : Trigger  
**Configuration** :
- **HTTP Method** : POST
- **Path** : `personal-b`
- **Response Mode** : Using 'Respond to Webhook' Node
- **Authentication** : None (ou ajoutez une authentification si nécessaire)

**URL du Webhook** :
- Test : `http://votre-instance-n8n.com/webhook-test/personal-b`
- Production : `http://votre-instance-n8n.com/webhook/personal-b`

**Format de la requête attendue** :
```json
{
  "user_question": "Comment améliorer mon CV pour postuler dans la tech ?",
  "cv_summary": "Développeur Full Stack avec 3 ans d'expérience en React et Node.js. Diplômé en informatique. Passionné par l'innovation et l'apprentissage continu."
}
```

### 2️⃣ Gemini - Génération Réponse
**Type** : HTTP Request  
**Configuration** :
- **Method** : POST
- **URL** : `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent`
- **Authentication** : Query Parameter
  - `key` = `{{ $env.GEMINI_API_KEY }}`

**Headers** :
```
Content-Type: application/json
```

**Body (JSON)** :
```json
{
  "contents": [
    {
      "parts": [
        {
          "text": "Tu es Personal B, un coach carrière personnalisé.\n\nVoici le résumé du CV de l'utilisateur :\n{{ $json.body.cv_summary }}\n\nVoici sa question :\n\"{{ $json.body.user_question }}\"\n\nRéponds de manière personnalisée, courte, actionnable, avec des conseils pratiques et adaptés à son profil.\nPas de texte inutile. Pas de justification. Va droit au but.\nReste dans un ton professionnel mais accessible. Maximum 150 mots."
        }
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 500
  }
}
```

**Expressions n8n utilisées** :
- `{{ $json.body.cv_summary }}` - Récupère le résumé du CV
- `{{ $json.body.user_question }}` - Récupère la question

### 3️⃣ Extraire Texte Gemini
**Type** : Set (Edit Fields)  
**Configuration** :
Extrait la réponse de Gemini et conserve les données d'entrée.

**Assignments** :
- `assistant_text` = `{{ $json.candidates[0].content.parts[0].text }}`
- `user_question` = `{{ $('Webhook').item.json.body.user_question }}`
- `cv_summary` = `{{ $('Webhook').item.json.body.cv_summary }}`

### 4️⃣ ElevenLabs - Text-to-Speech
**Type** : HTTP Request  
**Configuration** :
- **Method** : POST
- **URL** : `https://api.elevenlabs.io/v1/text-to-speech/{{ $env.ELEVENLABS_VOICE_ID }}`

**Headers** :
```
xi-api-key: {{ $env.ELEVENLABS_API_KEY }}
Content-Type: application/json
```

**Body (JSON)** :
```json
{
  "text": "{{ $json.assistant_text }}",
  "model_id": "eleven_multilingual_v2",
  "voice_settings": {
    "stability": 0.5,
    "similarity_boost": 0.75
  }
}
```

**Options** :
- Response Format : File
- Output Property Name : `audio_data`

**Modèles disponibles** :
- `eleven_multilingual_v2` - Support multilingue (français inclus)
- `eleven_turbo_v2_5` - Plus rapide, qualité légèrement inférieure
- `eleven_monolingual_v1` - Anglais uniquement

### 5️⃣ Convertir Audio Binary
**Type** : Move Binary Data  
**Configuration** :
- **Mode** : JSON to Binary
- Convertit les données binaires audio en format exploitable

### 6️⃣ Préparer Réponse Finale
**Type** : Set (Edit Fields)  
**Configuration** :
Prépare l'objet de réponse final.

**Assignments** :
- `assistant_text` = `{{ $('Extraire Texte Gemini').item.json.assistant_text }}`
- `assistant_audio_base64` = `{{ $binary.audio_data.data }}`
- `user_question` = `{{ $('Extraire Texte Gemini').item.json.user_question }}`

### 7️⃣ Respond to Webhook
**Type** : Respond to Webhook  
**Configuration** :
- **Respond With** : JSON
- **Response Code** : 200

**Response Body** :
```json
{
  "success": true,
  "user_question": "{{ $json.user_question }}",
  "assistant_text": "{{ $json.assistant_text }}",
  "assistant_audio_base64": "{{ $json.assistant_audio_base64 }}"
}
```

## 🚀 Installation

### Étape 1 : Importer le Workflow dans n8n

1. Ouvrez votre instance n8n
2. Cliquez sur **Workflows** → **Add workflow** → **Import from File**
3. Sélectionnez le fichier `personal-b-workflow.json`
4. Le workflow sera importé avec tous les nœuds configurés

### Étape 2 : Configurer les Variables d'Environnement

#### Option A : Via l'interface n8n (recommandé)
1. Allez dans **Settings** → **Environments**
2. Ajoutez les variables :
   - `GEMINI_API_KEY`
   - `ELEVENLABS_API_KEY`
   - `ELEVENLABS_VOICE_ID`

#### Option B : Via le fichier .env (self-hosted)
Ajoutez à votre fichier `.env` :
```bash
GEMINI_API_KEY=votre_clé_ici
ELEVENLABS_API_KEY=votre_clé_ici
ELEVENLABS_VOICE_ID=votre_voice_id_ici
```

### Étape 3 : Tester le Workflow

1. Ouvrez le workflow importé
2. Cliquez sur **Webhook** node
3. Cliquez sur **Listen for Test Event**
4. Utilisez curl ou Postman pour tester :

```bash
curl -X POST http://votre-instance-n8n.com/webhook-test/personal-b \
  -H "Content-Type: application/json" \
  -d '{
    "user_question": "Comment structurer mon CV pour la tech ?",
    "cv_summary": "Développeur Full Stack, 3 ans d'\''expérience React/Node.js"
  }'
```

### Étape 4 : Activer le Workflow

1. Vérifiez que le test fonctionne correctement
2. Cliquez sur le bouton **Active** en haut à droite
3. Le webhook de production sera maintenant accessible

## 📡 Utilisation de l'API

### Endpoint de Production
```
POST https://votre-instance-n8n.com/webhook/personal-b
```

### Format de la Requête
```json
{
  "user_question": "Votre question ici",
  "cv_summary": "Résumé du CV (5-10 lignes)"
}
```

### Format de la Réponse
```json
{
  "success": true,
  "user_question": "Comment structurer mon CV pour la tech ?",
  "assistant_text": "Voici ma réponse personnalisée...",
  "assistant_audio_base64": "SGVsbG8gd29ybGQh..." 
}
```

### Exemple d'Intégration Frontend (JavaScript/React)

```javascript
async function askPersonalB(question, cvSummary) {
  try {
    const response = await fetch('https://votre-n8n.com/webhook/personal-b', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_question: question,
        cv_summary: cvSummary
      })
    });

    const data = await response.json();
    
    // Afficher le texte
    console.log('Réponse:', data.assistant_text);
    
    // Jouer l'audio
    const audio = new Audio(`data:audio/mpeg;base64,${data.assistant_audio_base64}`);
    await audio.play();
    
    return data;
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// Utilisation
askPersonalB(
  "Comment améliorer mon profil LinkedIn ?",
  "Product Manager avec 5 ans d'expérience"
);
```

## 🔍 Expressions n8n Importantes

### Accéder aux données du Webhook
- `{{ $json.body.user_question }}` - Question de l'utilisateur
- `{{ $json.body.cv_summary }}` - Résumé du CV

### Accéder aux variables d'environnement
- `{{ $env.GEMINI_API_KEY }}` - Clé API Gemini
- `{{ $env.ELEVENLABS_API_KEY }}` - Clé API ElevenLabs
- `{{ $env.ELEVENLABS_VOICE_ID }}` - ID de la voix

### Accéder aux données d'un nœud précédent
- `{{ $('Nom du Node').item.json.field }}` - Accès à un champ spécifique
- `{{ $binary.audio_data.data }}` - Accès aux données binaires

### Extraire la réponse de Gemini
- `{{ $json.candidates[0].content.parts[0].text }}` - Texte généré

## ⚙️ Personnalisation

### Modifier le Prompt Gemini
Dans le nœud **Gemini - Génération Réponse**, modifiez le champ `text` du body JSON pour ajuster :
- Le ton de la réponse
- La longueur maximale
- Le style de coaching
- Les contraintes spécifiques

### Ajuster les Paramètres de la Voix
Dans le nœud **ElevenLabs**, modifiez `voice_settings` :
```json
{
  "stability": 0.5,        // 0-1 : plus stable = moins expressif
  "similarity_boost": 0.75  // 0-1 : fidélité à la voix originale
}
```

### Changer le Modèle Gemini
Modifiez l'URL du nœud Gemini :
- `gemini-2.0-flash-exp` - Rapide et efficace (recommandé)
- `gemini-1.5-pro` - Plus puissant, plus lent
- `gemini-1.5-flash` - Très rapide, moins puissant

## 🐛 Dépannage

### Erreur : "Invalid API Key"
✅ Vérifiez que les variables d'environnement sont correctement configurées  
✅ Vérifiez que vos clés API sont actives et valides

### Erreur : "Voice not found"
✅ Vérifiez que le `ELEVENLABS_VOICE_ID` est correct  
✅ Essayez avec une voix par défaut : `21m00Tcm4TlvDq8ikWAM`

### Pas de réponse audio
✅ Vérifiez que le nœud "Convertir Audio Binary" est bien configuré  
✅ Vérifiez que l'option "Response Format: File" est activée dans ElevenLabs

### Timeout sur le workflow
✅ Augmentez le timeout dans les settings du workflow  
✅ Réduisez `maxOutputTokens` dans la config Gemini  
✅ Utilisez `eleven_turbo_v2_5` pour ElevenLabs (plus rapide)

## 📊 Limites et Quotas

### Gemini API (Free Tier)
- 60 requêtes par minute
- 1,500 requêtes par jour
- ~32,000 tokens par requête

### ElevenLabs API (Free Tier)
- 10,000 caractères par mois
- ~330 caractères par requête (si réponses de 150 mots)
- Soit ~30 requêtes/mois en free

💡 **Conseil** : Pour la production, passez aux plans payants.

## 🔐 Sécurité

### Recommandations :
1. ✅ Activez l'authentification sur le webhook (Header Auth ou Basic Auth)
2. ✅ Utilisez HTTPS en production
3. ✅ Ne partagez jamais vos clés API
4. ✅ Limitez les IP autorisées dans les options du webhook
5. ✅ Ajoutez un rate limiting côté frontend

### Exemple d'ajout d'authentification :
Dans le nœud Webhook, activez **Authentication** → **Header Auth** :
- Header Name : `X-API-Key`
- Header Value : `votre_secret_key`

## 📈 Améliorations Futures

### Possibles extensions :
- [ ] Ajouter un système de cache pour les questions similaires
- [ ] Intégrer un historique des conversations
- [ ] Ajouter une analyse de sentiment
- [ ] Support multi-langue automatique
- [ ] Génération de PDF de conseils
- [ ] Intégration avec LinkedIn API pour récupérer le CV

## 🆘 Support

### Ressources utiles :
- **Documentation n8n** : https://docs.n8n.io
- **API Gemini** : https://ai.google.dev/docs
- **API ElevenLabs** : https://docs.elevenlabs.io

### Communauté :
- n8n Community : https://community.n8n.io
- Discord n8n : https://discord.gg/n8n

---

## 📄 Licence

Ce workflow est fourni tel quel, sans garantie. Libre d'utilisation et de modification.

**Créé pour Personal B** 🚀

