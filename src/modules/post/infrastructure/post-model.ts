import { model, Schema, SchemaTypeOptions } from 'mongoose';
import { POSTS_COLLECTION_NAME } from '../../../db/collections';

export const postSchema = new Schema(
  {
    title: {
      type: String,
      minLength: 1,
      maxLength: 256,
      required: true,
    } satisfies SchemaTypeOptions<string>,
    shortDescription: {
      type: String,
      minLength: 1,
      maxLength: 512,
      required: true,
    } satisfies SchemaTypeOptions<string>,
    content: {
      type: String,
      minLength: 1,
      maxLength: 1024,
      required: true,
    } satisfies SchemaTypeOptions<string>,
    blogId: {
      type: Schema.Types.ObjectId,
      required: true,
    } satisfies SchemaTypeOptions<Schema.Types.ObjectId>,
    blogName: {
      type: String,
      minLength: 1,
      maxLength: 256,
      required: true,
    } satisfies SchemaTypeOptions<string>,
  },
  { timestamps: true },
);

export const PostModel = model(POSTS_COLLECTION_NAME, postSchema);

export const POST_MODEL = Symbol('PostModel');
