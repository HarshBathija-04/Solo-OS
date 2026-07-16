import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

/** Throw from services/routes for expected failures; carries an HTTP status. */
export class AppError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ ok: false, error: "not_found" });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ ok: false, error: "invalid_input", details: err.flatten() });
  }
  if (err instanceof AppError) {
    return res.status(err.status).json({ ok: false, error: err.message });
  }
  const message = err instanceof Error ? err.message : "internal_error";
  // Known service-level errors thrown as plain Errors keep their message.
  console.error(err);
  res.status(500).json({ ok: false, error: message });
}
