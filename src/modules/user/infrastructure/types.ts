import { HydratedDocument, InferSchemaType } from 'mongoose';
import { userSchema } from './user-model';

export type UserDB = {
  login: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  emailConfirmation: {
    confirmationCode: string;
    expirationDate: Date;
    isConfirmed: boolean;
  };
};

export type UserInput = InferSchemaType<typeof userSchema>;
export type UserDocument = HydratedDocument<UserInput>;
