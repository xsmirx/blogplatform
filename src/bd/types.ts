export type Blog = {
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: Date;
  isMembership: boolean;
};

export type Post = {
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
};
