import { PaginationAndSorting } from '../../../core/types/pagination-and-sorting';
import { User } from '../domain/types';

// === Repository Layer ===

export type CheckUserExistsPayload = {
  email: string;
  login: string;
};

export type CreateUserPayload = Omit<User, 'id'>;

// === Query Repository Layer ===

export enum UserSortField {
  createdAt = 'createdAt',
  login = 'login',
  email = 'email',
}

export type UserListQueryInput = PaginationAndSorting<UserSortField> & {
  searchLoginTerm?: string;
  searchEmailTerm?: string;
};

// === Database ===

export type UserDB = {
  login: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  emailConfirmation: {
    confirmationCode: string;
    expirationDate: Date;
    isConfirmed: boolean;
  };
};
