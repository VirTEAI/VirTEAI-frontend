import { z } from 'zod';

// A tela pública "Cadastrar" não cria mais conta direto — só um pedido
// (ver registration_requests em schema.js), por isso não recebe `role` nem
// `avatar`: o papel é sempre 'terapeuta' (único que alguém de fora pode
// pedir; paciente só é criado por terapeuta/admin, admin não se
// autocadastra) e avatar nunca foi preenchido nesse formulário mesmo.
export const registerRequestSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome completo.'),
  email: z.string().trim().toLowerCase().email('E-mail inválido.'),
  password: z.string().min(6, 'A senha precisa ter pelo menos 6 caracteres.'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido.'),
  password: z.string().min(1, 'Informe a senha.'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido.'),
});

export const verifyResetCodeSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido.'),
  code: z.string().length(5, 'Código precisa ter 5 dígitos.'),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido.'),
  newPassword: z.string().min(6, 'A senha precisa ter pelo menos 6 caracteres.'),
});
