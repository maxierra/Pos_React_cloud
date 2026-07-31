import type { Request, Response, NextFunction } from "express";
import { config } from "../config.js";

function redactToken(token: string): string {
  if (!token) return "(empty)";
  if (token.length <= 8) return `${token.slice(0, 2)}***`;
  return `${token.slice(0, 4)}***${token.slice(-4)}`;
}

export function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || token !== config.apiKey) {
    const debugDetails =
      process.env.NODE_ENV !== "production"
        ? ` received=${redactToken(token)} expected=${redactToken(config.apiKey)}`
        : "";
    if (process.env.NODE_ENV !== "production") {
      console.warn("[fiscal-api] unauthorized", {
        received: redactToken(token),
        expected: redactToken(config.apiKey),
      });
    }
    res.status(401).json({ error: `Unauthorized${debugDetails}` });
    return;
  }
  next();
}
