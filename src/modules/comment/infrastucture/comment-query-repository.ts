import type { CommentListQueryInput, CommentOutputDTO } from '../api/types';
import type { ListResponse } from '../../../core/types/list-response';
import { inject, injectable } from 'inversify';
import { COMMENT_MODEL } from './comment-model';
import { Model } from 'mongoose';
import { CommentDocument, CommentInput } from './types';

@injectable()
export class CommentQueryRepository {
  constructor(
    @inject(COMMENT_MODEL)
    protected readonly commentModel: Model<CommentInput>,
  ) {}

  private mapToOutputModel(comment: CommentDocument): CommentOutputDTO {
    return {
      id: comment.id,
      content: comment.content,
      commentatorInfo: {
        userId: comment.userId.toString(),
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
    items: CommentDocument[];
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

    const query = this.commentModel.find({ postId: postId });
    const filter = query.getFilter();

    const items = await query
      .sort({ [sortBy]: sortDirection })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize);

    const totalCount = await this.commentModel.countDocuments(filter);

    return this.mapListToListResponseViewModel({ items, queries, totalCount });
  }

  public async findById(id: string): Promise<CommentOutputDTO | null> {
    const comment = await this.commentModel.findById(id);
    if (!comment) return null;
    return this.mapToOutputModel(comment);
  }
}
