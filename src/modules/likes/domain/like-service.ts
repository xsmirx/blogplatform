import { inject, injectable } from 'inversify';
import { LIKE_MODEL, LikeModel, LikeStatus } from './like-model';

@injectable()
export class LikeService {
  constructor(@inject(LIKE_MODEL) protected readonly likeModel: LikeModel) {}

  public async updateLikeStatus(
    userId: string,
    parentId: string,
    status: LikeStatus,
  ): Promise<void> {
    await this.likeModel.updateOne(
      { userId, parentId },
      { $set: { status } },
      { upsert: true },
    );
  }

  public async getLikesCount(parentId: string): Promise<{
    likesCount: number;
    dislikesCount: number;
  }> {
    const likesCountPromise = this.likeModel.countDocuments({
      parentId,
      status: 'Like',
    });
    const dislikesCountPromise = this.likeModel.countDocuments({
      parentId,
      status: 'Dislike',
    });
    const [likesCount, dislikesCount] = await Promise.all([
      likesCountPromise,
      dislikesCountPromise,
    ]);
    return { likesCount, dislikesCount };
  }
}
