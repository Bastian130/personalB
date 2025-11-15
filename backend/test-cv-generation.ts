import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const API_BASE_URL = 'http://localhost:3001/api';

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

interface CVData {
  name: string;
  email: string;
  phone: string;
  summary: string;
  experiences: Array<{
    title: string;
    company: string;
    startDate: string;
    endDate?: string;
    description: string;
    current?: boolean;
  }>;
  education: Array<{
    degree: string;
    school: string;
    startDate: string;
    endDate?: string;
    description?: string;
  }>;
  skills: string[];
  projects?: Array<{
    name: string;
    description: string;
    technologies?: string[];
    link?: string;
  }>;
  passions: string[];
}

// Données de test
const testUser = {
  email: `test_${Date.now()}@example.com`,
  password: 'TestPassword123!',
  name: 'Jean Dupont',
};

const testCVData: CVData = {
  name: 'Jean Dupont',
  email: 'jean.dupont@example.com',
  phone: '+33 6 12 34 56 78',
  summary:
    "Développeur Full Stack passionné avec 5 ans d'expérience dans la création d'applications web modernes et scalables. Expert en JavaScript/TypeScript, React, et Node.js. Orienté résultats avec un fort esprit d'équipe.",
  experiences: [
    {
      title: 'Développeur Full Stack Senior',
      company: 'TechCorp Paris',
      startDate: '2021-01',
      endDate: '2024-11',
      description:
        "Développement d'applications web avec React, Node.js et PostgreSQL. Mise en place d'une architecture microservices qui a amélioré les performances de 40%. Lead technique d'une équipe de 4 développeurs. Migration réussie vers TypeScript avec réduction de 60% des bugs en production.",
      current: true,
    },
    {
      title: 'Développeur Frontend',
      company: 'WebAgency',
      startDate: '2019-06',
      endDate: '2020-12',
      description:
        "Création d'interfaces utilisateur modernes et responsives avec React et TypeScript. Intégration de designs Figma avec pixel-perfect precision. Optimisation des performances web (amélioration du score Lighthouse de 45 à 95). Collaboration étroite avec les designers UX/UI.",
    },
    {
      title: 'Développeur Web Junior',
      company: 'StartupTech',
      startDate: '2018-01',
      endDate: '2019-05',
      description:
        "Développement de sites web et applications mobiles avec Vue.js et Ionic. Participation active aux code reviews et aux sprints agiles. Contribution à l'amélioration continue des pratiques de développement.",
    },
  ],
  education: [
    {
      degree: 'Master en Informatique - Spécialité Génie Logiciel',
      school: 'Université Paris-Saclay',
      startDate: '2017-09',
      endDate: '2019-06',
      description:
        'Spécialisation en développement web et architecture logicielle. Projet de fin d\'études : "Plateforme de e-learning interactive avec IA".',
    },
    {
      degree: 'Licence en Informatique',
      school: 'Université Pierre et Marie Curie',
      startDate: '2014-09',
      endDate: '2017-06',
      description: 'Formation générale en informatique avec mention Bien.',
    },
  ],
  skills: [
    'JavaScript/TypeScript',
    'React/Next.js',
    'Node.js/Express',
    'PostgreSQL/MongoDB',
    'Docker/Kubernetes',
    'Git/GitHub',
    'CI/CD (Jenkins, GitLab CI)',
    'REST APIs/GraphQL',
    'Jest/Testing Library',
    'AWS/GCP',
    'Agile/Scrum',
    'TDD/Clean Code',
  ],
  projects: [
    {
      name: 'E-Commerce Platform',
      description:
        'Plateforme e-commerce complète avec gestion des paiements (Stripe), inventaire en temps réel, et système de recommandations basé sur le machine learning. Plus de 10 000 utilisateurs actifs.',
      technologies: ['React', 'Node.js', 'PostgreSQL', 'Stripe', 'Redis', 'Docker'],
      link: 'https://github.com/jeandupont/ecommerce-platform',
    },
    {
      name: 'Task Manager Pro',
      description:
        'Application de gestion de tâches collaborative avec synchronisation temps réel via WebSocket. Interface intuitive et performante.',
      technologies: ['Next.js', 'Socket.io', 'MongoDB', 'TypeScript'],
      link: 'https://github.com/jeandupont/task-manager',
    },
  ],
  passions: [
    'Contributions Open Source (500+ commits sur GitHub)',
    'Photographie de paysage',
    'Randonnée en montagne',
    'Lecture de blogs tech et veille technologique',
    'Mentorat de développeurs juniors',
  ],
};

