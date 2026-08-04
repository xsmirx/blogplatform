import { RequestHandler } from 'express';
import { RateLimitingService } from '../../domain/rate-limiting-service';

export const createRateLimiter =
  (
    { rateLimitingService }: { rateLimitingService: RateLimitingService },
    { maxRequests, windowMs }: { maxRequests: number; windowMs: number },
  ): RequestHandler =>
  async (req, res, next) => {
    const url = req.originalUrl || req.baseUrl;
    const ip = req.ip as string;

    await rateLimitingService.checkAndRegisterRequest({
      url,
      ip,
      maxRequests,
      windowMs,
    });

    next();
  };
