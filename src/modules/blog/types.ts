export type Blog = {
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: Date;
  isMembership: boolean;
};

export type BlogInputDTO = {
  name: string;
  description: string;
  websiteUrl: string;
};

export type BlogOutputDTO = {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
};
