import { HydratedDocument, InferSchemaType } from 'mongoose';
import { deviceSchema } from './device-model';

export type DeviceInput = InferSchemaType<typeof deviceSchema>;
export type DeviceDocument = HydratedDocument<DeviceInput>;
