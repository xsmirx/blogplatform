import type { NewPost, Post } from './types';

export interface PostRepository {
  findById(id: string): Promise<Post | null>;
  create(post: NewPost): Promise<string>;
  update(id: string, post: Omit<Post, 'id' | 'createdAt'>): Promise<boolean>;
  delete(id: string): Promise<boolean>;
}
