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
