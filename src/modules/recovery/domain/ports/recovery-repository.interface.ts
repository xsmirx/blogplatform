import { ServiceIdentifier } from 'inversify';

export interface RecoveryRepository {}

export const RECOVERY_REPOSITORY: ServiceIdentifier<RecoveryRepository> =
  Symbol('RecoveryRepository');
