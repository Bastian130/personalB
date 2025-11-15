export interface CV {
  id: string;
  userId: string;
  filename: string;
  originalName: string;
  path: string;
  mimeType: string;
  size: number;
  uploadDate: Date;
  // Données extraites (optionnel, rempli après analyse)
  extractedData?: {
    experiences?: string;
    skills?: string;
    passions?: string;
    education?: string;
    projects?: string;
    summary?: string;
  };
}

export interface CVResponse {
  id: string;
  userId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadDate: Date;
  extractedData?: CV['extractedData'];
}
