import { model, Schema, SchemaTypeOptions } from 'mongoose';
import { RECOVERY_COLLECTION_NAME } from '../../../db/collections';

export const recoverySchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
  } satisfies SchemaTypeOptions<Schema.Types.ObjectId>,
  email: {
    type: String,
    min: 1,
    max: 256,
    required: true,
  } satisfies SchemaTypeOptions<string>,
  code: {
    type: Schema.Types.UUID,
    required: true,
    index: true,
  } satisfies SchemaTypeOptions<Schema.Types.UUID>,
  expiresAt: {
    type: Date,
    required: true,
    expires: 0,
  } satisfies SchemaTypeOptions<Date>,
});

export const RecoveryModel = model(RECOVERY_COLLECTION_NAME, recoverySchema);

export const RECOVERY_MODEL = Symbol('RecoveryModel');
