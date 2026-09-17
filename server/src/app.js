import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import patientsRoutes from './routes/patients.routes.js';
import codesRoutes from './routes/codes.routes.js';
import worldsRoutes from './routes/worlds.routes.js';
import sessionsRoutes from './routes/sessions.routes.js';
import { errorHandler } from './middleware/error-handler.js';
import { UPLOAD_DIR } from './middleware/upload.js';

// CLIENT_ORIGIN aceita uma ou várias origens separadas por vírgula (ex.:
// "https://virteai.vercel.app,https://virteai-git-main.vercel.app") — em
// produção normalmente tem pelo menos a URL de produção do Vercel e a URL
// de preview do branch atual. `origin: true` faria o mesmo pra qualquer
// site (inseguro com `credentials: true`), então a lista é sempre explícita.
function parseAllowedOrigins() {
  const raw = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

export function createApp() {
  const app = express();

  // Necessário pro Express reconhecer corretamente `req.protocol`/`req.secure`
  // atrás do proxy reverso do Render (e de qualquer outro host atrás de
  // load balancer) — sem isso, checagens de HTTPS podem se comportar como
  // se a conexão fosse HTTP mesmo em produção.
  app.set('trust proxy', 1);

  const allowedOrigins = parseAllowedOrigins();
  app.use(
    cors({
      origin(origin, callback) {
        // Sem `Origin` (ex.: curl, health check) — libera; não é uma
        // requisição de navegador então a checagem de CORS não se aplica.
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Origem não permitida: ${origin}`));
      },
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  // Imagens de mundo enviadas via POST/PATCH /api/worlds (multer) — servidas
  // direto por este servidor (armazenamento local; ver comentário em
  // middleware/upload.js sobre a troca futura pra um bucket de verdade).
  // Serve a partir do mesmo UPLOAD_DIR que o multer usa pra salvar (isolado
  // em teste via env), não um caminho fixo — senão os testes de upload
  // gravam num lugar e o servidor tenta servir de outro.
  app.use('/uploads/worlds', express.static(UPLOAD_DIR));

  app.get('/api/health', (req, res) => {
    res.json({ ok: true, service: 'virteai-server' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/patients', patientsRoutes);
  app.use('/api/codes', codesRoutes);
  app.use('/api/worlds', worldsRoutes);
  app.use('/api/sessions', sessionsRoutes);

  app.use((req, res) => {
    res.status(404).json({ error: 'Rota não encontrada.' });
  });

  app.use(errorHandler);

  return app;
}
