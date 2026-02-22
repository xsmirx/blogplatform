import { User } from '../domain/types';

export type CheckUserExistsPayload = {
  email: string;
  login: string;
};

export type CreateUserPayload = Omit<User, 'id'>;
