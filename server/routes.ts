import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertEmpresaSchema, insertDepartamentoSchema, insertUsuarioSchema, insertVagaSchema, insertTesteSchema, insertTesteResultadoSchema, insertEntrevistaSchema, insertPipelineEtapaSchema, pipelineAuditoria, matchFeedback, vagaMatchingConfig } from "@shared/schema";
import { TesteService } from "./services/teste-service.js";
import { EntrevistaService } from "./services/entrevista-service.js";
import { z } from "zod";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { authLimiter, candidatePortalLimiter } from "./middleware/rate-limit.middleware";
import multer from 'multer';
import mammoth from 'mammoth';
import { HfInference } from '@huggingface/inference';
import fs from 'fs';
import ExcelJS from "exceljs";
import { db } from './db';
import { like, eq, ilike } from 'drizzle-orm';
import { candidatoSkills, vagaSkills, skills } from "@shared/schema";

const scryptAsync = promisify(scrypt);
const upload = multer({ dest: '/tmp' });
const hf = new HfInference(process.env.HF_API_KEY || undefined);

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

  // Middleware para injetar o db em req.db
  app.use((req, res, next) => {
    req.db = db;
    next();
  });

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

  // Change user status - admin only
  app.patch("/api/usuarios/:id/status", requireAdmin, async (req, res, next) => {
    try {
      const { ativo } = req.body;
      
      if (typeof ativo !== "number" || ![0, 1].includes(ativo)) {
        return res.status(400).json({ message: "Status inválido. Use 0 para inativo ou 1 para ativo" });
      }
      
      const usuario = await storage.updateUsuario(req.params.id, { ativo });
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
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const vagaData = insertVagaSchema.parse(req.body);
      const skillsIds = req.body.skillsIds || [];
      const vaga = await storage.createVaga(vagaData);
      // Atualizar skills da vaga
      if (skillsIds.length > 0) {
        const { db } = await import("./db");
        const { vagaSkills } = await import("@shared/schema");
        for (const skillId of skillsIds) {
          await db.insert(vagaSkills).values({ vagaId: vaga.id, skillId }).onConflictDoNothing();
        }
      }
      // Auditoria: criar
      try {
        await storage.createVagaAuditoria({
          vagaId: vaga.id,
          usuarioId: req.user.id,
          acao: 'criar',
          detalhes: JSON.stringify(vagaData)
        });
      } catch (e) { console.error('Erro ao registrar auditoria:', e); }
      // Notificação automática (já implementada)
      try {
        const { CommunicationService } = await import("./services/communication-service");
        const comm = new CommunicationService();
        const gestor = await storage.getUsuario(vaga.gestorId);
        const recrutadores = await storage.getUsuariosByEmpresa(vaga.empresaId);
        if (gestor) {
          await comm.enviarComunicacao('email', gestor, `Uma nova vaga foi criada: ${vaga.titulo}`);
          await comm.enviarComunicacao('whatsapp', gestor, `Uma nova vaga foi criada: ${vaga.titulo}`);
        }
        for (const rec of recrutadores) {
          if (rec.id !== gestor?.id) {
            await comm.enviarComunicacao('email', rec, `Uma nova vaga foi criada: ${vaga.titulo}`);
            await comm.enviarComunicacao('whatsapp', rec, `Uma nova vaga foi criada: ${vaga.titulo}`);
          }
        }
      } catch (e) { console.error('Erro ao notificar:', e); }
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
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const vagaData = insertVagaSchema.partial().parse(req.body);
      const skillsIds = req.body.skillsIds || [];
      // Buscar dados antigos da vaga antes da atualização
      const vagaAntiga = await storage.getVaga(req.params.id);
      if (!vagaAntiga) {
        return res.status(404).json({ message: "Vaga não encontrada" });
      }
      const vaga = await storage.updateVaga(req.params.id, vagaData);
      if (!vaga) {
        return res.status(404).json({ message: "Vaga não encontrada" });
      }
      // Atualizar skills da vaga
      const { db } = await import("./db");
      const { vagaSkills } = await import("@shared/schema");
      await db.delete(vagaSkills).where(vagaSkills.vagaId.eq(req.params.id));
      for (const skillId of skillsIds) {
        await db.insert(vagaSkills).values({ vagaId: req.params.id, skillId }).onConflictDoNothing();
      }
      // Auditoria: editar
      try {
        const dadosAuditoria = {
          dadosAntigos: vagaAntiga,
          dadosNovos: vagaData,
          camposAlterados: Object.keys(vagaData)
        };
        await storage.createVagaAuditoria({
          vagaId: req.params.id,
          usuarioId: req.user.id,
          acao: 'editar',
          detalhes: JSON.stringify(dadosAuditoria)
        });
      } catch (e) { console.error('Erro ao registrar auditoria:', e); }
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
      // Auditoria: excluir
      try {
        await storage.createVagaAuditoria({
          vagaId: req.params.id,
          usuarioId: req.user.id,
          acao: 'excluir',
          detalhes: null
        });
      } catch (e) { console.error('Erro ao registrar auditoria:', e); }
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
      console.log('[DEBUG] Candidatos encontrados no banco:', candidatos.length);

      // DECLARE AS VARIÁVEIS DE FILTRO AQUI, ANTES DE QUALQUER USO
      const status = Array.isArray(req.query.status) ? req.query.status : req.query.status ? [req.query.status] : [];
      const statusEtico = Array.isArray(req.query.statusEtico) ? req.query.statusEtico : req.query.statusEtico ? [req.query.statusEtico] : [];
      const origem = Array.isArray(req.query.origem) ? req.query.origem : req.query.origem ? [req.query.origem] : [];
      const perfilDisc = Array.isArray(req.query.perfilDisc) ? req.query.perfilDisc : req.query.perfilDisc ? [req.query.perfilDisc] : [];

      const algumFiltro = status.length > 0 || statusEtico.length > 0 || origem.length > 0 || perfilDisc.length > 0;
      if (!algumFiltro) {
        // Nenhum filtro: retorna todos os candidatos
        console.log('[DEBUG] Retornando candidatos:', candidatos.length);
        return res.json(candidatos);
      }
      // Se houver filtro, aplica normalmente
      const norm = (v) => (v || '').toString().trim().toLowerCase();
      const arrNorm = (arr) => arr.map(norm);
      if (status.length > 0) {
        const statusNorm = arrNorm(status);
        candidatos = candidatos.filter(c => statusNorm.includes(norm(c.status)));
      }
      if (statusEtico.length > 0) {
        const statusEticoNorm = arrNorm(statusEtico);
        candidatos = candidatos.filter(c => statusEticoNorm.includes(norm(c.statusEtico)));
      }
      if (origem.length > 0) {
        const origemNorm = arrNorm(origem);
        candidatos = candidatos.filter(c => origemNorm.includes(norm(c.origem)));
      }
      if (perfilDisc.length > 0) {
        const perfilDiscNorm = arrNorm(perfilDisc);
        candidatos = candidatos.filter(c => perfilDiscNorm.includes(norm(c.perfilDisc)));
      }
      console.log('[DEBUG] Retornando candidatos filtrados:', candidatos.length);
      return res.json(candidatos);
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
      res.json(candidato); // Retorna apenas o objeto, não um array
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/candidatos", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const candidatoData = insertCandidatoSchema.parse(req.body);
      const skillsIds = req.body.skillsIds || [];
      const candidato = await storage.createCandidato(candidatoData);
      // Atualizar skills do candidato
      if (skillsIds.length > 0) {
        const { db } = await import("./db");
        const { candidatoSkills } = await import("@shared/schema");
        for (const skillId of skillsIds) {
          await db.insert(candidatoSkills).values({ candidatoId: candidato.id, skillId }).onConflictDoNothing();
        }
      }
      res.status(201).json(candidato);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  app.put("/api/candidatos/:id", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const candidatoData = insertCandidatoSchema.partial().parse(req.body);
      const skillsIds = req.body.skillsIds || [];
      const candidato = await storage.updateCandidato(req.params.id, candidatoData);
      if (!candidato) {
        return res.status(404).json({ message: "Candidato não encontrado" });
      }
      // Atualizar skills do candidato
      const { db } = await import("./db");
      const { candidatoSkills } = await import("@shared/schema");
      await db.delete(candidatoSkills).where(candidatoSkills.candidatoId.eq(req.params.id));
      for (const skillId of skillsIds) {
        await db.insert(candidatoSkills).values({ candidatoId: req.params.id, skillId }).onConflictDoNothing();
      }
      res.json(candidato);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  // PUT /api/candidatos/:id/status-etico - Atualizar status ético do candidato
  app.put("/api/candidatos/:id/status-etico", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const { id } = req.params;
      const { statusEtico, motivoReprovacaoEtica } = req.body;
      
      if (!["aprovado", "reprovado", "pendente"].includes(statusEtico)) {
        return res.status(400).json({ message: "Status ético inválido" });
      }
      
      const candidato = await storage.updateCandidato(id, { 
        statusEtico, 
        motivoReprovacaoEtica: statusEtico === "reprovado" ? motivoReprovacaoEtica : null 
      });
      
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
          'UPDATE_FAILED': 500,
          'MISSING_REQUIRED_FIELD': 400
        };
        const status = statusMap[error.code] || 400;
        return res.status(status).json({
          message: error.message,
          code: error.code,
          field: error.field || undefined,
          details: error.details || undefined
        });
      }
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Dados inválidos",
          code: "VALIDATION_ERROR",
          details: error.errors
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
      const historico = await PipelineService.obterHistoricoCompleto(req.params.id, req.user);
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

  // Buscar slots livres para agendamento inteligente
  app.get("/api/entrevistas/slots-livres", requireAuth, async (req, res, next) => {
    try {
      const { entrevistadorId, candidatoId, dataInicio, dataFim } = req.query;
      if (!entrevistadorId || !candidatoId || !dataInicio || !dataFim) {
        return res.status(400).json({ message: "Parâmetros obrigatórios: entrevistadorId, candidatoId, dataInicio, dataFim" });
      }
      const slots = await EntrevistaService.buscarSlotsLivres({
        entrevistadorId: String(entrevistadorId),
        candidatoId: String(candidatoId),
        dataInicio: new Date(String(dataInicio)),
        dataFim: new Date(String(dataFim)),
      });
      res.json(slots);
    } catch (error) {
      next(error);
    }
  });

  // Reagendar entrevista
  app.patch("/api/entrevistas/:id/reagendar", requireAuth, async (req, res, next) => {
    try {
      const { novaDataHora } = req.body;
      if (!novaDataHora) return res.status(400).json({ message: "novaDataHora é obrigatório" });
      const entrevista = await EntrevistaService.reagendarEntrevista(
        req.params.id,
        new Date(novaDataHora),
        req.user
      );
      res.json(entrevista);
    } catch (error) {
      next(error);
    }
  });

  // Confirmar presença
  app.patch("/api/entrevistas/:id/confirmar", async (req, res, next) => {
    try {
      const entrevista = await EntrevistaService.confirmarPresenca(req.params.id);
      res.json(entrevista);
    } catch (error) {
      next(error);
    }
  });

  // Registrar feedback pós-entrevista
  app.patch("/api/entrevistas/:id/feedback", requireAuth, async (req, res, next) => {
    try {
      const { notas, comentarios } = req.body;
      if (notas === undefined || comentarios === undefined) {
        return res.status(400).json({ message: "notas e comentarios são obrigatórios" });
      }
      const entrevista = await EntrevistaService.registrarFeedback(
        req.params.id,
        req.user.id,
        notas,
        comentarios
      );
      res.json(entrevista);
    } catch (error) {
      next(error);
    }
  });

  // Gerar link de vídeo para entrevista
  app.post("/api/entrevistas/:id/link-video", requireAuth, async (req, res, next) => {
    try {
      const { plataforma } = req.body;
      if (!plataforma) return res.status(400).json({ message: "plataforma é obrigatória" });
      const link = await EntrevistaService.gerarLinkVideo(req.params.id, plataforma);
      res.json({ link });
    } catch (error) {
      next(error);
    }
  });

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
  app.post("/api/candidate-portal/register", candidatePortalLimiter, async (req, res, next) => {
    // Força o uso do ID da empresa padrão GentePRO
    req.body.empresaId = "98f2fed8-b7fb-44ab-ac53-7a51f1c9e6ff";
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

  app.post("/api/candidate-portal/login", authLimiter, async (req, res, next) => {
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
      
      // Force session save
      await new Promise((resolve, reject) => {
        (req.session as any).save((err: any) => {
          if (err) {
            console.error("Session save error:", err);
            reject(err);
          } else {
            console.log("Session saved successfully for candidate:", candidate.id);
            resolve(true);
          }
        });
      });

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

  app.post("/api/candidate-portal/apply", candidatePortalLimiter, requireCandidateAuth, async (req, res, next) => {
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
        message: "Candidatura submetida com sucesso! Aguarde a aprovação do recrutador.",
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
      let candidatoId = req.body.candidatoId;
      
      // Debug session data
      console.log("Session data:", {
        candidateId: (req as any).session?.candidateId,
        candidateEmail: (req as any).session?.candidateEmail,
        sessionId: (req as any).session?.id,
        hasSession: !!(req as any).session
      });
      
      // Se não foi fornecido candidatoId no body, tentar obter da sessão
      if (!candidatoId && (req as any).session?.candidateId) {
        candidatoId = (req as any).session.candidateId;
        console.log("Using candidateId from session:", candidatoId);
      }
      
      if (!candidatoId) {
        return res.status(400).json({ 
          message: "candidatoId é obrigatório", 
          debug: {
            sessionExists: !!(req as any).session,
            candidateIdInSession: (req as any).session?.candidateId,
            bodyData: req.body
          }
        });
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
      const candidatoId = req.params.candidatoId === "current" ? 
        (req as any).session?.candidateId : req.params.candidatoId;
      
      if (!candidatoId) {
        return res.status(400).json({ message: "candidatoId é obrigatório" });
      }

      const { AvaliacaoService } = await import("./services/avaliacao-service.js");
      const historico = await AvaliacaoService.obterHistoricoCandidato(candidatoId);
      res.json(historico);
    } catch (error: any) {
      console.error("Erro ao obter histórico:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // GET /api/avaliacoes/disc/:id/progresso - Buscar progresso de uma avaliação
  app.get("/api/avaliacoes/disc/:id/progresso", async (req: Request, res: Response) => {
    try {
      const avaliacaoId = parseInt(req.params.id);
      const { AvaliacaoService } = await import("./services/avaliacao-service.js");
      const progresso = await AvaliacaoService.buscarProgressoAvaliacao(avaliacaoId);
      res.json(progresso);
    } catch (error: any) {
      console.error("Erro ao buscar progresso da avaliação:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // POST /api/avaliacoes/disc/admin/update-block - Atualizar bloco DISC (admin only)
  app.post("/api/avaliacoes/disc/admin/update-block", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { bloco, titulo, questions } = req.body;

      if (!bloco || !titulo || !questions || !Array.isArray(questions)) {
        return res.status(400).json({ error: "Dados inválidos" });
      }

      // Deletar questões existentes do bloco
      await db
        .delete(questoesDisc)
        .where(eq(questoesDisc.bloco, bloco));

      // Inserir novas questões
      if (questions.length > 0) {
        await db
          .insert(questoesDisc)
          .values(questions.map(q => ({
            bloco,
            ordem: q.ordem,
            frase: q.frase,
            fator: q.fator
          })));
      }

      console.log(`Bloco ${bloco} atualizado com ${questions.length} questões`);
      res.json({ success: true, message: "Bloco atualizado com sucesso" });
    } catch (error) {
      console.error("Erro ao atualizar bloco DISC:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // GET /api/avaliacoes/disc/resultados-todos - Obter resultados DISC de todos os candidatos
  app.get("/api/avaliacoes/disc/resultados-todos", requireAuth, async (req: Request, res: Response) => {
    try {
      const { AvaliacaoService } = await import("./services/avaliacao-service.js");
      const resultados = await AvaliacaoService.obterResultadosTodosCandidatos();
      res.json(resultados);
    } catch (error: any) {
      console.error("Erro ao obter resultados:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // POST /api/avaliacoes/disc/enviar-convite - Enviar convite para teste DISC
  app.post("/api/avaliacoes/disc/enviar-convite", requireAuth, async (req: Request, res: Response) => {
    try {
      const { candidatoId, tipo } = req.body;

      if (!candidatoId || !tipo) {
        return res.status(400).json({ message: "candidatoId e tipo são obrigatórios" });
      }

      // Buscar dados do candidato
      const candidato = await storage.getCandidatoById(candidatoId);
      if (!candidato) {
        return res.status(404).json({ message: "Candidato não encontrado" });
      }

      const linkTeste = `${req.get('origin') || 'http://localhost:5000'}/portal/disc`;
      
      if (tipo === 'email') {
        // Criar comunicação por email
        await storage.createComunicacao({
          candidatoId,
          tipo: 'email',
          canal: 'teste',
          destinatario: candidato.email,
          assunto: 'Teste DISC Obrigatório - GentePRO',
          conteudo: `
            Olá ${candidato.nome},

            Você precisa completar o teste DISC obrigatório para continuar no processo seletivo.

            Acesse o link abaixo para realizar o teste:
            ${linkTeste}

            O teste é obrigatório e deve ser realizado o quanto antes.

            Atenciosamente,
            Equipe GentePRO
          `,
          statusEnvio: 'pendente',
          enviadoPor: req.user.id,
        });
      } else if (tipo === 'whatsapp') {
        // Criar comunicação por WhatsApp
        await storage.createComunicacao({
          candidatoId,
          tipo: 'whatsapp',
          canal: 'teste',
          destinatario: candidato.telefone || candidato.email,
          conteudo: `Olá ${candidato.nome}! Você precisa completar o teste DISC obrigatório. Acesse: ${linkTeste}`,
          statusEnvio: 'pendente',
          enviadoPor: req.user.id,
        });
      }

      res.json({ message: "Convite enviado com sucesso" });
    } catch (error: any) {
      console.error("Erro ao enviar convite:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // === ENDPOINTS DE MATCHING ===
  
  // GET /api/vagas/:vagaId/matches - Obter matches para uma vaga
  app.get("/api/vagas/:vagaId/matches", requireAuth, async (req: Request, res: Response) => {
    try {
      const { vagaId } = req.params;
      const { scoreMinimo = "70", localizacao, nivelExperiencia } = req.query;

      const { MatchingService } = await import("./services/matching-service.js");
      
      let matches = await MatchingService.calcularMatchesParaVaga(
        vagaId, 
        parseInt(scoreMinimo as string)
      );

      // Aplicar filtros adicionais
      if (localizacao) {
        matches = matches.filter(match => 
          match.candidato.localizacao?.toLowerCase().includes((localizacao as string).toLowerCase())
        );
      }

      if (nivelExperiencia && nivelExperiencia !== "todos" && nivelExperiencia !== "") {
        matches = matches.filter(match => 
          match.candidato.nivelExperiencia === nivelExperiencia
        );
      }

      res.json(matches);
    } catch (error: any) {
      console.error("Erro ao obter matches:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // GET /api/vagas/:vagaId/matches/estatisticas - Obter estatísticas de matching
  app.get("/api/vagas/:vagaId/matches/estatisticas", requireAuth, async (req: Request, res: Response) => {
    try {
      const { vagaId } = req.params;

      const { MatchingService } = await import("./services/matching-service.js");
      const estatisticas = await MatchingService.obterEstatisticasMatching(vagaId);

      res.json(estatisticas);
    } catch (error: any) {
      console.error("Erro ao obter estatísticas de matching:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // AI Recommendation Routes
  
  // GET /api/vagas/:vagaId/ai-recommendations - Get AI-powered candidate recommendations
  app.get("/api/vagas/:vagaId/ai-recommendations", requireAuth, async (req: Request, res: Response) => {
    try {
      const vagaId = req.params.vagaId;
      const limit = parseInt(req.query.limit as string) || 5;

      if (!["admin", "recrutador"].includes(req.user?.perfil || "")) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const { AIRecommendationService } = await import("./services/ai-recommendation-service.js");
      const recommendations = await AIRecommendationService.getAIRecommendations(vagaId, limit);
      
      res.json(recommendations);
    } catch (error: any) {
      console.error("Erro ao gerar recomendações AI:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // GET /api/candidatos/:candidatoId/ai-insights/:vagaId - Get detailed AI insights for a candidate
  app.get("/api/candidatos/:candidatoId/ai-insights/:vagaId", requireAuth, async (req: Request, res: Response) => {
    try {
      const candidatoId = req.params.candidatoId;
      const vagaId = req.params.vagaId;

      if (!["admin", "recrutador", "gestor"].includes(req.user?.perfil || "")) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const { AIRecommendationService } = await import("./services/ai-recommendation-service.js");
      const insights = await AIRecommendationService.getCandidateInsights(candidatoId, vagaId);
      
      res.json(insights);
    } catch (error: any) {
      console.error("Erro ao gerar insights do candidato:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Endpoint para atualizar status ético do candidato
  app.put("/api/candidatos/:id/status-etico", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { statusEtico, motivoReprovacaoEtica } = req.body;

      const updateData: any = { statusEtico };
      if (statusEtico === "reprovado" && motivoReprovacaoEtica) {
        updateData.motivoReprovacaoEtica = motivoReprovacaoEtica;
      } else if (statusEtico !== "reprovado") {
        updateData.motivoReprovacaoEtica = null;
      }

      const [updatedCandidato] = await db
        .update(candidatos)
        .set(updateData)
        .where(eq(candidatos.id, id))
        .returning();

      if (!updatedCandidato) {
        return res.status(404).json({ error: "Candidato não encontrado" });
      }

      res.json(updatedCandidato);
    } catch (error) {
      console.error("Erro ao atualizar status ético:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Application approval workflow endpoints
  app.get("/api/candidaturas-pendentes", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user || !['admin', 'recrutador'].includes(user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const { ApprovalService } = await import('./services/approval-service');
      const pendingApplications = await ApprovalService.getPendingApplications(user.empresaId);
      
      res.json(pendingApplications);
    } catch (error) {
      console.error("Erro ao buscar candidaturas pendentes:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/candidaturas/:id/aprovar", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user || !['admin', 'recrutador'].includes(user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const { comentarios } = req.body;
      const { ApprovalService } = await import('./services/approval-service');
      const approvedApplication = await ApprovalService.approveApplication(
        req.params.id, 
        user.id, 
        comentarios
      );
      
      res.json({
        message: "Candidatura aprovada com sucesso",
        application: approvedApplication
      });
    } catch (error) {
      console.error("Erro ao aprovar candidatura:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/candidaturas/:id/rejeitar", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user || !['admin', 'recrutador'].includes(user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const { comentarios } = req.body;
      const { ApprovalService } = await import('./services/approval-service');
      const rejectedApplication = await ApprovalService.rejectApplication(
        req.params.id, 
        user.id, 
        comentarios
      );
      
      res.json({
        message: "Candidatura rejeitada",
        application: rejectedApplication
      });
    } catch (error) {
      console.error("Erro ao rejeitar candidatura:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Confirmação de presença via link/token
  app.get("/api/entrevistas/:id/confirmar-presenca", async (req, res, next) => {
    try {
      const { token, tipo } = req.query;
      const { id } = req.params;
      if (!token || !tipo || !["candidato", "entrevistador"].includes(tipo)) {
        return res.status(400).json({ message: "Token e tipo (candidato|entrevistador) são obrigatórios" });
      }
      const entrevista = await storage.getEntrevista(id);
      if (!entrevista) {
        return res.status(404).json({ message: "Entrevista não encontrada" });
      }
      if (tipo === "candidato") {
        if (entrevista.tokenConfirmacaoCandidato !== token) {
          return res.status(400).json({ message: "Token inválido para candidato" });
        }
        if (entrevista.confirmadoCandidato) {
          return res.json({ message: "Presença já confirmada pelo candidato" });
        }
        await storage.updateEntrevista(id, {
          confirmadoCandidato: true,
          dataConfirmacaoCandidato: new Date()
        });
        return res.json({ message: "Presença confirmada com sucesso (candidato)!" });
      } else {
        if (entrevista.tokenConfirmacaoEntrevistador !== token) {
          return res.status(400).json({ message: "Token inválido para entrevistador" });
        }
        if (entrevista.confirmadoEntrevistador) {
          return res.json({ message: "Presença já confirmada pelo entrevistador" });
        }
        await storage.updateEntrevista(id, {
          confirmadoEntrevistador: true,
          dataConfirmacaoEntrevistador: new Date()
        });
        return res.json({ message: "Presença confirmada com sucesso (entrevistador)!" });
      }
    } catch (error) {
      next(error);
    }
  });

  // Upload de currículo com extração automática
  app.post('/api/curriculos/upload', requireAuth, upload.single('file'), async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Arquivo não enviado.' });
      }
      // Declarar campos no início
      const campos = { nome: '', email: '', telefone: '', formacao: '', experiencia: '', cpf: '', linkedin: '' };
      // Extrair texto do arquivo
      let text = '';
      if (req.file.mimetype === 'application/pdf') {
        try {
          const pdfParse = (await import('pdf-parse')).default;
          const dataBuffer = fs.readFileSync(req.file.path);
          const data = await pdfParse(dataBuffer);
          text = data.text;
        } catch (error) {
          console.error('Erro ao processar PDF:', error);
          return res.status(400).json({ message: 'Erro ao processar arquivo PDF.' });
        }
      } else if (
        req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        req.file.mimetype === 'application/msword'
      ) {
        try {
          const data = await mammoth.extractRawText({ path: req.file.path });
          text = data.value;
        } catch (error) {
          console.error('Erro ao processar DOCX:', error);
          return res.status(400).json({ message: 'Erro ao processar arquivo DOCX.' });
        }
      } else if (req.file.mimetype === 'text/plain') {
        // Aceitar arquivos de texto para testes
        try {
          text = fs.readFileSync(req.file.path, 'utf-8');
        } catch (error) {
          console.error('Erro ao processar arquivo de texto:', error);
          return res.status(400).json({ message: 'Erro ao processar arquivo de texto.' });
        }
      } else {
        return res.status(400).json({ message: 'Formato de arquivo não suportado.' });
      }
      fs.unlinkSync(req.file.path); // Remove arquivo temporário

      // LOG do texto extraído para debug
      console.log('[DEBUG] Texto extraído do currículo:', text);

      // CPF: aceita prefixos e espaços
      let cpfMatch = text.match(/CPF[:\s.]*([0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2})/i);
      if (cpfMatch) campos.cpf = cpfMatch[1];
      else {
        // fallback: qualquer CPF no texto
        const cpfFallback = text.replace(/\s+/g, '').match(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/);
        if (cpfFallback) campos.cpf = cpfFallback[0];
      }
      // Data de Nascimento: aceita prefixo
      const nascMatch = text.match(/Data de Nascimento[:\s]*([0-9]{2}\/[0-9]{2}\/[0-9]{4})/i);
      if (nascMatch) campos.dataNascimento = nascMatch[1];
      // E-mail: aceita prefixo e fallback global
      let emailMatch = text.match(/E-?mail[:\s]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
      if (emailMatch) campos.email = emailMatch[1];
      else {
        // fallback: qualquer e-mail no texto
        const emailFallback = text.replace(/\s+/g, '').match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
        if (emailFallback) campos.email = emailFallback[0];
      }
      // Regex para telefone: buscar linhas com 'Telefone' ou 'Tel' prioritariamente
      let telMatch = null;
      const telLinha = text.split(/\r?\n/).find(l => /tel|telefone/i.test(l));
      if (telLinha) {
        telMatch = telLinha.match(/(\+\d{1,3}[\s-]?)?(\(?\d{2,3}\)?[\s-]?)?\d{4,5}[\s-]?\d{4}/g);
      }
      if (!telMatch) {
        telMatch = text.match(/(\+\d{1,3}[\s-]?)?(\(?\d{2,3}\)?[\s-]?)?\d{4,5}[\s-]?\d{4}/g);
      }
      if (telMatch) campos.telefone = telMatch[0];
      // Regex para LinkedIn
      const linkedinMatch = text.match(/https?:\/\/(www\.)?linkedin\.com\/[a-zA-Z0-9\-_/]+/);
      if (linkedinMatch) campos.linkedin = linkedinMatch[0];

      // Formação: bloco entre 'FORMAÇÃO', 'ESCOLARIDADE' e próximo título
      let formacaoBloco = '';
      const formacaoRegex = /(FORMA[ÇC][AÃ]O|ESCOLARIDADE)[\s\S]*?(?=\n[A-Z][A-ZÇÃÕÉÍÓÚÂÊÎÔÛÀÈÌÒÙÜ\s]{4,}|$)/i;
      const formacaoMatch = text.match(formacaoRegex);
      if (formacaoMatch) formacaoBloco = formacaoMatch[0];
      if (!formacaoBloco) {
        // fallback: busca por palavras-chave
        const formacaoMatch2 = text.match(/(Formação|Educação|Graduação|Ensino Superior|Universidade|Faculdade|Bacharelado|Licenciatura|Tecnólogo|Escolaridade)[\s\S]{0,400}/i);
        if (formacaoMatch2) formacaoBloco = formacaoMatch2[0];
      }
      campos.formacao = formacaoBloco.trim();

      // Experiência: bloco entre 'EXPERIÊNCIA', 'EXPERIÊNCIAS PROFISSIONAIS' e próximo título
      let expBloco = '';
      const expRegex = /(EXPERI[ÊE]NCIA(S)?( PROFISSIONAIS)?)[\s\S]*?(?=\n[A-Z][A-ZÇÃÕÉÍÓÚÂÊÎÔÛÀÈÌÒÙÜ\s]{4,}|$)/i;
      const expMatch = text.match(expRegex);
      if (expMatch) expBloco = expMatch[0];
      if (!expBloco) {
        // fallback: busca por palavras-chave
        const expMatch2 = text.match(/(Experiência|Experiências Profissionais|Atuação|Histórico Profissional|Emprego|Trabalho|Cargo)[\s\S]{0,600}/i);
        if (expMatch2) expBloco = expMatch2[0];
      }
      campos.experiencia = expBloco.trim();

      campos.nome = campos.nome.trim();

      const nenhumDadoExtraido = !campos.nome && !campos.email && !campos.telefone && !campos.formacao && !campos.experiencia;
      if (!text.trim() && req.file.mimetype === 'application/pdf') {
        return res.status(400).json({ message: 'O PDF enviado não contém texto extraível. Provavelmente é um arquivo escaneado. Use um PDF gerado digitalmente.' });
      }
      if (nenhumDadoExtraido) {
        return res.json({ nenhumDadoExtraido: true });
      }
      return res.json(campos);
    } catch (error) {
      next(error);
    }
  });

  // Endpoint para consultar histórico/auditoria de uma vaga
  app.get("/api/vagas/:id/auditoria", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const auditoria = await storage.getAuditoriaByVaga(req.params.id);
      res.json(auditoria);
    } catch (error) {
      next(error);
    }
  });

  // Pipeline etapas endpoints
  app.get("/api/vagas/:vagaId/etapas", requireAuth, async (req, res, next) => {
    try {
      const etapas = await storage.getEtapasByVaga(req.params.vagaId);
      res.json(etapas);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/vagas/:vagaId/etapas", requireAuth, async (req, res, next) => {
    try {
      if (!['admin', 'recrutador'].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const etapas = req.body.etapas;
      console.log('Recebendo etapas para salvar:', etapas);
      console.log('Vaga ID:', req.params.vagaId);
      
      // Remove etapas que não existem mais
      const etapasAtuais = await storage.getEtapasByVaga(req.params.vagaId);
      const idsAtuais = etapasAtuais.map(e => e.id);
      const idsNovos = etapas.filter(e => e.id).map(e => e.id);
      for (const id of idsAtuais) {
        if (!idsNovos.includes(id)) {
          await storage.deleteEtapa(id);
        }
      }
      // Atualiza ou cria etapas
      for (const etapa of etapas) {
        if (etapa.id) {
          // Sempre atualiza todos os campos editáveis
          await storage.updateEtapa(etapa.id, {
            nome: etapa.nome,
            cor: etapa.cor,
            ordem: etapa.ordem,
            camposObrigatorios: etapa.camposObrigatorios,
            responsaveis: etapa.responsaveis
          });
        } else {
          console.log('Criando nova etapa:', etapa);
          await storage.createEtapa({ ...etapa, vagaId: req.params.vagaId });
        }
      }
      const atualizadas = await storage.getEtapasByVaga(req.params.vagaId);
      console.log('Etapas atualizadas:', atualizadas);
      res.json(atualizadas);
    } catch (error) {
      console.error('Erro ao salvar etapas:', error);
      next(error);
    }
  });

  app.put("/api/etapas/:id", requireAuth, async (req, res, next) => {
    try {
      if (!['admin', 'recrutador'].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const etapaData = {
        ...req.body,
        camposObrigatorios: Array.isArray(req.body.camposObrigatorios) ? req.body.camposObrigatorios : [],
        responsaveis: Array.isArray(req.body.responsaveis) ? req.body.responsaveis : [],
      };
      const etapa = await storage.updateEtapa(req.params.id, etapaData);
      if (!etapa) {
        return res.status(404).json({ message: "Etapa não encontrada", code: "NOT_FOUND" });
      }
      await req.db.insert(pipelineAuditoria).values({
        vagaId: etapa.vagaId,
        candidatoId: null,
        usuarioId: req.user.id,
        acao: 'editar_etapa',
        etapaAnterior: null,
        etapaNova: etapa.nome,
        nota: null,
        comentarios: null,
        dataMovimentacao: new Date(),
        ip: req.ip,
        detalhes: { etapa }
      });
      res.json(etapa);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", code: "VALIDATION_ERROR", details: error.errors });
      }
      next(error);
    }
  });

  app.delete("/api/etapas/:id", requireAuth, async (req, res, next) => {
    try {
      if (!['admin', 'recrutador'].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const deleted = await storage.deleteEtapa(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Etapa não encontrada" });
      }
      // Auditoria
      await req.db.insert(pipelineAuditoria).values({
        vagaId: deleted.vagaId,
        candidatoId: null,
        usuarioId: req.user.id,
        acao: 'remover_etapa',
        etapaAnterior: deleted.nome,
        etapaNova: null,
        nota: null,
        comentarios: null,
        dataMovimentacao: new Date(),
        ip: req.ip,
        detalhes: { etapa: deleted }
      });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/vagas/:vagaId/etapas/reorder", requireAuth, async (req, res, next) => {
    try {
      if (!['admin', 'recrutador'].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const etapas = req.body.etapas; // [{id, ordem}]
      await storage.reorderEtapas(req.params.vagaId, etapas);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Exportação do pipeline em XLSX
  app.get("/api/vagas/:vagaId/pipeline/export", requireAuth, async (req, res, next) => {
    try {
      const pipeline = await storage.getCandidatosByVaga(req.params.vagaId);
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Pipeline");
      sheet.addRow(["Nome", "Email", "Etapa", "Nota", "Comentários"]);
      pipeline.forEach((c: any) => {
        sheet.addRow([
          c.candidato?.nome || "",
          c.candidato?.email || "",
          c.etapa,
          c.nota,
          c.comentarios
        ]);
      });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=pipeline.xlsx');
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      next(error);
    }
  });

  // Endpoint para buscar skills (autocomplete)
  app.get("/api/skills", requireAuth, async (req: Request, res: Response) => {
    try {
      const { search, limit = "50" } = req.query;
      let query = db.select().from(skills);
      if (search) {
        const words = (search as string).split(/\s+/).filter(Boolean);
        for (const word of words) {
          query = query.where(ilike(skills.nome, `%${word}%`));
        }
      }
      // Filtro de categoria removido temporariamente
      const results = await query.limit(parseInt(limit as string));
      res.json(results);
    } catch (error) {
      console.error("Erro ao buscar skills:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Endpoint para registrar feedback de match
  app.post("/api/match-feedback", requireAuth, async (req, res, next) => {
    try {
      const { vagaId, candidatoId, feedback, comentario } = req.body;
      if (!vagaId || !candidatoId || !feedback) {
        return res.status(400).json({ message: "vagaId, candidatoId e feedback são obrigatórios" });
      }
      const usuarioId = req.user.id;
      const [fb] = await db.insert(matchFeedback).values({ vagaId, candidatoId, usuarioId, feedback, comentario }).returning();
      res.status(201).json(fb);
    } catch (error) {
      next(error);
    }
  });

  // Endpoint para consultar feedbacks de match
  app.get("/api/match-feedback", requireAuth, async (req, res, next) => {
    try {
      const { vagaId, candidatoId } = req.query;
      let query = db.select().from(matchFeedback);
      if (vagaId) query = query.where(matchFeedback.vagaId.eq(vagaId));
      if (candidatoId) query = query.where(matchFeedback.candidatoId.eq(candidatoId));
      const feedbacks = await query;
      res.json(feedbacks);
    } catch (error) {
      next(error);
    }
  });

  // Endpoint para salvar configuração de matching por vaga
  app.post("/api/vagas/:id/matching-config", requireAuth, async (req, res, next) => {
    try {
      const vagaId = req.params.id;
      const config = req.body;
      // Remove configs antigas para a vaga
      await db.delete(vagaMatchingConfig).where(vagaMatchingConfig.vagaId.eq(vagaId));
      // Salva nova config
      const [saved] = await db.insert(vagaMatchingConfig).values({ vagaId, ...config }).returning();
      res.status(201).json(saved);
    } catch (error) {
      next(error);
    }
  });

  // Endpoint para recuperar configuração de matching por vaga
  app.get("/api/vagas/:id/matching-config", requireAuth, async (req, res, next) => {
    try {
      const vagaId = req.params.id;
      const [config] = await db.select().from(vagaMatchingConfig).where(vagaMatchingConfig.vagaId.eq(vagaId)).orderBy(vagaMatchingConfig.data.desc()).limit(1);
      res.json(config || null);
    } catch (error) {
      next(error);
    }
  });

  // CRUD de Competências (Skills)
  app.get("/api/skills", requireAuth, async (req: Request, res: Response) => {
    try {
      const { search, categoria, limit = "50" } = req.query;
      
      let query = db.select().from(skills);
      
      if (search) {
        query = query.where(like(skills.nome, `%${search}%`));
      }
      
      if (categoria) {
        query = query.where(eq(skills.categoria, categoria as string));
      }
      
      const results = await query.limit(parseInt(limit as string));
      res.json(results);
    } catch (error) {
      console.error("Erro ao buscar skills:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/skills", requireAuth, async (req: Request, res: Response) => {
    try {
      const { nome, codigoExterno, categoria } = req.body;
      
      if (!nome) {
        return res.status(400).json({ error: "Nome é obrigatório" });
      }
      
      const [newSkill] = await db.insert(skills).values({
        nome,
        codigoExterno: codigoExterno || null,
        categoria: categoria || "Custom"
      }).returning();
      
      res.status(201).json(newSkill);
    } catch (error) {
      console.error("Erro ao criar skill:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.put("/api/skills/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { nome, codigoExterno, categoria } = req.body;
      
      if (!nome) {
        return res.status(400).json({ error: "Nome é obrigatório" });
      }
      
      const [updatedSkill] = await db.update(skills)
        .set({
          nome,
          codigoExterno: codigoExterno || null,
          categoria: categoria || "Custom"
        })
        .where(eq(skills.id, id))
        .returning();
      
      if (!updatedSkill) {
        return res.status(404).json({ error: "Competência não encontrada" });
      }
      
      res.json(updatedSkill);
    } catch (error) {
      console.error("Erro ao atualizar skill:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.delete("/api/skills/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Verificar se a skill está sendo usada
      const candidatoSkills = await db.select().from(candidatoSkills).where(eq(candidatoSkills.skillId, id));
      const vagaSkills = await db.select().from(vagaSkills).where(eq(vagaSkills.skillId, id));
      
      if (candidatoSkills.length > 0 || vagaSkills.length > 0) {
        return res.status(400).json({ 
          error: "Não é possível excluir. Esta competência está sendo usada por candidatos ou vagas.",
          candidatos: candidatoSkills.length,
          vagas: vagaSkills.length
        });
      }
      
      const [deletedSkill] = await db.delete(skills)
        .where(eq(skills.id, id))
        .returning();
      
      if (!deletedSkill) {
        return res.status(404).json({ error: "Competência não encontrada" });
      }
      
      res.json({ message: "Competência excluída com sucesso" });
    } catch (error) {
      console.error("Erro ao excluir skill:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
