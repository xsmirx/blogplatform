import { model, Schema } from 'mongoose';
import { DEVICES_COLLECTION_NAME } from '../../../db/collections';
import { isIP } from 'node:net';

export const deviceSchema = new Schema(
  {
    _id: { type: Schema.Types.UUID, required: true },
    version: { type: Schema.Types.UUID, required: true },
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    ip: {
      type: String,
      required: true,
      validate: (value: string) => isIP(value) !== 0,
    },
    deviceName: { type: String, minLength: 1, maxLength: 256, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

export const DeviceModel = model(DEVICES_COLLECTION_NAME, deviceSchema);

export const DEVICE_MODEL = Symbol('DeviceModel');
