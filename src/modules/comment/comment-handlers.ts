import { RequestHandler } from 'express';
import { commentQueryRepository } from './comment-query-repository';
import { CommentInputDTO, CommentOutputDTO } from './types';
import { matchedData } from 'express-validator';
import { commentService } from './comment-service';

export const getCommentHandler: RequestHandler<
  { id: string },
  CommentOutputDTO
> = async (req, res) => {
  const { id } = matchedData<{ id: string }>(req);
  const comment = await commentQueryRepository.findById(id);
  res.status(200).send(comment);
};

export const updateCommentHandler: RequestHandler<
  { id: string },
  void,
  CommentInputDTO
> = async (req, res) => {
  const userId = req.appContext!.user!.userId;
  const { id, content } = matchedData<{ id: string } & CommentInputDTO>(req);

  await commentService.updateComment({ id, userId, content });

  res.status(204).send();
};

export const deleteCommentHandler: RequestHandler<{ id: string }> = async (
  req,
  res,
) => {
  const userId = req.appContext!.user!.userId;
  const { id } = matchedData<{ id: string }>(req);

  await commentService.deleteComment({ id, userId });

  res.status(204).send();
};
