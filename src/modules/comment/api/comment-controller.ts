import { RequestHandler } from 'express';
import { inject, injectable } from 'inversify';
import {
  CommentInputDTO,
  CommentListQueryInput,
  CommentOutputDTO,
} from './types';
import { matchedData } from 'express-validator';
import { CommentQueryRepository } from '../infrastucture/comment-query-repository';
import { NotFoundError } from '../../../core/errors/domain-errors';
import { ListResponse } from '../../../core/types/list-response';
import { PostQueryRepository } from '../../post/infrastructure/post-query-repository';
import { CommentService } from '../domain/comment-service';

@injectable()
export class CommentController {
  constructor(
    @inject(CommentService)
    protected readonly commentService: CommentService,
    @inject(CommentQueryRepository)
    protected readonly commentQueryRepository: CommentQueryRepository,
    @inject(PostQueryRepository)
    protected readonly postQueryRepository: PostQueryRepository,
  ) {}

  public getCommentList: RequestHandler<
    { postId: string },
    ListResponse<CommentOutputDTO>
  > = async (req, res) => {
    const { postId, pageNumber, pageSize, sortBy, sortDirection } =
      matchedData<CommentListQueryInput>(req);

    const post = await this.postQueryRepository.findById(postId);
    if (!post) throw new NotFoundError('Post', postId);

    const result = await this.commentQueryRepository.findAllByPostId({
      postId: post.id,
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
    });
    return res.status(200).send(result);
  };

  public getComment: RequestHandler<{ id: string }, CommentOutputDTO> = async (
    req,
    res,
  ) => {
    const { id } = matchedData<{ id: string }>(req);
    const comment = await this.commentQueryRepository.findById(id);
    if (!comment) throw new NotFoundError('Comment', id);
    return res.status(200).send(comment);
  };

  public createComment: RequestHandler<
    { postId: string },
    CommentOutputDTO,
    CommentInputDTO
  > = async (req, res) => {
    const userId = req.appContext!.user!.userId;
    const { postId, content } = matchedData<CommentInputDTO>(req);

    const commentId = await this.commentService.createComment({
      postId,
      userId,
      content,
    });
    const comment = await this.commentQueryRepository.findById(commentId);
    if (!comment) throw new Error('');
    return res.status(201).send(comment);
  };

  public updateComment: RequestHandler<{ id: string }, void, CommentInputDTO> =
    async (req, res) => {
      const userId = req.appContext!.user!.userId;
      const { id, content } = matchedData<{ id: string } & CommentInputDTO>(
        req,
      );
      await this.commentService.updateComment(id, userId, { content });
      return res.status(204).send();
    };

  public deleteComment: RequestHandler<{ id: string }> = async (req, res) => {
    const userId = req.appContext!.user!.userId;
    const { id } = matchedData<{ id: string }>(req);
    await this.commentService.deleteComment(id, userId);
    return res.status(204).send();
  };
}
