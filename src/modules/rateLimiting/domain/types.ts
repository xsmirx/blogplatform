export type CheckAndRegisterRequestInput = {
  ip: string;
  url: string;
  maxRequests?: number;
  windowMs?: number;
};
