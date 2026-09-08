import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  Save,
  RefreshCw,
  Key,
  Copy,
  CheckCircle2,
  Code2,
  Calendar,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { CompanyConfig } from '../../types/index.js';
import { api } from '../api/index.js';
import { useToast } from '../context/ToastContext.js';

export const ConfiguracoesPage: React.FC = () => {
  const { success, error, info } = useToast();

  const [config, setConfig] = useState<CompanyConfig>({
    id: 1,
    company_name: 'Robo Led Partner',
    responsavel: 'Carlos Henrique Silva',
    documento: '12.345.678/0001-90',
    endereco: 'Av. Paulista, 1500 - Bela Vista',
    cidade: 'São Paulo',
    estado: 'SP',
    telefone: '',
    email: '',
    api_key: 'demo_showcase_key_2026',
    google_calendar_enabled: 1,
    google_calendar_id: 'eventos.agenda.demo@gmail.com',
    google_calendar_credentials: '',
  });

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingGoogle, setIsTestingGoogle] = useState(false);
  const [googleTestResult, setGoogleTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    api
      .getConfig()
      .then((data) => setConfig(data))
      .catch((err) => {
        console.error('Erro ao buscar configurações:', err);
        error('Erro ao carregar', err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await api.updateConfig(config);
      setConfig(updated);
      success(
        'Configurações Salvas!',
        'Os dados institucionais e de integração com o Google Agenda foram atualizados com sucesso.'
      );
    } catch (err: any) {
      error('Erro ao salvar', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestGoogleConnection = async () => {
    setIsTestingGoogle(true);
    setGoogleTestResult(null);
    try {
      const res = await api.testGoogleCalendar();
      setGoogleTestResult(res);
      if (res.success) {
        success('Google Agenda Conectado!', res.message);
      } else {
        info('Aviso de Conexão', res.message);
      }
    } catch (err: any) {
      setGoogleTestResult({ success: false, message: err.message || 'Erro ao testar conexão.' });
      error('Falha no Teste', err.message);
    } finally {
      setIsTestingGoogle(false);
    }
  };

  const handleGenerateKey = async () => {
    if (!confirm('Deseja gerar uma nova Chave de API? A chave anterior deixará de funcionar.')) return;
    try {
      const res = await api.generateApiKey();
      setConfig((prev) => ({ ...prev, api_key: res.api_key }));
      success('Nova API Key Gerada!', 'Copie e salve a nova chave no seu sistema externo.');
    } catch (err: any) {
      error('Erro ao gerar chave', err.message);
    }
  };

  const handleCopyKey = () => {
    if (config.api_key) {
      navigator.clipboard.writeText(config.api_key);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
      success('Chave Copiada!', 'Token copiado para a área de transferência.');
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto flex items-center justify-center py-20 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mr-2 text-brand-400" /> Carregando configurações...
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Notice Card */}
      <div className="card-glass rounded-2xl p-5 border-brand-500/30 flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20 shrink-0">
          <Building2 className="w-5 h-5" />
        </div>
        <div className="text-xs">
          <h4 className="font-bold text-white text-sm">Dados Cadastrais da Contratada</h4>
          <p className="text-slate-400 mt-1">
            Estes dados são preenchidos automaticamente no cabeçalho, caixas de dados, cláusula de foro e campo de assinatura de todos os contratos gerados pelo sistema.
          </p>
        </div>
      </div>

      {/* Form Institucional */}
      <form onSubmit={handleSubmit} className="card-glass rounded-2xl p-6 space-y-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
          <Settings className="w-4 h-4 text-brand-400" /> Informações Institucionais
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          {/* Nome da Empresa */}
          <div>
            <label className="block font-bold text-slate-300 mb-1">
              Nome Fantasia / Empresa <span className="text-brand-400">*</span>
            </label>
            <input
              type="text"
              value={config.company_name}
              onChange={(e) => setConfig({ ...config, company_name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-brand-500"
              required
            />
          </div>

          {/* Responsável Legal */}
          <div>
            <label className="block font-bold text-slate-300 mb-1">
              Responsável Legal <span className="text-brand-400">*</span>
            </label>
            <input
              type="text"
              value={config.responsavel}
              onChange={(e) => setConfig({ ...config, responsavel: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-brand-500"
              required
            />
          </div>

          {/* CNPJ ou Documento */}
          <div>
            <label className="block font-bold text-slate-300 mb-1">
              CNPJ / Documento <span className="text-brand-400">*</span>
            </label>
            <input
              type="text"
              value={config.documento}
              onChange={(e) => setConfig({ ...config, documento: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-800 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-brand-500"
              required
            />
          </div>

          {/* Cidade de Foro e Emissão */}
          <div>
            <label className="block font-bold text-slate-300 mb-1">
              Cidade da Comarca (Foro) <span className="text-brand-400">*</span>
            </label>
            <input
              type="text"
              value={config.cidade}
              onChange={(e) => setConfig({ ...config, cidade: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-brand-500"
              required
            />
          </div>

          {/* Endereço Sede */}
          <div className="md:col-span-2">
            <label className="block font-bold text-slate-300 mb-1">
              Endereço Completo da Sede <span className="text-brand-400">*</span>
            </label>
            <input
              type="text"
              value={config.endereco}
              onChange={(e) => setConfig({ ...config, endereco: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-brand-500"
              required
            />
          </div>

          {/* Telefone / WhatsApp */}
          <div>
            <label className="block font-bold text-slate-300 mb-1">Telefone / WhatsApp</label>
            <input
              type="text"
              value={config.telefone || ''}
              onChange={(e) => setConfig({ ...config, telefone: e.target.value })}
              placeholder="(11) 99999-9999"
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* E-mail Institucional */}
          <div>
            <label className="block font-bold text-slate-300 mb-1">E-mail Institucional</label>
            <input
              type="email"
              value={config.email || ''}
              onChange={(e) => setConfig({ ...config, email: e.target.value })}
              placeholder="eventos.agenda.demo@gmail.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end pt-4 border-t border-slate-800">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-brand-600/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Salvar Configurações
              </>
            )}
          </button>
        </div>
      </form>

      {/* Google Agenda (eventos.agenda.demo@gmail.com) */}
      <div className="card-glass rounded-2xl p-6 space-y-5 border-purple-500/20">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-400" /> Integração com Google Agenda (Google Calendar)
          </h3>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
            eventos.agenda.demo@gmail.com
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Todos os eventos e apresentações cadastrados na plataforma são sincronizados automaticamente com a agenda da <strong>Robô Led Partner</strong> no Google Calendar, incluindo detalhes do cliente, horários, localização com mapa, atrações e valor.
        </p>

        <div className="space-y-4 text-xs">
          {/* Toggle Sincronização */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-dark-800 border border-slate-700/60">
            <div>
              <div className="font-bold text-white">Sincronização Automática com Google Agenda</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Cria e atualiza eventos na agenda de <span className="text-purple-300 font-mono">eventos.agenda.demo@gmail.com</span> ao agendar ou editar.
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(config.google_calendar_enabled)}
                onChange={(e) => setConfig({ ...config, google_calendar_enabled: e.target.checked ? 1 : 0 })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ID da Agenda */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">ID da Agenda do Google (E-mail)</label>
              <input
                type="text"
                value={config.google_calendar_id || 'eventos.agenda.demo@gmail.com'}
                onChange={(e) => setConfig({ ...config, google_calendar_id: e.target.value })}
                placeholder="eventos.agenda.demo@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-dark-800 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Test Connection Button */}
            <div className="flex flex-col justify-end">
              <button
                type="button"
                onClick={handleTestGoogleConnection}
                disabled={isTestingGoogle}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 font-semibold text-xs transition-colors disabled:opacity-50"
              >
                {isTestingGoogle ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Verificando Conexão...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-purple-400" /> Testar Conexão Google Calendar
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Test Feedback Box */}
          {googleTestResult && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 border ${
                googleTestResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              {googleTestResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed">{googleTestResult.message}</div>
            </div>
          )}

          {/* Credentials JSON Info */}
          <div>
            <label className="block font-bold text-slate-300 mb-1">
              Credenciais da Conta de Serviço (JSON do Google Cloud)
            </label>
            <textarea
              rows={3}
              value={config.google_calendar_credentials || ''}
              onChange={(e) => setConfig({ ...config, google_calendar_credentials: e.target.value })}
              placeholder='Cole o conteúdo do arquivo credentials.json (opcional se já colocado na pasta data/google-credentials.json)'
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-800 border border-slate-700 text-slate-300 font-mono text-[11px] focus:outline-none focus:border-purple-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              💡 Dica: Você também pode salvar o arquivo JSON gerado no Google Cloud diretamente como <code className="text-purple-300">data/google-credentials.json</code>. Além da API em background, o sistema gera links diretos para 1-clique adicionar no Google Agenda.
            </p>
          </div>
        </div>
      </div>

      {/* API & Integração Externa */}
      <div className="card-glass rounded-2xl p-6 space-y-5">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
          <Key className="w-4 h-4 text-emerald-400" /> Integração REST API & Webhooks
        </h3>

        <div className="text-xs text-slate-400 leading-relaxed">
          Utilize sua chave de API para integrar sistemas externos (como formulários do WhatsApp, site ou ERP) diretamente a esta instância unificada.
        </div>

        {/* Chave de API Box */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">Chave Secreta de API (Bearer Token)</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3.5 py-2.5 rounded-xl bg-dark-800 border border-slate-700 text-emerald-400 font-mono text-xs font-bold select-all truncate">
              {config.api_key || 'demo_showcase_key_2026'}
            </div>
            <button
              type="button"
              onClick={handleCopyKey}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              title="Copiar Chave"
            >
              {copiedKey ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={handleGenerateKey}
              className="px-4 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 border border-slate-700 text-xs font-semibold text-slate-300 transition-colors"
            >
              Gerar Nova
            </button>
          </div>
        </div>

        {/* Exemplo de Endpoints */}
        <div className="p-4 rounded-xl bg-dark-800/80 border border-slate-700/60 text-xs space-y-3">
          <div className="flex items-center gap-2 font-bold text-white">
            <Code2 className="w-4 h-4 text-brand-400" /> Endpoints Disponíveis para Integração Externa:
          </div>

          <div className="space-y-2 font-mono text-[11px]">
            <div className="p-2 rounded-lg bg-dark-900 border border-slate-800">
              <span className="text-emerald-400 font-bold">POST</span>{' '}
              <span className="text-slate-300">/api/v1/eventos/importar</span>
              <div className="text-[10px] font-sans text-slate-400 mt-0.5">
                Importa cliente, agenda o evento, sincroniza no Google Agenda e opcionalmente gera o Contrato PDF automaticamente.
              </div>
            </div>

            <div className="p-2 rounded-lg bg-dark-900 border border-slate-800">
              <span className="text-emerald-400 font-bold">POST</span>{' '}
              <span className="text-slate-300">/api/v1/financeiro/webhook</span>
              <div className="text-[10px] font-sans text-slate-400 mt-0.5">
                Recebe confirmação de pagamento de gateways externos e liquida a parcela financeira.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
