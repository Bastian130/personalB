export interface CVData {
  name?: string;
  email?: string;
  phone?: string;
  experiences?: Array<{
    title: string;
    company: string;
    startDate: string;
    endDate?: string;
    description: string;
    current?: boolean;
  }>;
  skills?: string[];
  passions?: string[];
  education?: Array<{
    degree: string;
    school: string;
    startDate: string;
    endDate?: string;
    description?: string;
  }>;
  projects?: Array<{
    name: string;
    description: string;
    technologies?: string[];
    link?: string;
  }>;
  summary?: string;
}

export interface CV {
  id: string;
  userId: string;
  // Données pour CV uploadé
  filename?: string;
  originalName?: string;
  path?: string;
  mimeType?: string;
  size?: number;
  uploadDate?: Date;
  // Type de CV : 'uploaded' ou 'manual'
  type: 'uploaded' | 'manual';
  // Données du CV (saisie manuelle ou extraites de l'upload)
  data?: CVData;
  // Métadonnées
  createdAt: Date;
  updatedAt: Date;
}

export interface CVResponse {
  id: string;
  userId: string;
  type: 'uploaded' | 'manual';
  filename?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  uploadDate?: Date;
  data?: CVData;
  createdAt: Date;
  updatedAt: Date;
}
