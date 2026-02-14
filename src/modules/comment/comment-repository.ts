import { ObjectId, WithId } from 'mongodb';
import {
  Comment,
  CommentDB,
  CreateCommentPayload,
  UpdateCommentPayload,
} from './types';
import { NotFoundError } from '../../core/errors/errors';
import { databaseConnection } from '../../bd/mongo.db';
import { BaseRepository } from '../../core/repositories/base-repository';
import { COMMENTS_COLLECTION_NAME } from '../../core/repositories/collections';

class CommentRepository extends BaseRepository<CommentDB> {
  private mapToDomainModel(comment: WithId<CommentDB>): Comment {
    return {
      id: comment._id.toString(),
      content: comment.content,
      commentatorInfo: {
        userId: comment.userId,
        userLogin: comment.userLogin,
      },
      createdAt: comment.createdAt,
    };
  }

  public async findById(commentId: string): Promise<Comment | null> {
    const comment = await this.collection.findOne({
      _id: new ObjectId(commentId),
    });
    if (!comment) {
      return null;
    }
    return this.mapToDomainModel(comment);
  }

  public async findByIdOrFail(commentId: string): Promise<Comment> {
    const comment = await this.collection.findOne({
      _id: new ObjectId(commentId),
    });
    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    return this.mapToDomainModel(comment);
  }

  public async create({
    userId,
    userLogin,
    postId,
    content,
  }: CreateCommentPayload): Promise<string> {
    const result = await this.collection.insertOne({
      userId,
      userLogin,
      postId,
      content,
      createdAt: new Date(),
    });
    return result.insertedId.toString();
  }

  public async update({ id, content }: UpdateCommentPayload): Promise<void> {
    const result = await this.collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { content } },
    );

    if (result.matchedCount === 0) {
      throw new NotFoundError('Comment not found');
    }
  }

  public async delete(id: string): Promise<void> {
    const result = await this.collection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundError('Comment not found');
    }
  }
}

export const commentRepository = new CommentRepository(
  COMMENTS_COLLECTION_NAME,
  {
    databaseConnection: databaseConnection,
  },
);
