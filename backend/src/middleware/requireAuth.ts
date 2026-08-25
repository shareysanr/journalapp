import { NextFunction, Request, Response } from "express";
import { accessTokenVerifier } from "../config/cognito";
import { findOrCreateByCognitoSub } from "../services/userService";
import { logger } from "../config/logger";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        sub: string;
        userId: number;
        username?: string;
        client_id?: string;
      };
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    logger.warn({ event: "auth_missing_bearer", path: req.path }, "Unauthorized request");
    return res.status(401).json({ error: { message: "Unauthorized" } });
  }
  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    logger.warn({ event: "auth_empty_token", path: req.path }, "Unauthorized request");
    return res.status(401).json({ error: { message: "Unauthorized" } });
  }
  try {
    const payload = await accessTokenVerifier.verify(token);
    const user = await findOrCreateByCognitoSub(payload.sub);
    req.auth = {
      sub: payload.sub,
      userId: user.id,
      username: typeof payload.username === "string" ? payload.username : undefined,
      client_id: typeof payload.client_id === "string" ? payload.client_id : undefined
    };
    logger.info({ event: "auth_verified", userId: user.id, sub: payload.sub, path: req.path });
    next();
  } catch (err) {
    logger.warn({ event: "auth_verification_failed", path: req.path, err }, "Unauthorized request");
    return res.status(401).json({ error: { message: "Unauthorized" } });
  }
}
