import { inject, injectable } from 'inversify';
import { LikeStatus } from '../domain/like-model';
import { LikeRepository } from '../infrastucture/like-repository';

@injectable()
export class LikeService {
  constructor(
    @inject(LikeRepository) protected readonly likeRepository: LikeRepository,
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

  public async getNewestLikes(parentId: string) {
    return await this.likeRepository.findNewestLikes(parentId);
  }
}
