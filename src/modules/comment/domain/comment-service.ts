import {
  ForbiddenError,
  NotFoundError,
} from '../../../core/errors/domain-errors';
import type { PostRepository } from '../../post/domain/post-repository.interface';
import type { UserRepository } from '../../user/domain/user-repository.interface';
import type { CommentRepository } from './comment-repository.interface';
import type { Comment, CreateCommentInput, UpdateCommentInput } from './types';

export class CommentService {
  private readonly userRepository: UserRepository;
  private readonly postRepository: PostRepository;
  private readonly commentRepository: CommentRepository;

  constructor(deps: {
    userRepository: UserRepository;
    postRepository: PostRepository;
    commentRepository: CommentRepository;
  }) {
    this.userRepository = deps.userRepository;
    this.commentRepository = deps.commentRepository;
    this.postRepository = deps.postRepository;
  }

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
