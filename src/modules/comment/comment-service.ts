import { ForbiddenError } from '../../core/errors/errors';
import { userRepository } from '../user/user-repository';
import { commentRepository } from './comment-repository';
import {
  CreateCommentInput,
  DeleteCommentInput,
  UpdateCommentInput,
} from './types';

class CommentService {
  public async createComment({
    userId,
    postId,
    content,
  }: CreateCommentInput): Promise<string> {
    const user = await userRepository.findById(userId);

    return await commentRepository.create({
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
    const comment = await commentRepository.findByIdOrFail(id);

    if (comment.commentatorInfo.userId !== userId) {
      throw new ForbiddenError('You are not allowed to update this comment');
    }

    await commentRepository.update({ id, content });
  }

  public async deleteComment({
    id,
    userId,
  }: DeleteCommentInput): Promise<void> {
    const comment = await commentRepository.findByIdOrFail(id);
    if (comment.commentatorInfo.userId !== userId) {
      throw new ForbiddenError('You are not allowed to delete this comment');
    }
    await commentRepository.delete(id);
  }
}

export const commentService = new CommentService();
