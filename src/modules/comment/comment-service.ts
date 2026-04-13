import { ForbiddenError } from '../../core/errors/errors';
import type { UserRepository } from '../user/infrastructure/user-repository';
import type { CommentRepository } from './comment-repository';
import {
  CreateCommentInput,
  DeleteCommentInput,
  UpdateCommentInput,
} from './types';

export class CommentService {
  private readonly userRepository: UserRepository;
  private readonly commentRepository: CommentRepository;

  constructor(deps: {
    userRepository: UserRepository;
    commentRepository: CommentRepository;
  }) {
    this.userRepository = deps.userRepository;
    this.commentRepository = deps.commentRepository;
  }

  public async createComment({
    userId,
    postId,
    content,
  }: CreateCommentInput): Promise<string> {
    const user = await this.userRepository.findByIdOrFail(userId);

    return await this.commentRepository.create({
      postId: postId,
      content: content,
      userId: user.id,
      userLogin: user.login,
    });
  }

  public async updateComment({
    id,
    userId,
    content,
  }: UpdateCommentInput): Promise<void> {
    const comment = await this.commentRepository.findByIdOrFail(id);

    if (comment.commentatorInfo.userId !== userId) {
      throw new ForbiddenError('You are not allowed to update this comment');
    }

    await this.commentRepository.update({ id, content });
  }

  public async deleteComment({
    id,
    userId,
  }: DeleteCommentInput): Promise<void> {
    const comment = await this.commentRepository.findByIdOrFail(id);
    if (comment.commentatorInfo.userId !== userId) {
      throw new ForbiddenError('You are not allowed to delete this comment');
    }
    await this.commentRepository.delete(id);
  }
}
