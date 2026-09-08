import React, { useState } from 'react';
import { Modal } from './Modal.js';
import { Download, Printer, ExternalLink, RefreshCw } from 'lucide-react';
import { api } from '../api/index.js';
import { useToast } from '../context/ToastContext.js';

interface ContractPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractId?: number;
  htmlContent?: string;
  contractNumber?: string;
  onRegenerated?: () => void;
}

export const ContractPreviewModal: React.FC<ContractPreviewModalProps> = ({
  isOpen,
  onClose,
  contractId,
  htmlContent,
  contractNumber,
  onRegenerated,
}) => {
  const { success, error } = useToast();
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handlePrint = () => {
    const iframe = document.getElementById('contract-preview-frame') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.print();
    }
  };

  const handleRegenerate = async () => {
    if (!contractId) return;
    setIsRegenerating(true);
    try {
      await api.regeneratePdf(contractId);
      success('PDF atualizado', 'O PDF do contrato foi renderizado novamente com sucesso.');
      if (onRegenerated) onRegenerated();
    } catch (err: any) {
      error('Erro ao gerar novamente', err.message);
    } finally {
      setIsRegenerating(false);
    }
  };

  const iframeSrc = contractId
    ? api.getContractHtmlUrl(contractId)
    : undefined;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Visualização do Contrato ${contractNumber ? `(${contractNumber})` : ''}`}
      size="full"
    >
      <div className="flex flex-col h-[75vh]">
        {/* Actions Bar */}
        <div className="flex items-center justify-between pb-4 mb-3 border-b border-slate-800">
          <div className="text-xs text-slate-400">
            Formato padrão A4 oficial para impressão e envio ao cliente.
          </div>
          <div className="flex items-center gap-2">
            {contractId && (
              <>
                <button
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700 disabled:opacity-50"
                  title="Renderizar PDF novamente com base nos dados atuais"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin text-brand-400' : ''}`} />
                  {isRegenerating ? 'Gerando...' : 'Gerar Novamente'}
                </button>

                <a
                  href={api.getContractPdfUrl(contractId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-600 text-white hover:bg-brand-500 transition-colors shadow-sm shadow-brand-600/30"
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar PDF
                </a>
              </>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir
            </button>
          </div>
        </div>

        {/* Frame Container */}
        <div className="flex-1 bg-slate-950/70 rounded-xl overflow-hidden border border-slate-800 flex justify-center p-4">
          {htmlContent ? (
            <iframe
              id="contract-preview-frame"
              srcDoc={htmlContent}
              title="Prévia do Contrato"
              className="w-full max-w-[210mm] h-full bg-white rounded-lg shadow-2xl border-0"
            />
          ) : iframeSrc ? (
            <iframe
              id="contract-preview-frame"
              src={iframeSrc}
              title="Prévia do Contrato"
              className="w-full max-w-[210mm] h-full bg-white rounded-lg shadow-2xl border-0"
            />
          ) : (
            <div className="flex items-center justify-center text-slate-500">Carregando prévia...</div>
          )}
        </div>
      </div>
    </Modal>
  );
};
