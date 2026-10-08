import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

declare global {
  interface Window {
    google?: any;
  }
}

export const LoginPage: React.FC = () => {
  const { loginWithCredentials, loginWithGoogle, authConfig } = useAuth();
  const [email, setEmail] = useState<string>('roboledpartner@gmail.com');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Inicializa o Google Identity Services (GIS) se houver Client ID ou script disponível
  useEffect(() => {
    const allowedEmail = authConfig?.allowed_email || 'roboledpartner@gmail.com';
    setEmail(allowedEmail);

    const clientId = authConfig?.google_client_id;
    if (!clientId) return;

    // Carrega o script oficial do Google Sign-In se ainda não existir
    if (!document.getElementById('google-client-script')) {
      const script = document.createElement('script');
      script.id = 'google-client-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initGoogleButton(clientId);
      };
      document.body.appendChild(script);
    } else if (window.google) {
      initGoogleButton(clientId);
    }
  }, [authConfig]);

  const initGoogleButton = (clientId: string) => {
    if (!window.google?.accounts?.id || !googleBtnRef.current) return;

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: any) => {
          if (response.credential) {
            setLoading(true);
            setError(null);
            try {
              await loginWithGoogle(response.credential);
            } catch (err: any) {
              setError(err.message || 'Falha ao autenticar com a conta Google.');
            } finally {
              setLoading(false);
            }
          }
        },
        auto_select: false,
      });

      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'filled_black',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        locale: 'pt-BR',
        width: 320,
      });
    } catch (err) {
      console.warn('Erro ao inicializar botão Google:', err);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Por favor, digite a sua senha.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await loginWithCredentials(password, email);
    } catch (err: any) {
      setError(err.message || 'Credenciais inválidas. Verifique seu e-mail e senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#07090e] text-slate-100 p-4 relative overflow-hidden font-sans">
      {/* Background Cyber Glow & Geometric Shapes */}
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-600/15 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1e1e38_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md relative z-10 animate-fadeIn">
        <div className="card-glass rounded-3xl p-6 sm:p-8 border border-slate-800/80 shadow-2xl backdrop-blur-2xl bg-dark-900/80">
          
          {/* Logo & Brand Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-dark-950/80 border border-brand-500/30 shadow-[0_0_30px_rgba(236,72,153,0.3)] mb-3 group">
              <img
                src="/assets/branding/logo.png"
                alt="Robo Led Partner"
                className="w-16 h-16 object-contain group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
              Robo Led Partner
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Painel de Gestão Operacional & Inteligência de Eventos
            </p>
          </div>

          {/* Security Badge */}
          <div className="mb-6 p-3 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center gap-2.5 text-xs text-brand-300">
            <ShieldCheck className="w-4 h-4 text-brand-400 shrink-0" />
            <div className="leading-tight">
              <span className="font-semibold block text-white">Acesso Exclusivo e Protegido</span>
              <span className="text-[11px] text-brand-300/80 font-mono">
                {authConfig?.allowed_email || 'roboledpartner@gmail.com'}
              </span>
            </div>
          </div>

          {/* Error Message Box */}
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{error}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>E-mail do Administrador</span>
                <span className="text-[10px] text-brand-400 font-mono">Conta Autorizada</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  readOnly
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-dark-950/70 border border-slate-800 text-slate-300 font-mono cursor-not-allowed select-none focus:outline-none"
                  placeholder="roboledpartner@gmail.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Senha de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha..."
                  autoFocus
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-dark-950 border border-slate-700/80 text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-gradient-to-r from-brand-600 via-brand-500 to-purple-600 hover:from-brand-500 hover:to-purple-500 shadow-lg shadow-brand-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Google Sign-in Option (se configurado ou disponível) */}
          {authConfig?.google_client_id && (
            <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
              <span className="text-[11px] text-slate-400 font-medium block mb-3">
                Ou acesse com 1 clique usando o Google:
              </span>
              <div ref={googleBtnRef} className="flex justify-center min-h-[44px]" />
            </div>
          )}

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-slate-800/50 text-center">
            <p className="text-[10px] text-slate-400 leading-tight">
              Robo Led Partner • Sistema Operacional v2.0
              <br />
              Ambiente de Produção Homelab & Proxmox Protegido
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
