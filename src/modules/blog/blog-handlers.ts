import { RequestHandler } from 'express';
import { BlogInputDTO, BlogListQueryInput, BlogOutputDTO } from './types';
import { ListResponse } from '../../core/types/list-response';
import { blogService } from './blog-service';
import { matchedData } from 'express-validator';

export const getBlogListHandler: RequestHandler<
  undefined,
  ListResponse<BlogOutputDTO>
> = async (req, res) => {
  const validationData = matchedData<BlogListQueryInput>(req);

  const { items, totalCount } = await blogService.findMany(validationData);

  res.status(200).send({
    page: validationData.pageNumber,
    pageSize: validationData.pageSize,
    pagesCount: Math.ceil(totalCount / validationData.pageSize),
    totalCount: totalCount,
    items: items.map((blog) => ({
      id: blog._id.toString(),
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
      createdAt: blog.createdAt.toISOString(),
      isMembership: blog.isMembership,
    })),
  });
};

export const getBlogHandler: RequestHandler<
  { id: string },
  BlogOutputDTO
> = async (req, res) => {
  const blogId = req.params.id;
  const blog = await blogService.findByIdOrFail(blogId);
  res.status(200).send({
    id: blog._id.toString(),
    name: blog.name,
    description: blog.description,
    websiteUrl: blog.websiteUrl,
    createdAt: blog.createdAt.toISOString(),
    isMembership: blog.isMembership,
  });
};

export const createBlogHandler: RequestHandler<
  unknown,
  BlogOutputDTO,
  BlogInputDTO
> = async (req, res) => {
  const { description, name, websiteUrl } = req.body;
  const newBlog = await blogService.create({ description, name, websiteUrl });
  res.status(201).send({
    id: newBlog._id.toString(),
    name: newBlog.name,
    description: newBlog.description,
    websiteUrl: newBlog.websiteUrl,
    createdAt: newBlog.createdAt.toISOString(),
    isMembership: newBlog.isMembership,
  });
};

export const updateBlogHandler: RequestHandler<
  { id: string },
  void,
  BlogInputDTO
> = async (req, res) => {
  const blogId = req.params.id;
  const { name, description, websiteUrl } = req.body;

  await blogService.update(blogId, {
    name,
    description,
    websiteUrl,
  });
  res.status(204).send();
};

export const deleteBlogHandler: RequestHandler<{ id: string }> = async (
  req,
  res,
) => {
  const blogId = req.params.id;

  await blogService.delete(blogId);
  res.status(204).send();
};
