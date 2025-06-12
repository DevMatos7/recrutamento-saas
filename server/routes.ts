import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertEmpresaSchema, insertDepartamentoSchema, insertUsuarioSchema, insertVagaSchema } from "@shared/schema";
import { z } from "zod";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Middleware to check authentication
function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

// Middleware to check admin role
function requireAdmin(req: any, res: any, next: any) {
  if (!req.isAuthenticated() || req.user.perfil !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Custom registration endpoint that requires admin
  app.post("/api/register-user", requireAdmin, async (req, res, next) => {
    try {
      const userData = insertUsuarioSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email já está em uso" });
      }

      const hashedPassword = await hashPassword(userData.password);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  // Companies endpoints
  app.get("/api/empresas", requireAuth, async (req, res, next) => {
    try {
      const empresas = await storage.getAllEmpresas();
      res.json(empresas);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/empresas", requireAdmin, async (req, res, next) => {
    try {
      const empresaData = insertEmpresaSchema.parse(req.body);
      const empresa = await storage.createEmpresa(empresaData);
      res.status(201).json(empresa);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  app.get("/api/empresas/:id", requireAuth, async (req, res, next) => {
    try {
      const empresa = await storage.getEmpresa(req.params.id);
      if (!empresa) {
        return res.status(404).json({ message: "Empresa não encontrada" });
      }
      res.json(empresa);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/empresas/:id", requireAdmin, async (req, res, next) => {
    try {
      const empresaData = insertEmpresaSchema.partial().parse(req.body);
      const empresa = await storage.updateEmpresa(req.params.id, empresaData);
      if (!empresa) {
        return res.status(404).json({ message: "Empresa não encontrada" });
      }
      res.json(empresa);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  app.delete("/api/empresas/:id", requireAdmin, async (req, res, next) => {
    try {
      // Check if company has users, departments, or jobs associated
      const empresa = await storage.getEmpresa(req.params.id);
      if (!empresa) {
        return res.status(404).json({ message: "Empresa não encontrada" });
      }

      // Check for users in this company
      const usuarios = await storage.getUsuariosByEmpresa(req.params.id);
      if (usuarios.length > 0) {
        return res.status(400).json({ 
          message: "Não é possível excluir empresa com usuários vinculados" 
        });
      }

      // Check for departments in this company
      const departamentos = await storage.getDepartamentosByEmpresa(req.params.id);
      if (departamentos.length > 0) {
        return res.status(400).json({ 
          message: "Não é possível excluir empresa com departamentos vinculados" 
        });
      }

      // Check for jobs in this company
      const vagas = await storage.getVagasByEmpresa(req.params.id);
      if (vagas.length > 0) {
        return res.status(400).json({ 
          message: "Não é possível excluir empresa com vagas vinculadas" 
        });
      }

      // Check for candidates in this company
      const candidatos = await storage.getCandidatosByEmpresa(req.params.id);
      if (candidatos.length > 0) {
        return res.status(400).json({ 
          message: "Não é possível excluir empresa com candidatos vinculados" 
        });
      }

      const deleted = await storage.deleteEmpresa(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Empresa não encontrada" });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Departments endpoints
  app.get("/api/departamentos", requireAuth, async (req, res, next) => {
    try {
      const { empresaId } = req.query;
      const departamentos = empresaId 
        ? await storage.getDepartamentosByEmpresa(empresaId as string)
        : await storage.getAllDepartamentos();
      res.json(departamentos);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/departamentos", requireAdmin, async (req, res, next) => {
    try {
      const departamentoData = insertDepartamentoSchema.parse(req.body);
      const departamento = await storage.createDepartamento(departamentoData);
      res.status(201).json(departamento);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  app.get("/api/departamentos/:id", requireAuth, async (req, res, next) => {
    try {
      const departamento = await storage.getDepartamento(req.params.id);
      if (!departamento) {
        return res.status(404).json({ message: "Departamento não encontrado" });
      }
      res.json(departamento);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/departamentos/:id", requireAdmin, async (req, res, next) => {
    try {
      const departamentoData = insertDepartamentoSchema.partial().parse(req.body);
      const departamento = await storage.updateDepartamento(req.params.id, departamentoData);
      if (!departamento) {
        return res.status(404).json({ message: "Departamento não encontrado" });
      }
      res.json(departamento);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  app.delete("/api/departamentos/:id", requireAdmin, async (req, res, next) => {
    try {
      // Check if department has users or jobs associated
      const departamento = await storage.getDepartamento(req.params.id);
      if (!departamento) {
        return res.status(404).json({ message: "Departamento não encontrado" });
      }

      // Check for users in this department
      const usuarios = await storage.getUsuariosByEmpresa(departamento.empresaId);
      const usuariosNoDepartamento = usuarios.filter(u => u.departamentoId === req.params.id);
      
      if (usuariosNoDepartamento.length > 0) {
        return res.status(400).json({ 
          message: "Não é possível excluir departamento com usuários vinculados" 
        });
      }

      // Check for jobs in this department
      const vagas = await storage.getVagasByDepartamento(req.params.id);
      if (vagas.length > 0) {
        return res.status(400).json({ 
          message: "Não é possível excluir departamento com vagas vinculadas" 
        });
      }

      const deleted = await storage.deleteDepartamento(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Departamento não encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Users endpoints
  app.get("/api/usuarios", requireAuth, async (req, res, next) => {
    try {
      const { empresaId } = req.query;
      const usuarios = empresaId 
        ? await storage.getUsuariosByEmpresa(empresaId as string)
        : await storage.getAllUsuarios();
      
      // Remove passwords from response
      const usuariosSemSenha = usuarios.map(({ password, ...user }) => user);
      res.json(usuariosSemSenha);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/usuarios/:id", requireAuth, async (req, res, next) => {
    try {
      const usuario = await storage.getUser(req.params.id);
      if (!usuario) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      const { password, ...usuarioSemSenha } = usuario;
      res.json(usuarioSemSenha);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/usuarios/:id", requireAdmin, async (req, res, next) => {
    try {
      const userData = insertUsuarioSchema.partial().parse(req.body);
      
      // Hash password if provided
      if (userData.password) {
        userData.password = await hashPassword(userData.password);
      }
      
      const usuario = await storage.updateUsuario(req.params.id, userData);
      if (!usuario) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      const { password, ...usuarioSemSenha } = usuario;
      res.json(usuarioSemSenha);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  app.delete("/api/usuarios/:id", requireAdmin, async (req, res, next) => {
    try {
      const deleted = await storage.deleteUsuario(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Job management routes
  app.get("/api/vagas", requireAuth, async (req, res, next) => {
    try {
      const { empresaId, departamentoId, status } = req.query;
      let vagas;
      
      if (empresaId) {
        vagas = await storage.getVagasByEmpresa(empresaId as string);
      } else if (departamentoId) {
        vagas = await storage.getVagasByDepartamento(departamentoId as string);
      } else {
        vagas = await storage.getAllVagas();
      }
      
      // Filter by status if provided
      if (status) {
        vagas = vagas.filter(vaga => vaga.status === status);
      }
      
      res.json(vagas);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/vagas/:id", requireAuth, async (req, res, next) => {
    try {
      const vaga = await storage.getVaga(req.params.id);
      if (!vaga) {
        return res.status(404).json({ message: "Vaga não encontrada" });
      }
      res.json(vaga);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/vagas", requireAuth, async (req, res, next) => {
    try {
      // Only admin and recrutador can create jobs
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const vagaData = insertVagaSchema.parse(req.body);
      const vaga = await storage.createVaga(vagaData);
      res.status(201).json(vaga);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  app.put("/api/vagas/:id", requireAuth, async (req, res, next) => {
    try {
      // Only admin and recrutador can edit jobs
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const vagaData = insertVagaSchema.partial().parse(req.body);
      const vaga = await storage.updateVaga(req.params.id, vagaData);
      if (!vaga) {
        return res.status(404).json({ message: "Vaga não encontrada" });
      }
      res.json(vaga);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  app.patch("/api/vagas/:id/encerrar", requireAuth, async (req, res, next) => {
    try {
      // Only admin and recrutador can close jobs
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const vaga = await storage.updateVaga(req.params.id, { 
        status: "encerrada",
        dataFechamento: new Date()
      });
      if (!vaga) {
        return res.status(404).json({ message: "Vaga não encontrada" });
      }
      res.json(vaga);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/vagas/:id", requireAdmin, async (req, res, next) => {
    try {
      const deleted = await storage.deleteVaga(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Vaga não encontrada" });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Candidates management routes
  app.get("/api/candidatos", requireAuth, async (req, res, next) => {
    try {
      const { empresaId } = req.query;
      let candidatos;
      
      if (empresaId) {
        candidatos = await storage.getCandidatosByEmpresa(empresaId as string);
      } else {
        candidatos = await storage.getAllCandidatos();
      }
      
      res.json(candidatos);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/candidatos/:id", requireAuth, async (req, res, next) => {
    try {
      const candidato = await storage.getCandidato(req.params.id);
      if (!candidato) {
        return res.status(404).json({ message: "Candidato não encontrado" });
      }
      res.json(candidato);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/candidatos", requireAuth, async (req, res, next) => {
    try {
      // Only admin and recrutador can create candidates
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const candidato = await storage.createCandidato(req.body);
      res.status(201).json(candidato);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/candidatos/:id", requireAuth, async (req, res, next) => {
    try {
      // Only admin and recrutador can update candidates
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const candidato = await storage.updateCandidato(req.params.id, req.body);
      if (!candidato) {
        return res.status(404).json({ message: "Candidato não encontrado" });
      }
      res.json(candidato);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/candidatos/:id", requireAuth, async (req, res, next) => {
    try {
      // Only admin can delete candidates
      if ((req as any).user.perfil !== "admin") {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const deleted = await storage.deleteCandidato(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Candidato não encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Stats endpoint
  app.get("/api/stats", requireAuth, async (req, res, next) => {
    try {
      const [empresas, departamentos, usuarios] = await Promise.all([
        storage.getAllEmpresas(),
        storage.getAllDepartamentos(),
        storage.getAllUsuarios(),
      ]);

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      const usuariosHoje = usuarios.filter(user => 
        new Date(user.dataCriacao) >= hoje
      );

      res.json({
        empresas: empresas.length,
        departamentos: departamentos.length,
        usuarios: usuarios.length,
        usuariosHoje: usuariosHoje.length,
      });
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
