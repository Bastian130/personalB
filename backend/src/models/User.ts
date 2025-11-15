export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  createdAt: Date;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
}
