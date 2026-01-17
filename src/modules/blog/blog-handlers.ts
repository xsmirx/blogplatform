import { RequestHandler } from 'express';
import { blogRepository } from './blog-repository';
import { BlogInputDTO, BlogOutputDTO } from './types';

export const getBlogListHandler: RequestHandler<
  unknown,
  BlogOutputDTO[]
> = async (req, res) => {
  const blogs = await blogRepository.findAll();
  res.status(200).send(
    blogs.map((blog) => ({
      id: blog._id.toString(),
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
      createdAt: blog.createdAt.toISOString(),
      isMembership: blog.isMembership,
    })),
  );
};

export const getBlogHandler: RequestHandler<
  { id: string },
  BlogOutputDTO
> = async (req, res) => {
  const blogId = req.params.id;
  const blog = await blogRepository.findByIdOrFail(blogId);
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
  const { name, description, websiteUrl } = req.body;

  try {
    const newBlog: Parameters<typeof blogRepository.create>[0] = {
      name,
      description,
      websiteUrl,
      createdAt: new Date(),
      isMembership: false,
    };
    const newBlogId = await blogRepository.create(newBlog);
    res.status(201).send({
      id: newBlogId.toString(),
      name: newBlog.name,
      description: newBlog.description,
      websiteUrl: newBlog.websiteUrl,
      createdAt: newBlog.createdAt.toISOString(),
      isMembership: newBlog.isMembership,
    });
  } catch {
    res.status(404).send();
  }
};

export const updateBlogHandler: RequestHandler<
  { id: string },
  void,
  BlogInputDTO
> = async (req, res) => {
  const blogId = req.params.id;
  const { name, description, websiteUrl } = req.body;

  try {
    await blogRepository.update(blogId, {
      name,
      description,
      websiteUrl,
      isMembership: false,
    });
    res.status(204).send();
  } catch {
    res.status(404).send();
  }
};

export const deleteBlogHandler: RequestHandler<{ id: string }> = async (
  req,
  res,
) => {
  const blogId = req.params.id;

  try {
    await blogRepository.delete(blogId);
    res.status(204).send();
  } catch {
    res.status(404).send();
  }
};
