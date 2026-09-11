import type { CommentRepository } from '../domain/comment-repository.interface';
import type { Comment, NewComment, UpdateComment } from '../domain/types';
import { inject, injectable } from 'inversify';
import { CommentDocument, CommentInput } from './types';
import { COMMENT_MODEL } from './comment-model';
import { Model } from 'mongoose';

@injectable()
export class MongoCommentRepository implements CommentRepository {
  constructor(
    @inject(COMMENT_MODEL)
    protected readonly commentModel: Model<CommentInput>,
  ) {}

  private mapToDomainModel(comment: CommentDocument): Comment {
    return {
      id: comment.id,
      content: comment.content,
      postId: comment.postId.toString(),
      userId: comment.userId.toString(),
      userLogin: comment.userLogin,
      createdAt: comment.createdAt,
    };
  }

  public async findById(commentId: string): Promise<Comment | null> {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) return null;
    return this.mapToDomainModel(comment);
  }

  public async create({
    userId,
    userLogin,
    postId,
    content,
  }: NewComment): Promise<string> {
    const result = await this.commentModel.create({
      userId,
      userLogin,
      postId,
      content,
    });
    return result.id;
  }

  public async update(
    id: string,
    { content }: UpdateComment,
  ): Promise<boolean> {
    const result = await this.commentModel
      .findByIdAndUpdate(id)
      .set({ content });
    return result !== null;
  }

  public async delete(id: string): Promise<boolean> {
    const result = await this.commentModel.findByIdAndDelete(id);
    return result !== null;
  }
}
