import { ServiceIdentifier } from 'inversify';
import { User } from '../../../user/domain/types';

export interface RecoveryUserAccessor {
  findByEmail(email: string): Promise<User | null>;
  updatePasswordHash(id: string, passwordHash: string): Promise<boolean>;
}

export const RECOVERY_USER_REPOSITORY: ServiceIdentifier<RecoveryUserAccessor> =
  Symbol('RecoveryUserAccessor');