class CVGenerationTester {
  private token: string = '';
  private userId: string = '';

  /**
   * Test 1 : Inscription
   */
  async testRegister(): Promise<void> {
    console.log('\n📝 Test 1 : Inscription...');
    try {
      const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/register`, testUser);

      this.token = response.data.token;
      this.userId = response.data.user.id;

      console.log('✅ Inscription réussie');
      console.log(`   User ID: ${this.userId}`);
      console.log(`   Email: ${response.data.user.email}`);
      console.log(`   Token: ${this.token.substring(0, 20)}...`);
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'inscription:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Test 2 : Upload de la photo
   */
  async testPhotoUpload(photoPath?: string): Promise<void> {
    console.log('\n📸 Test 2 : Upload de la photo...');

    // Si aucune photo n'est fournie, créer une image de test
    let photoToUpload = photoPath;
    let isTestPhoto = false;

    if (!photoToUpload) {
      console.log('   ⚠️  Aucune photo fournie, création d\'une photo de test...');
      photoToUpload = path.join(__dirname, 'test-photo.jpg');
      isTestPhoto = true;

      // Vérifier si la photo de test existe
      if (!fs.existsSync(photoToUpload)) {
        console.log('   ℹ️  Pas de photo disponible pour ce test (optionnel)');
        return;
      }
    }

    try {
      const form = new FormData();
      form.append('photo', fs.createReadStream(photoToUpload));

      const response = await axios.post(`${API_BASE_URL}/user/photo`, form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${this.token}`,
        },
      });

      console.log('✅ Photo uploadée avec succès');
      console.log(`   Filename: ${response.data.user.photoFilename}`);
      console.log(`   URL: ${response.data.user.photoUrl}`);

      if (isTestPhoto) {
        console.log('   ℹ️  Photo de test utilisée');
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'upload de la photo:', error.response?.data || error.message);
      console.log('   ℹ️  Le test continuera sans photo (optionnel)');
    }
  }

  /**
   * Test 3 : Création des données du CV
   */
  async testCreateCV(): Promise<void> {
    console.log('\n📄 Test 3 : Création des données du CV...');
    try {
      const response = await axios.post(`${API_BASE_URL}/cv/manual`, testCVData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
      });

      console.log('✅ Données du CV créées avec succès');
      console.log(`   CV ID: ${response.data.cv.id}`);
      console.log(`   Type: ${response.data.cv.type}`);
      console.log(`   Sections: ${Object.keys(response.data.cv.data || {}).length} sections`);
    } catch (error: any) {
      console.error('❌ Erreur lors de la création du CV:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Test 4 : Récupération du CV
   */
  async testGetCV(): Promise<void> {
    console.log('\n📋 Test 4 : Récupération du CV...');
    try {
      const response = await axios.get(`${API_BASE_URL}/cv/me`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      console.log('✅ CV récupéré avec succès');
      console.log(`   Nom: ${response.data.data?.name}`);
      console.log(`   Email: ${response.data.data?.email}`);
      console.log(`   Expériences: ${response.data.data?.experiences?.length || 0}`);
      console.log(`   Compétences: ${response.data.data?.skills?.length || 0}`);
      console.log(`   Formations: ${response.data.data?.education?.length || 0}`);
    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération du CV:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Test 5 : Génération du code LaTeX
   */
  async testGenerateLatex(): Promise<void> {
    console.log('\n📝 Test 5 : Génération du code LaTeX...');
    try {
      const response = await axios.get(`${API_BASE_URL}/cv/latex`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      const latexCode = response.data;
      console.log('✅ Code LaTeX généré avec succès');
      console.log(`   Longueur: ${latexCode.length} caractères`);
      console.log(`   Commence par: ${latexCode.substring(0, 50)}...`);

      // Sauvegarder le code LaTeX
      const latexPath = path.join(__dirname, 'test-output-cv.tex');
      fs.writeFileSync(latexPath, latexCode);
      console.log(`   💾 Code LaTeX sauvegardé: ${latexPath}`);
    } catch (error: any) {
      console.error('❌ Erreur lors de la génération du LaTeX:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Test 6 : Génération du PDF complet
   */
  async testGeneratePDF(): Promise<void> {
    console.log('\n🎨 Test 6 : Génération du PDF complet...');
    try {
      const response = await axios.post(
        `${API_BASE_URL}/cv/generate-pdf`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
          responseType: 'arraybuffer',
        }
      );

      const pdfPath = path.join(__dirname, 'test-output-cv.pdf');
      fs.writeFileSync(pdfPath, response.data);

      const fileSize = fs.statSync(pdfPath).size;
      console.log('✅ PDF généré avec succès');
      console.log(`   Taille: ${(fileSize / 1024).toFixed(2)} KB`);
      console.log(`   💾 PDF sauvegardé: ${pdfPath}`);
      console.log(`   🎉 Vous pouvez maintenant ouvrir le fichier !`);
    } catch (error: any) {
      console.error('❌ Erreur lors de la génération du PDF:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Exécuter tous les tests
   */
  async runAllTests(photoPath?: string): Promise<void> {
    console.log('🚀 Démarrage des tests de génération de CV\n');
    console.log('=' .repeat(60));

    try {
      await this.testRegister();
      await this.testPhotoUpload(photoPath);
      await this.testCreateCV();
      await this.testGetCV();
      await this.testGenerateLatex();
      await this.testGeneratePDF();

      console.log('\n' + '='.repeat(60));
      console.log('✅ TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS ! 🎉');
      console.log('=' .repeat(60));
      console.log('\nFichiers générés :');
      console.log(`  - ${path.join(__dirname, 'test-output-cv.tex')} (Code LaTeX)`);
      console.log(`  - ${path.join(__dirname, 'test-output-cv.pdf')} (CV final)`);
      console.log('\n');
    } catch (error) {
      console.log('\n' + '='.repeat(60));
      console.log('❌ LES TESTS ONT ÉCHOUÉ');
      console.log('=' .repeat(60));
      console.error('\nErreur:', error);
      process.exit(1);
    }
  }
}

// Fonction principale
async function main() {
  // Vérifier si le serveur est accessible
  console.log('🔍 Vérification de la connexion au serveur...');
  try {
    // Tenter une connexion simple au serveur (404 est acceptable, cela montre que le serveur répond)
    await axios.get(`${API_BASE_URL.replace('/api', '')}/`, { validateStatus: (status) => status < 500 });
    console.log('✅ Serveur accessible\n');
  } catch (error) {
    console.error('❌ Impossible de se connecter au serveur');
    console.error('   Assurez-vous que le serveur tourne sur http://localhost:3001');
    console.error('   Lancez-le avec : npm run dev');
    process.exit(1);
  }

  const tester = new CVGenerationTester();

  // Récupérer le chemin de la photo depuis les arguments
  const photoPath = process.argv[2];

  if (photoPath) {
    console.log(`📷 Photo fournie : ${photoPath}\n`);
  } else {
    console.log('ℹ️  Aucune photo fournie (les tests continueront sans photo)\n');
    console.log('   Pour tester avec une photo : ts-node test-cv-generation.ts /path/to/photo.jpg\n');
  }

  await tester.runAllTests(photoPath);
}

// Exécution
main().catch((error) => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});
