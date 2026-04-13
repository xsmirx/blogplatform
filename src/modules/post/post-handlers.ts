import { RequestHandler } from 'express';
import { PostInputDTO, PostListQueryInput, PostOutputDTO } from './types';
import { ListResponse } from '../../core/types/list-response';
import { matchedData } from 'express-validator';
import {
  CommentInputDTO,
  CommentListQueryInput,
  CommentOutputDTO,
} from '../comment/types';
import type { PostService } from './post-service';
import type { CommentService } from '../comment/comment-service';
import type { CommentQueryRepository } from '../comment/comment-query-repository';

export const createGetPostListHandler = ({
  postService,
}: {
  postService: PostService;
}): RequestHandler<object, ListResponse<PostOutputDTO>> => {
  return async (req, res) => {
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
};

export const createGetPostHandler = ({
  postService,
}: {
  postService: PostService;
}): RequestHandler<{ id: string }, PostOutputDTO> => {
  return async (req, res) => {
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
};

export const createCreatePostHandler = ({
  postService,
}: {
  postService: PostService;
}): RequestHandler<unknown, PostOutputDTO, PostInputDTO> => {
  return async (req, res) => {
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
};

export const createUpdatePostHandler = ({
  postService,
}: {
  postService: PostService;
}): RequestHandler<{ id: string }, void, PostInputDTO> => {
  return async (req, res) => {
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
};

export const createDeletePostHandler = ({
  postService,
}: {
  postService: PostService;
}): RequestHandler<{ id: string }> => {
  return async (req, res) => {
    const postId = req.params.id;

    await postService.delete(postId);
    res.status(204).send();
  };
};

export const createGetCommentListHandler = ({
  postService,
  commentQueryRepository,
}: {
  postService: PostService;
  commentQueryRepository: CommentQueryRepository;
}): RequestHandler<{ id: string }, ListResponse<CommentOutputDTO>> => {
  return async (req, res) => {
    const { id, pageNumber, pageSize, sortBy, sortDirection } = matchedData<
      { id: string } & CommentListQueryInput
    >(req);

    await postService.findByIdOrFail(id);

    const result = await commentQueryRepository.findAllByPostId({
      postId: id,
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
    });
    res.status(200).send(result);
  };
};

export const createCreateCommentHandler = ({
  postService,
  commentService,
  commentQueryRepository,
}: {
  postService: PostService;
  commentService: CommentService;
  commentQueryRepository: CommentQueryRepository;
}): RequestHandler<{ id: string }, CommentOutputDTO, CommentInputDTO> => {
  return async (req, res) => {
    const userId = req.appContext!.user!.userId;
    const { id, content } = matchedData<{ id: string } & CommentInputDTO>(req);

    await postService.findByIdOrFail(id);

    const commentId = await commentService.createComment({
      postId: id,
      userId,
      content,
    });
    const comment = await commentQueryRepository.findById(commentId);
    res.status(201).send(comment);
  };
};
