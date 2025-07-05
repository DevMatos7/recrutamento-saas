import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

function logRateLimit(req: Request, res: Response, next: NextFunction) {
  console.log(`[RateLimit] IP: ${req.ip} - Rota: ${req.originalUrl}`);
  next();
}

// Rate limiter para autenticação (login/registro)
export const authLimiter = [
  logRateLimit,
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // máximo 5 tentativas por IP
    message: {
      message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // não conta tentativas bem-sucedidas
  })
];

// Rate limiter para APIs gerais
export const apiLimiter = [
  logRateLimit,
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requisições por IP
    message: {
      message: 'Muitas requisições. Tente novamente em 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  })
];

// Rate limiter para uploads e operações pesadas
export const uploadLimiter = [
  logRateLimit,
  rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 10, // máximo 10 uploads por IP
    message: {
      message: 'Limite de uploads excedido. Tente novamente em 1 hora.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  })
];

// Rate limiter para candidaturas (portal público)
export const candidatePortalLimiter = [
  logRateLimit,
  rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // máximo 3 candidaturas por IP
    message: {
      message: 'Limite de candidaturas excedido. Tente novamente em 1 hora.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  })
]; 