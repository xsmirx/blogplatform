import { RequestHandler } from 'express';
import { postRepository } from './post-repository';
import { Post, PostInputDTO, PostOutputDTO } from './types';
import { blogRepository } from '../blog/blog-repository';
import { BlogNotFoundError } from '../blog/blog-errors';

export const getPostListHandler: RequestHandler<
  unknown,
  PostOutputDTO[]
> = async (req, res) => {
  const posts = await postRepository.findAll();
  res.status(200).send(
    posts.map((post) => ({
      id: post._id.toString(),
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName,
      createdAt: post.createdAt.toISOString(),
    })),
  );
};

export const getPostHandler: RequestHandler<
  { id: string },
  PostOutputDTO
> = async (req, res) => {
  const postId = req.params.id;
  const post = await postRepository.findByIdOrFail(postId);
  res.status(200).send({
    id: post._id.toString(),
    title: post.title,
    shortDescription: post.shortDescription,
    content: post.content,
    blogId: post.blogId,
    blogName: post.blogName,
    createdAt: post.createdAt.toISOString(),
  });
};

export const createPostHandler: RequestHandler<
  unknown,
  PostOutputDTO,
  PostInputDTO
> = async (req, res) => {
  const { title, shortDescription, content, blogId } = req.body;

  const blog = await blogRepository.findById(blogId);

  if (!blog) {
    throw new BlogNotFoundError(`Blog with id ${blogId} not found`);
  }

  const newPost: Post = {
    title,
    shortDescription,
    content,
    blogId,
    blogName: blog.name,
    createdAt: new Date(),
  };

  const result = await postRepository.create(newPost);
  res.status(201).send({
    id: result.toString(),
    title: newPost.title,
    shortDescription: newPost.shortDescription,
    content: newPost.content,
    blogId: newPost.blogId,
    blogName: newPost.blogName,
    createdAt: newPost.createdAt.toISOString(),
  });
};

export const updatePostHandler: RequestHandler<
  { id: string },
  void,
  PostInputDTO
> = async (req, res) => {
  const postId = req.params.id;
  const { title, shortDescription, content, blogId } = req.body;

  const blog = await blogRepository.findById(blogId);

  if (!blog) {
    throw new BlogNotFoundError(`Blog with id ${blogId} not found`);
  }

  await postRepository.update(postId, {
    title,
    shortDescription,
    content,
    blogId,
    blogName: blog.name,
  });
  res.status(204).send();
};

export const deletePostHandler: RequestHandler<{ id: string }> = async (
  req,
  res,
) => {
  const postId = req.params.id;

  await postRepository.delete(postId);
  res.status(204).send();
};
