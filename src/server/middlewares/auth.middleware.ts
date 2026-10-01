import { Request, Response, NextFunction } from 'express';
import { CompanyRepository } from '../db/database.js';

/**
 * Middleware para validar Token / API Key no Header HTTP Authorization: Bearer <token>
 */
export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const config = CompanyRepository.get();
  const configuredKey = config.api_key || 'rlp_live_secret_key_2026';

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Não autorizado. Header "Authorization: Bearer <API_KEY>" ausente ou inválido.',
    });
    return;
  }

  const token = authHeader.substring(7).trim();
  if (token !== configuredKey) {
    res.status(401).json({
      error: 'Token de API inválido ou revogado.',
    });
    return;
  }

  next();
}
