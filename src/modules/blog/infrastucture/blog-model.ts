import mongoose from 'mongoose';
import { BLOGS_COLLECTION_NAME } from '../../../db/collections';

export const BlogSchema = new mongoose.Schema(
  {
    name: { type: String, min: 1, required: true },
    description: { type: String, min: 1, required: true },
    websiteUrl: { type: String, min: 1, required: true },
    isMembership: { type: Boolean, required: true },
  },
  { timestamps: true, versionKey: false },
);

export const BlogModel = mongoose.model(BLOGS_COLLECTION_NAME, BlogSchema);

export const BLOG_MODEL = Symbol('BlogModel');
