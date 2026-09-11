import { HydratedDocument, InferSchemaType } from 'mongoose';
import { commentSchema } from './comment-model';

export type CommentInput = InferSchemaType<typeof commentSchema>;
export type CommentDocument = HydratedDocument<CommentInput>;
