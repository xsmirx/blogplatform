import { HydratedDocument, InferSchemaType } from 'mongoose';
import { blogSchema } from './blog-model';

export type BlogInput = {
  name: string;
  description: string;
  websiteUrl: string;
  isMembership: boolean;
};

export type BlogDocument = HydratedDocument<InferSchemaType<typeof blogSchema>>;
