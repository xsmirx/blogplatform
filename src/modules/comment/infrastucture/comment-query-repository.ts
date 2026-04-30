import { ObjectId, type Filter, type WithId } from 'mongodb';
import type { DatabaseConnection } from '../../../bd/mongo.db';
import type { CommentDB } from './types';
import type { CommentListQueryInput, CommentOutputDTO } from '../api/types';
import type { ListResponse } from '../../../core/types/list-response';

export class CommentQueryRepository {
  constructor(protected readonly databaseConnection: DatabaseConnection) {}

  private get collection() {
    return this.databaseConnection.getCollections().commentsCollection;
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

  private mapListToListResponseViewModel({
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
      items: items.map((comment) => this.mapToOutputModel(comment)),
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

    return this.mapListToListResponseViewModel({ items, queries, totalCount });
  }

  public async findById(id: string): Promise<CommentOutputDTO | null> {
    const comment = await this.collection.findOne({ _id: new ObjectId(id) });
    if (!comment) return null;
    return this.mapToOutputModel(comment);
  }
}
