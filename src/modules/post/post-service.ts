import { blogRepository } from '../blog/blog-repository';
import { postRepository } from './post-repository';
import { Post, PostInputDTO, PostListQueryInput } from './types';

class PostService {
  public async findMany(query: PostListQueryInput & { blogId?: string }) {
    if (query.blogId) {
      await blogRepository.findByIdOrFail(query.blogId);
    }

    return postRepository.findAll(query);
  }

  public async findByIdOrFail(id: string) {
    return await postRepository.findByIdOrFail(id);
  }

  public async create(dto: PostInputDTO) {
    const { blogId, content, shortDescription, title } = dto;

    const blog = await blogRepository.findByIdOrFail(blogId);

    const newPost: Post = {
      title,
      shortDescription,
      content,
      blogId,
      blogName: blog.name,
      createdAt: new Date(),
    };
    const id = await postRepository.create(newPost);
    return await postRepository.findByIdOrFail(id.toString());
  }

  public async update(id: string, dto: PostInputDTO) {
    const blog = await blogRepository.findByIdOrFail(dto.blogId);
    return postRepository.update(id, { ...dto, blogName: blog.name });
  }

  public async delete(id: string) {
    return postRepository.delete(id);
  }
}

export const postService = new PostService();
