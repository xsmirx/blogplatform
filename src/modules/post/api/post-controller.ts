import { RequestHandler } from 'express';
import { inject, injectable } from 'inversify';
import { ListResponse } from '../../../core/types/list-response';
import { PostInputDTO, PostListQueryInput, PostOutputDTO } from './types';
import { BlogQueryRepository } from '../../blog/infrastucture/blog-query-repository';
import { PostQueryRepository } from '../infrastructure/post-query-repository';
import { matchedData } from 'express-validator';
import { NotFoundError } from '../../../core/errors/domain-errors';
import { PostService } from '../domain/post-service';

@injectable()
export class PostController {
  constructor(
    @inject(PostService) protected readonly postService: PostService,
    @inject(BlogQueryRepository)
    protected readonly blogQueryRepository: BlogQueryRepository,
    @inject(PostQueryRepository)
    protected readonly postQueryRepository: PostQueryRepository,
  ) {}

  public getPostList: RequestHandler<
    { blogId?: string },
    ListResponse<PostOutputDTO>
  > = async (req, res) => {
    const { pageNumber, pageSize, sortBy, sortDirection, blogId } =
      matchedData<PostListQueryInput>(req);

    if (blogId !== undefined) {
      const blog = await this.blogQueryRepository.findById(blogId);
      if (!blog) throw new NotFoundError('Blog', blogId);
    }

    const result = await this.postQueryRepository.findAll({
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
      blogId,
    });

    return res.status(200).send(result);
  };

  public getPost: RequestHandler<{ id: string }, PostOutputDTO> = async (
    req,
    res,
  ) => {
    const { id: postId } = matchedData<{ id: string }>(req);
    const post = await this.postQueryRepository.findById(postId);
    if (!post) throw new NotFoundError('Post', postId);
    return res.status(200).send(post);
  };

  public createPost: RequestHandler<
    { blogId?: string },
    PostOutputDTO,
    PostInputDTO
  > = async (req, res) => {
    const { title, shortDescription, content, blogId } =
      matchedData<PostInputDTO>(req);

    const newPostId = await this.postService.create({
      blogId,
      content,
      shortDescription,
      title,
    });

    const newPost = await this.postQueryRepository.findById(newPostId);
    if (!newPost)
      throw new Error(
        `Post ${newPostId} was created but not found - DB inconsistency`,
      );

    return res.status(201).send(newPost);
  };

  public updatePost: RequestHandler<{ id: string }, void, PostInputDTO> =
    async (req, res) => {
      const {
        id: postId,
        title,
        shortDescription,
        content,
        blogId,
      } = matchedData<PostInputDTO & { id: string }>(req);

      await this.postService.update(postId, {
        title,
        shortDescription,
        content,
        blogId,
      });

      return res.status(204).send();
    };

  public deletePost: RequestHandler<{ id: string }> = async (req, res) => {
    const { id: postId } = matchedData<{ id: string }>(req);
    await this.postService.delete(postId);
    return res.status(204).send();
  };
}
