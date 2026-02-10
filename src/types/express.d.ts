declare global {
  namespace Express {
    export interface Request {
      appContext?: {
        user?: { userId: string };
      };
    }
  }
}

export {};
