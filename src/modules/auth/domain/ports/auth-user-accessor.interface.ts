import { ServiceIdentifier } from 'inversify';
import { User } from '../../../user/domain/types';

export interface AuthUserAccessor {
  findByLoginOrEmail(loginOrEmail: string): Promise<User | null>;
}

export const AUTH_USER_ACCESSOR: ServiceIdentifier<AuthUserAccessor> =
  Symbol('AuthUserAccessor');
