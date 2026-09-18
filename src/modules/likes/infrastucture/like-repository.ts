import { inject, injectable } from 'inversify';
import {
  LIKE_MODEL,
  LikeDocument,
  LikeModel,
  LikeStatus,
} from '../domain/like-model';

@injectable()
export class LikeRepository {
  constructor(@inject(LIKE_MODEL) protected readonly LikeModel: LikeModel) {}

  public async findLikeCount(parentId: string, status: LikeStatus) {
    return await this.LikeModel.countDocuments({ parentId, status });
  }

  public async updateLikeStatus(
    userId: string,
    parentId: string,
    status: LikeStatus,
  ): Promise<void> {
    await this.LikeModel.updateOne(
      { userId, parentId },
      { $set: { status } },
      { upsert: true },
    );
  }

  public async save(like: LikeDocument) {
    await like.save();
  }
}
