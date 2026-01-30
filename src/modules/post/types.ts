import { PaginationAndSorting } from '../../core/types/pagination-and-sorting';

export type Post = {
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: Date;
};

export enum PostSortField {
  createdAt = 'createdAt',
  title = 'title',
  shortDescription = 'shortDescription',
}

export type PostListQueryInput = PaginationAndSorting<PostSortField>;

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
