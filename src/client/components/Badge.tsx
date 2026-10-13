import React from 'react';
import { AttractionType, ContractStatus } from '../../types/index.js';

interface StatusBadgeProps {
  status: ContractStatus | 'AGENDADO' | 'CONFIRMADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'GERADO':
    case 'CONFIRMADO':
    case 'CONCLUIDO':
    case 'FINALIZADO':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
          {status === 'GERADO' ? 'Gerado' : status === 'CONFIRMADO' ? 'Confirmado' : 'Concluído'}
        </span>
      );
    case 'EM_ANDAMENTO':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-1.5 animate-pulse"></span>
          Em Andamento
        </span>
      );
    case 'RASCUNHO':
    case 'AGENDADO':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
          {status === 'RASCUNHO' ? 'Rascunho' : 'Confirmado'}
        </span>
      );
    case 'CANCELADO':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span>
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
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
        <span className="w-2 h-2 rounded-sm bg-purple-600"></span>
        Robô LED
      </span>
    );
  }

  const label = personagem ? `${personagem}${quantidade && quantidade > 1 ? ` (${quantidade}x)` : ''}` : 'Personagens';

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
      <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
      {label}
    </span>
  );
};
