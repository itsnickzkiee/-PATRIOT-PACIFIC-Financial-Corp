import type {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  verifyAccessToken,
  type AuthTokenPayload,
} from "../../utils/jwt.js";

export interface AuthenticatedRequest
  extends Request {
  user?: AuthTokenPayload;
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const authorization =
    req.headers.authorization;

  if (
    !authorization ||
    !authorization.startsWith("Bearer ")
  ) {
    res.status(401).json({
      message:
        "Authentication token is required.",
    });

    return;
  }

  const token = authorization
    .slice("Bearer ".length)
    .trim();

  if (!token) {
    res.status(401).json({
      message:
        "Authentication token is required.",
    });

    return;
  }

  try {
    req.user =
      verifyAccessToken(token);

    next();
  } catch {
    res.status(401).json({
      message:
        "Your session is invalid or has expired. Please log in again.",
    });
  }
}