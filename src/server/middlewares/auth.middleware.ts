import { Request, Response, NextFunction } from 'express';
import { CompanyRepository } from '../db/database.js';
import { AuthService } from '../services/auth.service.js';

/**
 * Middleware para validar autenticação do usuário (Sessão JWT ou API Key)
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const config = CompanyRepository.get();

  // Se a autenticação estiver desativada globalmente
  if (config.auth_enabled === 0 || config.auth_enabled === false) {
    (req as any).user = {
      email: config.admin_email || 'roboledpartner@gmail.com',
      name: config.responsavel || 'Robo Led Partner',
      role: 'ADMIN',
    };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Não autorizado. Faça login para acessar o sistema.',
    });
    return;
  }

  const token = authHeader.substring(7).trim();

  // 1. Verifica se é a API Key da empresa (para integrações / scripts)
  const configuredKey = config.api_key || 'rlp_live_secret_key_2026';
  if (token === configuredKey) {
    (req as any).user = {
      email: config.admin_email || 'roboledpartner@gmail.com',
      name: 'API Key Integration',
      role: 'ADMIN',
    };
    return next();
  }

  // 2. Verifica se é um token de sessão JWT do usuário
  const user = AuthService.verifyToken(token);
  if (!user) {
    res.status(401).json({
      error: 'Sessão expirada ou token inválido. Por favor, faça login novamente.',
    });
    return;
  }

  (req as any).user = user;
  next();
}

/**
 * Middleware para validar exclusivamente API Key externa (Webhooks / Integrações)
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
