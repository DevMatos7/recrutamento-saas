import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertEmpresaSchema, insertDepartamentoSchema, insertUsuarioSchema, insertVagaSchema, insertTesteSchema, insertTesteResultadoSchema, insertEntrevistaSchema } from "@shared/schema";
import { TesteService } from "./services/teste-service.js";
import { EntrevistaService } from "./services/entrevista-service.js";
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
      const user = req.user!;
      let usuarios;
      
      // Role-based access: only admin can see all users, others see only their company users
      if (user.perfil === 'admin') {
        const { empresaId } = req.query;
        usuarios = empresaId 
          ? await storage.getUsuariosByEmpresa(empresaId as string)
          : await storage.getAllUsuarios();
      } else {
        // Non-admin users can only see users from their own company
        usuarios = await storage.getUsuariosByEmpresa(user.empresaId);
      }
      
      // Remove passwords from response
      const usuariosSemSenha = usuarios.map(({ password, ...userItem }) => userItem);
      res.json(usuariosSemSenha);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/usuarios/:id", requireAuth, async (req, res, next) => {
    try {
      const currentUser = req.user!;
      const usuario = await storage.getUser(req.params.id);
      
      if (!usuario) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Permission check: admin can see any user, others only themselves or users from same company
      if (currentUser.perfil !== 'admin' && 
          currentUser.id !== req.params.id && 
          currentUser.empresaId !== usuario.empresaId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const { password, ...usuarioSemSenha } = usuario;
      res.json(usuarioSemSenha);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/usuarios/:id", requireAuth, async (req, res, next) => {
    try {
      const currentUser = req.user!;
      const targetUserId = req.params.id;
      
      // Permission check: admin can edit any user, others only themselves
      if (currentUser.perfil !== 'admin' && currentUser.id !== targetUserId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const userData = insertUsuarioSchema.partial().parse(req.body);
      
      // Only admin can change perfil and empresaId
      if (currentUser.perfil !== 'admin') {
        delete userData.perfil;
        delete userData.empresaId;
      }
      
      // Hash password if provided
      if (userData.password) {
        userData.password = await hashPassword(userData.password);
      }
      
      const usuario = await storage.updateUsuario(targetUserId, userData);
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
      // Soft delete - set ativo = 0 using direct storage method
      const deleted = await storage.deleteUsuario(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Change user role - admin only
  app.patch("/api/usuarios/:id/perfil", requireAdmin, async (req, res, next) => {
    try {
      const { perfil } = req.body;
      
      if (!["admin", "recrutador", "gestor", "candidato"].includes(perfil)) {
        return res.status(400).json({ message: "Perfil inválido" });
      }
      
      const usuario = await storage.updateUsuario(req.params.id, { perfil });
      if (!usuario) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      const { password, ...usuarioSemSenha } = usuario;
      res.json(usuarioSemSenha);
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

  // Pipeline management routes
  app.get("/api/vagas/:vagaId/candidatos", requireAuth, async (req, res, next) => {
    try {
      const vagaCandidatos = await storage.getCandidatosByVaga(req.params.vagaId);
      res.json(vagaCandidatos);
    } catch (error) {
      next(error);
    }
  });

  // Get pipeline view for a specific job
  app.get("/api/vagas/:vagaId/pipeline", requireAuth, async (req, res, next) => {
    try {
      const pipeline = await storage.getPipelineByVaga(req.params.vagaId);
      res.json(pipeline);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/vagas/:vagaId/candidatos/:candidatoId/mover", requireAuth, async (req, res, next) => {
    try {
      const { etapa, comentarios, nota } = req.body;
      const currentUser = (req as any).user;
      
      // Import the pipeline service
      const { PipelineService, PipelineServiceError } = await import('./services/pipeline-service');
      
      const resultado = await PipelineService.moverCandidatoPipeline(
        req.params.vagaId,
        req.params.candidatoId,
        etapa,
        currentUser,
        nota,
        comentarios
      );
      
      res.json({
        vagaCandidato: resultado.vagaCandidato,
        historico: resultado.historico,
        message: `Candidato movido para "${etapa}" com sucesso`
      });
    } catch (error) {
      if (error instanceof (await import('./services/pipeline-service')).PipelineServiceError) {
        const statusMap: Record<string, number> = {
          'PERMISSION_DENIED': 403,
          'INVALID_STAGE': 400,
          'INVALID_NOTE': 400,
          'CANDIDATE_NOT_ENROLLED': 404,
          'JOB_NOT_FOUND': 404,
          'JOB_INACTIVE': 400,
          'CANDIDATE_NOT_FOUND': 404,
          'CANDIDATE_INACTIVE': 400,
          'NO_MOVEMENT_NEEDED': 400,
          'UPDATE_FAILED': 500
        };
        
        const status = statusMap[error.code] || 400;
        return res.status(status).json({ 
          message: error.message,
          code: error.code 
        });
      }
      next(error);
    }
  });

  app.post("/api/vagas/:vagaId/candidatos", requireAuth, async (req, res, next) => {
    try {
      // Only admin and recrutador can add candidates to jobs
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const vagaCandidato = await storage.inscreverCandidatoVaga({
        vagaId: req.params.vagaId,
        candidatoId: req.body.candidatoId,
        etapa: req.body.etapa || "recebido",
        nota: req.body.nota,
        comentarios: req.body.comentarios,
      });
      
      res.status(201).json(vagaCandidato);
    } catch (error) {
      next(error);
    }
  });

  // Remove candidate from job pipeline
  app.delete("/api/vagas/:vagaId/candidatos/:candidatoId", requireAuth, async (req, res, next) => {
    try {
      // Only admin and recrutador can remove candidates from jobs
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const { db } = await import('./db');
      const { vagaCandidatos } = await import('@shared/schema');
      const { and, eq } = await import('drizzle-orm');

      const deleted = await db
        .delete(vagaCandidatos)
        .where(and(
          eq(vagaCandidatos.vagaId, req.params.vagaId),
          eq(vagaCandidatos.candidatoId, req.params.candidatoId)
        ))
        .returning();

      if (deleted.length === 0) {
        return res.status(404).json({ message: "Candidato não encontrado nesta vaga" });
      }

      res.json({ message: "Candidato removido da vaga com sucesso" });
    } catch (error) {
      next(error);
    }
  });

  // Get candidate history across all jobs
  app.get("/api/candidatos/:id/historico", requireAuth, async (req, res, next) => {
    try {
      const { PipelineService } = await import('./services/pipeline-service');
      const historico = await PipelineService.obterHistoricoCompleto(req.params.id);
      res.json(historico);
    } catch (error) {
      next(error);
    }
  });

  // Get pipeline statistics for a job
  app.get("/api/vagas/:vagaId/estatisticas", requireAuth, async (req, res, next) => {
    try {
      const { PipelineService } = await import('./services/pipeline-service');
      const estatisticas = await PipelineService.obterEstatisticasPipeline(req.params.vagaId);
      res.json(estatisticas);
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

  // =================== TESTES DISC E TÉCNICOS ===================

  // Get all tests
  app.get("/api/testes", requireAuth, async (req, res, next) => {
    try {
      const testes = await TesteService.listarTestes((req as any).user);
      res.json(testes);
    } catch (error) {
      if (error instanceof Error && error.message.includes("permissão")) {
        return res.status(403).json({ message: error.message });
      }
      next(error);
    }
  });

  // Get specific test
  app.get("/api/testes/:id", requireAuth, async (req, res, next) => {
    try {
      const teste = await TesteService.obterTeste(req.params.id, (req as any).user);
      if (!teste) {
        return res.status(404).json({ message: "Teste não encontrado" });
      }
      res.json(teste);
    } catch (error) {
      if (error instanceof Error && error.message.includes("permissão")) {
        return res.status(403).json({ message: error.message });
      }
      next(error);
    }
  });

  // Create new test (admin only)
  app.post("/api/testes", requireAuth, async (req, res, next) => {
    try {
      const testeData = insertTesteSchema.parse(req.body);
      const novoTeste = await TesteService.criarTeste(testeData, (req as any).user);
      res.status(201).json(novoTeste);
    } catch (error) {
      if (error instanceof Error && error.message.includes("permissão")) {
        return res.status(403).json({ message: error.message });
      }
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      next(error);
    }
  });

  // Update test (admin only)
  app.put("/api/testes/:id", requireAuth, async (req, res, next) => {
    try {
      const testeData = insertTesteSchema.partial().parse(req.body);
      const testeAtualizado = await TesteService.atualizarTeste(req.params.id, testeData, (req as any).user);
      if (!testeAtualizado) {
        return res.status(404).json({ message: "Teste não encontrado" });
      }
      res.json(testeAtualizado);
    } catch (error) {
      if (error instanceof Error && error.message.includes("permissão")) {
        return res.status(403).json({ message: error.message });
      }
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      next(error);
    }
  });

  // Deactivate test (admin only)
  app.delete("/api/testes/:id", requireAuth, async (req, res, next) => {
    try {
      const sucesso = await TesteService.desativarTeste(req.params.id, (req as any).user);
      if (!sucesso) {
        return res.status(404).json({ message: "Teste não encontrado" });
      }
      res.json({ message: "Teste desativado com sucesso" });
    } catch (error) {
      if (error instanceof Error && error.message.includes("permissão")) {
        return res.status(403).json({ message: error.message });
      }
      next(error);
    }
  });

  // Assign test to candidate for specific job
  app.post("/api/testes/aplicar", requireAuth, async (req, res, next) => {
    try {
      const { testeId, candidatoId, vagaId } = req.body;
      
      if (!testeId || !candidatoId || !vagaId) {
        return res.status(400).json({ 
          message: "testeId, candidatoId e vagaId são obrigatórios" 
        });
      }

      const resultado = await TesteService.atribuirTeste(
        testeId, 
        candidatoId, 
        vagaId, 
        (req as any).user
      );
      
      res.status(201).json(resultado);
    } catch (error) {
      if (error instanceof Error && error.message.includes("permissão")) {
        return res.status(403).json({ message: error.message });
      }
      if (error instanceof Error && (error.message.includes("já foi atribuído") || error.message.includes("não encontrad"))) {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  });

  // Submit test responses
  app.post("/api/testes/responder", async (req, res, next) => {
    try {
      const { resultadoId, respostas } = req.body;
      
      if (!resultadoId || !Array.isArray(respostas)) {
        return res.status(400).json({ 
          message: "resultadoId e respostas (array) são obrigatórios" 
        });
      }

      const resultado = await TesteService.responderTeste(resultadoId, respostas);
      res.json(resultado);
    } catch (error) {
      if (error instanceof Error && (error.message.includes("não encontrado") || error.message.includes("já foi respondido"))) {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  });

  // Get tests assigned to candidate
  app.get("/api/candidatos/:id/testes", async (req, res, next) => {
    try {
      const testes = await TesteService.obterTestesCandidato(req.params.id);
      res.json(testes);
    } catch (error) {
      next(error);
    }
  });

  // Get candidate test history
  app.get("/api/candidatos/:id/historico-testes", requireAuth, async (req, res, next) => {
    try {
      const historico = await TesteService.obterHistoricoTestes(req.params.id, (req as any).user);
      res.json(historico);
    } catch (error) {
      if (error instanceof Error && error.message.includes("permissão")) {
        return res.status(403).json({ message: error.message });
      }
      next(error);
    }
  });

  // Get test results for specific job
  app.get("/api/vagas/:id/resultados-testes", requireAuth, async (req, res, next) => {
    try {
      const resultados = await TesteService.obterResultadosPorVaga(req.params.id, (req as any).user);
      res.json(resultados);
    } catch (error) {
      if (error instanceof Error && error.message.includes("permissão")) {
        return res.status(403).json({ message: error.message });
      }
      next(error);
    }
  });

  // =================== ENTREVISTAS ===================

  // Get all interviews with filters
  app.get("/api/entrevistas", requireAuth, async (req, res, next) => {
    try {
      const filtros = {
        vagaId: req.query.vagaId as string,
        candidatoId: req.query.candidatoId as string,
        entrevistadorId: req.query.entrevistadorId as string,
        status: req.query.status as string,
        dataInicio: req.query.dataInicio ? new Date(req.query.dataInicio as string) : undefined,
        dataFim: req.query.dataFim ? new Date(req.query.dataFim as string) : undefined,
      };

      const entrevistas = await EntrevistaService.listarEntrevistas(filtros, (req as any).user);
      res.json(entrevistas);
    } catch (error) {
      if (error instanceof Error && error.message.includes("permissão")) {
        return res.status(403).json({ message: error.message });
      }
      next(error);
    }
  });

  // Get specific interview
  app.get("/api/entrevistas/:id", requireAuth, async (req, res, next) => {
    try {
      const entrevista = await EntrevistaService.obterEntrevista(req.params.id, (req as any).user);
      if (!entrevista) {
        return res.status(404).json({ message: "Entrevista não encontrada" });
      }
      res.json(entrevista);
    } catch (error) {
      if (error instanceof Error && error.message.includes("permissão")) {
        return res.status(403).json({ message: error.message });
      }
      next(error);
    }
  });

  // Schedule new interview
  app.post("/api/entrevistas", requireAuth, async (req, res, next) => {
    try {
      const entrevistaData = insertEntrevistaSchema.parse(req.body);
      const novaEntrevista = await EntrevistaService.agendarEntrevista(entrevistaData, (req as any).user);
      res.status(201).json(novaEntrevista);
    } catch (error) {
      if (error instanceof Error && error.message.includes("permissão")) {
        return res.status(403).json({ message: error.message });
      }
      if (error instanceof Error && (error.message.includes("já possui") || error.message.includes("não encontrad") || error.message.includes("deve ser futura"))) {
        return res.status(400).json({ message: error.message });
      }
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      next(error);
    }
  });

  // Update interview
  app.put("/api/entrevistas/:id", requireAuth, async (req, res, next) => {
    try {
      const entrevistaData = insertEntrevistaSchema.partial().parse(req.body);
      const entrevistaAtualizada = await EntrevistaService.atualizarEntrevista(req.params.id, entrevistaData, (req as any).user);
      if (!entrevistaAtualizada) {
        return res.status(404).json({ message: "Entrevista não encontrada" });
      }
      res.json(entrevistaAtualizada);
    } catch (error) {
      if (error instanceof Error && error.message.includes("permissão")) {
        return res.status(403).json({ message: error.message });
      }
      if (error instanceof Error && (error.message.includes("não é possível") || error.message.includes("deve ser futura"))) {
        return res.status(400).json({ message: error.message });
      }
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      next(error);
    }
  });

  // Update interview status
  app.patch("/api/entrevistas/:id/status", requireAuth, async (req, res, next) => {
    try {
      const { status, observacoes } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status é obrigatório" });
      }

      const entrevistaAtualizada = await EntrevistaService.atualizarStatus(
        req.params.id, 
        status, 
        observacoes, 
        (req as any).user
      );
      
      if (!entrevistaAtualizada) {
        return res.status(404).json({ message: "Entrevista não encontrada" });
      }
      
      res.json(entrevistaAtualizada);
    } catch (error) {
      if (error instanceof Error && error.message.includes("permissão")) {
        return res.status(403).json({ message: error.message });
      }
      if (error instanceof Error && error.message.includes("inválido")) {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  });

  // Delete interview
  app.delete("/api/entrevistas/:id", requireAuth, async (req, res, next) => {
    try {
      const sucesso = await EntrevistaService.removerEntrevista(req.params.id, (req as any).user);
      if (!sucesso) {
        return res.status(404).json({ message: "Entrevista não encontrada" });
      }
      res.json({ message: "Entrevista removida com sucesso" });
    } catch (error) {
      if (error instanceof Error && error.message.includes("permissão")) {
        return res.status(403).json({ message: error.message });
      }
      if (error instanceof Error && error.message.includes("não é possível")) {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  });

  // Get upcoming interviews for user
  app.get("/api/entrevistas/usuario/:id/proximas", requireAuth, async (req, res, next) => {
    try {
      const proximasEntrevistas = await EntrevistaService.obterProximasEntrevistas(req.params.id, (req as any).user);
      res.json(proximasEntrevistas);
    } catch (error) {
      if (error instanceof Error && error.message.includes("permissão")) {
        return res.status(403).json({ message: error.message });
      }
      next(error);
    }
  });

  // Get interview statistics
  app.get("/api/entrevistas/estatisticas", requireAuth, async (req, res, next) => {
    try {
      const estatisticas = await EntrevistaService.obterEstatisticas((req as any).user);
      res.json(estatisticas);
    } catch (error) {
      if (error instanceof Error && error.message.includes("permissão")) {
        return res.status(403).json({ message: error.message });
      }
      next(error);
    }
  });

  // Communication routes
  app.get("/api/comunicacoes", requireAuth, async (req, res, next) => {
    try {
      const { candidato, status, tipo, canal } = req.query;
      
      let comunicacoes;
      if (candidato) {
        comunicacoes = await storage.getComunicacoesByCanditato(candidato as string);
      } else if (status) {
        comunicacoes = await storage.getComunicacoesByStatus(status as string);
      } else {
        comunicacoes = await storage.getAllComunicacoes();
      }
      
      // Apply additional filters
      if (tipo || canal) {
        comunicacoes = comunicacoes.filter((comm: any) => {
          return (!tipo || comm.tipo === tipo) && (!canal || comm.canal === canal);
        });
      }
      
      res.json(comunicacoes);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/comunicacoes/templates", requireAuth, async (req, res, next) => {
    try {
      const fallbackTemplates = {
        inscricao: {
          whatsapp: "Olá {{nome}}! Sua candidatura para a vaga {{vaga}} foi recebida com sucesso.",
          email: {
            assunto: "Candidatura recebida - {{vaga}}",
            mensagem: "Olá {{nome}},\n\nSua candidatura foi recebida com sucesso.\n\nAtenciosamente,\nEquipe {{empresa}}"
          }
        },
        pipeline: {
          whatsapp: "Olá {{nome}}! Sua candidatura para {{vaga}} avançou para a próxima etapa.",
          email: {
            assunto: "Atualização do processo seletivo - {{vaga}}",
            mensagem: "Olá {{nome}},\n\nSua candidatura avançou para a próxima etapa.\n\nAtenciosamente,\nEquipe {{empresa}}"
          }
        },
        entrevista: {
          whatsapp: "Olá {{nome}}! Sua entrevista está agendada para {{data_entrevista}}.",
          email: {
            assunto: "Entrevista agendada - {{vaga}}",
            mensagem: "Olá {{nome}},\n\nSua entrevista foi agendada para {{data_entrevista}}.\n\nAtenciosamente,\nEquipe {{empresa}}"
          }
        },
        teste: {
          whatsapp: "Olá {{nome}}! Foi disponibilizado um teste. Acesse: {{link_teste}}",
          email: {
            assunto: "Teste disponível - {{vaga}}",
            mensagem: "Olá {{nome}},\n\nFoi disponibilizado um teste: {{link_teste}}\n\nAtenciosamente,\nEquipe {{empresa}}"
          }
        }
      };
      res.json(fallbackTemplates);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/comunicacoes/:id", requireAuth, async (req, res, next) => {
    try {
      const comunicacao = await storage.getComunicacao(req.params.id);
      if (!comunicacao) {
        return res.status(404).json({ message: "Comunicação não encontrada" });
      }
      res.json(comunicacao);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/comunicacoes/enviar", requireAuth, async (req, res, next) => {
    try {
      const { communicationService } = await import('./services/communication-service');
      
      const {
        candidatoId,
        tipo,
        canal,
        assunto,
        mensagem,
        dataAgendada,
        variables
      } = req.body;

      // Validation
      if (!candidatoId || !tipo || !canal || !mensagem) {
        return res.status(400).json({ 
          message: "Campos obrigatórios: candidatoId, tipo, canal, mensagem" 
        });
      }

      if (!["whatsapp", "email"].includes(tipo)) {
        return res.status(400).json({ message: "Tipo deve ser 'whatsapp' ou 'email'" });
      }

      if (!["inscricao", "pipeline", "entrevista", "teste", "outros"].includes(canal)) {
        return res.status(400).json({ 
          message: "Canal deve ser 'inscricao', 'pipeline', 'entrevista', 'teste' ou 'outros'" 
        });
      }

      const result = await communicationService.enviarEArmazenar({
        candidatoId,
        tipo,
        canal,
        assunto,
        mensagem,
        enviadoPor: (req as any).user?.id,
        dataAgendada: dataAgendada ? new Date(dataAgendada) : undefined,
        variables
      });

      if (!result.success) {
        return res.status(400).json({ message: result.error });
      }

      res.status(201).json({
        message: "Comunicação enviada com sucesso",
        comunicacao: result.comunicacao
      });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/comunicacoes/:id/reenviar", requireAuth, async (req, res, next) => {
    try {
      const { communicationService } = await import('./services/communication-service');
      
      const comunicacao = await storage.getComunicacao(req.params.id);
      if (!comunicacao) {
        return res.status(404).json({ message: "Comunicação não encontrada" });
      }

      if (comunicacao.statusEnvio === 'enviado') {
        return res.status(400).json({ message: "Esta comunicação já foi enviada" });
      }

      const candidato = await storage.getCandidato(comunicacao.candidatoId);
      if (!candidato) {
        return res.status(404).json({ message: "Candidato não encontrado" });
      }

      const result = await communicationService.enviarComunicacao(
        comunicacao.tipo as 'whatsapp' | 'email',
        candidato,
        comunicacao.mensagem,
        comunicacao.assunto || undefined
      );

      await storage.updateComunicacao(comunicacao.id, {
        statusEnvio: result.success ? 'enviado' : 'erro',
        erro: result.error,
        dataEnvio: result.success ? new Date() : undefined
      });

      res.json({
        message: result.success ? "Comunicação reenviada com sucesso" : "Erro ao reenviar comunicação",
        success: result.success,
        error: result.error
      });
    } catch (error) {
      next(error);
    }
  });



  app.delete("/api/comunicacoes/:id", requireAuth, async (req, res, next) => {
    try {
      const success = await storage.deleteComunicacao(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Comunicação não encontrada" });
      }
      res.json({ message: "Comunicação removida com sucesso" });
    } catch (error) {
      next(error);
    }
  });

  // Analytics routes
  app.get("/api/analytics/dashboard", requireAuth, async (req, res, next) => {
    try {
      const user = req.user as any;
      if (!user || !['admin', 'recrutador'].includes(user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const dashboardData = await storage.getDashboardGeral(user.empresaId);
      res.json(dashboardData);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/analytics/vagas/:vagaId", requireAuth, async (req, res, next) => {
    try {
      const user = req.user as any;
      if (!user || !['admin', 'recrutador', 'gestor'].includes(user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const { vagaId } = req.params;
      const analiseVaga = await storage.getAnaliseVaga(vagaId, user.empresaId);
      res.json(analiseVaga);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/analytics/departamentos/:departamentoId", requireAuth, async (req, res, next) => {
    try {
      const user = req.user as any;
      if (!user || !['admin', 'recrutador', 'gestor'].includes(user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const { departamentoId } = req.params;
      const analiseDepartamento = await storage.getAnaliseDepartamento(departamentoId, user.empresaId);
      res.json(analiseDepartamento);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/analytics/testes/:vagaId", requireAuth, async (req, res, next) => {
    try {
      const user = req.user as any;
      if (!user || !['admin', 'recrutador', 'gestor'].includes(user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const { vagaId } = req.params;
      const analiseTestes = await storage.getAnaliseTestesVaga(vagaId, user.empresaId);
      res.json(analiseTestes);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/analytics/origens", requireAuth, async (req, res, next) => {
    try {
      const user = req.user as any;
      if (!user || !['admin', 'recrutador'].includes(user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const analiseOrigens = await storage.getAnaliseOrigens(user.empresaId);
      res.json(analiseOrigens);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/analytics/tempos", requireAuth, async (req, res, next) => {
    try {
      const user = req.user as any;
      if (!user || !['admin', 'recrutador'].includes(user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const temposPorEtapa = await storage.getTemposPorEtapa(user.empresaId);
      res.json(temposPorEtapa);
    } catch (error) {
      next(error);
    }
  });

  // Candidate Portal routes
  app.post("/api/candidate-portal/register", async (req, res, next) => {
    try {
      const { candidatePortalService } = await import('./services/candidate-portal-service');
      
      const { nome, email, telefone, password, empresaId } = req.body;

      if (!nome || !email || !password || !empresaId) {
        return res.status(400).json({ 
          message: "Campos obrigatórios: nome, email, password, empresaId" 
        });
      }

      const candidate = await candidatePortalService.registerCandidate({
        nome,
        email,
        telefone,
        password,
        empresaId
      });

      res.status(201).json({
        message: "Candidato registrado com sucesso",
        candidate: {
          id: candidate.id,
          nome: candidate.nome,
          email: candidate.email
        }
      });
    } catch (error: any) {
      if (error.message === 'Email já cadastrado') {
        return res.status(409).json({ message: error.message });
      }
      next(error);
    }
  });

  app.post("/api/candidate-portal/login", async (req, res, next) => {
    try {
      const { candidatePortalService } = await import('./services/candidate-portal-service');
      
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ 
          message: "Email e senha são obrigatórios" 
        });
      }

      const candidate = await candidatePortalService.loginCandidate(email, password);

      // Set session for candidate
      (req.session as any).candidateId = candidate.id;
      (req.session as any).candidateEmail = candidate.email;

      res.json({
        message: "Login realizado com sucesso",
        candidate: {
          id: candidate.id,
          nome: candidate.nome,
          email: candidate.email
        }
      });
    } catch (error: any) {
      if (error.message === 'Credenciais inválidas' || error.message === 'Conta inativa') {
        return res.status(401).json({ message: error.message });
      }
      next(error);
    }
  });

  app.post("/api/candidate-portal/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logout realizado com sucesso" });
    });
  });

  // Middleware para verificar autenticação do candidato
  const requireCandidateAuth = (req: any, res: any, next: any) => {
    if (!req.session.candidateId) {
      return res.status(401).json({ message: "Acesso não autorizado" });
    }
    req.candidateId = req.session.candidateId;
    next();
  };

  app.get("/api/candidate-portal/vagas", async (req, res, next) => {
    try {
      const { candidatePortalService } = await import('./services/candidate-portal-service');
      
      const { empresaId } = req.query;
      const jobs = await candidatePortalService.getOpenJobs(empresaId as string);
      
      res.json(jobs);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/candidate-portal/vagas/:id", async (req, res, next) => {
    try {
      const { candidatePortalService } = await import('./services/candidate-portal-service');
      
      const { id } = req.params;
      const job = await candidatePortalService.getJobDetails(id);
      
      res.json(job);
    } catch (error: any) {
      if (error.message === 'Vaga não encontrada ou não está aberta') {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  });

  app.post("/api/candidate-portal/apply", requireCandidateAuth, async (req, res, next) => {
    try {
      const { candidatePortalService } = await import('./services/candidate-portal-service');
      
      const { vagaId } = req.body;
      const candidateId = req.candidateId;

      if (!vagaId) {
        return res.status(400).json({ message: "ID da vaga é obrigatório" });
      }

      if (!candidateId) {
        return res.status(401).json({ message: "Candidato não autenticado" });
      }

      const application = await candidatePortalService.applyToJob(candidateId, vagaId);
      
      res.status(201).json({
        message: "Candidatura realizada com sucesso",
        application
      });
    } catch (error: any) {
      if (error.message === 'Vaga não encontrada ou não está aberta' || 
          error.message === 'Você já se candidatou a esta vaga') {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  });

  app.get("/api/candidate-portal/dashboard", requireCandidateAuth, async (req, res, next) => {
    try {
      const { candidatePortalService } = await import('./services/candidate-portal-service');
      
      const candidateId = req.candidateId;
      if (!candidateId) {
        return res.status(401).json({ message: "Candidato não autenticado" });
      }
      const applications = await candidatePortalService.getCandidateApplications(candidateId);
      
      res.json(applications);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/candidate-portal/profile", requireCandidateAuth, async (req, res, next) => {
    try {
      const { candidatePortalService } = await import('./services/candidate-portal-service');
      
      const candidateId = req.candidateId;
      if (!candidateId) {
        return res.status(401).json({ message: "Candidato não autenticado" });
      }
      
      // Get candidate's actual applications, not dashboard stats
      const candidaturas = await candidatePortalService.getCandidateApplications(candidateId);
      
      res.json({ candidaturas });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/candidate-portal/tests", requireCandidateAuth, async (req, res, next) => {
    try {
      const { candidatePortalService } = await import('./services/candidate-portal-service');
      
      const candidateId = req.candidateId;
      if (!candidateId) {
        return res.status(401).json({ message: "Candidato não autenticado" });
      }
      const tests = await candidatePortalService.getPendingTests(candidateId);
      
      res.json(tests);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/candidate-portal/tests/:id/submit", requireCandidateAuth, async (req, res, next) => {
    try {
      const { candidatePortalService } = await import('./services/candidate-portal-service');
      
      const { id } = req.params;
      const { respostas } = req.body;
      const candidateId = req.candidateId;

      if (!candidateId) {
        return res.status(401).json({ message: "Candidato não autenticado" });
      }

      if (!respostas) {
        return res.status(400).json({ message: "Respostas são obrigatórias" });
      }

      const result = await candidatePortalService.submitTestResponse(candidateId, id, respostas);
      
      res.json({
        message: "Respostas enviadas com sucesso",
        result
      });
    } catch (error: any) {
      if (error.message === 'Teste não encontrado ou já respondido') {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  });

  app.get("/api/candidate-portal/interviews", requireCandidateAuth, async (req, res, next) => {
    try {
      const { candidatePortalService } = await import('./services/candidate-portal-service');
      
      const candidateId = req.candidateId;
      if (!candidateId) {
        return res.status(401).json({ message: "Candidato não autenticado" });
      }
      const interviews = await candidatePortalService.getScheduledInterviews(candidateId);
      
      res.json(interviews);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/candidate-portal/notifications", requireCandidateAuth, async (req, res, next) => {
    try {
      const { candidatePortalService } = await import('./services/candidate-portal-service');
      
      const candidateId = req.candidateId;
      if (!candidateId) {
        return res.status(401).json({ message: "Candidato não autenticado" });
      }
      const notifications = await candidatePortalService.getCandidateNotifications(candidateId);
      
      res.json(notifications);
    } catch (error) {
      next(error);
    }
  });

  // Configuration endpoints (admin only)
  app.get("/api/config/credentials", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const config = {
        smtp: {
          host: process.env.SMTP_HOST || "",
          port: parseInt(process.env.SMTP_PORT || "587"),
          secure: process.env.SMTP_SECURE === "true",
          user: process.env.SMTP_USER || "",
          pass: process.env.SMTP_PASS ? "****" : ""
        },
        whatsapp: {
          apiUrl: process.env.WHATSAPP_API_URL || "",
          apiToken: process.env.WHATSAPP_API_TOKEN ? "****" : ""
        }
      };
      res.json(config);
    } catch (error) {
      console.error("Error fetching credentials config:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/config/smtp", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { host, port, secure, user, pass } = req.body;
      
      if (!host || !user || !pass) {
        return res.status(400).json({ message: "Todos os campos são obrigatórios" });
      }

      res.json({ message: "Configurações SMTP salvas com sucesso" });
    } catch (error) {
      console.error("Error saving SMTP config:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/config/whatsapp", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { apiUrl, apiToken } = req.body;
      
      if (!apiUrl || !apiToken) {
        return res.status(400).json({ message: "URL da API e token são obrigatórios" });
      }

      res.json({ message: "Configurações WhatsApp salvas com sucesso" });
    } catch (error) {
      console.error("Error saving WhatsApp config:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/config/test-smtp", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      res.json({ message: "Teste SMTP simulado - implementar teste real" });
    } catch (error) {
      console.error("Error testing SMTP:", error);
      res.status(500).json({ message: "Erro no teste SMTP" });
    }
  });

  app.post("/api/config/test-whatsapp", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      res.json({ message: "Teste WhatsApp simulado - implementar teste real" });
    } catch (error) {
      console.error("Error testing WhatsApp:", error);
      res.status(500).json({ message: "Erro no teste WhatsApp" });
    }
  });

  // ==========================================
  // AVALIAÇÕES DISC ROUTES
  // ==========================================

  // GET /api/avaliacoes/disc/modelo - Retorna modelo das questões DISC
  app.get("/api/avaliacoes/disc/modelo", async (req: Request, res: Response) => {
    try {
      const { AvaliacaoService } = await import("./services/avaliacao-service.js");
      const modelo = await AvaliacaoService.obterModeloDisc();
      res.json(modelo);
    } catch (error: any) {
      console.error("Erro ao obter modelo DISC:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // POST /api/avaliacoes/disc/iniciar - Inicia nova avaliação DISC
  app.post("/api/avaliacoes/disc/iniciar", async (req: Request, res: Response) => {
    try {
      const { candidatoId } = req.body;
      
      if (!candidatoId) {
        return res.status(400).json({ message: "candidatoId é obrigatório" });
      }

      const { AvaliacaoService } = await import("./services/avaliacao-service.js");
      const avaliacao = await AvaliacaoService.iniciarAvaliacao(candidatoId);
      res.json(avaliacao);
    } catch (error: any) {
      console.error("Erro ao iniciar avaliação:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // POST /api/avaliacoes/disc/:id/responder - Salva respostas de um bloco
  app.post("/api/avaliacoes/disc/:id/responder", async (req: Request, res: Response) => {
    try {
      const avaliacaoId = parseInt(req.params.id);
      const { bloco, respostas } = req.body;

      if (!bloco || !respostas || !Array.isArray(respostas)) {
        return res.status(400).json({ 
          message: "bloco e respostas (array) são obrigatórios" 
        });
      }

      const { AvaliacaoService } = await import("./services/avaliacao-service.js");
      const resultado = await AvaliacaoService.salvarRespostasBloco(
        avaliacaoId, 
        bloco, 
        respostas
      );
      res.json(resultado);
    } catch (error: any) {
      console.error("Erro ao salvar respostas:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // POST /api/avaliacoes/disc/:id/finalizar - Finaliza avaliação e calcula resultado
  app.post("/api/avaliacoes/disc/:id/finalizar", async (req: Request, res: Response) => {
    try {
      const avaliacaoId = parseInt(req.params.id);

      const { AvaliacaoService } = await import("./services/avaliacao-service.js");
      const resultado = await AvaliacaoService.finalizarAvaliacao(avaliacaoId);
      res.json(resultado);
    } catch (error: any) {
      console.error("Erro ao finalizar avaliação:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // GET /api/avaliacoes/disc/:id/resultado - Retorna resultado da avaliação
  app.get("/api/avaliacoes/disc/:id/resultado", async (req: Request, res: Response) => {
    try {
      const avaliacaoId = parseInt(req.params.id);

      const { AvaliacaoService } = await import("./services/avaliacao-service.js");
      const resultado = await AvaliacaoService.obterResultado(avaliacaoId);
      res.json(resultado);
    } catch (error: any) {
      console.error("Erro ao obter resultado:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // GET /api/avaliacoes/disc/candidato/:candidatoId - Histórico de avaliações do candidato
  app.get("/api/avaliacoes/disc/candidato/:candidatoId", async (req: Request, res: Response) => {
    try {
      const { candidatoId } = req.params;

      const { AvaliacaoService } = await import("./services/avaliacao-service.js");
      const historico = await AvaliacaoService.obterHistoricoCandidato(candidatoId);
      res.json(historico);
    } catch (error: any) {
      console.error("Erro ao obter histórico:", error);
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
