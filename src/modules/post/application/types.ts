export type Post = {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: Date;
  likesCount: number;
  dislikesCount: number;
  newestLikes: { userId: string; login: string; addedAt: Date }[];
};

export type NewPost = Omit<
  Post,
  'id' | 'createdAt' | 'likesCount' | 'dislikesCount' | 'newestLikes'
>;

export type CreatePostInput = {
  blogId: string;
  content: string;
  shortDescription: string;
  title: string;
};

export type UpdatePostInput = {
  blogId: string;
  content: string;
  shortDescription: string;
  title: string;
};
