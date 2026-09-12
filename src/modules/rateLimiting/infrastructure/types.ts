import { HydratedDocument, InferSchemaType } from 'mongoose';
import { logSchema } from './log-model';

export type LogInput = InferSchemaType<typeof logSchema>;
export type LogDocument = HydratedDocument<LogInput>;
