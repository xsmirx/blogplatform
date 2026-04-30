import { RequestHandler } from 'express';
import type { PostService } from '../domain/post-service';
import type { PostQueryRepository } from '../infrastructure/post-query-repository';
import type { ListResponse } from '../../../core/types/list-response';
import type { PostInputDTO, PostListQueryInput, PostOutputDTO } from './types';
import { matchedData } from 'express-validator';
import { NotFoundError } from '../../../core/errors/domain-errors';
import type { BlogQueryRepository } from '../../blog/infrastucture/blog-query-repository';

export const createGetPostListHandler = ({
  blogQueryRepository,
  postQueryRepository,
}: {
  blogQueryRepository: BlogQueryRepository;
  postQueryRepository: PostQueryRepository;
}): RequestHandler<{ blogId?: string }, ListResponse<PostOutputDTO>> => {
  return async (req, res) => {
    const { pageNumber, pageSize, sortBy, sortDirection, blogId } =
      matchedData<PostListQueryInput>(req);

    if (blogId !== undefined) {
      const blog = await blogQueryRepository.findById(blogId);
      if (!blog) throw new NotFoundError('Blog', blogId);
    }

    const result = await postQueryRepository.findAll({
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
      blogId,
    });

    return res.status(200).send(result);
  };
};

export const createGetPostHandler = ({
  postQueryRepository,
}: {
  postQueryRepository: PostQueryRepository;
}): RequestHandler<{ id: string }, PostOutputDTO> => {
  return async (req, res) => {
    const { id: postId } = matchedData<{ id: string }>(req);
    const post = await postQueryRepository.findById(postId);
    if (!post) throw new NotFoundError('Post', postId);
    return res.status(200).send(post);
  };
};

export const createCreatePostHandler = ({
  postService,
  postQueryRepository,
}: {
  postService: PostService;
  postQueryRepository: PostQueryRepository;
}): RequestHandler<{ blogId?: string }, PostOutputDTO, PostInputDTO> => {
  return async (req, res) => {
    const { title, shortDescription, content, blogId } =
      matchedData<PostInputDTO>(req);

    const newPostId = await postService.create({
      blogId,
      content,
      shortDescription,
      title,
    });

    const newPost = await postQueryRepository.findById(newPostId);
    if (!newPost)
      throw new Error(
        `Post ${newPostId} was created but not found - DB inconsistency`,
      );

    return res.status(201).send(newPost);
  };
};

export const createUpdatePostHandler = ({
  postService,
}: {
  postService: PostService;
}): RequestHandler<{ id: string }, void, PostInputDTO> => {
  return async (req, res) => {
    const {
      id: postId,
      title,
      shortDescription,
      content,
      blogId,
    } = matchedData<PostInputDTO & { id: string }>(req);

    await postService.update(postId, {
      title,
      shortDescription,
      content,
      blogId,
    });

    return res.status(204).send();
  };
};

export const createDeletePostHandler = ({
  postService,
}: {
  postService: PostService;
}): RequestHandler<{ id: string }> => {
  return async (req, res) => {
    const { id: postId } = matchedData<{ id: string }>(req);
    await postService.delete(postId);
    return res.status(204).send();
  };
};
