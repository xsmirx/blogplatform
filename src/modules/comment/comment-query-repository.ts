import { ObjectId, WithId } from 'mongodb';
import { databaseConnection } from '../../bd';
import { CommentDB, CommentOutputDTO } from './types';
import { NotFoundError } from '../../core/errors/errors';

class CommentQueryRepository {
  public get collection() {
    return databaseConnection.getDb().collection<CommentDB>('comments');
  }

  private mapToOutputModel(comment: WithId<CommentDB>): CommentOutputDTO {
    return {
      id: comment._id.toString(),
      content: comment.content,
      commentatorInfo: {
        userId: comment.userId,
        userLogin: comment.userLogin,
      },
      createdAt: comment.createdAt.toISOString(),
    };
  }

  public async findCommentById(id: string): Promise<CommentOutputDTO> {
    const comment = await this.collection.findOne({ _id: new ObjectId(id) });
    if (!comment) {
      throw new NotFoundError('Comment not found');
    }
    return this.mapToOutputModel(comment);
  }
}

export const commentQueryRepository = new CommentQueryRepository();
