import type { BlogRepository } from './blog-repository';
import { Blog, BlogInputDTO, BlogListQueryInput } from './types';

export class BlogService {
  private readonly blogRepository: BlogRepository;

  constructor(deps: { blogRepository: BlogRepository }) {
    this.blogRepository = deps.blogRepository;
  }

  public async findMany(query: BlogListQueryInput) {
    return this.blogRepository.findAll(query);
  }

  public async findByIdOrFail(id: string) {
    return await this.blogRepository.findByIdOrFail(id);
  }

  public async create(dto: BlogInputDTO) {
    const { name, description, websiteUrl } = dto;

    const newBlog: Blog = {
      name,
      description,
      websiteUrl,
      createdAt: new Date(),
      isMembership: false,
    };
    const id = await this.blogRepository.create(newBlog);
    return await this.blogRepository.findByIdOrFail(id.toString());
  }

  public async update(id: string, dto: BlogInputDTO) {
    return this.blogRepository.update(id, {
      ...dto,
      isMembership: false,
    });
  }

  public async delete(id: string) {
    return this.blogRepository.delete(id);
  }
}
