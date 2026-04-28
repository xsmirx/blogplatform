import type { Blog, NewBlog } from './types';

export interface BlogRepository {
  findById(id: string): Promise<Blog | null>;
  create(blog: NewBlog): Promise<string>;
  update(id: string, blog: Omit<Blog, 'id' | 'createdAt'>): Promise<boolean>;
  delete(id: string): Promise<boolean>;
}
