import { Request, Response } from 'express';
import { CompanyRepository } from '../db/database.js';
import { AuthService } from '../services/auth.service.js';
import { UserProfile } from '../../types/index.js';

export const AuthController = {
  /**
   * Login por e-mail e senha
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
        return;
      }

      const config = CompanyRepository.get();
      const allowedEmail = (config.admin_email || 'roboledpartner@gmail.com').toLowerCase().trim();
      const inputEmail = String(email).toLowerCase().trim();

      // 1. Validação estrita de e-mail (apenas o e-mail autorizado)
      if (inputEmail !== allowedEmail) {
        res.status(401).json({
          error: `Acesso negado: O e-mail "${inputEmail}" não possui autorização. Apenas ${allowedEmail} tem acesso ao sistema.`,
        });
        return;
      }

      // 2. Validação de senha
      const currentHash = config.admin_password_hash || AuthService.hashPassword('Robodeled10.');
      const isPasswordValid = AuthService.verifyPassword(password, currentHash);

      if (!isPasswordValid) {
        res.status(401).json({ error: 'Senha incorreta. Tente novamente.' });
        return;
      }

      // 3. Emissão do token de sessão
      const user: UserProfile = {
        email: allowedEmail,
        name: config.responsavel || 'Robo Led Partner',
        role: 'ADMIN',
      };

      const token = AuthService.signToken(user);

      res.json({
        success: true,
        message: 'Login realizado com sucesso!',
        token,
        user,
      });
    } catch (err: any) {
      console.error('Erro no login:', err);
      res.status(500).json({ error: 'Erro interno ao realizar login.' });
    }
  },

  /**
   * Login com Google Identity (Google Sign-In / One Tap)
   */
  async loginGoogle(req: Request, res: Response): Promise<void> {
    try {
      const { credential } = req.body;
      if (!credential) {
        res.status(400).json({ error: 'Credencial do Google ausente.' });
        return;
      }

      // 1. Valida o ID Token com os servidores do Google
      const googleUser = await AuthService.verifyGoogleIdToken(credential);
      if (!googleUser) {
        res.status(401).json({ error: 'Token do Google inválido ou expirado.' });
        return;
      }

      const config = CompanyRepository.get();
      const allowedEmail = (config.google_auth_allowed_email || config.admin_email || 'roboledpartner@gmail.com')
        .toLowerCase()
        .trim();

      // 2. Trava de Segurança: Apenas o e-mail roboledpartner@gmail.com pode entrar
      if (googleUser.email.toLowerCase().trim() !== allowedEmail) {
        res.status(403).json({
          error: `Acesso Negado: A conta Google (${googleUser.email}) não possui autorização de acesso a este sistema. Somente a conta ${allowedEmail} pode entrar.`,
        });
        return;
      }

      // 3. Gera sessão
      const user: UserProfile = {
        email: googleUser.email,
        name: googleUser.name || 'Robo Led Partner',
        picture: googleUser.picture,
        role: 'ADMIN',
      };

      const token = AuthService.signToken(user);

      res.json({
        success: true,
        message: `Bem-vindo(a), ${user.name}! Login com Google efetuado.`,
        token,
        user,
      });
    } catch (err: any) {
      console.error('Erro no login Google:', err);
      res.status(500).json({ error: 'Erro ao validar autenticação com Google.' });
    }
  },

  /**
   * Retorna os dados do usuário logado atual
   */
  async me(req: Request, res: Response): Promise<void> {
    const user = (req as any).user as UserProfile;
    if (!user) {
      res.status(401).json({ error: 'Não autenticado.' });
      return;
    }
    res.json({ user });
  },

  /**
   * Retorna as configurações públicas para a tela de login
   */
  async getPublicConfig(_req: Request, res: Response): Promise<void> {
    const config = CompanyRepository.get();
    res.json({
      auth_enabled: Boolean(config.auth_enabled ?? true),
      google_client_id: config.google_auth_client_id || '',
      allowed_email: config.google_auth_allowed_email || config.admin_email || 'roboledpartner@gmail.com',
      company_name: config.company_name || 'Robo Led Partner',
    });
  },

  /**
   * Altera a senha do administrador
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user as UserProfile;
      const { currentPassword, newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        res.status(400).json({ error: 'A nova senha deve ter no mínimo 6 caracteres.' });
        return;
      }

      const config = CompanyRepository.get();
      const currentHash = config.admin_password_hash || AuthService.hashPassword('Robodeled10.');

      if (!AuthService.verifyPassword(currentPassword, currentHash)) {
        res.status(401).json({ error: 'Senha atual incorreta.' });
        return;
      }

      const newHash = AuthService.hashPassword(newPassword);
      CompanyRepository.update({ admin_password_hash: newHash });

      res.json({ success: true, message: 'Senha alterada com sucesso!' });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao alterar senha.' });
    }
  },
};
