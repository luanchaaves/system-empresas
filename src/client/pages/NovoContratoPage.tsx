import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  User,
  Calendar,
  DollarSign,
  Bot,
  Users,
  Eye,
  CheckCircle2,
  AlertCircle,
  Download,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  FileCheck2,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../api/index.js';
import { useToast } from '../context/ToastContext.js';
import { CreateContractDTO, AttractionType, Client } from '../../types/index.js';
import { isValidCPF, cleanCPF, formatCPF, generateCPF } from '../../domain/cpf.js';
import { calculatePaymentSplit, formatCurrencyBRL, calculateEndTime, formatDurationText } from '../../domain/calculations.js';

interface NovoContratoPageProps {
  onContractCreated: (contractId: number) => void;
}

export const NovoContratoPage: React.FC<NovoContratoPageProps> = ({ onContractCreated }) => {
  const { success, error } = useToast();

  // Wizard Step (1: Atração & Cliente, 2: Evento & Financeiro, 3: Prévia & Emitir)
  const [step, setStep] = useState<number>(1);

  // Form Fields
  const [tipo, setTipo] = useState<AttractionType>('ROBO_LED');
  const [personagem, setPersonagem] = useState<string>('');
  const [quantidadePersonagens, setQuantidadePersonagens] = useState<number>(1);

  // Cliente
  const [clienteNome, setClienteNome] = useState<string>('');
  const [clienteCpf, setClienteCpf] = useState<string>('');
  const [clienteEndereco, setClienteEndereco] = useState<string>('');
  const [clienteTelefone, setClienteTelefone] = useState<string>('');
  const [clienteEmail, setClienteEmail] = useState<string>('');

  // Evento
  const [eventoData, setEventoData] = useState<string>('');
  const [eventoHorario, setEventoHorario] = useState<string>('20:00');
  const [eventoDuracao, setEventoDuracao] = useState<number>(1); // padrão 1 hora
  const [eventoEndereco, setEventoEndereco] = useState<string>('');
  const [eventoObservacoes, setEventoObservacoes] = useState<string>('');

  // Financeiro & Opções
  const [valorTotalStr, setValorTotalStr] = useState<string>('1500');
  const [usoImagem, setUsoImagem] = useState<boolean>(true);

  // Autocomplete Clientes
  const [existingClients, setExistingClients] = useState<Client[]>([]);

  // Preview State
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdContractResult, setCreatedContractResult] = useState<{ id: number; numero: string; pdf_path: string } | null>(null);

  useEffect(() => {
    // Carrega clientes para auxílio de preenchimento
    api.getClients()
      .then((cls) => setExistingClients(cls))
      .catch((e) => console.warn('Não foi possível carregar lista de clientes para autocomplete:', e));
  }, []);

  // Cálculos dinâmicos em tempo real
  const valorTotalNum = useMemo(() => {
    const clean = valorTotalStr.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  }, [valorTotalStr]);

  const paymentSplit = useMemo(() => {
    return calculatePaymentSplit(valorTotalNum);
  }, [valorTotalNum]);

  const calculatedEndTime = useMemo(() => {
    return calculateEndTime(eventoHorario, eventoDuracao);
  }, [eventoHorario, eventoDuracao]);

  const isCpfValid = useMemo(() => {
    if (!clienteCpf) return false;
    return isValidCPF(clienteCpf);
  }, [clienteCpf]);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatCPF(raw);
    setClienteCpf(formatted);

    // Auto-preenche se o CPF já existir no banco
    const cleaned = cleanCPF(raw);
    if (cleaned.length === 11) {
      const found = existingClients.find((c) => cleanCPF(c.cpf) === cleaned);
      if (found) {
        setClienteNome(found.nome);
        setClienteEndereco(found.endereco || '');
        setClienteTelefone(found.telefone || '');
        setClienteEmail(found.email || '');
      }
    }
  };

  // Helper para construir DTO atual
  const buildDTO = (): CreateContractDTO => {
    return {
      tipo,
      personagem: tipo === 'PERSONAGEM' ? personagem : undefined,
      quantidade_personagens: tipo === 'PERSONAGEM' ? quantidadePersonagens : undefined,
      cliente_nome: clienteNome.trim(),
      cliente_cpf: clienteCpf.trim(),
      cliente_endereco: clienteEndereco.trim(),
      cliente_telefone: clienteTelefone.trim() || undefined,
      cliente_email: clienteEmail.trim() || undefined,
      evento_data: eventoData,
      evento_horario: eventoHorario,
      evento_duracao: eventoDuracao,
      evento_endereco: eventoEndereco.trim(),
      evento_observacoes: eventoObservacoes.trim() || undefined,
      valor_total: valorTotalNum,
      uso_imagem: usoImagem,
    };
  };

  // Atualiza pré-visualização quando entra no step 3
  const updatePreview = async () => {
    setIsLoadingPreview(true);
    try {
      const dto = buildDTO();
      const res = await api.previewContract(dto);
      setPreviewHtml(res.html);
    } catch (err: any) {
      console.error('Erro ao renderizar prévia:', err);
      setPreviewHtml(`<div style="color:red;padding:20px;font-family:sans-serif;">Erro ao carregar prévia: ${err.message}</div>`);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  useEffect(() => {
    if (step === 3) {
      updatePreview();
    }
  }, [step]);

  const validateStep1 = (): boolean => {
    if (!clienteNome.trim()) {
      error('Campo Obrigatório', 'Por favor informe o Nome Completo do contratante.');
      return false;
    }
    if (!clienteCpf.trim()) {
      error('Campo Obrigatório', 'Por favor informe o CPF do contratante.');
      return false;
    }
    if (!isCpfValid) {
      error('CPF Inválido', 'O CPF informado não possui dígitos verificadores válidos. Você pode usar o botão "Gerar CPF Válido" se necessário.');
      return false;
    }
    if (!clienteEndereco.trim()) {
      error('Campo Obrigatório', 'Por favor informe o Endereço do cliente para o contrato.');
      return false;
    }
    if (tipo === 'PERSONAGEM' && !personagem.trim()) {
      error('Atração Incompleta', 'Por favor especifique o nome do Personagem.');
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!eventoData) {
      error('Campo Obrigatório', 'Por favor selecione a Data do Evento.');
      return false;
    }
    if (!eventoHorario) {
      error('Campo Obrigatório', 'Por favor selecione o Horário de Início do Evento.');
      return false;
    }
    if (!eventoEndereco.trim()) {
      error('Campo Obrigatório', 'Por favor informe o Local/Endereço onde ocorrerá o evento.');
      return false;
    }
    if (valorTotalNum <= 0) {
      error('Valor Inválido', 'O valor cobrado deve ser maior que zero.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2()) return;

    setIsSubmitting(true);
    try {
      const dto = buildDTO();
      const contract = await api.createContract(dto);
      success('Contrato Criado com Sucesso!', `Contrato ${contract.numero} gerado e salvo no histórico.`);
      setCreatedContractResult({
        id: contract.id,
        numero: contract.numero,
        pdf_path: contract.pdf_path,
      });
    } catch (err: any) {
      console.error('Erro ao gerar contrato:', err);
      error('Não foi possível gerar o contrato', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setCreatedContractResult(null);
    setClienteNome('');
    setClienteCpf('');
    setClienteEndereco('');
    setClienteTelefone('');
    setClienteEmail('');
    setEventoData('');
    setEventoEndereco('');
    setEventoObservacoes('');
    setPersonagem('');
    setValorTotalStr('1500');
  };

  // Se o contrato foi criado com sucesso, exibe o cartão de conclusão
  if (createdContractResult) {
    return (
      <div className="max-w-3xl mx-auto p-8 my-8">
        <div className="bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Sucesso
          </span>

          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-3">Contrato Gerado com Sucesso!</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            O documento oficial foi compilado, assinado e registrado com o identificador único:
          </p>

          <div className="my-6 p-4 rounded-2xl bg-purple-50 dark:bg-slate-800 border border-purple-200 dark:border-purple-800 max-w-sm mx-auto font-mono text-xl font-black text-primary-600 dark:text-primary-400 tracking-wider">
            {createdContractResult.numero}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            <a
              href={api.getContractPdfUrl(createdContractResult.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 hover:opacity-95 text-white font-bold text-sm shadow-primary-glow transition-all hover:scale-105"
            >
              <Download className="w-4 h-4" />
              Baixar / Visualizar PDF
            </a>

            <button
              onClick={() => onContractCreated(createdContractResult.id)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-sm border border-slate-200 dark:border-slate-700 transition-all"
            >
              <FileCheck2 className="w-4 h-4" />
              Ver no Histórico
            </button>

            <button
              onClick={resetForm}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-sm border border-slate-200 dark:border-slate-700 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Criar Outro Contrato
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* Progress Steps Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-clean rounded-2xl p-3 sm:p-4 flex items-center justify-between overflow-x-auto gap-2">
        {[
          { num: 1, label: 'Atração & Cliente', icon: User },
          { num: 2, label: 'Evento & Financeiro', icon: Calendar },
          { num: 3, label: 'Revisão & PDF', icon: Eye },
        ].map((s, idx) => {
          const Icon = s.icon;
          const isActive = step === s.num;
          const isDone = step > s.num;

          return (
            <React.Fragment key={s.num}>
              <div
                onClick={() => {
                  if (s.num < step) setStep(s.num);
                }}
                className={`flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0 ${
                  isActive
                    ? 'text-primary-600 dark:text-primary-400 font-bold'
                    : isDone
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'text-slate-400 font-medium'
                }`}
              >
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-br from-primary-600 to-purple-600 text-white shadow-primary-glow scale-105'
                      : isDone
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-[9px] sm:text-[10px] uppercase tracking-wider opacity-70">Passo 0{s.num}</div>
                  <div className="text-xs font-semibold hidden sm:block">{s.label}</div>
                </div>
              </div>

              {idx < 2 && (
                <div
                  className={`flex-1 min-w-[20px] h-0.5 mx-2 sm:mx-4 transition-colors ${
                    step > idx + 1 ? 'bg-emerald-500/50' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* STEP 1: Atração & Dados do Cliente */}
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Card Tipo de Atração */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-clean rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" /> Escolha a Atração
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                O modelo oficial de contrato correspondente será selecionado automaticamente.
              </p>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTipo('ROBO_LED')}
                  className={`w-full p-4 rounded-xl border text-left transition-all flex items-center gap-4 ${
                    tipo === 'ROBO_LED'
                      ? 'bg-purple-50/80 dark:bg-purple-950/40 border-primary-500 ring-2 ring-primary-500/20 text-slate-900 dark:text-white shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`p-3 rounded-xl ${
                      tipo === 'ROBO_LED'
                        ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm">Robô LED</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Apresentação com operador, lasers & efeitos
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTipo('PERSONAGEM')}
                  className={`w-full p-4 rounded-xl border text-left transition-all flex items-center gap-4 ${
                    tipo === 'PERSONAGEM'
                      ? 'bg-pink-50/80 dark:bg-pink-950/40 border-pink-500 ring-2 ring-pink-500/20 text-slate-900 dark:text-white shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`p-3 rounded-xl ${
                      tipo === 'PERSONAGEM'
                        ? 'bg-pink-600 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm">Personagens Vivos</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Cosplay / Figurinos artísticos & animação
                    </div>
                  </div>
                </button>
              </div>

              {/* Se Personagens selecionado: Campo Qual Personagem */}
              {tipo === 'PERSONAGEM' && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-in fade-in">
                  <div>
                    <label className="input-label">
                      Qual Personagem? <span className="text-primary-600">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Homem-Aranha, Mickey, La Casa de Papel..."
                      value={personagem}
                      onChange={(e) => setPersonagem(e.target.value)}
                      className="input-clean"
                    />
                  </div>

                  <div>
                    <label className="input-label">
                      Quantidade de Personagens
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={quantidadePersonagens}
                      onChange={(e) => setQuantidadePersonagens(parseInt(e.target.value, 10) || 1)}
                      className="input-clean"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dados do Cliente */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-clean rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-primary-600 dark:text-primary-400" /> Dados do Contratante (Cliente)
                </h3>
                {existingClients.length > 0 && (
                  <span className="text-[11px] text-slate-400">
                    {existingClients.length} clientes na base
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nome Completo */}
                <div className="md:col-span-2">
                  <label className="input-label">
                    Nome Completo <span className="text-primary-600">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Maria da Silva"
                    value={clienteNome}
                    onChange={(e) => setClienteNome(e.target.value)}
                    className="input-clean"
                  />
                </div>

                {/* CPF com validação oficial */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                      CPF <span className="text-primary-600">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const newCpf = generateCPF();
                        setClienteCpf(newCpf);
                      }}
                      className="text-[10px] text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 font-bold"
                    >
                      <Sparkles className="w-3 h-3" /> Gerar CPF Válido
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      value={clienteCpf}
                      onChange={handleCpfChange}
                      className={`input-clean font-mono ${
                        clienteCpf.length === 14
                          ? isCpfValid
                            ? 'border-emerald-500 focus:border-emerald-500'
                            : 'border-rose-500 focus:border-rose-500'
                          : ''
                      }`}
                    />
                    {clienteCpf.length === 14 && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs">
                        {isCpfValid ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {clienteCpf.length === 14 && !isCpfValid && (
                    <p className="text-[10px] text-rose-500 mt-1">Dígitos verificadores de CPF inválidos.</p>
                  )}
                </div>

                {/* Telefone / WhatsApp */}
                <div>
                  <label className="input-label">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="(11) 99999-9999"
                    value={clienteTelefone}
                    onChange={(e) => setClienteTelefone(e.target.value)}
                    className="input-clean"
                  />
                </div>

                {/* Endereço Completo do Cliente */}
                <div className="md:col-span-2">
                  <label className="input-label">
                    Endereço Completo do Cliente <span className="text-primary-600">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Rua, número, complemento, bairro, cidade - UF, CEP"
                    value={clienteEndereco}
                    onChange={(e) => setClienteEndereco(e.target.value)}
                    className="input-clean"
                  />
                </div>

                {/* E-mail (Opcional) */}
                <div className="md:col-span-2">
                  <label className="input-label">
                    E-mail do Cliente (Opcional)
                  </label>
                  <input
                    type="email"
                    placeholder="cliente@exemplo.com"
                    value={clienteEmail}
                    onChange={(e) => setClienteEmail(e.target.value)}
                    className="input-clean"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 via-purple-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs tracking-wide shadow-primary-glow transition-all hover:scale-105 active:scale-95"
              >
                Próximo: Evento & Financeiro <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Dados do Evento, Financeiro e Imagem */}
      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Dados do Evento */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-clean rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary-600 dark:text-primary-400" /> Dados do Evento
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Data do Evento */}
              <div>
                <label className="input-label">
                  Data do Evento <span className="text-primary-600">*</span>
                </label>
                <input
                  type="date"
                  value={eventoData}
                  onChange={(e) => setEventoData(e.target.value)}
                  className="input-clean"
                />
              </div>

              {/* Horário de Início */}
              <div>
                <label className="input-label">
                  Horário de Início <span className="text-primary-600">*</span>
                </label>
                <input
                  type="time"
                  value={eventoHorario}
                  onChange={(e) => setEventoHorario(e.target.value)}
                  className="input-clean"
                />
              </div>

              {/* Duração em Horas */}
              <div>
                <label className="input-label">
                  Duração da Apresentação
                </label>
                <select
                  value={eventoDuracao}
                  onChange={(e) => setEventoDuracao(parseFloat(e.target.value))}
                  className="input-clean"
                >
                  <option value={0.75}>45 minutos</option>
                  <option value={1}>1 hora</option>
                  <option value={1.5}>1 hora e 30 minutos (1,5h)</option>
                  <option value={2}>2 horas</option>
                  <option value={2.5}>2 horas e 30 minutos (2,5h)</option>
                  <option value={3}>3 horas</option>
                  <option value={4}>4 horas</option>
                </select>
              </div>

              {/* Horário de Término Calculado */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">
                  Término Previsto (Automático)
                </label>
                <div className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-mono flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                  {calculatedEndTime || '--:--'} ({formatDurationText(eventoDuracao)})
                </div>
              </div>

              {/* Endereço / Local do Evento */}
              <div className="md:col-span-2">
                <label className="input-label">
                  Endereço / Local do Evento <span className="text-primary-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Espaço Aricanduva, Av. Aricanduva 5426, Buffet XYZ..."
                  value={eventoEndereco}
                  onChange={(e) => setEventoEndereco(e.target.value)}
                  className="input-clean"
                />
              </div>

              {/* Observações */}
              <div className="md:col-span-2">
                <label className="input-label">
                  Observações do Evento
                </label>
                <textarea
                  rows={2}
                  placeholder="Informações adicionais para a apresentação (ex: momento da entrada, local de montagem...)"
                  value={eventoObservacoes}
                  onChange={(e) => setEventoObservacoes(e.target.value)}
                  className="input-clean resize-none"
                />
              </div>
            </div>
          </div>

          {/* Financeiro & Uso de Imagem */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-clean rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" /> Condições Comerciais & Pagamento
              </h3>

              {/* Valor Cobrado */}
              <div>
                <label className="input-label">
                  Valor Cobrado (R$) <span className="text-primary-600">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    R$
                  </span>
                  <input
                    type="text"
                    value={valorTotalStr}
                    onChange={(e) => setValorTotalStr(e.target.value)}
                    placeholder="1500,00"
                    className="input-clean pl-10 text-sm font-bold"
                  />
                </div>
              </div>

              {/* Breakdown 40% e 60% */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Divisão de Pagamento Contratual:
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">
                      Entrada (40% na Assinatura)
                    </div>
                    <div className="text-base font-extrabold text-primary-600 dark:text-primary-400 mt-0.5">
                      {formatCurrencyBRL(paymentSplit.valorEntrada, true)}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">
                      Restante (60% no Evento)
                    </div>
                    <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {formatCurrencyBRL(paymentSplit.valorRestante, true)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Opção Uso de Imagem */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <label className="input-label flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-primary-600 dark:text-primary-400" /> Autorização de Uso de Imagem
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUsoImagem(true)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      usoImagem
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <div className="text-xs">✓ Autorizado</div>
                    <div className="text-[10px] opacity-70 mt-0.5">Permite fotos de divulgação</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUsoImagem(false)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      !usoImagem
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-300 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <div className="text-xs">✕ Não Autorizado</div>
                    <div className="text-[10px] opacity-70 mt-0.5">Cláusula restritiva</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Step Navigation Buttons */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-all"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 via-purple-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs tracking-wide shadow-primary-glow transition-all hover:scale-105 active:scale-95"
              >
                Revisar & Prévia do Contrato <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Revisão & Pré-visualização do Contrato */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sumário de Revisão Lateral */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-clean rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-primary-600 dark:text-primary-400" /> Resumo do Contrato
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Atração</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {tipo === 'ROBO_LED' ? 'Robô LED' : `Personagem: ${personagem || 'N/D'} (${quantidadePersonagens}x)`}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Cliente</span>
                    <span className="font-bold text-slate-900 dark:text-white block">{clienteNome}</span>
                    <span className="text-slate-400 text-[11px] block">{clienteCpf}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Data & Horário</span>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {eventoData ? new Date(eventoData + 'T00:00:00').toLocaleDateString('pt-BR') : ''} às {eventoHorario}
                    </span>
                    <span className="text-slate-400 text-[11px] block">
                      Duração: {formatDurationText(eventoDuracao)} (Término: {calculatedEndTime})
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Condições Financeiras</span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white block">
                      {formatCurrencyBRL(valorTotalNum, true)}
                    </span>
                    <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
                      <span>40% Entrada: {formatCurrencyBRL(paymentSplit.valorEntrada, true)}</span>
                      <span>60% Evento: {formatCurrencyBRL(paymentSplit.valorRestante, true)}</span>
                    </div>
                  </div>
                </div>

                {/* Ações Finais */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm tracking-wide shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Gerando PDF Oficial...
                      </>
                    ) : (
                      <>
                        <FileCheck2 className="w-4 h-4" /> Gerar PDF & Salvar Contrato
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
                  >
                    ← Voltar e Editar Dados
                  </button>
                </div>
              </div>
            </div>

            {/* Visualização da Prévia em Iframe */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-clean rounded-2xl p-4 flex flex-col h-[700px]">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-primary-600 dark:text-primary-400" /> Prévia Visual do Contrato Oficial (A4)
                  </div>
                  <button
                    onClick={updatePreview}
                    disabled={isLoadingPreview}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingPreview ? 'animate-spin' : ''}`} /> Atualizar Prévia
                  </button>
                </div>

                <div className="flex-1 bg-slate-100 dark:bg-slate-950/80 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex justify-center p-2">
                  {isLoadingPreview ? (
                    <div className="flex items-center justify-center text-slate-400 text-xs">
                      Renderizando prévia do contrato...
                    </div>
                  ) : previewHtml ? (
                    <iframe
                      srcDoc={previewHtml}
                      title="Prévia do Contrato"
                      className="w-full max-w-[210mm] h-full bg-white rounded-lg shadow-2xl border-0"
                    />
                  ) : (
                    <div className="flex items-center justify-center text-slate-400 text-xs">
                      Não foi possível carregar a prévia.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
