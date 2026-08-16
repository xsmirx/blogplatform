import { ServiceIdentifier } from 'inversify';
import { Recovery } from '../types';

export interface RecoveryRepository {
  findByCode(code: string): Promise<Recovery | null>;
  create(code: string): Promise<string>;
}

export const RECOVERY_REPOSITORY: ServiceIdentifier<RecoveryRepository> =
  Symbol('RecoveryRepository');
