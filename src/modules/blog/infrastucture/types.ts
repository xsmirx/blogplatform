import { HydratedDocument, InferSchemaType } from 'mongoose';
import { BlogSchema } from './blog-model';

export type BlogInput = InferSchemaType<typeof BlogSchema>;
export type BlogDocument = HydratedDocument<BlogInput>;
