import { RequestHandler } from 'express';
import { PostDTO } from './types';
import { postRepository } from './post-repository';

export const getPostListHandler: RequestHandler = (req, res) => {
  const posts = postRepository.findAll();
  res.status(200).send(posts);
};

export const getPostHandler: RequestHandler<{ id: string }> = (req, res) => {
  const postId = req.params.id;
  const post = postRepository.findById(postId);
  if (!post) {
    res.status(404).send();
  }
  res.status(200).send(post);
};

export const createPostHandler: RequestHandler<
  unknown,
  unknown,
  PostDTO
> = async (req, res) => {
  const { title, shortDescription, content, blogId } = req.body;

  try {
    const newPost = postRepository.create({
      title,
      shortDescription,
      content,
      blogId,
    });
    res.status(201).send(newPost);
  } catch {
    res.status(400).send();
  }
};

export const updatePostHandler: RequestHandler<
  { id: string },
  unknown,
  Partial<PostDTO>
> = async (req, res) => {
  const postId = req.params.id;
  const { title, shortDescription, content, blogId } = req.body;

  try {
    postRepository.update(postId, {
      title,
      shortDescription,
      content,
      blogId,
    });
    res.status(204).send();
  } catch {
    res.status(404).send();
  }
};

export const deletePostHandler: RequestHandler<{ id: string }> = async (
  req,
  res,
) => {
  const postId = req.params.id;

  try {
    postRepository.delete(postId);
    res.status(204).send();
  } catch {
    res.status(404).send();
  }
};
