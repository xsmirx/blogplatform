import {
  DefaultTimestampProps,
  HydratedDocument,
  Model,
  model,
  Schema,
  Types,
} from 'mongoose';
import { UserModel } from '../../user/infrastructure/user-model';

export type LikeStatus = 'None' | 'Like' | 'Dislike';

export type Like = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  parentId: Types.ObjectId;
  status: LikeStatus;
} & DefaultTimestampProps;

export type LikeStatics = {
  findStatus(userId: string, parentId: string): Promise<LikeStatus>;
  findStatusesByParentIds(
    userId: string,
    parentIds: string[],
  ): Promise<Map<string, LikeStatus>>;
  findNewestLikes(
    parentId: string,
    listLength: number,
  ): Promise<{ userId: string; login: string; createdAt: Date }[]>;
};

export type LikeModel = Model<Like> & LikeStatics;

export const likeSchema = new Schema<Like, LikeModel>(
  {
    userId: { type: Schema.Types.ObjectId, required: true },
    parentId: { type: Schema.Types.ObjectId, required: true },
    status: {
      type: String,
      enum: ['None', 'Like', 'Dislike'],
      required: true,
    },
  },
  {
    timestamps: true,
    statics: {
      async findStatus(userId: string, parentId: string) {
        const like = await this.findOne({ userId, parentId });
        return like?.status ?? 'None';
      },
      async findStatusesByParentIds(userId: string, parentIds: string[]) {
        const likes = await this.find({ userId, parentId: { $in: parentIds } });
        return new Map(
          likes.map((like) => [like.parentId.toString(), like.status]),
        );
      },
      async findNewestLikes(parentId: string, listLength: number) {
        const likes = await this.find({ parentId, status: 'Like' })
          .sort({ ['createdAt']: -1 })
          .limit(listLength);
        const users = await UserModel.find({
          id: { $in: likes.map((like) => like.userId.toString()) },
        });
        const logins = new Map(users.map((user) => [user.id, user.login]));
        return likes.map((like) => ({
          userId: like.userId,
          createdAt: like.createdAt,
          login: logins.get(like.userId.toString()),
        }));
      },
    },
  },
);

likeSchema.index({ userId: 1, parentId: 1 }, { unique: true });

export type LikeDocument = HydratedDocument<Like>;

export const LikeModel = model<Like, LikeStatics>('like', likeSchema);

export const LIKE_MODEL = Symbol('LikeModel');
