import { PaginationAndSorting } from '../../../core/types/pagination-and-sorting';

export enum PostSortField {
  createdAt = 'createdAt',
  title = 'title',
  blogName = 'blogName',
  shortDescription = 'shortDescription',
}

export type PostListQueryInput = PaginationAndSorting<PostSortField> & {
  blogId?: string;
};

export type PostInputDTO = {
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
};

export type PostOutputDTO = {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: string;
};
