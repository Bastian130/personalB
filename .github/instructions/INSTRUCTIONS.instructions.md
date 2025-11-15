---
applyTo: '/backend'
---
✅ 1) Fonctionnalités réalisables en 6h
🎯 Ce que vous pouvez livrer en version hackathon

Upload d’un premier CV OU d’un texte brut

Champs essentiels : expérience, compétences, passions, contact, études.

Analyse et structuration par Gemini (via n8n)

Extraction des infos

Mise au propre

Normalisation ATS (titres, bullet points, mots clés, format CAR)

Génération d’un CV LaTeX propre

Template fixe

Variables remplies automatiquement

Assistant vocal (ElevenLabs + Gemini)

Il connaît les données du CV (stockées dans n8n memory / JSON / DB simple)

Coaching : comment répondre à une question d’entretien, comment reformuler une expérience, comment optimiser un projet…

Web App simple

Upload / formulaire

Aperçu du CV généré

Player audio pour la voix

Chat assistant (texte + audio)

C’est largement suffisant pour un hackathon.
Résumé global : Projet “Personal B – Le coach CV & carrière”

Une web app qui :

Récupère les infos d’un utilisateur (CV PDF ou texte + champs d’expérience, compétences, passions).

Analyse et structure les données via Gemini (workflow n8n).

Génère un CV ATS en LaTeX automatiquement.

Propose un assistant vocal utilisant ElevenLabs pour répondre, coacher et préparer les entretiens.

Cet assistant connaît les données du CV et adapte ses réponses.

Pas d’authentification (ou session locale simple).

🧩 Les fonctionnalités (obligatoires & réalistes en 6h)
🟦 1) Collecte des données

Upload CV PDF ou saisie texte.

Formulaire minimal :

Nom

Email

Expériences

Compétences

Passions

Études

➡️ Ces données partent dans un webhook n8n.

🟦 2) Analyse & extraction

Via n8n + Gemini :

Lire le PDF ou texte

Extraire :

résumé

expériences structurées

compétences

formations

projets

Normalisation ATS

Sortie : JSON propre

Stocké dans frontend (localStorage) + renvoyé au front.

🟦 3) Génération CV LaTeX

Workflow n8n :

Input = JSON du CV

Gemini génère le template LaTeX rempli

Renvoie le code LaTeX ou un PDF compilé

➡️ Le front affiche le LaTeX et propose un bouton “Télécharger PDF”.

🟦 4) Assistant Vocal – “Personal B Coach”

Fonctionnalités :

Bouton “Parler” → enregistrement audio

Envoi dans n8n → Speech-to-Text Gemini

Gemini répond en fonction du CV connu

Transformation ElevenLabs → voix de coach

Le front :

affiche la réponse texte

lit la réponse vocale

Scénarios de coaching :

“Comment répondre à ‘Présentez-vous’ ?”

“Comment améliorer mon expérience X ?”

“Optimise mes hard skills pour un job Y.”

“Prépare-moi pour un entretien en 3 questions.”
