import { blogRepository } from './blog-repository';
import { BlogListQueryInput } from './types';

class BlogService {
  public async findMany(
    query: BlogListQueryInput,
  ): Promise<ReturnType<typeof blogRepository.findAll>> {
    return blogRepository.findAll(query);
  }
}

export const blogService = new BlogService();
