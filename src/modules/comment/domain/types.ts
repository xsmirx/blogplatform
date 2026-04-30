export type Comment = {
  id: string;
  postId: string;
  content: string;
  userId: string;
  userLogin: string;
  createdAt: Date;
};

export type CreateCommentInput = {
  userId: string;
  postId: string;
  content: string;
};

export type NewComment = Omit<Comment, 'id'>;

export type UpdateCommentInput = {
  content: string;
};

export type UpdateComment = Omit<
  Comment,
  'id' | 'userId' | 'postId' | 'userLogin' | 'createdAt'
>;
