import { PaginationAndSorting } from '../../core/types/pagination-and-sorting';

export type User = {
  id: string;
  login: string;
  email: string;
  createdAt: string;
};

export enum UserSortField {
  createdAt = 'createdAt',
  login = 'login',
  email = 'email',
}

export type UserListPagQueryInput = PaginationAndSorting<UserSortField> & {
  searchLoginTerm?: string;
  searchEmailTerm?: string;
};

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

export type UserDB = {
  login: string;
  email: string;
  saltedHash: string;
  createdAt: Date;
};
