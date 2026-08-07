import { RequestHandler } from 'express';
import { inject, injectable } from 'inversify';
import { ListResponse } from '../../../core/types/list-response';
import { BlogInputDTO, BlogListQueryInput, BlogOutputDTO } from './types';
import { matchedData } from 'express-validator';
import { BlogQueryRepository } from '../infrastucture/blog-query-repository';
import { NotFoundError } from '../../../core/errors/domain-errors';
import { BlogService } from '../domain/blog-service';

@injectable()
export class BlogController {
  constructor(
    @inject(BlogService) protected readonly blogService: BlogService,
    @inject(BlogQueryRepository)
    protected readonly blogQueryRepository: BlogQueryRepository,
  ) {}

  public getBlogList: RequestHandler<object, ListResponse<BlogOutputDTO>> =
    async (req, res) => {
      const validationData = matchedData<BlogListQueryInput>(req);
      const result = await this.blogQueryRepository.findAll(validationData);
      return res.status(200).send(result);
    };

  public getBlog: RequestHandler<{ id: string }, BlogOutputDTO> = async (
    req,
    res,
  ) => {
    const blogId = req.params.id;
    const blog = await this.blogQueryRepository.findById(blogId);
    if (!blog) throw new NotFoundError('Blog', blogId);
    return res.status(200).send(blog);
  };

  public createBlog: RequestHandler<object, BlogOutputDTO, BlogInputDTO> =
    async (req, res) => {
      const { description, name, websiteUrl } = matchedData<BlogInputDTO>(req);
      const newBlogId = await this.blogService.create({
        description,
        name,
        websiteUrl,
      });
      const newBlog = await this.blogQueryRepository.findById(newBlogId);
      if (!newBlog)
        throw new Error(
          `Blog ${newBlogId} was created but not found - DB inconsistency`,
        );
      return res.status(201).send(newBlog);
    };

  public updateBlog: RequestHandler<{ id: string }, void, BlogInputDTO> =
    async (req, res) => {
      const { id, name, description, websiteUrl } = matchedData<
        { id: string } & BlogInputDTO
      >(req);

      await this.blogService.update(id, {
        name,
        description,
        websiteUrl,
      });
      return res.status(204).send();
    };

  public deleteBlog: RequestHandler<{ id: string }> = async (req, res) => {
    const { id } = matchedData<{ id: string }>(req);
    await this.blogService.delete(id);
    return res.status(204).send();
  };
}
