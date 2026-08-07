import { ServiceIdentifier } from 'inversify';
import { User } from '../../../user/domain/types';

export interface RegistrationUserAccessor {
  findByLogin(login: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByCode(code: string): Promise<User | null>;
  create(user: Omit<User, 'id'>): Promise<string>;
  updateEmailConfirmation(
    userId: string,
    confirmation: Partial<User['emailConfirmation']>,
  ): Promise<boolean>;
}

export const REGISTATION_USER_ACESSOR: ServiceIdentifier<RegistrationUserAccessor> =
  Symbol('RegistrationUserAccessor');
