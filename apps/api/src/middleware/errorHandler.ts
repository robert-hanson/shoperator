import type { Request, Response, NextFunction } from 'express'

export interface ApiError extends Error {
  statusCode?: number
}

export function errorHandler(err: ApiError, _req: Request, res: Response, _next: NextFunction) {
  const status = err.statusCode ?? 500
  const message = err.message ?? 'Internal Server Error'

  if (status >= 500) {
    console.error('[error]', err)
  }

  res.status(status).json({ error: message })
}
