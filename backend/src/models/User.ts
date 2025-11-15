export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  createdAt: Date;
  cvId?: string; // Reference to the user's CV
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  cvId?: string;
}
