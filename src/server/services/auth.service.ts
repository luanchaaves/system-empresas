import crypto from 'node:crypto';
import { CompanyRepository } from '../db/database.js';
import { UserProfile } from '../../types/index.js';

export const AuthService = {
  /**
   * Hasheia a senha usando SHA-256 com salt fixo do sistema
   */
  hashPassword(password: string): string {
    return crypto.createHash('sha256').update(`rlp_salt_2026_${password.trim()}`).digest('hex');
  },

  /**
   * Valida a senha comparando com o hash salvo
   */
  verifyPassword(password: string, hash: string): boolean {
    if (!hash) return false;
    const computed = this.hashPassword(password);
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
  },

  /**
   * Gera um token de sessão assinado (JWT HMAC-SHA256)
   */
  signToken(user: UserProfile, expiresInSeconds = 60 * 60 * 24 * 30): string {
    const config = CompanyRepository.get();
    const secret = config.jwt_secret || 'rlp_live_jwt_secret_2026_super_secure';

    const header = { alg: 'HS256', typ: 'JWT' };
    const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const payload = {
      email: user.email,
      name: user.name,
      picture: user.picture,
      role: user.role,
      exp,
    };

    const encodeBase64Url = (obj: any) =>
      Buffer.from(JSON.stringify(obj))
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    const encodedHeader = encodeBase64Url(header);
    const encodedPayload = encodeBase64Url(payload);
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  },

  /**
   * Verifica o token de sessão assinado
   */
  verifyToken(token: string): UserProfile | null {
    try {
      const config = CompanyRepository.get();
      const secret = config.jwt_secret || 'rlp_live_jwt_secret_2026_super_secure';

      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const [headerB64, payloadB64, sigB64] = parts;
      const expectedSig = crypto
        .createHmac('sha256', secret)
        .update(`${headerB64}.${payloadB64}`)
        .digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

      if (sigB64 !== expectedSig) return null;

      const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf-8'));
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return null; // Token expirado
      }

      return {
        email: payload.email,
        name: payload.name || 'Robo Led Partner',
        picture: payload.picture,
        role: payload.role || 'ADMIN',
      };
    } catch {
      return null;
    }
  },

  /**
   * Valida o token do Google (Google Identity Services / One Tap / OAuth 2.0)
   */
  async verifyGoogleIdToken(idToken: string): Promise<{ email: string; name: string; picture?: string; sub: string } | null> {
    try {
      // 1. Valida diretamente com o endpoint oficial do Google OAuth2
      const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
      if (!res.ok) {
        console.warn('Falha na validação do token Google:', await res.text());
        return null;
      }

      const data = (await res.json()) as any;
      if (!data || !data.email) {
        return null;
      }

      return {
        email: data.email.toLowerCase(),
        name: data.name || data.given_name || 'Robo Led Partner',
        picture: data.picture,
        sub: data.sub,
      };
    } catch (err) {
      console.error('Erro ao verificar Google ID Token:', err);
      return null;
    }
  },
};
