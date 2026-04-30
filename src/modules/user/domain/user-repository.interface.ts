import type { User } from './types';

export interface UserRepository {
  findById(userId: string): Promise<User | null>;
  findByLogin(login: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: Omit<User, 'id'>): Promise<string>;
  delete(userId: string): Promise<boolean>;
}
