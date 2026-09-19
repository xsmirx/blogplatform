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

export type LikeStatusDTO = 'None' | 'Like' | 'Dislike';
export type NewestLikeDTO = {
  addedAt: string;
  userId: string;
  login: string;
};

export type PostOutputDTO = {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: string;
  extendedLikesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: LikeStatusDTO;
    newestLikes: NewestLikeDTO[];
  };
};

export type LikeStatusInputDTO = {
  likeStatus: 'None' | 'Like' | 'Dislike';
};
