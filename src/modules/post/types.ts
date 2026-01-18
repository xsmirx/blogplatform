export type Post = {
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: Date;
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
