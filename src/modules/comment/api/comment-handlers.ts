import { RequestHandler } from 'express';
import type { CommentQueryRepository } from '../infrastucture/comment-query-repository';
import type {
  CommentInputDTO,
  CommentListQueryInput,
  CommentOutputDTO,
} from './types';
import { matchedData } from 'express-validator';
import { NotFoundError } from '../../../core/errors/domain-errors';
import type { CommentService } from '../domain/comment-service';
import type { ListResponse } from '../../../core/types/list-response';
import type { PostQueryRepository } from '../../post/infrastructure/post-query-repository';

export const createGetCommentHandler = ({
  commentQueryRepository,
}: {
  commentQueryRepository: CommentQueryRepository;
}): RequestHandler<{ id: string }, CommentOutputDTO> => {
  return async (req, res) => {
    const { id } = matchedData<{ id: string }>(req);
    const comment = await commentQueryRepository.findById(id);
    if (!comment) throw new NotFoundError('Comment', id);
    return res.status(200).send(comment);
  };
};

export const createGetCommentListHandler = ({
  postQueryRepository,
  commentQueryRepository,
}: {
  postQueryRepository: PostQueryRepository;
  commentQueryRepository: CommentQueryRepository;
}): RequestHandler<{ postId: string }, ListResponse<CommentOutputDTO>> => {
  return async (req, res) => {
    const { postId, pageNumber, pageSize, sortBy, sortDirection } =
      matchedData<CommentListQueryInput>(req);

    const post = await postQueryRepository.findById(postId);
    if (!post) throw new NotFoundError('Post', postId);

    const result = await commentQueryRepository.findAllByPostId({
      postId: post.id,
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
    });
    return res.status(200).send(result);
  };
};

export const createCreateCommentHandler = ({
  commentService,
  commentQueryRepository,
}: {
  commentService: CommentService;
  commentQueryRepository: CommentQueryRepository;
}): RequestHandler<{ postId: string }, CommentOutputDTO, CommentInputDTO> => {
  return async (req, res) => {
    const userId = req.appContext!.user!.userId;
    const { postId, content } = matchedData<CommentInputDTO>(req);

    const commentId = await commentService.createComment({
      postId,
      userId,
      content,
    });
    const comment = await commentQueryRepository.findById(commentId);
    if (!comment) throw new Error('');
    return res.status(201).send(comment);
  };
};

export const createUpdateCommentHandler = ({
  commentService,
}: {
  commentService: CommentService;
}): RequestHandler<{ id: string }, void, CommentInputDTO> => {
  return async (req, res) => {
    const userId = req.appContext!.user!.userId;
    const { id, content } = matchedData<{ id: string } & CommentInputDTO>(req);
    await commentService.updateComment(id, userId, { content });
    return res.status(204).send();
  };
};

export const createDeleteCommentHandler = ({
  commentService,
}: {
  commentService: CommentService;
}): RequestHandler<{ id: string }> => {
  return async (req, res) => {
    const userId = req.appContext!.user!.userId;
    const { id } = matchedData<{ id: string }>(req);
    await commentService.deleteComment(id, userId);
    return res.status(204).send();
  };
};
