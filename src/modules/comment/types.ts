import { PaginationAndSorting } from '../../core/types/pagination-and-sorting';

export enum CommentSortField {
  createdAt = 'createdAt',
}

export type Comment = {
  id: string;
  content: string;
  commentatorInfo: {
    userId: string;
    userLogin: string;
  };
  createdAt: Date;
};

// === DTO (API Layer) ===
export type CommentInputDTO = {
  content: string;
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

// === Service Layer ===
export type CreateCommentInput = {
  userId: string;
  postId: string;
  content: string;
};

export type UpdateCommentInput = {
  id: string;
  userId: string;
  content: string;
};

export type DeleteCommentInput = {
  id: string;
  userId: string;
};

// === Query Repository Layer ===

export type CommentListQueryInput = PaginationAndSorting<CommentSortField> & {
  postId: string;
};

// === Repository Layer ===
export type CreateCommentPayload = {
  userId: string;
  userLogin: string;
  postId: string;
  content: string;
};

export type UpdateCommentPayload = {
  id: string;
  content: string;
};

// === Database ===
export type CommentDB = {
  content: string;
  userId: string;
  userLogin: string;
  postId: string;
  createdAt: Date;
};
