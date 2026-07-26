import { User } from '../../../user/domain/types';

export interface RegistrationUserAccessor {
  findByLogin(login: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: Omit<User, 'id'>): Promise<string>;
}
