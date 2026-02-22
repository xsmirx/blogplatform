import { PaginationAndSorting } from '../../../core/types/pagination-and-sorting';

// === DTO (API Layer) ===

export type UserInputDTO = {
  login: string;
  email: string;
  password: string;
};

export type UserOutputDTO = {
  id: string;
  login: string;
  email: string;
  createdAt: string;
};

// === Service Layer ===

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

// === Repository Layer ===

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
