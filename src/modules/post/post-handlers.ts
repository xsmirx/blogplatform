import { RequestHandler } from 'express';
import { PostInputDTO, PostListQueryInput, PostOutputDTO } from './types';
import { ListResponse } from '../../core/types/list-response';
import { matchedData } from 'express-validator';
import { postService } from './post-service';
import { CommentInputDTO, CommentOutputDTO } from '../comment/types';
import { commentService } from '../comment/comment-service';

export const getPostListHandler: RequestHandler<
  undefined,
  ListResponse<PostOutputDTO>
> = async (req, res) => {
  const validationData = matchedData<PostListQueryInput>(req);

  const { items, totalCount } = await postService.findMany(validationData);

  res.status(200).send({
    page: validationData.pageNumber,
    pageSize: validationData.pageSize,
    pagesCount: Math.ceil(totalCount / validationData.pageSize),
    totalCount: totalCount,
    items: items.map((post) => ({
      id: post._id.toString(),
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName,
      createdAt: post.createdAt.toISOString(),
    })),
  });
};

export const getPostHandler: RequestHandler<
  { id: string },
  PostOutputDTO
> = async (req, res) => {
  const postId = req.params.id;
  const post = await postService.findByIdOrFail(postId);
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

  const newPost = await postService.create({
    blogId,
    content,
    shortDescription,
    title,
  });

  res.status(201).send({
    id: newPost._id.toString(),
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

  await postService.update(postId, {
    title,
    shortDescription,
    content,
    blogId,
  });

  res.status(204).send();
};

export const deletePostHandler: RequestHandler<{ id: string }> = async (
  req,
  res,
) => {
  const postId = req.params.id;

  await postService.delete(postId);
  res.status(204).send();
};

export const createCommentHandler: RequestHandler<
  { id: string },
  CommentOutputDTO,
  CommentInputDTO
> = async (req, res) => {
  const userId = req.appContext!.user!.userId;
  const { id, content } = matchedData<{ id: string } & CommentInputDTO>(req);
  const coomentId = await commentService.createComment();
};
