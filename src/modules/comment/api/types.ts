import type { PaginationAndSorting } from '../../../core/types/pagination-and-sorting';

export enum CommentSortField {
  createdAt = 'createdAt',
}

export type CommentListQueryInput = PaginationAndSorting<CommentSortField> & {
  postId: string;
};

export type CommentInputDTO = {
  content: string;
  postId: string;
};

export type CommentOutputDTO = {
  id: string;
  content: string;
  commentatorInfo: {
    userId: string;
    userLogin: string;
  };
  createdAt: string;
};
