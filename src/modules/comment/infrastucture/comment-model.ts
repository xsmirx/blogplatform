import { model, Schema, SchemaTypeOptions } from 'mongoose';
import { COMMENTS_COLLECTION_NAME } from '../../../db/collections';

export const commentSchema = new Schema(
  {
    content: {
      type: String,
      minLength: 1,
      maxLength: 512,
      required: true,
    } satisfies SchemaTypeOptions<string>,
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
    } satisfies SchemaTypeOptions<Schema.Types.ObjectId>,
    userLogin: {
      type: String,
      minLength: 3,
      maxLength: 20,
      required: true,
    } satisfies SchemaTypeOptions<string>,
    postId: {
      type: Schema.Types.ObjectId,
      required: true,
    } satisfies SchemaTypeOptions<Schema.Types.ObjectId>,
  },
  { timestamps: true },
);

export const CommentModel = model(COMMENTS_COLLECTION_NAME, commentSchema);

export const COMMENT_MODEL = Symbol('CommentModel');
