import {
  HydratedDocument,
  InferSchemaType,
  model,
  Schema,
  SchemaTypeOptions,
} from 'mongoose';
import { POSTS_COLLECTION_NAME } from '../../../db/collections';

export const newestLike = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true },
    login: { type: String, required: true },
    addedAt: { type: Date, required: true },
  },
  { _id: false },
);

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
    likesCount: {
      type: Number,
      min: 0,
      required: true,
      default: 0,
    } satisfies SchemaTypeOptions<number>,
    dislikesCount: {
      type: Number,
      min: 0,
      required: true,
      default: 0,
    } satisfies SchemaTypeOptions<number>,
    newestLikes: {
      type: [newestLike],
      required: true,
      default: [],
    } satisfies SchemaTypeOptions<(typeof newestLike)[]>,
  },
  { timestamps: true },
);

export const PostModel = model(POSTS_COLLECTION_NAME, postSchema);

export type PostInput = InferSchemaType<typeof postSchema>;
export type PostDocument = HydratedDocument<PostInput>;
export type PostModel = typeof PostModel;

export const POST_MODEL = Symbol('PostModel');
