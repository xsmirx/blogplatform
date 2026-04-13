import { RequestHandler } from 'express';
import { CommentInputDTO, CommentOutputDTO } from './types';
import { matchedData } from 'express-validator';
import type { CommentQueryRepository } from './comment-query-repository';
import type { CommentService } from './comment-service';

export const createGetCommentHandler = ({
  commentQueryRepository,
}: {
  commentQueryRepository: CommentQueryRepository;
}): RequestHandler<{ id: string }, CommentOutputDTO> => {
  return async (req, res) => {
    const { id } = matchedData<{ id: string }>(req);
    const comment = await commentQueryRepository.findById(id);
    res.status(200).send(comment);
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

    await commentService.updateComment({ id, userId, content });

    res.status(204).send();
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

    await commentService.deleteComment({ id, userId });

    res.status(204).send();
  };
};
