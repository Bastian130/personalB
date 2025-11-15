#!/bin/bash

# ============================================
# Script de Test pour Personal B Workflow
# ============================================

# CONFIGURATION
# Remplacez par l'URL de votre instance n8n
N8N_URL="http://localhost:5678"
WEBHOOK_PATH="webhook-test/personal-b"  # Pour test
# WEBHOOK_PATH="webhook/personal-b"     # Pour production

# Couleurs pour le terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}   Personal B - Tests du Workflow   ${NC}"
echo -e "${BLUE}=====================================${NC}\n"

# ============================================
# TEST 1 : Question sur le CV Tech
# ============================================
echo -e "${YELLOW}📝 TEST 1 : Question CV Tech${NC}"

curl -X POST "${N8N_URL}/${WEBHOOK_PATH}" \
  -H "Content-Type: application/json" \
  -d '{
    "user_question": "Comment améliorer mon CV pour postuler dans la tech ?",
    "cv_summary": "Développeur Full Stack avec 3 ans d'\''expérience en React et Node.js. Diplômé en informatique de l'\''EPITA. Passionné par l'\''innovation et l'\''apprentissage continu. Expérience en startup et grande entreprise."
  }' \
  -w "\n\nStatus: %{http_code}\nTime: %{time_total}s\n" \
  -o response1.json

echo -e "${GREEN}✅ Réponse sauvegardée dans response1.json${NC}\n"
sleep 2

# ============================================
# TEST 2 : Question sur Transition de Carrière
# ============================================
echo -e "${YELLOW}📝 TEST 2 : Transition de Carrière${NC}"

curl -X POST "${N8N_URL}/${WEBHOOK_PATH}" \
  -H "Content-Type: application/json" \
  -d '{
    "user_question": "Je veux passer du marketing au product management, comment préparer ma candidature ?",
    "cv_summary": "Marketing Manager avec 5 ans d'\''expérience en stratégie digitale. MBA en Marketing. Compétences en analyse de données, gestion de projets agiles, et connaissance du développement web. Passionné par les produits tech."
  }' \
  -w "\n\nStatus: %{http_code}\nTime: %{time_total}s\n" \
  -o response2.json

echo -e "${GREEN}✅ Réponse sauvegardée dans response2.json${NC}\n"
sleep 2

# ============================================
# TEST 3 : Question LinkedIn
# ============================================
echo -e "${YELLOW}📝 TEST 3 : Optimisation LinkedIn${NC}"

curl -X POST "${N8N_URL}/${WEBHOOK_PATH}" \
  -H "Content-Type: application/json" \
  -d '{
    "user_question": "Comment optimiser mon profil LinkedIn pour attirer les recruteurs ?",
    "cv_summary": "Data Scientist junior, diplômé en statistiques. 1 an d'\''expérience en analyse prédictive. Certifications Python et Machine Learning. Recherche opportunités en IA et Big Data."
  }' \
  -w "\n\nStatus: %{http_code}\nTime: %{time_total}s\n" \
  -o response3.json

echo -e "${GREEN}✅ Réponse sauvegardée dans response3.json${NC}\n"
sleep 2

# ============================================
# TEST 4 : Question Entretien
# ============================================
echo -e "${YELLOW}📝 TEST 4 : Préparation Entretien${NC}"

curl -X POST "${N8N_URL}/${WEBHOOK_PATH}" \
  -H "Content-Type: application/json" \
  -d '{
    "user_question": "Quels sont les points clés à mettre en avant lors d'\''un entretien pour un poste de lead developer ?",
    "cv_summary": "Senior Developer avec 7 ans d'\''expérience. Expert React, Node.js, et architecture cloud AWS. A managé des équipes de 3-5 personnes sur plusieurs projets. Forte orientation business et technique."
  }' \
  -w "\n\nStatus: %{http_code}\nTime: %{time_total}s\n" \
  -o response4.json

echo -e "${GREEN}✅ Réponse sauvegardée dans response4.json${NC}\n"
sleep 2

# ============================================
# TEST 5 : Question Junior
# ============================================
echo -e "${YELLOW}📝 TEST 5 : Premier Emploi${NC}"

curl -X POST "${N8N_URL}/${WEBHOOK_PATH}" \
  -H "Content-Type: application/json" \
  -d '{
    "user_question": "Comment me démarquer en tant que jeune diplômé sans expérience pro ?",
    "cv_summary": "Jeune diplômé en développement web (Bac+2). Stage de 6 mois en agence digitale. Projets personnels : site e-commerce, application mobile de gestion de tâches. Passionné et motivé."
  }' \
  -w "\n\nStatus: %{http_code}\nTime: %{time_total}s\n" \
  -o response5.json

echo -e "${GREEN}✅ Réponse sauvegardée dans response5.json${NC}\n"

# ============================================
# RÉSUMÉ
# ============================================
echo -e "\n${BLUE}=====================================${NC}"
echo -e "${BLUE}        Résumé des Tests             ${NC}"
echo -e "${BLUE}=====================================${NC}\n"

echo "📁 Fichiers de réponse créés :"
echo "   - response1.json (CV Tech)"
echo "   - response2.json (Transition)"
echo "   - response3.json (LinkedIn)"
echo "   - response4.json (Entretien)"
echo "   - response5.json (Junior)"
echo ""

echo -e "${GREEN}Pour voir une réponse :${NC}"
echo "   cat response1.json | jq '.assistant_text'"
echo ""

echo -e "${GREEN}Pour décoder l'audio base64 :${NC}"
echo "   cat response1.json | jq -r '.assistant_audio_base64' | base64 -d > audio.mp3"
echo "   mpv audio.mp3  # ou vlc audio.mp3"
echo ""

echo -e "${BLUE}=====================================${NC}"
echo -e "${GREEN}✅ Tests terminés !${NC}"
echo -e "${BLUE}=====================================${NC}\n"

