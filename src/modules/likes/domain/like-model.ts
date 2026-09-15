import { HydratedDocument, Model, model, Schema, Types } from 'mongoose';

export type LikeStatus = 'None' | 'Like' | 'Dislike';

export type Like = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  parentId: Types.ObjectId;
  status: LikeStatus;
};

export type LikeStatics = {
  findStatus(userId: string, parentId: string): Promise<LikeStatus>;
  findStatusesByParentIds(
    userId: string,
    parentIds: string[],
  ): Promise<Map<string, LikeStatus>>;
};

export type LikeModel = Model<Like> & LikeStatics;

export const likeSchema = new Schema<Like, LikeModel>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    parentId: { type: Schema.Types.ObjectId, required: true, index: true },
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
    },
  },
);

export type LikeDocument = HydratedDocument<Like>;

export const LikeModel = model<Like, LikeStatics>('like', likeSchema);

export const LIKE_MODEL = Symbol('LikeModel');
