import type { MongoBlogRepository } from '../blog/infrastucture/blog-repository';
import type { PostRepository } from './post-repository';
import { Post, PostInputDTO, PostListQueryInput } from './types';

export class PostService {
  private readonly blogRepository: MongoBlogRepository;
  private readonly postRepository: PostRepository;

  constructor(deps: {
    blogRepository: MongoBlogRepository;
    postRepository: PostRepository;
  }) {
    this.blogRepository = deps.blogRepository;
    this.postRepository = deps.postRepository;
  }

  public async findMany(query: PostListQueryInput & { blogId?: string }) {
    if (query.blogId) {
      await this.blogRepository.findByIdOrFail(query.blogId);
    }

    return this.postRepository.findAll(query);
  }

  public async findByIdOrFail(id: string) {
    return await this.postRepository.findByIdOrFail(id);
  }

  public async create(dto: PostInputDTO) {
    const { blogId, content, shortDescription, title } = dto;

    const blog = await this.blogRepository.findByIdOrFail(blogId);

    const newPost: Post = {
      title,
      shortDescription,
      content,
      blogId,
      blogName: blog.name,
      createdAt: new Date(),
    };
    const id = await this.postRepository.create(newPost);
    return await this.postRepository.findByIdOrFail(id.toString());
  }

  public async update(id: string, dto: PostInputDTO) {
    const blog = await this.blogRepository.findByIdOrFail(dto.blogId);
    return this.postRepository.update(id, { ...dto, blogName: blog.name });
  }

  public async delete(id: string) {
    return this.postRepository.delete(id);
  }
}
