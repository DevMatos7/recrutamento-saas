import { Request, Response, NextFunction } from 'express';

// Exemplo: req.user = { id, role, ... }
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }
  next();
}

export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso não autorizado.' });
    }
    next();
  };
}

// Uso nas rotas:
// app.post('/rota', requireAuth, requireRole(['gestor']), handler) 