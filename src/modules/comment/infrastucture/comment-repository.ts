import { ObjectId, type WithId } from 'mongodb';
import type { DatabaseConnection } from '../../../bd/mongo.db';
import type { CommentRepository } from '../domain/comment-repository.interface';
import type { CommentDB } from './types';
import type { Comment, NewComment, UpdateComment } from '../domain/types';

export class MongoCommentRepository implements CommentRepository {
  constructor(protected readonly databaseConnection: DatabaseConnection) {}

  private get collection() {
    return this.databaseConnection.getCollections().commentsCollection;
  }

  private mapToDomainModel(comment: WithId<CommentDB>): Comment {
    return {
      id: comment._id.toString(),
      content: comment.content,
      postId: comment.postId,
      userId: comment.userId,
      userLogin: comment.userLogin,
      createdAt: comment.createdAt,
    };
  }

  public async findById(commentId: string): Promise<Comment | null> {
    const comment = await this.collection.findOne({
      _id: new ObjectId(commentId),
    });
    if (!comment) return null;
    return this.mapToDomainModel(comment);
  }

  public async create({
    userId,
    userLogin,
    postId,
    content,
    createdAt,
  }: NewComment): Promise<string> {
    const result = await this.collection.insertOne({
      userId,
      userLogin,
      postId,
      content,
      createdAt,
    });
    return result.insertedId.toString();
  }

  public async update(
    id: string,
    { content }: UpdateComment,
  ): Promise<boolean> {
    const result = await this.collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { content } },
    );
    return result.matchedCount > 0;
  }

  public async delete(id: string): Promise<boolean> {
    const result = await this.collection.deleteOne({
      _id: new ObjectId(id),
    });
    return result.deletedCount > 0;
  }
}
