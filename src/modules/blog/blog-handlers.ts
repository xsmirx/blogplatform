import { RequestHandler } from 'express';
import { blogRepository } from './blog-repository';
import { BlogDTO } from './types';

export const getBlogListHandler: RequestHandler = (req, res) => {
  const blogs = blogRepository.findAll();
  res.status(200).send(blogs);
};

export const getBlogHandler: RequestHandler<{ id: string }> = (req, res) => {
  const blogId = req.params.id;
  const blog = blogRepository.findById(blogId);
  if (!blog) {
    res.status(404).send();
  }
  res.status(200).send(blog);
};

export const createBlogHandler: RequestHandler<unknown, unknown, BlogDTO> = (
  req,
  res,
) => {
  const { name, description, websiteUrl } = req.body;
  const newBlog = blogRepository.create({ name, description, websiteUrl });
  res.status(201).send(newBlog);
};

export const updateBlogHandler: RequestHandler<
  { id: string },
  unknown,
  Partial<BlogDTO>
> = async (req, res) => {
  const blogId = req.params.id;
  const { name, description, websiteUrl } = req.body;

  try {
    blogRepository.update(blogId, { name, description, websiteUrl });
    res.status(204).send();
  } catch {
    res.status(404).send();
  }
};

export const deleteBlogHandler: RequestHandler<{ id: string }> = (req, res) => {
  const blogId = req.params.id;

  try {
    blogRepository.delete(blogId);
    res.status(204).send();
  } catch {
    res.status(404).send();
  }
};
