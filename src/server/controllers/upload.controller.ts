import { Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { EventRepository } from '../db/database.js';

export const UploadController = {
  /**
   * POST /api/upload
   * Recebe payload com base64 ou dataURL e salva na pasta public/uploads
   */
  async upload(req: Request, res: Response): Promise<void> {
    try {
      const { filename, base64, dataUrl } = req.body;

      let fileBuffer: Buffer | null = null;
      let extension = 'png';
      let originalName = 'upload';

      if (dataUrl && typeof dataUrl === 'string') {
        const matches = dataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mime = matches[1];
          const rawB64 = matches[2];
          fileBuffer = Buffer.from(rawB64, 'base64');
          if (mime.includes('jpeg') || mime.includes('jpg')) extension = 'jpg';
          else if (mime.includes('png')) extension = 'png';
          else if (mime.includes('webp')) extension = 'webp';
          else if (mime.includes('pdf')) extension = 'pdf';
        }
      } else if (base64 && typeof base64 === 'string') {
        const cleanB64 = base64.replace(/^data:[^;]+;base64,/, '');
        fileBuffer = Buffer.from(cleanB64, 'base64');
      }

      if (filename && typeof filename === 'string') {
        const parsed = path.parse(filename);
        originalName = parsed.name.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
        if (parsed.ext) {
          extension = parsed.ext.replace('.', '').toLowerCase();
        }
      }

      if (!fileBuffer || fileBuffer.length === 0) {
        res.status(400).json({ error: 'Nenhum arquivo ou base64 fornecido para upload.' });
        return;
      }

      const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const uniqueSuffix = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const finalFileName = `${originalName}_${uniqueSuffix}.${extension}`;
      const targetFilePath = path.join(uploadsDir, finalFileName);

      fs.writeFileSync(targetFilePath, fileBuffer);

      const publicUrl = `/uploads/${finalFileName}`;

      res.status(201).json({
        success: true,
        url: publicUrl,
        filename: finalFileName,
        size: fileBuffer.length,
        originalName: filename || finalFileName,
      });
    } catch (err: any) {
      console.error('Erro no upload de arquivo:', err);
      res.status(500).json({ error: err.message || 'Erro ao processar upload.' });
    }
  },

  /**
   * PUT /api/lojas/detalhes
   * Atualiza a foto principal da loja ou anexos em todos os eventos daquela loja
   */
  async updateStoreDetails(req: Request, res: Response): Promise<void> {
    try {
      const { loja_unidade, foto_loja_url, anexos } = req.body;
      if (!loja_unidade || !loja_unidade.trim()) {
        res.status(400).json({ error: 'Nome da loja/unidade é obrigatório.' });
        return;
      }

      EventRepository.updateStoreDetails(loja_unidade, {
        foto_loja_url,
        anexos,
      });

      res.json({
        success: true,
        message: `Dados da loja "${loja_unidade}" atualizados com sucesso.`,
      });
    } catch (err: any) {
      console.error('Erro ao atualizar dados da loja:', err);
      res.status(500).json({ error: err.message || 'Erro ao atualizar dados da loja.' });
    }
  },
};
