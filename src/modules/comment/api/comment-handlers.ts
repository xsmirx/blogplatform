import { RequestHandler } from 'express';
import type { CommentQueryRepository } from '../infrastucture/comment-query-repository';
import type { CommentInputDTO, CommentOutputDTO } from './types';
import { matchedData } from 'express-validator';
import { NotFoundError } from '../../../core/errors/errors';
import type { CommentService } from '../domain/comment-service';

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
