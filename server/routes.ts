import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertEmpresaSchema, insertDepartamentoSchema, insertUsuarioSchema, insertVagaSchema, insertTesteSchema, insertTesteResultadoSchema, insertEntrevistaSchema, insertPipelineEtapaSchema, pipelineAuditoria, matchFeedback, vagaMatchingConfig, insertPerfilVagaSchema, updatePerfilVagaSchema, insertQuadroIdealSchema, insertQuadroRealSchema, insertSolicitacaoVagaSchema } from "@shared/schema";
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
import OpenAI from "openai";
import { parse as csvParse } from 'csv-parse';
import { validate as isUuid } from 'uuid';
import { SolicitacaoVagaService } from './services/solicitacao-vaga-service';
import { requireAuth, requireRole } from './middleware/auth.middleware';
import { TimelineService } from './services/timeline-service';
import { insertEventoTimelineSchema } from '@shared/schema';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const scryptAsync = promisify(scrypt);
const upload = multer({ dest: '/tmp' });
const hf = new HfInference(process.env.HF_API_KEY || undefined);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const parseCSV = (filePath: string) => {
  return new Promise<any[]>((resolve, reject) => {
    const results: any[] = [];
    fs.createReadStream(filePath)
      .pipe(csvParse({ columns: true, trim: true }))
      .on('data', (data: any) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err: any) => reject(err));
  });
};

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

