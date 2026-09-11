import { HydratedDocument, InferSchemaType } from 'mongoose';
import { postSchema } from './post-model';

export type PostInput = InferSchemaType<typeof postSchema>;
export type PostDocument = HydratedDocument<PostInput>;
