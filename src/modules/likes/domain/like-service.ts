import { inject, injectable } from 'inversify';
import { LIKE_MODEL, LikeModel, LikeStatus } from './like-model';
import { LikeRepository } from '../infrastucture/like-repository';

@injectable()
export class LikeService {
  constructor(
    @inject(LikeRepository) protected readonly likeRepository: LikeRepository,
    @inject(LIKE_MODEL) protected readonly LikeModel: LikeModel,
  ) {}

  public async updateLikeStatus(
    userId: string,
    parentId: string,
    status: LikeStatus,
  ): Promise<void> {
    await this.likeRepository.updateLikeStatus(userId, parentId, status);
  }

  public async getLikesCount(parentId: string): Promise<{
    likesCount: number;
    dislikesCount: number;
  }> {
    const likesCountPromise = this.likeRepository.findLikeCount(
      parentId,
      'Like',
    );
    const dislikesCountPromise = this.likeRepository.findLikeCount(
      parentId,
      'Dislike',
    );
    const [likesCount, dislikesCount] = await Promise.all([
      likesCountPromise,
      dislikesCountPromise,
    ]);
    return { likesCount, dislikesCount };
  }
}
