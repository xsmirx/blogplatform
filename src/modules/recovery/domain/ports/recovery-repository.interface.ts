import { ServiceIdentifier } from 'inversify';
import { Recovery } from '../types';

export interface RecoveryRepository {
  findByCode(code: string): Promise<Recovery | null>;
  create(input: {
    code: string;
    userId: string;
    email: string;
  }): Promise<string>;
  delete(id: string): Promise<boolean>;
}

export const RECOVERY_REPOSITORY: ServiceIdentifier<RecoveryRepository> =
  Symbol('RecoveryRepository');
