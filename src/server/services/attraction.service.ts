import { AttractionRepository } from '../db/database.js';
import { Attraction, CreateAttractionDTO, UpdateAttractionDTO, AttractionCategory } from '../../types/index.js';

export const AttractionService = {
  list(category?: AttractionCategory, onlyActive = false): Attraction[] {
    return AttractionRepository.list(category, onlyActive);
  },

  getById(id: number): Attraction {
    const attraction = AttractionRepository.findById(id);
    if (!attraction) {
      throw new Error(`Atração com ID ${id} não encontrada.`);
    }
    return attraction;
  },

  create(data: CreateAttractionDTO): Attraction {
    if (!data.nome || !data.nome.trim()) {
      throw new Error('O nome da atração é obrigatório.');
    }
    return AttractionRepository.create({
      nome: data.nome.trim(),
      categoria: data.categoria || 'ROBO_LED',
      descricao: data.descricao?.trim(),
      valor_base: Number(data.valor_base) || 0,
      ativo: data.ativo !== false ? 1 : 0,
      foto_url: data.foto_url?.trim(),
    });
  },

  update(id: number, data: UpdateAttractionDTO): Attraction {
    this.getById(id);
    return AttractionRepository.update(id, {
      ...data,
      nome: data.nome?.trim(),
      descricao: data.descricao?.trim(),
      valor_base: data.valor_base !== undefined ? Number(data.valor_base) : undefined,
      ativo: data.ativo !== undefined ? (data.ativo ? 1 : 0) : undefined,
    });
  },

  delete(id: number): boolean {
    return AttractionRepository.delete(id);
  },
};
