import { NotFoundError } from '../../../core/errors/domain-errors';
import type { CreateBlogInput, NewBlog, UpdateBlogInput } from './types';
import {
  BLOG_REPOSITORY,
  type BlogRepository,
} from './blog-repository.interface';
import { inject, injectable } from 'inversify';

@injectable()
export class BlogService {
  constructor(
    @inject(BLOG_REPOSITORY) private readonly blogRepository: BlogRepository,
  ) {}

  public async create(input: CreateBlogInput): Promise<string> {
    const { name, description, websiteUrl } = input;

    const newBlog: NewBlog = {
      name,
      description,
      websiteUrl,
      createdAt: new Date(),
      isMembership: false,
    };
    return await this.blogRepository.create(newBlog);
  }

  public async update(id: string, input: UpdateBlogInput): Promise<void> {
    const result = await this.blogRepository.update(id, {
      name: input.name,
      description: input.description,
      websiteUrl: input.websiteUrl,
      isMembership: false,
    });
    if (!result) throw new NotFoundError('Blog', id);
  }

  public async delete(id: string): Promise<void> {
    const result = await this.blogRepository.delete(id);
    if (!result) throw new NotFoundError('Blog', id);
  }
}
