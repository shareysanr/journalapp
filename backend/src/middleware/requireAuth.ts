import { NextFunction, Request, Response } from "express";
import { accessTokenVerifier } from "../config/cognito";
import { findOrCreateByCognitoSub } from "../services/userService";

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
    return res.status(401).json({ error: { message: "Unauthorized" } });
  }
  const token = header.slice("Bearer ".length).trim();
  if (!token) {
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
    next();
  } catch {
    return res.status(401).json({ error: { message: "Unauthorized" } });
  }
}
