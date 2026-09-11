import { HydratedDocument, InferSchemaType } from 'mongoose';
import { blogSchema } from './blog-model';

export type BlogInput = InferSchemaType<typeof blogSchema>;
export type BlogDocument = HydratedDocument<BlogInput>;
