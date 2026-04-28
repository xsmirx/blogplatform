export type Blog = {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: Date;
  isMembership: boolean;
};

export type NewBlog = Omit<Blog, 'id'>;

export type CreateBlogInput = {
  name: string;
  description: string;
  websiteUrl: string;
};

export type UpdateBlogInput = {
  name: string;
  description: string;
  websiteUrl: string;
};
