import { User } from './User';

// In-memory storage for hackathon
// TODO: Replace with actual database in production
class UserStore {
  private users: Map<string, User> = new Map();

  async create(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  async findById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async exists(email: string): Promise<boolean> {
    return Array.from(this.users.values()).some(u => u.email === email);
  }
}

export const userStore = new UserStore();
