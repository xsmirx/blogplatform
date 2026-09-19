import type {
  LikeStatusDTO,
  PostListQueryInput,
  PostOutputDTO,
} from '../api/types';
import type { ListResponse } from '../../../core/types/list-response';
import { inject, injectable } from 'inversify';
import {
  LIKE_MODEL,
  LikeModel,
  LikeStatus,
} from '../../likes/domain/like-model';
import { POST_MODEL, PostDocument, PostModel } from '../domain/post-model';

@injectable()
export class PostQueryRepository {
  constructor(
    @inject(POST_MODEL)
    protected readonly postModel: PostModel,
    @inject(LIKE_MODEL) protected readonly LikeModel: LikeModel,
  ) {}

  private mapToViewModel(
    post: PostDocument,
    myStatus: LikeStatusDTO,
  ): PostOutputDTO {
    return {
      id: post.id,
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId.toString(),
      blogName: post.blogName,
      createdAt: post.createdAt.toISOString(),
      extendedLikesInfo: {
        likesCount: post.likesCount,
        dislikesCount: post.dislikesCount,
        myStatus,
        newestLikes: post.newestLikes.map((like) => ({
          userId: like.userId.toString(),
          login: like.login,
          addedAt: like.addedAt.toISOString(),
        })),
      },
    };
  }

  public async findById(
    id: string,
    userId?: string,
  ): Promise<PostOutputDTO | null> {
    const post = await this.postModel.findById(id);
    let likeStatus: LikeStatus | null = null;
    if (userId !== undefined) {
      likeStatus = await this.LikeModel.findStatus(userId, id);
    }
    return post ? this.mapToViewModel(post, likeStatus || 'None') : null;
  }

  public async findAll(
    input: PostListQueryInput,
    userId?: string,
  ): Promise<ListResponse<PostOutputDTO>> {
    const { pageNumber, pageSize, sortBy, sortDirection, blogId } = input;

    const query = this.postModel.find();

    if (blogId) {
      query.where('blogId').equals(blogId);
    }
    const filter = query.getFilter();

    const skip = (pageNumber - 1) * pageSize;
    const items = await query
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(pageSize);

    const totalCount = await this.postModel.countDocuments(filter);

    let likeStatuses: Map<string, LikeStatus> | null = null;

    if (userId !== undefined) {
      likeStatuses = await this.LikeModel.findStatusesByParentIds(
        userId,
        items.map((like) => like.id),
      );
    }

    return {
      page: pageNumber,
      pageSize: pageSize,
      pagesCount: Math.ceil(totalCount / pageSize),
      totalCount: totalCount,
      items: items.map((item) =>
        this.mapToViewModel(item, likeStatuses?.get(item.id) ?? 'None'),
      ),
    };
  }
}
