import type { PaginationAndSorting } from '../../../core/types/pagination-and-sorting';

export enum UserSortField {
  createdAt = 'createdAt',
  login = 'login',
  email = 'email',
}

export type UserListQueryInput = PaginationAndSorting<UserSortField> & {
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
