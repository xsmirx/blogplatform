import { model, Schema, SchemaTypeOptions } from 'mongoose';
import { LOG_COLLECTION_NAME } from '../../../db/collections';
import { isIP } from 'node:net';

export const logSchema = new Schema(
  {
    url: {
      type: String,
      minLength: 1,
      maxLength: 500,
      required: true,
    } satisfies SchemaTypeOptions<string>,
    ip: {
      type: String,
      required: true,
      validate: (value: string) => isIP(value) !== 0,
    } satisfies SchemaTypeOptions<string>,
  },
  { timestamps: true },
);
logSchema.index({ createdAt: 1 }, { expireAfterSeconds: 10 });

export const LogModel = model(LOG_COLLECTION_NAME, logSchema);

export const LOG_MODEL = Symbol('LogModel');
