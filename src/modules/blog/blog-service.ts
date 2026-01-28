import { blogRepository } from './blog-repository';
import { Blog, BlogInputDTO, BlogListQueryInput } from './types';

class BlogService {
  public async findMany(query: BlogListQueryInput) {
    return blogRepository.findAll(query);
  }

  public async findByIdOrFail(id: string) {
    return await blogRepository.findByIdOrFail(id);
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
    const id = await blogRepository.create(newBlog);
    return await blogRepository.findByIdOrFail(id.toString());
  }

  public async update(id: string, dto: BlogInputDTO) {
    return blogRepository.update(id, {
      ...dto,
      isMembership: false,
    });
  }

  public async delete(id: string) {
    return blogRepository.delete(id);
  }
}

export const blogService = new BlogService();
