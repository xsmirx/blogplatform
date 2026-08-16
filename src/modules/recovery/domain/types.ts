export type Recovery = {
  id: string;
  userId: string;
  email: string;
  code: string;
  expiresAt: Date;
};
