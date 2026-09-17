import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';

// Armazenamento local em disco — real (não é mock: o arquivo é salvo de
// verdade e servido por este mesmo servidor em /uploads/worlds/...), mas
// simples de propósito. Trocar por um bucket de verdade (S3 etc.) é Fase 7
// (Armazenamento de arquivo real) — a troca fica contida aqui e em
// `fileUrl()` no controller, sem mexer no resto da API.
//
// `UPLOAD_DIR` é configurável via env pelo mesmo motivo do `DATABASE_URL`
// separado em `vitest.config.js`: sem isso, rodar os testes escreveria
// arquivos de verdade dentro da pasta de uploads de desenvolvimento.
export const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(process.cwd(), 'uploads', 'worlds');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  if (!file.mimetype.startsWith('image/')) {
    cb(new Error('Envie apenas arquivos de imagem.'));
    return;
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB por imagem
});

// "Foto 1" (thumbnail, mostrada nos cards) e "Foto 2" (gallery, mostrada na
// tela cheia do mundo) — os mesmos dois slots do `VincularMundoModal.jsx`.
const uploadWorldFields = upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'gallery', maxCount: 1 },
]);

// Envolve o multer pra transformar os erros dele (arquivo grande demais,
// tipo errado) numa resposta 400 amigável em vez de estourar pro
// error-handler genérico (que responderia 500).
export function uploadWorldImages(req, res, next) {
  uploadWorldFields(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Cada imagem pode ter no máximo 8MB.' });
    }
    return res.status(400).json({ error: err.message || 'Não foi possível processar as imagens.' });
  });
}
