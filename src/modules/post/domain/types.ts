export type Post = {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: Date;
};

export type NewPost = Omit<Post, 'id'>;

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
