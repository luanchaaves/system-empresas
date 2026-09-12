import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { apiRouter } from './routes/index.js';
import { initDatabase, closeDatabase } from './db/database.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos da pasta public, assets e data/contracts
app.use('/public', express.static(path.resolve(process.cwd(), 'public')));
app.use('/assets', express.static(path.resolve(process.cwd(), 'public', 'assets')));
app.use('/data/contracts', express.static(path.resolve(process.cwd(), 'data', 'contracts')));

// Rotas da API
app.use('/api', apiRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Servir Frontend SPA compilado (em produção / Homelab / Docker)
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (
      req.path.startsWith('/api') ||
      req.path.startsWith('/data') ||
      req.path.startsWith('/public') ||
      req.path === '/health'
    ) {
      return next();
    }
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      next();
    }
  });
}

// Middleware de tratamento global de erros
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: err?.message || 'Ocorreu um erro interno no servidor.',
  });
});

// Inicialização
initDatabase();

const server = app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`⚡ Servidor Robo Led Partner rodando em http://0.0.0.0:${PORT}`);
});

// Tratamento seguro de desligamento (Proxmox / Docker Graceful Shutdown)
let isShuttingDown = false;
const handleShutdown = (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n🛑 Sinal ${signal} recebido. Encerrando servidor e persistindo banco de dados com segurança...`);

  server.close(() => {
    console.log('🔌 Conexões HTTP finalizadas.');
    closeDatabase();
    process.exit(0);
  });

  // Timeout forçado de segurança caso alguma conexão permaneça aberta
  setTimeout(() => {
    console.warn('⚠️ Tempo limite de encerramento atingido. Forçando persistência e saída.');
    closeDatabase();
    process.exit(0);
  }, 10000).unref();
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGHUP', () => handleShutdown('SIGHUP'));

export default app;

