import { model, Schema, SchemaTypeOptions } from 'mongoose';
import { USERS_COLLECTION_NAME } from '../../../db/collections';

export const emailConfirmationSchema = new Schema(
  {
    confirmationCode: {
      type: Schema.Types.UUID,
      required: true,
      index: true,
    } satisfies SchemaTypeOptions<Schema.Types.UUID>,
    expirationDate: {
      type: Date,
      required: true,
    } satisfies SchemaTypeOptions<Date>,
    isConfirmed: {
      type: Boolean,
      required: true,
    } satisfies SchemaTypeOptions<boolean>,
  },
  { _id: false },
);

export const userSchema = new Schema(
  {
    login: {
      type: String,
      minLength: 1,
      maxLength: 64,
      required: true,
      index: true,
    } satisfies SchemaTypeOptions<string>,
    email: {
      type: String,
      minLength: 1,
      maxLength: 256,
      required: true,
      index: true,
    } satisfies SchemaTypeOptions<string>,
    passwordHash: {
      type: String,
      minLength: 60,
      maxLength: 60,
      required: true,
    } satisfies SchemaTypeOptions<string>,
    emailConfirmation: {
      type: emailConfirmationSchema,
      required: true,
    } satisfies SchemaTypeOptions<typeof emailConfirmationSchema>,
  },
  { timestamps: true },
);

export const UserModel = model(USERS_COLLECTION_NAME, userSchema);

export const USER_MODEL = Symbol('UserModel');
