import React from 'react';
import { AttractionType, ContractStatus } from '../../types/index.js';

interface StatusBadgeProps {
  status: ContractStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'GERADO':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
          Gerado
        </span>
      );
    case 'FINALIZADO':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
          Finalizado
        </span>
      );
    case 'RASCUNHO':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          Rascunho
        </span>
      );
    case 'CANCELADO':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          Cancelado
        </span>
      );
    default:
      return null;
  }
};

interface AttractionBadgeProps {
  tipo: AttractionType;
  personagem?: string;
  quantidade?: number;
}

export const AttractionBadge: React.FC<AttractionBadgeProps> = ({ tipo, personagem, quantidade }) => {
  if (tipo === 'ROBO_LED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-brand-900/40 to-purple-900/40 text-brand-300 border border-brand-600/30">
        <span className="w-2 h-2 rounded-sm bg-brand-500 shadow-sm shadow-brand-400"></span>
        Robô LED
      </span>
    );
  }

  const label = personagem ? `${personagem}${quantidade && quantidade > 1 ? ` (${quantidade}x)` : ''}` : 'Personagens';

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-purple-950/40 text-purple-300 border border-purple-500/30">
      <span className="w-2 h-2 rounded-full bg-purple-400 shadow-sm shadow-purple-300"></span>
      {label}
    </span>
  );
};
