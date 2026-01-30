import { PaginationAndSorting } from '../../core/types/pagination-and-sorting';

export type Blog = {
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: Date;
  isMembership: boolean;
};

export enum BlogSortField {
  createdAt = 'createdAt',
  name = 'name',
  description = 'description',
}

export type BlogListQueryInput = PaginationAndSorting<BlogSortField> & {
  searchNameTerm?: string;
};

export type BlogInputDTO = {
  name: string;
  description: string;
  websiteUrl: string;
};

export type BlogOutputDTO = {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
};
