import { model, Schema } from 'mongoose';
import { BLOGS_COLLECTION_NAME } from '../../../db/collections';
import { BlogInput } from './types';

export const blogSchema = new Schema<BlogInput>(
  {
    name: { type: String, minLength: 1, maxLength: 256, required: true },
    description: { type: String, minLength: 1, maxLength: 500, required: true },
    websiteUrl: { type: String, minLength: 1, maxLength: 500, required: true },
    isMembership: { type: Boolean, required: true },
  },
  { timestamps: true },
);

export const BlogModel = model(BLOGS_COLLECTION_NAME, blogSchema);

export const BLOG_MODEL = Symbol('BlogModel');
