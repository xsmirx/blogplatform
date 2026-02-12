import { Filter, ObjectId, WithId } from 'mongodb';
import { databaseConnection } from '../../bd';
import { CommentDB, CommentListQueryInput, CommentOutputDTO } from './types';
import { NotFoundError } from '../../core/errors/errors';
import { ListResponse } from '../../core/types/list-response';

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

  private mapListToListResponceViewModel({
    items,
    queries,
    totalCount,
  }: {
    items: WithId<CommentDB>[];
    queries: CommentListQueryInput;
    totalCount: number;
  }): ListResponse<CommentOutputDTO> {
    return {
      page: queries.pageNumber,
      pageSize: queries.pageSize,
      pagesCount: Math.ceil(totalCount / queries.pageSize),
      totalCount: totalCount,
      items: items.map(this.mapToOutputModel),
    };
  }

  public async findAllByPostId(
    queries: CommentListQueryInput,
  ): Promise<ListResponse<CommentOutputDTO>> {
    const { postId, pageNumber, pageSize, sortBy, sortDirection } = queries;
    const filter: Filter<CommentDB> = { postId: postId };

    const items = await this.collection
      .find(filter)
      .sort(sortBy, sortDirection)
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .toArray();

    const totalCount = await this.collection.countDocuments(filter);

    return this.mapListToListResponceViewModel({ items, queries, totalCount });
  }

  public async findById(id: string): Promise<CommentOutputDTO> {
    const comment = await this.collection.findOne({ _id: new ObjectId(id) });
    if (!comment) {
      throw new NotFoundError('Comment not found');
    }
    return this.mapToOutputModel(comment);
  }
}

export const commentQueryRepository = new CommentQueryRepository();
