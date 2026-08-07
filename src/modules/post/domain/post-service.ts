import { inject, injectable } from 'inversify';
import { NotFoundError } from '../../../core/errors/domain-errors';
import {
  BLOG_REPOSITORY,
  type BlogRepository,
} from '../../blog/domain/blog-repository.interface';
import {
  POST_REPOSITORY,
  type PostRepository,
} from './post-repository.interface';
import type { CreatePostInput, NewPost, UpdatePostInput } from './types';

@injectable()
export class PostService {
  constructor(
    @inject(BLOG_REPOSITORY) protected readonly blogRepository: BlogRepository,
    @inject(POST_REPOSITORY) protected readonly postRepository: PostRepository,
  ) {}

  public async create(input: CreatePostInput): Promise<string> {
    const { blogId, content, shortDescription, title } = input;

    const blog = await this.blogRepository.findById(blogId);
    if (!blog) throw new NotFoundError('Blog', blogId);

    const newPost: NewPost = {
      title,
      shortDescription,
      content,
      blogId,
      blogName: blog.name,
      createdAt: new Date(),
    };
    return await this.postRepository.create(newPost);
  }

  public async update(id: string, input: UpdatePostInput): Promise<void> {
    const { blogId, content, shortDescription, title } = input;

    const blog = await this.blogRepository.findById(blogId);
    if (!blog) throw new NotFoundError('Blog', blogId);

    const result = await this.postRepository.update(id, {
      title,
      shortDescription,
      content,
      blogId,
      blogName: blog.name,
    });
    if (!result) throw new NotFoundError('Post', id);
  }

  public async delete(id: string): Promise<void> {
    const result = await this.postRepository.delete(id);
    if (!result) throw new NotFoundError('Post', id);
  }
}
