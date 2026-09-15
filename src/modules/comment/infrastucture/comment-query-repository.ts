import type { CommentListQueryInput, CommentOutputDTO } from '../api/types';
import type { ListResponse } from '../../../core/types/list-response';
import { inject, injectable } from 'inversify';
import { COMMENT_MODEL } from './comment-model';
import { CommentDocument, CommentInput } from './types';
import {
  LIKE_MODEL,
  type LikeStatus,
  type LikeModel,
} from '../../likes/domain/like-model';
import { Model } from 'mongoose';

@injectable()
export class CommentQueryRepository {
  constructor(
    @inject(COMMENT_MODEL)
    protected readonly commentModel: Model<CommentInput>,
    @inject(LIKE_MODEL) protected readonly likeModel: LikeModel,
  ) {}

  private mapToOutputModel(
    comment: CommentDocument,
    status: LikeStatus,
  ): CommentOutputDTO {
    return {
      id: comment.id,
      content: comment.content,
      commentatorInfo: {
        userId: comment.userId.toString(),
        userLogin: comment.userLogin,
      },
      createdAt: comment.createdAt.toISOString(),
      likesInfo: {
        likesCount: comment.likesCount,
        dislikesCount: comment.dislikesCount,
        myStatus: status,
      },
    };
  }

  public async findAllByPostId(
    queries: CommentListQueryInput,
    userId?: string,
  ): Promise<ListResponse<CommentOutputDTO>> {
    const { postId, pageNumber, pageSize, sortBy, sortDirection } = queries;

    const query = this.commentModel.find({ postId: postId });
    const filter = query.getFilter();

    const items = await query
      .sort({ [sortBy]: sortDirection })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize);

    const totalCount = await this.commentModel.countDocuments(filter);

    let likeStatuses: Map<string, LikeStatus> | null = null;

    if (userId !== undefined) {
      likeStatuses = await this.likeModel.findStatusesByParentIds(
        userId,
        items.map((like) => like.id),
      );
    }

    return {
      page: pageNumber,
      pageSize: pageSize,
      pagesCount: Math.ceil(totalCount / queries.pageSize),
      totalCount: totalCount,
      items: items.map((comment) =>
        this.mapToOutputModel(comment, likeStatuses?.get(comment.id) ?? 'None'),
      ),
    };
  }

  public async findById(
    id: string,
    userId?: string,
  ): Promise<CommentOutputDTO | null> {
    const comment = await this.commentModel.findById(id);
    if (!comment) return null;
    let likeStatus: LikeStatus | null = null;
    if (userId !== undefined) {
      likeStatus = await this.likeModel.findStatus(userId, id);
    }
    return this.mapToOutputModel(comment, likeStatus || 'None');
  }
}
