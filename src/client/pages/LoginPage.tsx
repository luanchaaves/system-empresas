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

  useEffect(() => {
    const allowedEmail = authConfig?.allowed_email || 'roboledpartner@gmail.com';
    setEmail(allowedEmail);

    const clientId = authConfig?.google_client_id;
    if (!clientId) return;

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
        theme: 'outline',
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
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden font-sans bg-[#f2f5fb]">
      {/* Background Soft Mesh Glow */}
      <div className="absolute top-12 left-1/4 w-96 h-96 rounded-full bg-purple-200/50 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-12 right-1/4 w-96 h-96 rounded-full bg-indigo-200/50 blur-[100px] pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md relative z-10 animate-fadeIn">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-clean-lg">
          
          {/* Logo & Brand Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-500 shadow-primary-glow mb-3">
              <img
                src="/assets/branding/logo.png"
                alt="Robô LED Partner"
                className="w-12 h-12 object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Robô LED Partner
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Painel de Gestão Operacional & Inteligência de Eventos
            </p>
          </div>

          {/* Security Badge */}
          <div className="mb-6 p-3 rounded-2xl bg-purple-50 border border-purple-100 flex items-center gap-2.5 text-xs text-primary-700">
            <ShieldCheck className="w-4 h-4 text-primary-600 shrink-0" />
            <div className="leading-tight">
              <span className="font-bold block text-slate-800">Acesso Exclusivo e Protegido</span>
              <span className="text-[11px] text-slate-500 font-mono">
                {authConfig?.allowed_email || 'roboledpartner@gmail.com'}
              </span>
            </div>
          </div>

          {/* Error Message Box */}
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{error}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>E-mail do Administrador</span>
                <span className="text-[10px] text-primary-600 font-bold">Conta Autorizada</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  readOnly
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-600 font-mono cursor-not-allowed select-none focus:outline-none"
                  placeholder="roboledpartner@gmail.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Senha de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha..."
                  autoFocus
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-purple-100 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 shadow-primary-glow active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
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

          {/* Google Sign-in Option */}
          {authConfig?.google_client_id && (
            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <span className="text-[11px] text-slate-400 font-medium block mb-3">
                Ou acesse com 1 clique usando o Google:
              </span>
              <div ref={googleBtnRef} className="flex justify-center min-h-[44px]" />
            </div>
          )}

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 leading-tight">
              Robô LED Partner • Sistema de Gestão Pro v2.0
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
