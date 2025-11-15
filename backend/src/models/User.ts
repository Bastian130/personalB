export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  createdAt: Date;
  cvId?: string; // Reference to the user's CV
  photoFilename?: string; // Photo de profil (filename seulement)
  photoOriginalName?: string; // Nom original de la photo
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  cvId?: string;
  photoFilename?: string;
  photoUrl?: string; // URL complète pour accéder à la photo
}
