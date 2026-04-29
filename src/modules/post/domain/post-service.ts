import { NotFoundError } from '../../../core/errors/errors';
import type { BlogRepository } from '../../blog/domain/blog-repository.interface';
import type { PostRepository } from './post-repository.interface';
import type { CreatePostInput, NewPost, UpdatePostInput } from './types';

export class PostService {
  private readonly blogRepository: BlogRepository;
  private readonly postRepository: PostRepository;

  constructor(deps: {
    blogRepository: BlogRepository;
    postRepository: PostRepository;
  }) {
    this.blogRepository = deps.blogRepository;
    this.postRepository = deps.postRepository;
  }

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
