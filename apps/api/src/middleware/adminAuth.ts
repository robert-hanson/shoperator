import type { Request, Response, NextFunction } from 'express'
import { env } from '../config/env.js'

export function adminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const token = authHeader.slice(7)
  if (token !== env.ADMIN_TOKEN) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  next()
}
