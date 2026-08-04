declare global {
  namespace Express {
    export interface Request {
      appContext?: {
        user?: { userId: string };
        device?: { deviceId: string; version: string; iat: number };
      };
    }
  }
}

export {};
