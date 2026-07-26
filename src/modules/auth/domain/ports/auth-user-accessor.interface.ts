import { User } from '../../../user/domain/types';

export interface AuthUserAccessor {
  findByLoginOrEmail(loginOrEmail: string): Promise<User | null>;
}
