import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome completo.'),
  email: z.string().trim().toLowerCase().email('E-mail inválido.'),
  password: z.string().min(6, 'A senha precisa ter pelo menos 6 caracteres.'),
  role: z.enum(['admin', 'terapeuta', 'paciente']),
  avatar: z.string().url().optional(),
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