function requireRH(req: any, res: any, next: any) {
  if (!req.isAuthenticated() || !["admin", "recrutador", "rh"].includes(req.user.perfil)) {
    return res.status(403).json({ message: "Acesso restrito à equipe de RH/Admin." });
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
  app.get("/api/vagas", async (req, res, next) => {
    try {
      const { empresaId, departamentoId, status, incluirInativas, incluirOcultas } = req.query;
      let vagas;
      if (empresaId) {
        vagas = await storage.getVagasByEmpresa(empresaId as string);
      } else if (departamentoId) {
        vagas = await storage.getVagasByDepartamento(departamentoId as string);
      } else {
        vagas = await storage.getAllVagas();
      }
      // Filtro padrão: só vagas ativas e visíveis
      if (!incluirInativas) {
        vagas = vagas.filter(vaga => vaga.status !== "encerrada" && vaga.status !== "preenchida");
      }
      if (!incluirOcultas) {
        vagas = vagas.filter(vaga => vaga.visivel !== false);
      }
      // Filtro por status, se solicitado
      if (status) {
        vagas = vagas.filter(vaga => vaga.status === status);
      }
      res.json(vagas);
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
      
      // Aplicar modelo padrão de pipeline se existir
      try {
        const modeloPadrao = await storage.getModeloPipelinePadrao(vaga.empresaId);
        if (modeloPadrao) {
          await storage.aplicarModeloPipelineAVaga(vaga.id, modeloPadrao.id);
        }
      } catch (e) { 
        console.error('Erro ao aplicar modelo padrão:', e); 
      }
      
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
      // Após inserir na tabela vagaSkills, adicione:
      console.log(`Vaga ${vaga.id} associada às skills:`, skillsIds);
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
      // Registrar evento de cadastro na timeline
      const { TimelineService } = await import('./services/timeline-service');
      await TimelineService.criarEvento({
        candidatoId: candidato.id,
        tipoEvento: 'cadastro',
        descricao: 'Cadastro do candidato',
        usuarioResponsavelId: req.user.id,
        dataEvento: new Date(),
        origem: 'manual'
      });
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
        nota,
        comentarios,
        currentUser
      );
      // Registrar evento na timeline
      const { TimelineService } = await import('./services/timeline-service');
      await TimelineService.criarEvento({
        candidatoId: req.params.candidatoId,
        tipoEvento: 'movimentacao_pipeline',
        descricao: `Candidato movido para etapa "${etapa}". Comentários: ${comentarios || '-'} Nota: ${nota ?? '-'} `,
        usuarioResponsavelId: currentUser.id,
        dataEvento: new Date(),
        origem: 'pipeline'
      });
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

  // Pipeline Engagement Analytics routes
  app.get("/api/analytics/pipeline-engajamento", requireAuth, async (req, res, next) => {
    try {
      const user = req.user as any;
      if (!user || !['admin', 'recrutador', 'gestor'].includes(user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const { PipelineEngagementService } = await import('./services/pipeline-engagement-service');
      const engagementService = new PipelineEngagementService();
      
      const { vagaId } = req.query;
      const dashboard = await engagementService.getDashboardEngajamento(user.empresaId, vagaId as string);
      
      res.json(dashboard);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/analytics/pipeline-engajamento/tempo-medio", requireAuth, async (req, res, next) => {
    try {
      const user = req.user as any;
      if (!user || !['admin', 'recrutador', 'gestor'].includes(user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const { PipelineEngagementService } = await import('./services/pipeline-engagement-service');
      const engagementService = new PipelineEngagementService();
      
      const { vagaId } = req.query;
      const tempoMedio = await engagementService.getTempoMedioPorEtapa(user.empresaId, vagaId as string);
      
      res.json(tempoMedio);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/analytics/pipeline-engajamento/desistencia", requireAuth, async (req, res, next) => {
    try {
      const user = req.user as any;
      if (!user || !['admin', 'recrutador', 'gestor'].includes(user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const { PipelineEngagementService } = await import('./services/pipeline-engagement-service');
      const engagementService = new PipelineEngagementService();
      
      const { periodoDias = 30 } = req.query;
      const desistencia = await engagementService.getEtapasComMaiorDesistencia(user.empresaId, Number(periodoDias));
      
      res.json(desistencia);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/analytics/pipeline-engajamento/movimentacao", requireAuth, async (req, res, next) => {
    try {
      const user = req.user as any;
      if (!user || !['admin', 'recrutador', 'gestor'].includes(user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const { PipelineEngagementService } = await import('./services/pipeline-engagement-service');
      const engagementService = new PipelineEngagementService();
      
      const { periodoDias = 7 } = req.query;
      const movimentacao = await engagementService.getTaxaMovimentacao(user.empresaId, Number(periodoDias));
      
      res.json(movimentacao);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/analytics/pipeline-engajamento/sla-estourado", requireAuth, async (req, res, next) => {
    try {
      const user = req.user as any;
      if (!user || !['admin', 'recrutador', 'gestor'].includes(user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const { PipelineEngagementService } = await import('./services/pipeline-engagement-service');
      const engagementService = new PipelineEngagementService();
      
      const slaEstourado = await engagementService.getSlaEstourado(user.empresaId);
      
      res.json(slaEstourado);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/analytics/pipeline-engajamento/conversao", requireAuth, async (req, res, next) => {
    try {
      const user = req.user as any;
      if (!user || !['admin', 'recrutador', 'gestor'].includes(user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const { PipelineEngagementService } = await import('./services/pipeline-engagement-service');
      const engagementService = new PipelineEngagementService();
      
      const { vagaId } = req.query;
      const conversao = await engagementService.getConversaoPorEtapa(user.empresaId, vagaId as string);
      
      res.json(conversao);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/analytics/pipeline-engajamento/candidatos-parados", requireAuth, async (req, res, next) => {
    try {
      const user = req.user as any;
      if (!user || !['admin', 'recrutador', 'gestor'].includes(user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const { PipelineEngagementService } = await import('./services/pipeline-engagement-service');
      const engagementService = new PipelineEngagementService();
      
      const { diasMinimo = 3 } = req.query;
      const candidatosParados = await engagementService.getCandidatosParados(user.empresaId, Number(diasMinimo));
      
      res.json(candidatosParados);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/analytics/pipeline-engajamento/produtividade", requireAuth, async (req, res, next) => {
    try {
      const user = req.user as any;
      if (!user || !['admin', 'recrutador', 'gestor'].includes(user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      console.log("Usuário logado:", user.nome, "Empresa ID:", user.empresaId);

      const { PipelineEngagementService } = await import('./services/pipeline-engagement-service');
      const engagementService = new PipelineEngagementService();
      
      const { periodoDias = 30 } = req.query;
      const produtividade = await engagementService.getProdutividadeRecrutadores(user.empresaId, Number(periodoDias));
      
      console.log("Produtividade retornada:", produtividade);
      res.json(produtividade);
    } catch (error) {
      console.error("Erro na rota de produtividade:", error);
      next(error);
    }
  });

  // Rota de teste para verificar recrutadores (sem autenticação para debug)
  app.get("/api/test/recrutadores/:empresaId", async (req, res) => {
    try {
      const empresaId = req.params.empresaId;
      console.log("Testando empresa ID:", empresaId);
      
      const { db } = await import('./db');
      const { usuarios, empresas } = await import('../../shared/schema');
      const { eq, and, sql } = await import('drizzle-orm');
      
      const recrutadores = await db
        .select({
          recrutadorId: usuarios.id,
          recrutadorNome: usuarios.nome,
          recrutadorEmail: usuarios.email,
          empresaNome: empresas.nome
        })
        .from(usuarios)
        .innerJoin(empresas, eq(usuarios.empresaId, empresas.id))
        .where(
          and(
            eq(usuarios.empresaId, empresaId),
            sql`${usuarios.perfil} IN ('recrutador', 'admin', 'gestor')`
          )
        );
      
      console.log("Recrutadores encontrados:", recrutadores);
      res.json({ empresaId, recrutadores });
    } catch (error) {
      console.error("Erro no teste:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Rota para buscar vaga-candidatos com dados completos
  app.get("/api/vaga-candidatos", requireAuth, async (req, res, next) => {
    try {
      const user = req.user as any;
      if (!user || !['admin', 'recrutador', 'gestor'].includes(user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const { db } = await import('./db');
      const { vagaCandidatos, candidatos, vagas, usuarios } = await import('@shared/schema');
      const { eq, sql } = await import('drizzle-orm');

      const vagaCandidatosCompletos = await db
        .select({
          id: vagaCandidatos.id,
          candidatoId: vagaCandidatos.candidatoId,
          vagaId: vagaCandidatos.vagaId,
          responsavelId: vagaCandidatos.responsavelId,
          candidatoNome: candidatos.nome,
          vagaTitulo: vagas.titulo,
          responsavelNome: usuarios.nome
        })
        .from(vagaCandidatos)
        .innerJoin(candidatos, eq(vagaCandidatos.candidatoId, candidatos.id))
        .innerJoin(vagas, eq(vagaCandidatos.vagaId, vagas.id))
        .leftJoin(usuarios, eq(vagaCandidatos.responsavelId, usuarios.id));

      res.json(vagaCandidatosCompletos);
    } catch (error) {
      console.error("Erro ao buscar vaga-candidatos:", error);
      next(error);
    }
  });

  // Rota para buscar usuários por perfil
  app.get("/api/usuarios", requireAuth, async (req, res, next) => {
    try {
      const user = req.user as any;
      if (!user || !['admin', 'recrutador', 'gestor'].includes(user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const { perfil } = req.query;
      const { db } = await import('./db');
      const { usuarios, empresas } = await import('@shared/schema');
      const { eq, sql, inArray } = await import('drizzle-orm');

      let query = db
        .select({
          id: usuarios.id,
          nome: usuarios.nome,
          email: usuarios.email,
          perfil: usuarios.perfil,
          empresaNome: empresas.nome
        })
        .from(usuarios)
        .innerJoin(empresas, eq(usuarios.empresaId, empresas.id));

      if (perfil) {
        const perfis = (perfil as string).split(',');
        query = query.where(inArray(usuarios.perfil, perfis));
      }

      const usuariosData = await query;
      res.json(usuariosData);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      next(error);
    }
  });

  // Rota para atribuir recrutador a um candidato
  app.put("/api/vaga-candidatos/:id/assign", requireAuth, async (req, res, next) => {
    try {
      const user = req.user as any;
      if (!user || !['admin', 'recrutador', 'gestor'].includes(user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const { id } = req.params;
      const { responsavelId } = req.body;

      if (!responsavelId) {
        return res.status(400).json({ error: "ID do responsável é obrigatório" });
      }

      const { db } = await import('./db');
      const { vagaCandidatos } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');

      const [updated] = await db
        .update(vagaCandidatos)
        .set({ responsavelId })
        .where(eq(vagaCandidatos.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Vaga-candidato não encontrada" });
      }

      res.json({ message: "Responsável atribuído com sucesso", vagaCandidato: updated });
    } catch (error) {
      console.error("Erro ao atribuir responsável:", error);
      next(error);
    }
  });

  // Rotas para atribuição automática de vagas
  app.put("/api/vagas/:id/assign-responsavel", requireAuth, async (req, res, next) => {
    try {
      const user = req.user as any;
      if (!user || !['admin', 'recrutador', 'gestor'].includes(user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const { id } = req.params;
      const { responsavelId } = req.body;

      if (!responsavelId) {
        return res.status(400).json({ error: "ID do responsável é obrigatório" });
      }

      const { vagaAssignmentService } = await import('./services/vaga-assignment-service');
      const resultado = await vagaAssignmentService.atribuirResponsavelVaga(id, responsavelId);

      if (resultado.success) {
        res.json({ message: resultado.message });
      } else {
        res.status(400).json({ error: resultado.message });
      }
    } catch (error) {
      console.error("Erro ao atribuir responsável à vaga:", error);
      next(error);
    }
  });

  app.post("/api/vagas/:id/auto-assign-candidates", requireAuth, async (req, res, next) => {
    try {
      const user = req.user as any;
      if (!user || !['admin', 'recrutador', 'gestor'].includes(user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const { id } = req.params;
      const { vagaAssignmentService } = await import('./services/vaga-assignment-service');
      const resultado = await vagaAssignmentService.atribuirCandidatosAutomaticamente(id);

      if (resultado.success) {
        res.json({ 
          message: resultado.message, 
          candidatosAtribuidos: resultado.candidatosAtribuidos 
        });
      } else {
        res.status(400).json({ error: resultado.message });
      }
    } catch (error) {
      console.error("Erro na atribuição automática:", error);
      next(error);
    }
  });

  app.post("/api/vagas/global-auto-assign", requireAuth, async (req, res, next) => {
    try {
      const user = req.user as any;
      if (!user || !['admin'].includes(user.perfil)) {
        return res.status(403).json({ message: "Acesso negado - Apenas administradores" });
      }

      const { vagaAssignmentService } = await import('./services/vaga-assignment-service');
      const resultado = await vagaAssignmentService.executarAtribuicaoAutomaticaGlobal();

      if (resultado.success) {
        res.json({ 
          message: resultado.message, 
          totalAtribuidos: resultado.totalAtribuidos 
        });
      } else {
        res.status(400).json({ error: resultado.message });
      }
    } catch (error) {
      console.error("Erro na atribuição automática global:", error);
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
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      // Permitir apenas admin
      if (req.user?.perfil !== "admin") {
        return res.status(403).json({ message: "Apenas administradores podem usar recomendações de IA" });
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
      // Permitir apenas admin
      if (req.user?.perfil !== "admin") {
        return res.status(403).json({ message: "Apenas administradores podem usar insights de IA" });
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

  app.get("/api/etapas-pipeline", requireAuth, async (req, res, next) => {
    try {
      const { empresaId } = req.query;
      if (!empresaId) {
        return res.status(400).json({ message: "empresaId é obrigatório" });
      }
      const etapas = await storage.getEtapasPipelineByEmpresa(empresaId as string);
      res.json(etapas);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/etapas-pipeline", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const etapa = await storage.createEtapaPipelineEmpresa(req.body);
      res.json(etapa);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/etapas-pipeline/:id", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const etapa = await storage.updateEtapaPipelineEmpresa(req.params.id, req.body);
      res.json(etapa);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/etapas-pipeline/:id", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      await storage.deleteEtapaPipelineEmpresa(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/etapas-pipeline/reorder", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const { etapas } = req.body;
      await storage.reorderEtapasPipelineEmpresa(etapas);
      res.json({ message: "Ordem atualizada com sucesso" });
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/modelos-pipeline/:id/padrao", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const { empresaId } = req.body;
      await storage.setModeloPipelinePadrao(req.params.id, empresaId);
      res.json({ message: "Modelo definido como padrão" });
    } catch (error) {
      next(error);
    }
  });

  // Endpoints para migração de dados existentes
  app.get("/api/migracao/status", requireAuth, async (req, res, next) => {
    try {
      if (!["admin"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado - Apenas administradores" });
      }
      const { verificarStatusMigracao } = await import("./migration-script");
      const status = await verificarStatusMigracao();
      res.json(status);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/migracao/executar", requireAuth, async (req, res, next) => {
    try {
      if (!["admin"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado - Apenas administradores" });
      }
      const { migrarEmpresasEVagasExistentes } = await import("./migration-script");
      await migrarEmpresasEVagasExistentes();
      res.json({ message: "Migração executada com sucesso" });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/migracao/empresa/:empresaId", requireAuth, async (req, res, next) => {
    try {
      if (!["admin"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado - Apenas administradores" });
      }
      const { migrarEmpresaEspecifica } = await import("./migration-script");
      await migrarEmpresaEspecifica(req.params.empresaId);
      res.json({ message: "Migração da empresa executada com sucesso" });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/migracao/vaga/:vagaId", requireAuth, async (req, res, next) => {
    try {
      if (!["admin"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado - Apenas administradores" });
      }
      const { migrarVagaEspecifica } = await import("./migration-script");
      await migrarVagaEspecifica(req.params.vagaId);
      res.json({ message: "Migração da vaga executada com sucesso" });
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

      // Validação de unicidade do código externo
      if (codigoExterno) {
        const existing = await db.select().from(skills).where(eq(skills.codigoExterno, codigoExterno));
        if (existing.length > 0) {
          return res.status(400).json({ error: "Código externo já cadastrado para outra competência." });
        }
      }

      // Geração automática do código externo se não informado
      let finalCodigoExterno = codigoExterno;
      if (!finalCodigoExterno) {
        // Buscar o último código SKILL-XXXX
        const lastSkill = await db.select().from(skills)
          .where(like(skills.codigoExterno, 'SKILL-%'))
          .orderBy(sql`CAST(SUBSTRING(${skills.codigoExterno}, 7) AS INTEGER) DESC`)
          .limit(1);
        let nextNumber = 1;
        if (lastSkill.length > 0) {
          const lastCode = lastSkill[0].codigoExterno;
          const match = lastCode.match(/SKILL-(\d{4})/);
          if (match) {
            nextNumber = parseInt(match[1], 10) + 1;
          }
        }
        finalCodigoExterno = `SKILL-${String(nextNumber).padStart(4, '0')}`;
      }

      const [newSkill] = await db.insert(skills).values({
        nome,
        codigoExterno: finalCodigoExterno,
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

  // Perfis de Vaga endpoints
  app.get("/api/perfis-vaga", requireAuth, async (req, res, next) => {
    try {
      const { empresaId, departamentoId, nome, titulo, local } = req.query;
      let perfis;
      if (empresaId) {
        perfis = await storage.getPerfisVagaByEmpresa(empresaId as string);
      } else if (departamentoId) {
        perfis = await storage.getPerfisVagaByDepartamento(departamentoId as string);
      } else {
        perfis = await storage.getAllPerfisVaga();
      }
      // Filtros adicionais
      if (nome) {
        perfis = perfis.filter((p: any) => p.nomePerfil?.toLowerCase().includes((nome as string).toLowerCase()));
      }
      if (titulo) {
        perfis = perfis.filter((p: any) => p.tituloVaga?.toLowerCase().includes((titulo as string).toLowerCase()));
      }
      if (local) {
        perfis = perfis.filter((p: any) => p.localAtuacao?.toLowerCase().includes((local as string).toLowerCase()));
      }
      res.json(perfis);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/perfis-vaga/:id", requireAuth, async (req, res, next) => {
    try {
      const perfil = await storage.getPerfilVaga(req.params.id);
      if (!perfil) {
        return res.status(404).json({ message: "Perfil de vaga não encontrado" });
      }
      res.json(perfil);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/perfis-vaga", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const perfilData = insertPerfilVagaSchema.parse(req.body);
      const perfil = await storage.createPerfilVaga(perfilData);
      res.status(201).json(perfil);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  app.put("/api/perfis-vaga/:id", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const perfilData = updatePerfilVagaSchema.parse(req.body);
      const perfil = await storage.updatePerfilVaga(req.params.id, perfilData);
      if (!perfil) {
        return res.status(404).json({ message: "Perfil de vaga não encontrado" });
      }
      res.json(perfil);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  app.delete("/api/perfis-vaga/:id", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const deleted = await storage.deletePerfilVaga(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Perfil de vaga não encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  app.post("/ia/criar-perfil-vaga", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { cargo, tipo_contratacao, local, jornada, departamento, nivel, info_adicional } = req.body;
      const prompt = `Você é um especialista em recrutamento. Com base nas informações abaixo, gere um perfil completo de vaga:
- Cargo: ${cargo}
- Tipo de contratação: ${tipo_contratacao}
- Local: ${local}
- Jornada: ${jornada}
- Departamento: ${departamento}
- Nível: ${nivel}
- Observações: ${info_adicional}

Gere e retorne APENAS um JSON válido com os seguintes campos (use exatamente estes nomes de chave):
- nomePerfil (string)
- tituloVaga (string)
- descricaoFuncao (string)
- requisitosObrigatorios (array de string)
- requisitosDesejaveis (array de string)
- competenciasTecnicas (array de string)
- competenciasComportamentais (array de string)
- beneficios (array de string)
- tipoContratacao (string)
- faixaSalarial (string)
- empresaId (string, pode deixar vazio)
- departamentoId (string, pode deixar vazio)
- localAtuacao (string)
- modeloTrabalho (string)
- observacoesInternas (string)`;
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "Você é um especialista em RH. Responda sempre em JSON válido." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });
      // Log de auditoria (simples)
      console.log(`[IA] Perfil gerado por ${req.user.email} em ${new Date().toISOString()}:`, req.body);
      const result = JSON.parse(response.choices[0].message.content || '{}');
      res.json(result);
    } catch (error: any) {
      console.error("Erro IA criar-perfil-vaga:", error);
      res.status(500).json({ message: error.message || "Erro ao gerar perfil com IA" });
    }
  });

  // Jornadas detalhadas
  app.get("/api/jornadas", requireAuth, async (req, res, next) => {
    try {
      const empresaId = req.user.empresaId;
      const jornadas = await storage.getAllJornadas(empresaId);
      res.json(jornadas);
    } catch (error) { next(error); }
  });
  app.get("/api/jornadas/:id", requireAuth, async (req, res, next) => {
    try {
      const jornada = await storage.getJornada(req.params.id);
      if (!jornada) return res.status(404).json({ message: "Jornada não encontrada" });
      res.json(jornada);
    } catch (error) { next(error); }
  });
  app.post("/api/jornadas", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const data = { ...req.body, empresaId: req.user.empresaId };
      const [jornada] = await storage.createJornada(data);
      res.status(201).json(jornada);
    } catch (error) { next(error); }
  });
  app.put("/api/jornadas/:id", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const [jornada] = await storage.updateJornada(req.params.id, req.body);
      res.json(jornada);
    } catch (error) { next(error); }
  });
  app.delete("/api/jornadas/:id", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      await storage.deleteJornada(req.params.id);
      res.status(204).send();
    } catch (error) { next(error); }
  });

  // Quadro Ideal endpoints
  app.get("/api/quadro-ideal", requireAuth, async (req, res, next) => {
    try {
      const empresaId = req.user.empresaId;
      const quadros = await storage.getAllQuadrosIdeais(empresaId);
      res.json(quadros);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/quadro-ideal", requireAuth, async (req, res, next) => {
    try {
      const data = insertQuadroIdealSchema.parse({ ...req.body, empresaId: req.user.empresaId });
      const created = await storage.createQuadroIdeal(data);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  app.put("/api/quadro-ideal/:id", requireAuth, async (req, res, next) => {
    try {
      const data = insertQuadroIdealSchema.partial().parse(req.body);
      const updated = await storage.updateQuadroIdeal(req.params.id, data);
      if (!updated) {
        return res.status(404).json({ message: "Quadro Ideal não encontrado" });
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  app.delete("/api/quadro-ideal/:id", requireAuth, async (req, res, next) => {
    try {
      const deleted = await storage.deleteQuadroIdeal(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Quadro Ideal não encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Quadro Real endpoints
  app.get("/api/quadro-real", requireAuth, async (req, res, next) => {
    try {
      const empresaId = req.user.empresaId;
      const quadros = await storage.getAllQuadrosReais(empresaId);
      res.json(quadros);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/quadro-real/:id", requireAuth, async (req, res, next) => {
    try {
      const quadro = await storage.getQuadroReal(req.params.id);
      if (!quadro) {
        return res.status(404).json({ message: "Quadro Real não encontrado" });
      }
      res.json(quadro);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/quadro-real", requireAuth, async (req, res, next) => {
    try {
      const data = insertQuadroRealSchema.parse({ ...req.body, empresaId: req.user.empresaId });
      const created = await storage.createQuadroReal(data);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  app.put("/api/quadro-real/:id", requireAuth, async (req, res, next) => {
    try {
      const data = insertQuadroRealSchema.partial().parse(req.body);
      const updated = await storage.updateQuadroReal(req.params.id, data);
      if (!updated) {
        return res.status(404).json({ message: "Quadro Real não encontrado" });
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  app.delete("/api/quadro-real/:id", requireAuth, async (req, res, next) => {
    try {
      const deleted = await storage.deleteQuadroReal(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Quadro Real não encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Solicitação de Vaga endpoints
  app.get("/api/solicitacoes-vaga", requireAuth, async (req, res, next) => {
    try {
      const empresaId = req.user.empresaId;
      const solicitacoes = await storage.getAllSolicitacoesVaga(empresaId);
      res.json(solicitacoes);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/solicitacoes-vaga/:id", requireAuth, async (req, res, next) => {
    try {
      const solicitacao = await storage.getSolicitacaoVaga(req.params.id);
      if (!solicitacao) {
        return res.status(404).json({ message: "Solicitação não encontrada" });
      }
      res.json(solicitacao);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/solicitacoes-vaga", requireAuth, async (req, res, next) => {
    try {
      const data = insertSolicitacaoVagaSchema.parse({ ...req.body, empresaId: req.user.empresaId, criadoPor: req.user.id, origem: 'manual' });
      const created = await storage.createSolicitacaoVaga(data);
      await storage.createHistoricoSolicitacaoVaga({
        solicitacaoId: created.id,
        usuarioId: req.user.id,
        acao: 'criado',
        motivo: data.motivo || null
      });
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  app.put("/api/solicitacoes-vaga/:id", requireAuth, async (req, res, next) => {
    try {
      const data = insertSolicitacaoVagaSchema.partial().parse(req.body);
      const updated = await storage.updateSolicitacaoVaga(req.params.id, data);
      if (!updated) {
        return res.status(404).json({ message: "Solicitação não encontrada" });
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  app.delete("/api/solicitacoes-vaga/:id", requireAuth, async (req, res, next) => {
    try {
      const deleted = await storage.deleteSolicitacaoVaga(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Solicitação não encontrada" });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Aprovação/Reprovação de Solicitação de Vaga
  app.put("/api/solicitacoes-vaga/:id/aprovar", requireAuth, async (req, res, next) => {
    try {
      const updated = await storage.aprovarSolicitacaoVaga(req.params.id, req.user.id);
      if (!updated) {
        return res.status(404).json({ message: "Solicitação não encontrada" });
      }
      await storage.createHistoricoSolicitacaoVaga({
        solicitacaoId: req.params.id,
        usuarioId: req.user.id,
        acao: 'aprovado'
      });
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/solicitacoes-vaga/:id/reprovar", requireAuth, async (req, res, next) => {
    try {
      const motivo = req.body?.motivo || null;
      const updated = await storage.reprovarSolicitacaoVaga(req.params.id, req.user.id);
      if (!updated) {
        return res.status(404).json({ message: "Solicitação não encontrada" });
      }
      await storage.createHistoricoSolicitacaoVaga({
        solicitacaoId: req.params.id,
        usuarioId: req.user.id,
        acao: 'reprovado',
        motivo
      });
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  // Histórico de Quadro Ideal endpoint
  app.get("/api/quadro-ideal/historico/:quadroIdealId", requireAuth, async (req, res, next) => {
    try {
      const historico = await storage.getHistoricoQuadroIdeal(req.params.quadroIdealId);
      res.json(historico);
    } catch (error) {
      next(error);
    }
  });

  // Alertas/Gaps do Quadro Ideal
  app.get("/api/quadro-ideal/alertas", requireAuth, async (req, res, next) => {
    try {
      const alertas = await storage.getAlertasQuadroIdeal(req.user.empresaId);
      res.json(alertas);
    } catch (error) {
      console.error('[ALERTAS] Erro ao calcular alertas:', error);
      res.status(500).json({ message: 'Erro ao calcular alertas', error: error.message });
    }
  });

  // Rota genérica por ID (deve ficar por último)
  app.get("/api/quadro-ideal/:id", requireAuth, async (req, res, next) => {
    if (!isUuid(req.params.id)) {
      return res.status(400).json({ message: "ID inválido" });
    }
    console.log("Rota genérica chamada com id:", req.params.id);
    try {
      const quadro = await storage.getQuadroIdeal(req.params.id);
      if (!quadro) {
        return res.status(404).json({ message: "Quadro Ideal não encontrado" });
      }
      res.json(quadro);
    } catch (error) {
      next(error);
    }
  });

  // Abertura automática de solicitações de vaga
  app.post("/api/solicitacoes-vaga/automatica", requireAuth, async (req, res, next) => {
    try {
      const criadas = await storage.abrirSolicitacoesAutomaticas(req.user.empresaId, req.user.id);
      res.json({ message: `Solicitações automáticas criadas: ${criadas}` });
    } catch (error) {
      next(error);
    }
  });

  // Importação CSV para Quadro Ideal
  app.post("/api/quadro-ideal/importar-csv", requireAuth, upload.single('file'), async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'Arquivo não enviado.' });
      const rows = await parseCSV(req.file.path);
      let count = 0;
      for (const row of rows) {
        if (!row.departamentoId || !row.cargo || !row.quantidadeIdeal) continue;
        await storage.createQuadroIdeal({
          empresaId: req.user.empresaId,
          departamentoId: row.departamentoId,
          cargo: row.cargo,
          quantidadeIdeal: Number(row.quantidadeIdeal)
        });
        count++;
      }
      res.json({ message: `Importação concluída: ${count} registros inseridos.` });
    } catch (error) {
      next(error);
    }
  });

  // Importação CSV para Quadro Real (com abertura automática)
  app.post("/api/quadro-real/importar-csv", requireAuth, upload.single('file'), async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'Arquivo não enviado.' });
      const rows = await parseCSV(req.file.path);
      let count = 0;
      for (const row of rows) {
        if (!row.departamentoId || !row.cargo || !row.quantidadeAtual) continue;
        await storage.createQuadroReal({
          empresaId: req.user.empresaId,
          departamentoId: row.departamentoId,
          cargo: row.cargo,
          quantidadeAtual: Number(row.quantidadeAtual)
        });
        count++;
      }
      // Após importar, dispara abertura automática
      const criadas = await storage.abrirSolicitacoesAutomaticas(req.user.empresaId, req.user.id);
      res.json({ message: `Importação concluída: ${count} registros inseridos. Solicitações automáticas criadas: ${criadas}` });
    } catch (error) {
      next(error);
    }
  });

  // Histórico de Solicitação de Vaga
  app.get("/api/solicitacoes-vaga/:id/historico", requireAuth, async (req, res, next) => {
    try {
      const historico = await storage.getHistoricoSolicitacaoVaga(req.params.id);
      res.json(historico);
    } catch (error) {
      next(error);
    }
  });

  // Rotas para Solicitação de Vagas
  app.post('/vagas/solicitacoes', requireAuth, requireRole(['gestor']), async (req, res) => {
    try {
      const usuarioId = req.user.id;
      const solicitacao = await SolicitacaoVagaService.criarSolicitacao(req.body, usuarioId);
      res.status(201).json(solicitacao);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // Listar solicitações (RH/Admin vê todas, gestor vê as suas)
  app.get('/vagas/solicitacoes', requireAuth, async (req, res) => {
    let filtro = {};
    if (req.user.role === 'gestor') {
      filtro = { criadoPor: req.user.id };
    }
    const solicitacoes = await SolicitacaoVagaService.listarSolicitacoes(filtro);
    res.json(solicitacoes);
  });

  // Detalhar solicitação
  app.get('/vagas/solicitacoes/:id', requireAuth, async (req, res) => {
    const solicitacao = await SolicitacaoVagaService.detalharSolicitacao(req.params.id);
    if (!solicitacao) return res.status(404).json({ error: 'Solicitação não encontrada' });
    // Se gestor, só pode ver as suas
    if (req.user.role === 'gestor' && solicitacao.criadoPor !== req.user.id) {
      return res.status(403).json({ error: 'Acesso não autorizado.' });
    }
    res.json(solicitacao);
  });

  // Editar solicitação (RH/Admin)
  app.put('/vagas/solicitacoes/:id', requireAuth, requireRole(['rh', 'admin']), async (req, res) => {
    const usuarioId = req.user.id;
    const solicitacao = await SolicitacaoVagaService.editarSolicitacao(req.params.id, req.body, usuarioId);
    res.json(solicitacao);
  });

  // Aprovar solicitação (RH/Admin)
  app.post('/vagas/solicitacoes/:id/aprovar', requireAuth, requireRole(['rh', 'admin']), async (req, res) => {
    const usuarioId = req.user.id;
    const solicitacao = await SolicitacaoVagaService.aprovarSolicitacao(req.params.id, usuarioId);
    res.json(solicitacao);
  });

  // Rejeitar solicitação (RH/Admin)
  app.post('/vagas/solicitacoes/:id/rejeitar', requireAuth, requireRole(['rh', 'admin']), async (req, res) => {
    const usuarioId = req.user.id;
    const motivo = req.body.motivo;
    const solicitacao = await SolicitacaoVagaService.rejeitarSolicitacao(req.params.id, usuarioId, motivo);
    res.json(solicitacao);
  });

  // Listar histórico de ações
  app.get('/vagas/solicitacoes/:id/historico', requireAuth, async (req, res) => {
    const historico = await SolicitacaoVagaService.listarHistorico(req.params.id);
    res.json(historico);
  });

  // === Timeline do Candidato ===
  app.get('/api/candidatos/:id/timeline', requireAuth, async (req, res, next) => {
    try {
      const { tipoEvento, dataInicio, dataFim, usuarioResponsavelId, palavraChave, visivelParaCandidato } = req.query;
      const eventos = await TimelineService.listarEventos({
        candidatoId: req.params.id,
        tipoEvento: tipoEvento as string | undefined,
        dataInicio: dataInicio ? new Date(dataInicio as string) : undefined,
        dataFim: dataFim ? new Date(dataFim as string) : undefined,
        usuarioResponsavelId: usuarioResponsavelId as string | undefined,
        palavraChave: palavraChave as string | undefined,
        visivelParaCandidato: visivelParaCandidato !== undefined ? visivelParaCandidato === 'true' : undefined,
      });
      res.json(eventos);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/candidatos/:id/timeline', requireRH, async (req, res, next) => {
    try {
      const eventoData = insertEventoTimelineSchema.parse({ ...req.body, candidatoId: req.params.id });
      const evento = await TimelineService.criarEvento(eventoData);
      res.status(201).json(evento);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
      }
      next(error);
    }
  });

  // === Upload de arquivos para anexos da timeline ===
  app.post('/api/upload', requireAuth, upload.array('files'), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
      }
      // Mock: retorna URLs locais, ajuste para storage real se necessário
      const urls = files.map(f => `/uploads/${f.filename}`);
      // Registrar evento na timeline se informado candidatoId
      const { candidatoId } = req.body;
      if (candidatoId) {
        const { TimelineService } = await import('./services/timeline-service');
        await TimelineService.criarEvento({
          candidatoId,
          tipoEvento: 'anexo_adicionado',
          descricao: `Anexos adicionados: ${files.map(f => f.originalname).join(', ')}`,
          usuarioResponsavelId: req.user.id,
          dataEvento: new Date(),
          origem: 'upload'
        });
      }
      res.json({ urls });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao fazer upload.', error });
    }
  });

  // Upload de currículo (PDF/DOC)
  app.post('/api/upload/curriculo', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Arquivo não enviado.' });
      }
      const ext = path.extname(req.file.originalname).toLowerCase();
      if (!['.pdf', '.doc', '.docx'].includes(ext)) {
        return res.status(400).json({ message: 'Formato de arquivo não suportado.' });
      }
      // Renomear arquivo para evitar conflitos
      const newName = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}${ext}`;
      const destPath = path.join(__dirname, 'uploads', 'curriculos', newName);
      fs.renameSync(req.file.path, destPath);
      // Montar URL pública (ajustar conforme deploy)
      const url = `/uploads/curriculos/${newName}`;
      return res.json({ url });
    } catch (err) {
      console.error('Erro upload currículo:', err);
      return res.status(500).json({ message: 'Erro ao salvar arquivo.' });
    }
  });

  // Servir arquivos de currículo
  app.use('/uploads/curriculos', (req, res, next) => {
    const filePath = path.join(__dirname, 'uploads', 'curriculos', req.path);
    res.sendFile(filePath, (err) => {
      if (err) next();
    });
  });

  // Buscar empresa por slug
  app.get("/api/empresas", async (req, res, next) => {
    try {
      const { slug } = req.query;
      if (slug) {
        // Busca por slug (case-insensitive)
        const empresas = await storage.getAllEmpresas();
        const slugNorm = (slug as string).toLowerCase().replace(/[^a-z0-9]/g, "");
        const match = empresas.filter(e =>
          e.nome && e.nome.toLowerCase().replace(/[^a-z0-9]/g, "") === slugNorm
        );
        return res.json(match);
      }
      // Se não houver slug, retorna todas
      const empresas = await storage.getAllEmpresas();
      res.json(empresas);
    } catch (error) {
      next(error);
    }
  });

  // Modelos de Pipeline endpoints
  app.get("/api/empresas/:empresaId/modelos-pipeline", requireAuth, async (req, res, next) => {
    try {
      const modelos = await storage.getModelosPipelineByEmpresa(req.params.empresaId);
      res.json(modelos);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/modelos-pipeline/:id", requireAuth, async (req, res, next) => {
    try {
      const modelo = await storage.getModeloPipeline(req.params.id);
      if (!modelo) {
        return res.status(404).json({ message: "Modelo não encontrado" });
      }
      const etapas = await storage.getEtapasModeloPipeline(req.params.id);
      res.json({ ...modelo, etapas });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/modelos-pipeline", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const { insertModeloPipelineSchema } = await import("@shared/schema");
      const modeloData = insertModeloPipelineSchema.parse(req.body);
      const modelo = await storage.createModeloPipeline(modeloData);
      res.status(201).json(modelo);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  app.put("/api/modelos-pipeline/:id", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const { updateModeloPipelineSchema } = await import("@shared/schema");
      const modeloData = updateModeloPipelineSchema.parse(req.body);
      const modelo = await storage.updateModeloPipeline(req.params.id, modeloData);
      if (!modelo) {
        return res.status(404).json({ message: "Modelo não encontrado" });
      }
      res.json(modelo);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  app.delete("/api/modelos-pipeline/:id", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const deleted = await storage.deleteModeloPipeline(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Modelo não encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/modelos-pipeline/:id/padrao", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const modelo = await storage.getModeloPipeline(req.params.id);
      if (!modelo) {
        return res.status(404).json({ message: "Modelo não encontrado" });
      }
      await storage.setModeloPipelinePadrao(req.params.id, modelo.empresaId);
      res.json({ message: "Modelo definido como padrão" });
    } catch (error) {
      next(error);
    }
  });

  // Endpoint para buscar etapas do modelo padrão de uma empresa
  app.get("/api/empresas/:empresaId/etapas-pipeline", requireAuth, async (req, res, next) => {
    try {
      const etapas = await storage.getEtapasPipelineByEmpresa(req.params.empresaId);
      res.json(etapas);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/modelos-pipeline/:modeloId/etapas", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const { insertEtapaModeloPipelineSchema } = await import("@shared/schema");
      const etapaData = insertEtapaModeloPipelineSchema.parse(req.body);
      const etapa = await storage.createEtapaModeloPipeline({
        ...etapaData,
        modeloId: req.params.modeloId
      });
      res.status(201).json(etapa);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  app.put("/api/modelos-pipeline/etapas/:id", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const { updateEtapaModeloPipelineSchema } = await import("@shared/schema");
      const etapaData = updateEtapaModeloPipelineSchema.parse(req.body);
      const etapa = await storage.updateEtapaModeloPipeline(req.params.id, etapaData);
      if (!etapa) {
        return res.status(404).json({ message: "Etapa não encontrada" });
      }
      res.json(etapa);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  app.delete("/api/modelos-pipeline/etapas/:id", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const deleted = await storage.deleteEtapaModeloPipeline(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Etapa não encontrada" });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/vagas/:vagaId/aplicar-modelo/:modeloId", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      await storage.aplicarModeloPipelineAVaga(req.params.vagaId, req.params.modeloId);
      res.json({ message: "Modelo aplicado com sucesso" });
    } catch (error) {
      next(error);
    }
  });

  // Templates de Pipeline endpoints
  app.get("/api/pipeline/templates", requireAuth, async (req, res, next) => {
    try {
      const { PipelineTemplatesService } = await import("./services/pipeline-templates");
      const templates = PipelineTemplatesService.getEtapasPadraoSugeridas();
      res.json(templates);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/pipeline/templates/:tipoVaga", requireAuth, async (req, res, next) => {
    try {
      const { PipelineTemplatesService } = await import("./services/pipeline-templates");
      const templates = PipelineTemplatesService.getTemplatesPorTipoVaga(req.params.tipoVaga);
      res.json(templates);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/empresas/:empresaId/modelos-pipeline", requireAuth, async (req, res, next) => {
    try {
      console.log("[DEBUG] === POST ENDPOINT CHAMADO ===");
      console.log("[DEBUG] Body da requisição:", req.body);
      console.log("[DEBUG] Usuário:", req.user);
      
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        console.log("[DEBUG] Acesso negado - perfil:", (req as any).user.perfil);
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const { nome, descricao, etapas } = req.body;
      if (!nome) {
        return res.status(400).json({ message: "Nome do modelo é obrigatório" });
      }

      console.log("[DEBUG] Criando modelo com dados:", { nome, descricao, empresaId: req.params.empresaId });

      // Criar o modelo
      const modelo = await storage.createModeloPipeline({
        nome,
        descricao,
        empresaId: req.params.empresaId,
        ativo: true,
        padrao: false
      });

      console.log("[DEBUG] Modelo criado:", modelo);

      // Criar as etapas se fornecidas
      if (etapas && etapas.length > 0) {
        console.log("[DEBUG] Criando etapas:", etapas.length);
        for (const etapa of etapas) {
          await storage.createEtapaModeloPipeline({
            ...etapa,
            modeloId: modelo.id
          });
        }
      }

      // Buscar o modelo com suas etapas
      const modeloCompleto = await storage.getModeloPipeline(modelo.id);
      const etapasModelo = await storage.getEtapasModeloPipeline(modelo.id);
      
      console.log("[DEBUG] Retornando modelo completo:", { ...modeloCompleto, etapas: etapasModelo });
      res.status(201).json({ ...modeloCompleto, etapas: etapasModelo });
    } catch (error) {
      console.error("[DEBUG] Erro no POST:", error);
      next(error);
    }
  });

  app.post("/api/empresas/:empresaId/modelos-pipeline/template", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const { nome, tipoVaga } = req.body;
      if (!nome) {
        return res.status(400).json({ message: "Nome do modelo é obrigatório" });
      }

      const { PipelineTemplatesService } = await import("./services/pipeline-templates");
      const resultado = await PipelineTemplatesService.criarModeloPadraoCompleto(
        req.params.empresaId, 
        nome, 
        tipoVaga
      );
      
      res.status(201).json(resultado);
    } catch (error) {
      next(error);
    }
  });

  // Checklist endpoints
  app.get("/api/etapas/:etapaId/checklists", requireAuth, async (req, res, next) => {
    try {
      const checklists = await storage.getChecklistsByEtapa(req.params.etapaId);
      res.json(checklists);
    } catch (error) {
      next(error);
    }
  });

  // Checklist endpoints por tipo de etapa (para configuração)
  app.get("/api/etapas-tipo/:tipoEtapa/checklists", requireAuth, async (req, res, next) => {
    try {
      // Buscar checklists por tipo de etapa (recebidos, triagem, aprovado, etc.)
      const { tipoEtapa } = req.params;
      const { ChecklistTemplatesService } = await import("./services/checklist-templates");
      
      let templates: any[] = [];
      switch (tipoEtapa) {
        case 'recebidos':
        case 'triagem_curriculos':
          templates = ChecklistTemplatesService.getTemplatesDocumentacao();
          break;
        case 'entrevista_rh':
        case 'entrevista_gestor':
          templates = ChecklistTemplatesService.getTemplatesTarefasAdministrativas();
          break;
        case 'testes_tecnicos':
        case 'aprovacao_final':
          templates = ChecklistTemplatesService.getTemplatesValidacoes();
          break;
        case 'documentacao_admissional':
          templates = ChecklistTemplatesService.getTemplatesDocumentacao();
          break;
        case 'exames_medicos':
          templates = ChecklistTemplatesService.getTemplatesExamesMedicos();
          break;
        case 'contratacao':
        case 'integracao':
        case 'periodo_experiencia':
        case 'efetivacao':
          templates = ChecklistTemplatesService.getTemplatesTarefasAdministrativas();
          break;
        default:
          templates = [];
      }
      
      res.json(templates);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/etapas/:etapaId/checklists", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      // Se o etapaId é um tipo (recebidos, triagem_curriculos, etc.), não criar no banco
      const etapaId = req.params.etapaId;
      if (['recebidos', 'triagem_curriculos', 'entrevista_rh', 'testes_tecnicos', 'entrevista_gestor', 'aprovacao_final', 'documentacao_admissional', 'exames_medicos', 'contratacao', 'integracao', 'periodo_experiencia', 'efetivacao'].includes(etapaId)) {
        // Retornar sucesso mas não criar no banco (apenas para configuração)
        res.status(201).json({ 
          id: `temp_${Date.now()}`, 
          ...req.body, 
          etapaId,
          message: "Checklist configurado (não persistido no banco)" 
        });
        return;
      }
      
      const { insertChecklistEtapaSchema } = await import("@shared/schema");
      const checklistData = insertChecklistEtapaSchema.parse(req.body);
      const checklist = await storage.createChecklistEtapa({
        ...checklistData,
        etapaId: req.params.etapaId
      });
      res.status(201).json(checklist);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  app.put("/api/checklists/:id", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const { updateChecklistEtapaSchema } = await import("@shared/schema");
      const checklistData = updateChecklistEtapaSchema.parse(req.body);
      const checklist = await storage.updateChecklistEtapa(req.params.id, checklistData);
      if (!checklist) {
        return res.status(404).json({ message: "Checklist não encontrado" });
      }
      res.json(checklist);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  app.delete("/api/checklists/:id", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const deleted = await storage.deleteChecklistEtapa(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Checklist não encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Checklist por empresa endpoints
  app.get("/api/checklists-empresa", requireAuth, async (req, res, next) => {
    try {
      const { empresaId } = req.query;
      if (!empresaId) {
        return res.status(400).json({ message: "empresaId é obrigatório" });
      }
      const checklists = await storage.getChecklistsByEmpresa(empresaId as string);
      res.json(checklists);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/checklists-empresa", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const checklist = await storage.createChecklistEtapa(req.body);
      res.json(checklist);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/checklists-empresa/:id", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const checklist = await storage.updateChecklistEtapa(req.params.id, req.body);
      res.json(checklist);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/checklists-empresa/:id", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      await storage.deleteChecklistEtapa(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Templates de Checklist endpoints
  app.get("/api/checklist/templates", requireAuth, async (req, res, next) => {
    try {
      const { ChecklistTemplatesService } = await import("./services/checklist-templates");
      const templates = ChecklistTemplatesService.getAllTemplates();
      res.json(templates);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/etapas/:etapaId/checklists/template", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const { tipoEtapa } = req.body;
      if (!tipoEtapa) {
        return res.status(400).json({ message: "Tipo de etapa é obrigatório" });
      }

      // Se o etapaId é um tipo (recebidos, triagem_curriculos, etc.), retornar templates
      const etapaId = req.params.etapaId;
      if (['recebidos', 'triagem_curriculos', 'entrevista_rh', 'testes_tecnicos', 'entrevista_gestor', 'aprovacao_final', 'documentacao_admissional', 'exames_medicos', 'contratacao', 'integracao', 'periodo_experiencia', 'efetivacao'].includes(etapaId)) {
        const { ChecklistTemplatesService } = await import("./services/checklist-templates");
        let templates: any[] = [];
        
        switch (tipoEtapa) {
          case 'documentacao':
            templates = ChecklistTemplatesService.getTemplatesDocumentacao();
            break;
          case 'exames':
            templates = ChecklistTemplatesService.getTemplatesExamesMedicos();
            break;
          case 'tarefas':
            templates = ChecklistTemplatesService.getTemplatesTarefasAdministrativas();
            break;
          case 'validacoes':
            templates = ChecklistTemplatesService.getTemplatesValidacoes();
            break;
          default:
            templates = [];
        }
        
        // Adicionar IDs temporários para os templates
        const templatesComIds = templates.map((template, index) => ({
          ...template,
          id: `temp_${Date.now()}_${index}`,
          etapaId: etapaId
        }));
        
        res.status(201).json(templatesComIds);
        return;
      }

      const { ChecklistTemplatesService } = await import("./services/checklist-templates");
      const checklists = await ChecklistTemplatesService.criarChecklistsPadraoParaEtapa(
        req.params.etapaId, 
        tipoEtapa
      );
      
      res.status(201).json(checklists);
    } catch (error) {
      next(error);
    }
  });

  // Itens de Checklist por Candidato
  app.get("/api/vaga-candidatos/:vagaCandidatoId/checklist", requireAuth, async (req, res, next) => {
    try {
      const itens = await storage.getItensChecklistByCandidato(req.params.vagaCandidatoId);
      res.json(itens);
    } catch (error) {
      next(error);
    }
  });

  // Gerar link de upload para candidato
  app.get("/api/vaga-candidatos/:vagaCandidatoId/upload-link", requireAuth, async (req, res, next) => {
    try {
      if (!['admin', 'recrutador'].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const vagaCandidatoId = req.params.vagaCandidatoId;
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const uploadUrl = `${baseUrl}/upload/candidato/${vagaCandidatoId}`;
      
      res.json({ 
        url: uploadUrl,
        qrCode: `${baseUrl}/api/qr-code?url=${encodeURIComponent(uploadUrl)}`,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/vaga-candidatos/:vagaCandidatoId/checklist", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const { insertItemChecklistCandidatoSchema } = await import("@shared/schema");
      const itemData = insertItemChecklistCandidatoSchema.parse(req.body);
      const item = await storage.createItemChecklistCandidato({
        ...itemData,
        vagaCandidatoId: req.params.vagaCandidatoId
      });
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  app.put("/api/checklist-items/:id", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const { updateItemChecklistCandidatoSchema } = await import("@shared/schema");
      const itemData = updateItemChecklistCandidatoSchema.parse(req.body);
      const item = await storage.updateItemChecklistCandidato(req.params.id, itemData);
      if (!item) {
        return res.status(404).json({ message: "Item não encontrado" });
      }
      
      // Verificar se checklist está completo e mover candidato se necessário
      if (item.status === 'aprovado') {
        await storage.moverCandidatoSeChecklistCompleto(item.vagaCandidatoId);
      }
      
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  // Upload de arquivos para checklist (sem autenticação para candidatos)
  app.post("/api/checklist-items/:id/upload", async (req, res, next) => {
    try {
      // Aqui você implementaria o upload de arquivos
      // Por enquanto, vamos simular o upload
      const itemId = req.params.id;
      
      // Simular processamento de arquivos
      const anexos = [
        {
          nome: "documento.pdf",
          url: "/uploads/documento.pdf",
          tamanho: 1024000,
          tipo: "application/pdf"
        }
      ];
      
      // Atualizar o item com os anexos
      const item = await storage.updateItemChecklistCandidato(itemId, {
        anexos,
        status: "em_andamento"
      });
      
      res.json({ success: true, item });
    } catch (error) {
      next(error);
    }
  });

  // Informações do candidato para a página de upload
  app.get("/api/vaga-candidatos/:vagaCandidatoId/info", async (req, res, next) => {
    try {
      const vagaCandidatoId = req.params.vagaCandidatoId;
      
      // Buscar informações do candidato e vaga
      const vagaCandidato = await storage.getVagaCandidato(vagaCandidatoId);
      if (!vagaCandidato) {
        return res.status(404).json({ message: "Candidato não encontrado" });
      }
      
      const candidato = await storage.getCandidato(vagaCandidato.candidatoId);
      const vaga = await storage.getVaga(vagaCandidato.vagaId);
      const empresa = vaga ? await storage.getEmpresa(vaga.empresaId) : null;
      
      res.json({
        nome: candidato?.nome || "Candidato",
        email: candidato?.email || "",
        vaga: vaga?.titulo || "Vaga",
        empresa: empresa?.nome || "Empresa"
      });
    } catch (error) {
      next(error);
    }
  });

  // Automatização endpoints
  app.get("/api/etapas/:etapaId/automatizacoes", requireAuth, async (req, res, next) => {
    try {
      const automatizacoes = await storage.getAutomatizacoesByEtapa(req.params.etapaId);
      res.json(automatizacoes);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/etapas/:etapaId/automatizacoes", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const { insertAutomatizacaoEtapaSchema } = await import("@shared/schema");
      const automatizacaoData = insertAutomatizacaoEtapaSchema.parse(req.body);
      const automatizacao = await storage.createAutomatizacaoEtapa({
        ...automatizacaoData,
        etapaId: req.params.etapaId
      });
      res.status(201).json(automatizacao);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  app.put("/api/automatizacoes/:id", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const { updateAutomatizacaoEtapaSchema } = await import("@shared/schema");
      const automatizacaoData = updateAutomatizacaoEtapaSchema.parse(req.body);
      const automatizacao = await storage.updateAutomatizacaoEtapa(req.params.id, automatizacaoData);
      if (!automatizacao) {
        return res.status(404).json({ message: "Automatização não encontrada" });
      }
      res.json(automatizacao);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  app.delete("/api/automatizacoes/:id", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const deleted = await storage.deleteAutomatizacaoEtapa(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Automatização não encontrada" });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Templates de Automatização endpoints
  app.get("/api/automation/templates", requireAuth, async (req, res, next) => {
    try {
      const { AutomationTemplatesService } = await import("./services/automation-templates");
      const templates = AutomationTemplatesService.getAllTemplates();
      res.json(templates);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/etapas/:etapaId/automatizacoes/template", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const { tipoEtapa } = req.body;
      if (!tipoEtapa) {
        return res.status(400).json({ message: "Tipo de etapa é obrigatório" });
      }

      const { AutomationTemplatesService } = await import("./services/automation-templates");
      const automatizacoes = await AutomationTemplatesService.criarAutomatizacoesPadraoParaEtapa(
        req.params.etapaId, 
        tipoEtapa
      );
      
      res.status(201).json(automatizacoes);
    } catch (error) {
      next(error);
    }
  });

  // Execução de Automatizações
  app.post("/api/automatizacoes/:id/executar", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const { vagaCandidatoId } = req.body;
      if (!vagaCandidatoId) {
        return res.status(400).json({ message: "ID do candidato é obrigatório" });
      }

      const resultado = await storage.executarAutomatizacao(req.params.id, vagaCandidatoId);
      res.json(resultado);
    } catch (error) {
      next(error);
    }
  });

  // Logs de Automatizações
  app.get("/api/automatizacoes/:id/logs", requireAuth, async (req, res, next) => {
    try {
      const logs = await storage.getLogsAutomatizacao(req.params.id);
      res.json(logs);
    } catch (error) {
      next(error);
    }
  });

  // Motivos de Reprovação endpoints
  app.get("/api/empresas/:empresaId/motivos-reprovacao", requireAuth, async (req, res, next) => {
    try {
      const motivos = await storage.getMotivosReprovacaoByEmpresa(req.params.empresaId);
      res.json(motivos);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/empresas/:empresaId/motivos-reprovacao", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const { insertMotivoReprovacaoSchema } = await import("@shared/schema");
      const motivoData = insertMotivoReprovacaoSchema.parse(req.body);
      const motivo = await storage.createMotivoReprovacao({
        ...motivoData,
        empresaId: req.params.empresaId
      });
      res.status(201).json(motivo);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  app.put("/api/motivos-reprovacao/:id", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const { updateMotivoReprovacaoSchema } = await import("@shared/schema");
      const motivoData = updateMotivoReprovacaoSchema.parse(req.body);
      const motivo = await storage.updateMotivoReprovacao(req.params.id, motivoData);
      if (!motivo) {
        return res.status(404).json({ message: "Motivo não encontrado" });
      }
      res.json(motivo);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  app.delete("/api/motivos-reprovacao/:id", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const deleted = await storage.deleteMotivoReprovacao(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Motivo não encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Templates de Motivos de Reprovação endpoints
  app.get("/api/rejection/templates", requireAuth, async (req, res, next) => {
    try {
      const { RejectionTemplatesService } = await import("./services/rejection-templates");
      const templates = RejectionTemplatesService.getAllTemplates();
      res.json(templates);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/empresas/:empresaId/motivos-reprovacao/template", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const { categoria } = req.body;
      const { RejectionTemplatesService } = await import("./services/rejection-templates");
      
      let motivos;
      if (categoria) {
        motivos = await RejectionTemplatesService.criarMotivosPorCategoria(req.params.empresaId, categoria);
      } else {
        motivos = await RejectionTemplatesService.criarMotivosPadraoParaEmpresa(req.params.empresaId);
      }
      
      res.status(201).json(motivos);
    } catch (error) {
      next(error);
    }
  });

  // Histórico de Reprovações endpoints
  app.get("/api/vaga-candidatos/:vagaCandidatoId/historico-reprovacoes", requireAuth, async (req, res, next) => {
    try {
      const historico = await storage.getHistoricoReprovacoesByCandidato(req.params.vagaCandidatoId);
      res.json(historico);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/vaga-candidatos/:vagaCandidatoId/reprovar", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const { motivoId, motivoCustomizado, observacoes } = req.body;
      if (!motivoId && !motivoCustomizado) {
        return res.status(400).json({ message: "Motivo de reprovação é obrigatório" });
      }

      const historico = await storage.criarHistoricoReprovacao({
        vagaCandidatoId: req.params.vagaCandidatoId,
        motivoId,
        motivoCustomizado,
        observacoes,
        etapaReprovacao: "reprovado", // Será atualizado pelo pipeline
        reprovadoPor: (req as any).user.id,
        dataReprovacao: new Date()
      });
      
      res.status(201).json(historico);
    } catch (error) {
      next(error);
    }
  });

  // SLA endpoints
  app.get("/api/etapas/:etapaId/slas", requireAuth, async (req, res, next) => {
    try {
      const slas = await storage.getSlasByEtapa(req.params.etapaId);
      res.json(slas);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/etapas/:etapaId/slas", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const { insertSlaEtapaSchema } = await import("@shared/schema");
      const slaData = insertSlaEtapaSchema.parse(req.body);
      const sla = await storage.createSlaEtapa({
        ...slaData,
        etapaId: req.params.etapaId
      });
      res.status(201).json(sla);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  app.put("/api/slas/:id", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const { updateSlaEtapaSchema } = await import("@shared/schema");
      const slaData = updateSlaEtapaSchema.parse(req.body);
      const sla = await storage.updateSlaEtapa(req.params.id, slaData);
      if (!sla) {
        return res.status(404).json({ message: "SLA não encontrado" });
      }
      res.json(sla);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  app.delete("/api/slas/:id", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const deleted = await storage.deleteSlaEtapa(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "SLA não encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Templates de SLA endpoints
  app.get("/api/sla/templates", requireAuth, async (req, res, next) => {
    try {
      const { SlaTemplatesService } = await import("./services/sla-templates");
      const templates = SlaTemplatesService.getAllTemplates();
      res.json(templates);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/etapas/:etapaId/slas/template", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const { tipoEtapa } = req.body;
      if (!tipoEtapa) {
        return res.status(400).json({ message: "Tipo de etapa é obrigatório" });
      }

      const { SlaTemplatesService } = await import("./services/sla-templates");
      const slas = await SlaTemplatesService.criarSlasPadraoParaEtapa(
        req.params.etapaId, 
        tipoEtapa
      );
      
      res.status(201).json(slas);
    } catch (error) {
      next(error);
    }
  });

  // Alertas de SLA endpoints
  app.get("/api/sla/alertas/pendentes", requireAuth, async (req, res, next) => {
    try {
      const alertas = await storage.getAlertasSlaPendentes();
      res.json(alertas);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/vaga-candidatos/:vagaCandidatoId/sla-alertas", requireAuth, async (req, res, next) => {
    try {
      const alertas = await storage.getAlertasSlaByCandidato(req.params.vagaCandidatoId);
      res.json(alertas);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/sla-alertas/:id/resolver", requireAuth, async (req, res, next) => {
    try {
      if (!["admin", "recrutador"].includes((req as any).user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const alerta = await storage.resolverAlertaSla(req.params.id, (req as any).user.id);
      res.json(alerta);
    } catch (error) {
      next(error);
    }
  });

  // Notificações de SLA endpoints
  app.get("/api/sla/notificacoes/pendentes", requireAuth, async (req, res, next) => {
    try {
      const notificacoes = await storage.getNotificacoesSlaPendentes();
      res.json(notificacoes);
    } catch (error) {
      next(error);
    }
  });

  // Verificação de SLAs vencidos (para job/cron)
  app.post("/api/sla/verificar-vencidos", requireAuth, async (req, res, next) => {
    try {
      if ((req as any).user.perfil !== 'admin') {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const slasVencidos = await storage.verificarSlasVencidos();
      res.json({ 
        total: slasVencidos.length, 
        slas: slasVencidos 
      });
    } catch (error) {
      next(error);
    }
  });

  // Rotas específicas de vagas (devem vir antes das rotas com parâmetros)
  app.get("/api/vagas/with-responsavel", requireAuth, async (req, res, next) => {
    try {
      const user = req.user as any;
      if (!user || !['admin', 'recrutador', 'gestor'].includes(user.perfil)) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const { vagaAssignmentService } = await import('./services/vaga-assignment-service');
      const vagas = await vagaAssignmentService.getVagasComResponsavel();

      res.json(vagas);
    } catch (error) {
      console.error("Erro ao buscar vagas com responsável:", error);
      next(error);
    }
  });

  app.post("/api/vagas/global-auto-assign", requireAuth, async (req, res, next) => {
    try {
      const user = req.user as any;
      if (!user || !['admin'].includes(user.perfil)) {
        return res.status(403).json({ message: "Acesso negado - Apenas administradores" });
      }

      const { vagaAssignmentService } = await import('./services/vaga-assignment-service');
      const resultado = await vagaAssignmentService.executarAtribuicaoAutomaticaGlobal();

      if (resultado.success) {
        res.json({ 
          message: resultado.message, 
          totalAtribuidos: resultado.totalAtribuidos 
        });
      } else {
        res.status(400).json({ error: resultado.message });
      }
    } catch (error) {
      console.error("Erro na atribuição automática global:", error);
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

  const httpServer = createServer(app);
  return httpServer;
}
