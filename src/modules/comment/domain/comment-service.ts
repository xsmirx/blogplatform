import { inject, injectable } from 'inversify';
import {
  ForbiddenError,
  NotFoundError,
} from '../../../core/errors/domain-errors';
import {
  POST_REPOSITORY,
  type PostRepository,
} from '../../post/domain/post-repository.interface';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../user/domain/user-repository.interface';
import {
  COMMENT_REPOSITORY,
  type CommentRepository,
} from './comment-repository.interface';
import type { Comment, CreateCommentInput, UpdateCommentInput } from './types';

@injectable()
export class CommentService {
  constructor(
    @inject(USER_REPOSITORY) protected readonly userRepository: UserRepository,
    @inject(POST_REPOSITORY) protected readonly postRepository: PostRepository,
    @inject(COMMENT_REPOSITORY)
    protected readonly commentRepository: CommentRepository,
  ) {}

  private async getCommentForOwner(
    commentId: string,
    userId: string,
  ): Promise<Comment> {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) throw new NotFoundError('Comment', commentId);
    if (comment.userId !== userId) {
      throw new ForbiddenError('You are not allowed to modify this comment');
    }
    return comment;
  }

  public async createComment({
    userId,
    postId,
    content,
  }: CreateCommentInput): Promise<string> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundError('User', userId);

    const post = await this.postRepository.findById(postId);
    if (!post) throw new NotFoundError('Post', postId);

    return await this.commentRepository.create({
      postId: post.id,
      content: content,
      userId: user.id,
      userLogin: user.login,
      createdAt: new Date(),
    });
  }

  public async updateComment(
    commentId: string,
    userId: string,
    { content }: UpdateCommentInput,
  ): Promise<void> {
    await this.getCommentForOwner(commentId, userId);
    const result = await this.commentRepository.update(commentId, { content });
    if (!result) throw new NotFoundError('Comment', commentId);
  }

  public async deleteComment(id: string, userId: string): Promise<void> {
    await this.getCommentForOwner(id, userId);
    const result = await this.commentRepository.delete(id);
    if (!result) throw new NotFoundError('Comment', id);
  }
}
