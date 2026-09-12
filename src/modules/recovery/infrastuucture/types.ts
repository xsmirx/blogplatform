import { HydratedDocument, InferSchemaType } from 'mongoose';
import { recoverySchema } from './recovery-model';

export type RecoveryInput = InferSchemaType<typeof recoverySchema>;
export type RecoveryDocument = HydratedDocument<RecoveryInput>;
