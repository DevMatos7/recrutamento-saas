import { 
  empresas, 
  departamentos, 
  usuarios, 
  vagas,
  candidatos,
  vagaCandidatos,
  testes,
  testesResultados,
  entrevistas,
  comunicacoes,
  pipelineEtapas,
  type Empresa, 
  type InsertEmpresa,
  type Departamento, 
  type InsertDepartamento,
  type Usuario, 
  type InsertUsuario,
  type Vaga,
  type InsertVaga,
  type Candidato,
  type InsertCandidato,
  type VagaCandidato,
  type InsertVagaCandidato,
  type Teste,
  type InsertTeste,
  type TesteResultado,
  type InsertTesteResultado,
  type Entrevista,
  type InsertEntrevista,
  type Comunicacao,
  type InsertComunicacao,
  vagaAuditoria,
  type PipelineEtapa,
  type InsertPipelineEtapa,
  skills,
  perfisVaga,
  jornadas,
  type QuadroIdeal,
  type InsertQuadroIdeal,
  type QuadroReal,
  type InsertQuadroReal,
  quadrosReais,
  type SolicitacaoVaga,
  type InsertSolicitacaoVaga,
  solicitacoesVaga,
  type HistoricoQuadroIdeal,
  type InsertHistoricoQuadroIdeal,
  historicoQuadroIdeal,
  quadrosIdeais,
  type HistoricoSolicitacaoVaga,
  type InsertHistoricoSolicitacaoVaga,
  historicoSolicitacaoVaga
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, asc, lte, isNull, sql } from "drizzle-orm";
import session from "express-session";
import MemoryStore from "memorystore";

const MemStore = MemoryStore(session);

export interface IStorage {
  // Auth methods (required by blueprint)
  getUser(id: string): Promise<Usuario | undefined>;
  getUserByUsername(email: string): Promise<Usuario | undefined>;
  createUser(user: InsertUsuario): Promise<Usuario>;
  
  // Company methods
  getAllEmpresas(): Promise<Empresa[]>;
  getEmpresa(id: string): Promise<Empresa | undefined>;
  createEmpresa(empresa: InsertEmpresa): Promise<Empresa>;
  updateEmpresa(id: string, empresa: Partial<InsertEmpresa>): Promise<Empresa | undefined>;
  deleteEmpresa(id: string): Promise<boolean>;
  
  // Department methods
  getAllDepartamentos(): Promise<Departamento[]>;
  getDepartamentosByEmpresa(empresaId: string): Promise<Departamento[]>;
  getDepartamento(id: string): Promise<Departamento | undefined>;
  createDepartamento(departamento: InsertDepartamento): Promise<Departamento>;
  updateDepartamento(id: string, departamento: Partial<InsertDepartamento>): Promise<Departamento | undefined>;
  deleteDepartamento(id: string): Promise<boolean>;
  
  // User methods
  getAllUsuarios(): Promise<Usuario[]>;
  getUsuariosByEmpresa(empresaId: string): Promise<Usuario[]>;
  updateUsuario(id: string, usuario: Partial<InsertUsuario>): Promise<Usuario | undefined>;
  deleteUsuario(id: string): Promise<boolean>;
  
  // Job methods
  getAllVagas(): Promise<Vaga[]>;
  getVagasByEmpresa(empresaId: string): Promise<Vaga[]>;
  getVagasByDepartamento(departamentoId: string): Promise<Vaga[]>;
  getVaga(id: string): Promise<Vaga | undefined>;
  createVaga(vaga: InsertVaga): Promise<Vaga>;
  updateVaga(id: string, vaga: Partial<InsertVaga>): Promise<Vaga | undefined>;
  deleteVaga(id: string): Promise<boolean>;
  
  // Candidate methods
  getAllCandidatos(): Promise<Candidato[]>;
  getCandidatosByEmpresa(empresaId: string): Promise<Candidato[]>;
  getCandidato(id: string): Promise<Candidato | undefined>;
  createCandidato(candidato: InsertCandidato): Promise<Candidato>;
  updateCandidato(id: string, candidato: Partial<InsertCandidato>): Promise<Candidato | undefined>;
  deleteCandidato(id: string): Promise<boolean>;
  
  // Vaga-Candidato relationship methods
  getCandidatosByVaga(vagaId: string): Promise<any[]>;
  getVagasByCanditato(candidatoId: string): Promise<VagaCandidato[]>;
  getVagaCandidato(id: string): Promise<VagaCandidato | undefined>;
  inscreverCandidatoVaga(data: InsertVagaCandidato): Promise<VagaCandidato>;
  moverCandidatoEtapa(vagaId: string, candidatoId: string, etapa: string, comentarios?: string, nota?: number, responsavelId?: string): Promise<VagaCandidato | undefined>;
  
  // Pipeline specific methods
  getPipelineByVaga(vagaId: string): Promise<any>;
  getCandidatoHistorico(candidatoId: string): Promise<any[]>;
  
  // Tests methods
  getAllTestes(): Promise<Teste[]>;
  getTeste(id: string): Promise<Teste | undefined>;
  createTeste(teste: InsertTeste): Promise<Teste>;
  updateTeste(id: string, teste: Partial<InsertTeste>): Promise<Teste | undefined>;
  deleteTeste(id: string): Promise<boolean>;
  
  // Test results methods
  getTesteResultado(id: string): Promise<TesteResultado | undefined>;
  createTesteResultado(resultado: InsertTesteResultado): Promise<TesteResultado>;
  updateTesteResultado(id: string, resultado: Partial<InsertTesteResultado>): Promise<TesteResultado | undefined>;
  getResultadosByVaga(vagaId: string): Promise<any[]>;
  getResultadosByCandidato(candidatoId: string): Promise<any[]>;
  getTestesPendentes(candidatoId: string): Promise<any[]>;
  
  // Interview methods
  getAllEntrevistas(): Promise<Entrevista[]>;
  getEntrevista(id: string): Promise<Entrevista | undefined>;
  createEntrevista(entrevista: InsertEntrevista): Promise<Entrevista>;
  updateEntrevista(id: string, entrevista: Partial<InsertEntrevista>): Promise<Entrevista | undefined>;
  deleteEntrevista(id: string): Promise<boolean>;
  getEntrevistasByVaga(vagaId: string): Promise<any[]>;
  getEntrevistasByCandidato(candidatoId: string): Promise<any[]>;
  getEntrevistasByEntrevistador(entrevistadorId: string): Promise<any[]>;
  
  // Communication methods
  getAllComunicacoes(): Promise<Comunicacao[]>;
  getComunicacao(id: string): Promise<Comunicacao | undefined>;
  createComunicacao(comunicacao: InsertComunicacao): Promise<Comunicacao>;
  updateComunicacao(id: string, comunicacao: Partial<InsertComunicacao>): Promise<Comunicacao | undefined>;
  deleteComunicacao(id: string): Promise<boolean>;
  getComunicacoesByCanditato(candidatoId: string): Promise<any[]>;
  getComunicacoesByStatus(status: string): Promise<any[]>;
  getComunicacoesPendentes(): Promise<any[]>;
  
  // Analytics methods
  getDashboardGeral(empresaId: string): Promise<any>;
  getAnaliseVaga(vagaId: string, empresaId: string): Promise<any>;
  getAnaliseDepartamento(departamentoId: string, empresaId: string): Promise<any>;
  getAnaliseTestesVaga(vagaId: string, empresaId: string): Promise<any>;
  getAnaliseOrigens(empresaId: string): Promise<any>;
  getTemposPorEtapa(empresaId: string): Promise<any>;
  
  // Pipeline etapas methods
  getEtapasByVaga(vagaId: string): Promise<PipelineEtapa[]>;
  createEtapa(etapa: InsertPipelineEtapa): Promise<PipelineEtapa>;
  updateEtapa(id: string, etapa: Partial<InsertPipelineEtapa>): Promise<PipelineEtapa | undefined>;
  deleteEtapa(id: string): Promise<boolean>;
  reorderEtapas(vagaId: string, etapas: {id: string, ordem: number}[]): Promise<void>;
  
  // Perfis de Vaga methods
  getAllPerfisVaga(): Promise<any[]>;
  getPerfisVagaByEmpresa(empresaId: string): Promise<any[]>;
  getPerfisVagaByDepartamento(departamentoId: string): Promise<any[]>;
  getPerfilVaga(id: string): Promise<any | undefined>;
  createPerfilVaga(perfil: any): Promise<any>;
  updatePerfilVaga(id: string, perfil: Partial<any>): Promise<any | undefined>;
  deletePerfilVaga(id: string): Promise<boolean>;
  
  // Jornadas methods
  getAllJornadas(empresaId: string): Promise<any[]>;
  getJornada(id: string): Promise<any | undefined>;
  createJornada(data: any): Promise<any>;
  updateJornada(id: string, data: any): Promise<any | undefined>;
  deleteJornada(id: string): Promise<boolean>;
  
  // Quadro Ideal methods
  getAllQuadrosIdeais(empresaId: string): Promise<QuadroIdeal[]>;
  getQuadroIdeal(id: string): Promise<QuadroIdeal | undefined>;
  createQuadroIdeal(data: InsertQuadroIdeal): Promise<QuadroIdeal>;
  updateQuadroIdeal(id: string, data: Partial<InsertQuadroIdeal>): Promise<QuadroIdeal | undefined>;
  deleteQuadroIdeal(id: string): Promise<boolean>;
  
  // Quadro Real methods
  getAllQuadrosReais(empresaId: string): Promise<QuadroReal[]>;
  getQuadroReal(id: string): Promise<QuadroReal | undefined>;
  createQuadroReal(data: InsertQuadroReal): Promise<QuadroReal>;
  updateQuadroReal(id: string, data: Partial<InsertQuadroReal>): Promise<QuadroReal | undefined>;
  deleteQuadroReal(id: string): Promise<boolean>;
  
  // Solicitação de Vaga methods
  getAllSolicitacoesVaga(empresaId: string): Promise<SolicitacaoVaga[]>;
  getSolicitacaoVaga(id: string): Promise<SolicitacaoVaga | undefined>;
  createSolicitacaoVaga(data: InsertSolicitacaoVaga): Promise<SolicitacaoVaga>;
  updateSolicitacaoVaga(id: string, data: Partial<InsertSolicitacaoVaga>): Promise<SolicitacaoVaga | undefined>;
  deleteSolicitacaoVaga(id: string): Promise<boolean>;
  aprovarSolicitacaoVaga(id: string, aprovadoPor: string): Promise<SolicitacaoVaga | undefined>;
  reprovarSolicitacaoVaga(id: string, aprovadoPor: string): Promise<SolicitacaoVaga | undefined>;
  
  // Histórico de Quadro Ideal methods
  getHistoricoQuadroIdeal(quadroIdealId: string): Promise<HistoricoQuadroIdeal[]>;
  createHistoricoQuadroIdeal(data: InsertHistoricoQuadroIdeal): Promise<HistoricoQuadroIdeal>;
  
  // Histórico de Solicitação de Vaga
  getHistoricoSolicitacaoVaga(solicitacaoId: string): Promise<HistoricoSolicitacaoVaga[]>;
  createHistoricoSolicitacaoVaga(data: InsertHistoricoSolicitacaoVaga): Promise<HistoricoSolicitacaoVaga>;
  
  // Modelos de Pipeline methods
  getModelosPipelineByEmpresa(empresaId: string): Promise<any[]>;
  getModeloPipeline(id: string): Promise<any | undefined>;
  createModeloPipeline(modelo: any): Promise<any>;
  updateModeloPipeline(id: string, modelo: Partial<any>): Promise<any | undefined>;
  deleteModeloPipeline(id: string): Promise<boolean>;
  getModeloPipelinePadrao(empresaId: string): Promise<any | undefined>;
  setModeloPipelinePadrao(modeloId: string, empresaId: string): Promise<void>;
  getEtapasPipelineByEmpresa(empresaId: string): Promise<any[]>;
  getEtapasModeloPipeline(modeloId: string): Promise<any[]>;
  createEtapaModeloPipeline(etapa: any): Promise<any>;
  updateEtapaModeloPipeline(id: string, etapa: Partial<any>): Promise<any | undefined>;
  deleteEtapaModeloPipeline(id: string): Promise<boolean>;
  aplicarModeloPipelineAVaga(vagaId: string, modeloId: string): Promise<void>;
  
  // Checklist methods
  getChecklistsByEtapa(etapaId: string): Promise<any[]>;
  createChecklistEtapa(checklist: any): Promise<any>;
  updateChecklistEtapa(id: string, checklist: Partial<any>): Promise<any | undefined>;
  deleteChecklistEtapa(id: string): Promise<boolean>;
  getItensChecklistByCandidato(vagaCandidatoId: string): Promise<any[]>;
  createItemChecklistCandidato(item: any): Promise<any>;
  updateItemChecklistCandidato(id: string, item: Partial<any>): Promise<any | undefined>;
  deleteItemChecklistCandidato(id: string): Promise<boolean>;
  verificarChecklistCompleto(vagaCandidatoId: string): Promise<boolean>;
  moverCandidatoSeChecklistCompleto(vagaCandidatoId: string): Promise<void>;
  
  // Automatização methods
  getAutomatizacoesByEtapa(etapaId: string): Promise<any[]>;
  createAutomatizacaoEtapa(automatizacao: any): Promise<any>;
  updateAutomatizacaoEtapa(id: string, automatizacao: Partial<any>): Promise<any | undefined>;
  deleteAutomatizacaoEtapa(id: string): Promise<boolean>;
  getAutomatizacoesPendentes(): Promise<any[]>;
  executarAutomatizacao(automatizacaoId: string, vagaCandidatoId: string): Promise<any>;
  criarLogAutomatizacao(log: any): Promise<any>;
  atualizarLogAutomatizacao(id: string, log: Partial<any>): Promise<any | undefined>;
  getLogsAutomatizacao(automatizacaoId: string): Promise<any[]>;
  
  // Motivos de Reprovação methods
  getMotivosReprovacaoByEmpresa(empresaId: string): Promise<any[]>;
  createMotivoReprovacao(motivo: any): Promise<any>;
  updateMotivoReprovacao(id: string, motivo: Partial<any>): Promise<any | undefined>;
  deleteMotivoReprovacao(id: string): Promise<boolean>;
  getHistoricoReprovacoesByCandidato(vagaCandidatoId: string): Promise<any[]>;
  criarHistoricoReprovacao(historico: any): Promise<any>;
  reprovarCandidato(vagaCandidatoId: string, motivoId: string, motivoCustomizado: string, observacoes: string, reprovadoPor: string): Promise<any>;
  
  // SLA methods
  getSlasByEtapa(etapaId: string): Promise<any[]>;
  createSlaEtapa(sla: any): Promise<any>;
  updateSlaEtapa(id: string, sla: Partial<any>): Promise<any | undefined>;
  deleteSlaEtapa(id: string): Promise<boolean>;
  getAlertasSlaPendentes(): Promise<any[]>;
  getAlertasSlaByCandidato(vagaCandidatoId: string): Promise<any[]>;
  criarAlertaSla(alerta: any): Promise<any>;
  atualizarAlertaSla(id: string, alerta: Partial<any>): Promise<any | undefined>;
  resolverAlertaSla(id: string, resolvidoPor: string): Promise<any>;
  getNotificacoesSlaPendentes(): Promise<any[]>;
  criarNotificacaoSla(notificacao: any): Promise<any>;
  atualizarNotificacaoSla(id: string, notificacao: Partial<any>): Promise<any | undefined>;
  verificarSlasVencidos(): Promise<any[]>;
  calcularPrazoVencimento(slaId: string, dataInicio: Date): Promise<Date>;
  
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new MemStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }

  // Auth methods
  async getUser(id: string): Promise<Usuario | undefined> {
    const [user] = await db.select().from(usuarios).where(eq(usuarios.id, id));
    return user || undefined;
  }

  async getUserByUsername(email: string): Promise<Usuario | undefined> {
    const [user] = await db.select().from(usuarios).where(eq(usuarios.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUsuario): Promise<Usuario> {
    const [user] = await db
      .insert(usuarios)
      .values(insertUser)
      .returning();
    return user;
  }

  // Company methods
  async getAllEmpresas(): Promise<Empresa[]> {
    return db.select().from(empresas).orderBy(empresas.nome);
  }

  async getEmpresa(id: string): Promise<Empresa | undefined> {
    const [empresa] = await db.select().from(empresas).where(eq(empresas.id, id));
    return empresa || undefined;
  }

  async createEmpresa(empresa: InsertEmpresa): Promise<Empresa> {
    const [newEmpresa] = await db
      .insert(empresas)
      .values(empresa)
      .returning();
    return newEmpresa;
  }

  async updateEmpresa(id: string, empresa: Partial<InsertEmpresa>): Promise<Empresa | undefined> {
    const [updated] = await db
      .update(empresas)
      .set(empresa)
      .where(eq(empresas.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteEmpresa(id: string): Promise<boolean> {
    const result = await db.delete(empresas).where(eq(empresas.id, id));
    return result.rowCount! > 0;
  }

  // Department methods
  async getAllDepartamentos(): Promise<Departamento[]> {
    return db.select().from(departamentos).orderBy(desc(departamentos.dataCriacao));
  }

  async getDepartamentosByEmpresa(empresaId: string): Promise<Departamento[]> {
    return db.select().from(departamentos)
      .where(eq(departamentos.empresaId, empresaId))
      .orderBy(departamentos.nome);
  }

  async getDepartamento(id: string): Promise<Departamento | undefined> {
    const [departamento] = await db.select().from(departamentos).where(eq(departamentos.id, id));
    return departamento || undefined;
  }

  async createDepartamento(departamento: InsertDepartamento): Promise<Departamento> {
    const [newDepartamento] = await db
      .insert(departamentos)
      .values(departamento)
      .returning();
    return newDepartamento;
  }

  async updateDepartamento(id: string, departamento: Partial<InsertDepartamento>): Promise<Departamento | undefined> {
    const [updated] = await db
      .update(departamentos)
      .set({ ...departamento, dataAtualizacao: new Date() })
      .where(eq(departamentos.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteDepartamento(id: string): Promise<boolean> {
    const result = await db.delete(departamentos).where(eq(departamentos.id, id));
    return result.rowCount! > 0;
  }

  // User methods
  async getAllUsuarios(): Promise<Usuario[]> {
    return db.select().from(usuarios).orderBy(desc(usuarios.dataCriacao));
  }

  async getUsuariosByEmpresa(empresaId: string): Promise<Usuario[]> {
    return db.select().from(usuarios)
      .where(eq(usuarios.empresaId, empresaId))
      .orderBy(desc(usuarios.dataCriacao));
  }

  async updateUsuario(id: string, usuario: Partial<InsertUsuario>): Promise<Usuario | undefined> {
    const [updated] = await db
      .update(usuarios)
      .set(usuario)
      .where(eq(usuarios.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteUsuario(id: string): Promise<boolean> {
    // Soft delete - set ativo = 0
    const [updated] = await db
      .update(usuarios)
      .set({ ativo: 0 })
      .where(eq(usuarios.id, id))
      .returning();
    return !!updated;
  }

  // Job methods
  async getAllVagas(): Promise<Vaga[]> {
    return await db.select().from(vagas);
  }

  async getVagasByEmpresa(empresaId: string): Promise<Vaga[]> {
    return await db.select().from(vagas).where(eq(vagas.empresaId, empresaId));
  }

  async getVagasByDepartamento(departamentoId: string): Promise<Vaga[]> {
    return await db.select().from(vagas).where(eq(vagas.departamentoId, departamentoId));
  }

  async getVaga(id: string): Promise<Vaga | undefined> {
    const [vaga] = await db.select().from(vagas).where(eq(vagas.id, id));
    return vaga || undefined;
  }

  async createVaga(vaga: InsertVaga): Promise<Vaga> {
    const [created] = await db.insert(vagas).values(vaga).returning();
    return created;
  }

  async updateVaga(id: string, vaga: Partial<InsertVaga>): Promise<Vaga | undefined> {
    const [updated] = await db
      .update(vagas)
      .set({ ...vaga, dataAtualizacao: new Date() })
      .where(eq(vagas.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteVaga(id: string): Promise<boolean> {
    const result = await db.delete(vagas).where(eq(vagas.id, id));
    return result.rowCount! > 0;
  }

  // Candidate methods
  async getAllCandidatos(): Promise<Candidato[]> {
    return await db.select().from(candidatos).orderBy(desc(candidatos.dataCriacao));
  }

  async getCandidatosByEmpresa(empresaId: string): Promise<Candidato[]> {
    return await db.select().from(candidatos).where(eq(candidatos.empresaId, empresaId)).orderBy(desc(candidatos.dataCriacao));
  }

  async getCandidato(id: string): Promise<Candidato | undefined> {
    const [candidato] = await db.select().from(candidatos).where(eq(candidatos.id, id));
    if (!candidato) return undefined;
    return {
      ...candidato,
      experienciaProfissional: candidato.experienciaProfissional || [],
      educacao: candidato.educacao || [],
      habilidades: candidato.habilidades || [],
      idiomas: candidato.idiomas || [],
      certificacoes: candidato.certificacoes || [],
    };
  }

  async createCandidato(candidato: InsertCandidato): Promise<Candidato> {
    const [newCandidato] = await db.insert(candidatos).values(candidato).returning();
    return newCandidato;
  }

  async updateCandidato(id: string, candidato: Partial<InsertCandidato>): Promise<Candidato | undefined> {
    const [updated] = await db
      .update(candidatos)
      .set({ ...candidato, dataAtualizacao: new Date() })
      .where(eq(candidatos.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteCandidato(id: string): Promise<boolean> {
    try {
      // Delete all related records step by step to ensure proper deletion order
      
      // 1. First, delete DISC responses that reference avaliacoes
      await db.execute(sql`DELETE FROM respostas_disc WHERE avaliacao_id IN (SELECT id FROM avaliacoes WHERE candidato_id = ${id})`);
      
      // 2. Delete DISC evaluations
      await db.execute(sql`DELETE FROM avaliacoes WHERE candidato_id = ${id}`);
      
      // 3. Delete pipeline entries
      await db.execute(sql`DELETE FROM vaga_candidatos WHERE candidato_id = ${id}`);
      
      // 4. Delete test results
      await db.execute(sql`DELETE FROM testes_resultados WHERE candidato_id = ${id}`);
      
      // 5. Delete interviews
      await db.execute(sql`DELETE FROM entrevistas WHERE candidato_id = ${id}`);
      
      // 6. Delete communications
      await db.execute(sql`DELETE FROM comunicacoes WHERE candidato_id = ${id}`);
      
      // 7. Finally, delete the candidate
      const result = await db.execute(sql`DELETE FROM candidatos WHERE id = ${id}`);
      
      return true;
    } catch (error) {
      console.error("Error deleting candidato:", error);
      return false;
    }
  }

  // Vaga-Candidato relationship methods
  async getCandidatosByVaga(vagaId: string): Promise<any[]> {
    return await db.select({
      id: vagaCandidatos.id,
      vagaId: vagaCandidatos.vagaId,
      candidatoId: vagaCandidatos.candidatoId,
      etapa: vagaCandidatos.etapa,
      nota: vagaCandidatos.nota,
      comentarios: vagaCandidatos.comentarios,
      dataMovimentacao: vagaCandidatos.dataMovimentacao,
      dataInscricao: vagaCandidatos.dataInscricao,
      responsavelId: vagaCandidatos.responsavelId,
      candidato: {
        id: candidatos.id,
        nome: candidatos.nome,
        email: candidatos.email,
        telefone: candidatos.telefone,
        curriculoUrl: candidatos.curriculoUrl,
        linkedin: candidatos.linkedin,
        status: candidatos.status,
      }
    })
    .from(vagaCandidatos)
    .innerJoin(candidatos, eq(vagaCandidatos.candidatoId, candidatos.id))
    .where(eq(vagaCandidatos.vagaId, vagaId))
    .orderBy(desc(vagaCandidatos.dataMovimentacao));
  }

  async getVagasByCanditato(candidatoId: string): Promise<VagaCandidato[]> {
    return await db.select().from(vagaCandidatos).where(eq(vagaCandidatos.candidatoId, candidatoId)).orderBy(desc(vagaCandidatos.dataMovimentacao));
  }

  async getVagaCandidato(id: string): Promise<VagaCandidato | undefined> {
    const [vagaCandidato] = await db.select().from(vagaCandidatos).where(eq(vagaCandidatos.id, id));
    return vagaCandidato || undefined;
  }

  async inscreverCandidatoVaga(data: InsertVagaCandidato): Promise<VagaCandidato> {
    // Check if candidate is already enrolled in this job
    const existingInscricao = await db
      .select()
      .from(vagaCandidatos)
      .where(and(
        eq(vagaCandidatos.vagaId, data.vagaId),
        eq(vagaCandidatos.candidatoId, data.candidatoId)
      ))
      .limit(1);

    if (existingInscricao.length > 0) {
      throw new Error('Candidato já está inscrito nesta vaga');
    }

    const [inscricao] = await db.insert(vagaCandidatos).values({
      ...data,
      dataInscricao: new Date(),
      dataMovimentacao: new Date(),
    }).returning();
    return inscricao;
  }

  async moverCandidatoEtapa(vagaId: string, candidatoId: string, etapa: string, comentarios?: string, nota?: number, responsavelId?: string): Promise<VagaCandidato | undefined> {
    const [updated] = await db
      .update(vagaCandidatos)
      .set({ 
        etapa, 
        comentarios, 
        nota: nota?.toString(),
        responsavelId,
        dataMovimentacao: new Date() 
      })
      .where(and(
        eq(vagaCandidatos.vagaId, vagaId),
        eq(vagaCandidatos.candidatoId, candidatoId)
      ))
      .returning();
    return updated || undefined;
  }

  // Pipeline specific methods
  async getPipelineByVaga(vagaId: string): Promise<any> {
    const candidatos = await this.getCandidatosByVaga(vagaId);
    const etapas = await this.getEtapasByVaga(vagaId);
    
    // Criar objeto pipeline agrupando candidatos por id da etapa personalizada
    const pipeline: any = {};
    
    // Para cada etapa personalizada, criar uma chave com o id da etapa
    etapas.forEach(etapa => {
      pipeline[etapa.id] = candidatos.filter(c => c.etapa === etapa.id);
    });
    
    return pipeline;
  }

  async getCandidatoHistorico(candidatoId: string): Promise<any[]> {
    return await db.select({
      id: vagaCandidatos.id,
      vagaId: vagaCandidatos.vagaId,
      etapa: vagaCandidatos.etapa,
      nota: vagaCandidatos.nota,
      comentarios: vagaCandidatos.comentarios,
      dataMovimentacao: vagaCandidatos.dataMovimentacao,
      dataInscricao: vagaCandidatos.dataInscricao,
      vaga: {
        id: vagas.id,
        titulo: vagas.titulo,
        status: vagas.status,
      },
      responsavel: {
        id: usuarios.id,
        nome: usuarios.nome,
        email: usuarios.email,
      }
    })
    .from(vagaCandidatos)
    .innerJoin(vagas, eq(vagaCandidatos.vagaId, vagas.id))
    .leftJoin(usuarios, eq(vagaCandidatos.responsavelId, usuarios.id))
    .where(eq(vagaCandidatos.candidatoId, candidatoId))
    .orderBy(desc(vagaCandidatos.dataMovimentacao));
  }

  // Tests methods
  async getAllTestes(): Promise<Teste[]> {
    return await db.select().from(testes).where(eq(testes.ativo, true)).orderBy(desc(testes.dataCriacao));
  }

  async getTeste(id: string): Promise<Teste | undefined> {
    const [teste] = await db.select().from(testes).where(and(eq(testes.id, id), eq(testes.ativo, true)));
    return teste || undefined;
  }

  async createTeste(teste: InsertTeste): Promise<Teste> {
    const [novoTeste] = await db.insert(testes).values({
      ...teste,
      dataCriacao: new Date(),
      dataAtualizacao: new Date()
    }).returning();
    return novoTeste;
  }

  async updateTeste(id: string, teste: Partial<InsertTeste>): Promise<Teste | undefined> {
    const [testeAtualizado] = await db.update(testes)
      .set({ ...teste, dataAtualizacao: new Date() })
      .where(eq(testes.id, id))
      .returning();
    return testeAtualizado || undefined;
  }

  async deleteTeste(id: string): Promise<boolean> {
    const [testeDesativado] = await db.update(testes)
      .set({ ativo: false, dataAtualizacao: new Date() })
      .where(eq(testes.id, id))
      .returning();
    return !!testeDesativado;
  }

  // Test results methods
  async getTesteResultado(id: string): Promise<TesteResultado | undefined> {
    const [resultado] = await db.select().from(testesResultados).where(eq(testesResultados.id, id));
    return resultado || undefined;
  }

  async createTesteResultado(resultado: InsertTesteResultado): Promise<TesteResultado> {
    const [novoResultado] = await db.insert(testesResultados).values({
      ...resultado,
      dataEnvio: new Date()
    }).returning();
    return novoResultado;
  }

  async updateTesteResultado(id: string, resultado: Partial<InsertTesteResultado>): Promise<TesteResultado | undefined> {
    const [resultadoAtualizado] = await db.update(testesResultados)
      .set(resultado)
      .where(eq(testesResultados.id, id))
      .returning();
    return resultadoAtualizado || undefined;
  }

  async getResultadosByVaga(vagaId: string): Promise<any[]> {
    return await db.query.testesResultados.findMany({
      where: eq(testesResultados.vagaId, vagaId),
      with: {
        teste: true,
        candidato: true
      },
      orderBy: (testesResultados, { desc }) => [desc(testesResultados.dataEnvio)]
    });
  }

  async getResultadosByCandidato(candidatoId: string): Promise<any[]> {
    return await db.query.testesResultados.findMany({
      where: eq(testesResultados.candidatoId, candidatoId),
      with: {
        teste: true,
        vaga: true
      },
      orderBy: (testesResultados, { desc }) => [desc(testesResultados.dataEnvio)]
    });
  }

  async getTestesPendentes(candidatoId: string): Promise<any[]> {
    return await db.query.testesResultados.findMany({
      where: and(
        eq(testesResultados.candidatoId, candidatoId),
        eq(testesResultados.status, 'pendente')
      ),
      with: {
        teste: true,
        vaga: true
      },
      orderBy: (testesResultados, { desc }) => [desc(testesResultados.dataEnvio)]
    });
  }

  // Interview methods
  async getAllEntrevistas(): Promise<Entrevista[]> {
    return await db.select().from(entrevistas).orderBy(desc(entrevistas.dataHora));
  }

  async getEntrevista(id: string): Promise<Entrevista | undefined> {
    const [entrevista] = await db.select().from(entrevistas).where(eq(entrevistas.id, id));
    return entrevista || undefined;
  }

  async createEntrevista(entrevista: InsertEntrevista): Promise<Entrevista> {
    const [novaEntrevista] = await db.insert(entrevistas).values({
      ...entrevista,
      dataCriacao: new Date(),
      dataAtualizacao: new Date()
    }).returning();
    return novaEntrevista;
  }

  async updateEntrevista(id: string, entrevista: Partial<InsertEntrevista>): Promise<Entrevista | undefined> {
    const [entrevistaAtualizada] = await db.update(entrevistas)
      .set({ ...entrevista, dataAtualizacao: new Date() })
      .where(eq(entrevistas.id, id))
      .returning();
    return entrevistaAtualizada || undefined;
  }

  async deleteEntrevista(id: string): Promise<boolean> {
    const result = await db.delete(entrevistas).where(eq(entrevistas.id, id));
    return result.rowCount > 0;
  }

  async getEntrevistasByVaga(vagaId: string): Promise<any[]> {
    return await db.query.entrevistas.findMany({
      where: eq(entrevistas.vagaId, vagaId),
      with: {
        candidato: true,
        entrevistador: {
          columns: { id: true, nome: true, email: true, perfil: true }
        }
      },
      orderBy: (entrevistas, { desc }) => [desc(entrevistas.dataHora)]
    });
  }

  async getEntrevistasByCandidato(candidatoId: string): Promise<any[]> {
    return await db.query.entrevistas.findMany({
      where: eq(entrevistas.candidatoId, candidatoId),
      with: {
        vaga: { columns: { id: true, titulo: true, status: true } },
        entrevistador: {
          columns: { id: true, nome: true, email: true, perfil: true }
        }
      },
      orderBy: (entrevistas, { desc }) => [desc(entrevistas.dataHora)]
    });
  }

  async getEntrevistasByEntrevistador(entrevistadorId: string): Promise<any[]> {
    return await db.query.entrevistas.findMany({
      where: eq(entrevistas.entrevistadorId, entrevistadorId),
      with: {
        candidato: true,
        vaga: { columns: { id: true, titulo: true, status: true } }
      },
      orderBy: (entrevistas, { desc }) => [desc(entrevistas.dataHora)]
    });
  }

  // Communication methods implementation
  async getAllComunicacoes(): Promise<Comunicacao[]> {
    return await db.query.comunicacoes.findMany({
      with: {
        candidato: { columns: { id: true, nome: true, email: true, telefone: true } },
        enviadoPor: { columns: { id: true, nome: true } }
      },
      orderBy: (comunicacoes, { desc }) => [desc(comunicacoes.criadoEm)]
    });
  }

  async getComunicacao(id: string): Promise<Comunicacao | undefined> {
    return await db.query.comunicacoes.findFirst({
      where: eq(comunicacoes.id, id),
      with: {
        candidato: { columns: { id: true, nome: true, email: true, telefone: true } },
        enviadoPor: { columns: { id: true, nome: true } }
      }
    });
  }

  async createComunicacao(comunicacao: InsertComunicacao): Promise<Comunicacao> {
    const [newComunicacao] = await db.insert(comunicacoes).values({
      ...comunicacao,
      atualizadoEm: new Date(),
    }).returning();
    
    const result = await this.getComunicacao(newComunicacao.id);
    if (!result) throw new Error("Erro ao criar comunicação");
    return result;
  }

  async updateComunicacao(id: string, comunicacao: any): Promise<Comunicacao | undefined> {
    await db.update(comunicacoes)
      .set({ 
        ...comunicacao, 
        atualizadoEm: new Date()
      })
      .where(eq(comunicacoes.id, id));
    
    return await this.getComunicacao(id);
  }

  async deleteComunicacao(id: string): Promise<boolean> {
    const result = await db.delete(comunicacoes).where(eq(comunicacoes.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getComunicacoesByCanditato(candidatoId: string): Promise<any[]> {
    return await db.query.comunicacoes.findMany({
      where: eq(comunicacoes.candidatoId, candidatoId),
      with: {
        candidato: { columns: { id: true, nome: true, email: true, telefone: true } },
        enviadoPor: { columns: { id: true, nome: true } }
      },
      orderBy: (comunicacoes, { desc }) => [desc(comunicacoes.criadoEm)]
    });
  }

  async getComunicacoesByStatus(status: string): Promise<any[]> {
    return await db.query.comunicacoes.findMany({
      where: eq(comunicacoes.statusEnvio, status),
      with: {
        candidato: { columns: { id: true, nome: true, email: true, telefone: true } },
        enviadoPor: { columns: { id: true, nome: true } }
      },
      orderBy: (comunicacoes, { desc }) => [desc(comunicacoes.criadoEm)]
    });
  }

  async getComunicacoesPendentes(): Promise<any[]> {
    return await db.query.comunicacoes.findMany({
      where: and(
        eq(comunicacoes.statusEnvio, 'pendente'),
        or(
          isNull(comunicacoes.dataAgendada),
          lte(comunicacoes.dataAgendada, new Date())
        )
      ),
      with: {
        candidato: { columns: { id: true, nome: true, email: true, telefone: true } },
        enviadoPor: { columns: { id: true, nome: true } }
      },
      orderBy: (comunicacoes, { asc }) => [asc(comunicacoes.dataAgendada)]
    });
  }

  // Analytics methods implementation
  async getDashboardGeral(empresaId: string): Promise<any> {
    const { analyticsService } = await import('./services/analytics-service');
    return await analyticsService.getDashboardGeral(empresaId);
  }

  async getAnaliseVaga(vagaId: string, empresaId: string): Promise<any> {
    const { analyticsService } = await import('./services/analytics-service');
    return await analyticsService.getAnaliseVaga(vagaId, empresaId);
  }

  async getAnaliseDepartamento(departamentoId: string, empresaId: string): Promise<any> {
    const { analyticsService } = await import('./services/analytics-service');
    return await analyticsService.getAnaliseDepartamento(departamentoId, empresaId);
  }

  async getAnaliseTestesVaga(vagaId: string, empresaId: string): Promise<any> {
    const { analyticsService } = await import('./services/analytics-service');
    return await analyticsService.getAnaliseTestesVaga(vagaId, empresaId);
  }

  async getAnaliseOrigens(empresaId: string): Promise<any> {
    const { analyticsService } = await import('./services/analytics-service');
    return await analyticsService.getAnaliseOrigens(empresaId);
  }

  async getTemposPorEtapa(empresaId: string): Promise<any> {
    const { analyticsService } = await import('./services/analytics-service');
    return await analyticsService.getTemposPorEtapa(empresaId);
  }

  async createVagaAuditoria(auditoria: { vagaId: string, usuarioId: string, acao: string, detalhes: string | null }) {
    const [registro] = await db.insert(vagaAuditoria).values(auditoria).returning();
    return registro;
  }

  async getAuditoriaByVaga(vagaId: string) {
    return db.select().from(vagaAuditoria).where(eq(vagaAuditoria.vagaId, vagaId)).orderBy(desc(vagaAuditoria.data));
  }

  // Pipeline etapas methods
  async getEtapasByVaga(vagaId: string): Promise<PipelineEtapa[]> {
    return db.select().from(pipelineEtapas).where(eq(pipelineEtapas.vagaId, vagaId)).orderBy(pipelineEtapas.ordem);
  }

  async createEtapa(etapa: InsertPipelineEtapa): Promise<PipelineEtapa> {
    const [created] = await db.insert(pipelineEtapas).values(etapa).returning();
    return created;
  }

  async updateEtapa(id: string, etapa: Partial<InsertPipelineEtapa>): Promise<PipelineEtapa | undefined> {
    const [updated] = await db.update(pipelineEtapas).set(etapa).where(eq(pipelineEtapas.id, id)).returning();
    return updated || undefined;
  }

  async deleteEtapa(id: string): Promise<boolean> {
    const deleted = await db.delete(pipelineEtapas).where(eq(pipelineEtapas.id, id)).returning();
    return deleted.length > 0;
  }

  async reorderEtapas(vagaId: string, etapas: {id: string, ordem: number}[]): Promise<void> {
    for (const etapa of etapas) {
      await db.update(pipelineEtapas).set({ ordem: etapa.ordem }).where(eq(pipelineEtapas.id, etapa.id));
    }
  }

  // Skills methods
  async getSkills(query?: string): Promise<any[]> {
    if (query) {
      return db.select().from(skills).where(sql`LOWER(nome) LIKE ${'%' + query.toLowerCase() + '%'}`).orderBy(skills.nome);
    }
    return db.select().from(skills).orderBy(skills.nome);
  }

  // Perfis de Vaga methods
  async getAllPerfisVaga(): Promise<any[]> {
    return await db.select().from(perfisVaga);
  }

  async getPerfisVagaByEmpresa(empresaId: string): Promise<any[]> {
    return await db.select().from(perfisVaga).where(eq(perfisVaga.empresaId, empresaId));
  }

  async getPerfisVagaByDepartamento(departamentoId: string): Promise<any[]> {
    return await db.select().from(perfisVaga).where(eq(perfisVaga.departamentoId, departamentoId));
  }

  async getPerfilVaga(id: string): Promise<any | undefined> {
    const [perfil] = await db.select().from(perfisVaga).where(eq(perfisVaga.id, id));
    return perfil || undefined;
  }

  async createPerfilVaga(perfil: any): Promise<any> {
    const [created] = await db.insert(perfisVaga).values(perfil).returning();
    return created;
  }

  async updatePerfilVaga(id: string, perfil: Partial<any>): Promise<any | undefined> {
    const [updated] = await db
      .update(perfisVaga)
      .set({ ...perfil, dataAtualizacao: new Date() })
      .where(eq(perfisVaga.id, id))
      .returning();
    return updated || undefined;
  }

  async deletePerfilVaga(id: string): Promise<boolean> {
    const deleted = await db.delete(perfisVaga).where(eq(perfisVaga.id, id)).returning();
    return deleted.length > 0;
  }

  // Jornadas methods
  async getAllJornadas(empresaId: string): Promise<any[]> {
    return await db.select().from(jornadas).where(eq(jornadas.empresaId, empresaId));
  }
  async getJornada(id: string): Promise<any | undefined> {
    return await db.select().from(jornadas).where(eq(jornadas.id, id)).first();
  }
  async createJornada(data: any): Promise<any> {
    return await db.insert(jornadas).values(data).returning();
  }
  async updateJornada(id: string, data: any): Promise<any | undefined> {
    return await db.update(jornadas).set(data).where(eq(jornadas.id, id)).returning();
  }
  async deleteJornada(id: string): Promise<boolean> {
    return await db.delete(jornadas).where(eq(jornadas.id, id));
  }

  // Quadro Ideal methods
  async getAllQuadrosIdeais(empresaId: string): Promise<QuadroIdeal[]> {
    return db.select().from(quadrosIdeais).where(eq(quadrosIdeais.empresaId, empresaId));
  }

  async getQuadroIdeal(id: string): Promise<QuadroIdeal | undefined> {
    const [quadro] = await db.select().from(quadrosIdeais).where(eq(quadrosIdeais.id, id));
    return quadro || undefined;
  }

  async createQuadroIdeal(data: InsertQuadroIdeal): Promise<QuadroIdeal> {
    const [created] = await db.insert(quadrosIdeais).values(data).returning();
    return created;
  }

  async updateQuadroIdeal(id: string, data: Partial<InsertQuadroIdeal>): Promise<QuadroIdeal | undefined> {
    const [updated] = await db.update(quadrosIdeais).set({ ...data, atualizadoEm: new Date() }).where(eq(quadrosIdeais.id, id)).returning();
    return updated || undefined;
  }

  async deleteQuadroIdeal(id: string): Promise<boolean> {
    const result = await db.delete(quadrosIdeais).where(eq(quadrosIdeais.id, id));
    return result.rowCount! > 0;
  }

  // Quadro Real methods
  async getAllQuadrosReais(empresaId: string): Promise<QuadroReal[]> {
    return db.select().from(quadrosReais).where(eq(quadrosReais.empresaId, empresaId));
  }

  async getQuadroReal(id: string): Promise<QuadroReal | undefined> {
    const [quadro] = await db.select().from(quadrosReais).where(eq(quadrosReais.id, id));
    return quadro || undefined;
  }

  async createQuadroReal(data: InsertQuadroReal): Promise<QuadroReal> {
    const [created] = await db.insert(quadrosReais).values(data).returning();
    return created;
  }

  async updateQuadroReal(id: string, data: Partial<InsertQuadroReal>): Promise<QuadroReal | undefined> {
    const [updated] = await db.update(quadrosReais).set({ ...data, atualizadoEm: new Date() }).where(eq(quadrosReais.id, id)).returning();
    return updated || undefined;
  }

  async deleteQuadroReal(id: string): Promise<boolean> {
    const result = await db.delete(quadrosReais).where(eq(quadrosReais.id, id));
    return result.rowCount! > 0;
  }

  // Solicitação de Vaga methods
  async getAllSolicitacoesVaga(empresaId: string): Promise<SolicitacaoVaga[]> {
    return db.select().from(solicitacoesVaga).where(eq(solicitacoesVaga.empresaId, empresaId));
  }

  async getSolicitacaoVaga(id: string): Promise<SolicitacaoVaga | undefined> {
    const [sol] = await db.select().from(solicitacoesVaga).where(eq(solicitacoesVaga.id, id));
    return sol || undefined;
  }

  async createSolicitacaoVaga(data: InsertSolicitacaoVaga): Promise<SolicitacaoVaga> {
    const [created] = await db.insert(solicitacoesVaga).values(data).returning();
    return created;
  }

  async updateSolicitacaoVaga(id: string, data: Partial<InsertSolicitacaoVaga>): Promise<SolicitacaoVaga | undefined> {
    const [updated] = await db.update(solicitacoesVaga).set({ ...data, atualizadoEm: new Date() }).where(eq(solicitacoesVaga.id, id)).returning();
    return updated || undefined;
  }

  async deleteSolicitacaoVaga(id: string): Promise<boolean> {
    const result = await db.delete(solicitacoesVaga).where(eq(solicitacoesVaga.id, id));
    return result.rowCount! > 0;
  }

  async aprovarSolicitacaoVaga(id: string, aprovadoPor: string): Promise<SolicitacaoVaga | undefined> {
    const [updated] = await db.update(solicitacoesVaga)
      .set({ status: "aprovada", aprovadoPor, atualizadoEm: new Date() })
      .where(eq(solicitacoesVaga.id, id))
      .returning();
    return updated || undefined;
  }

  async reprovarSolicitacaoVaga(id: string, aprovadoPor: string): Promise<SolicitacaoVaga | undefined> {
    const [updated] = await db.update(solicitacoesVaga)
      .set({ status: "reprovada", aprovadoPor, atualizadoEm: new Date() })
      .where(eq(solicitacoesVaga.id, id))
      .returning();
    return updated || undefined;
  }

  // Histórico de Quadro Ideal methods
  async getHistoricoQuadroIdeal(quadroIdealId: string): Promise<HistoricoQuadroIdeal[]> {
    return db.select().from(historicoQuadroIdeal).where(eq(historicoQuadroIdeal.quadroIdealId, quadroIdealId)).orderBy(historicoQuadroIdeal.dataAlteracao);
  }

  async createHistoricoQuadroIdeal(data: InsertHistoricoQuadroIdeal): Promise<HistoricoQuadroIdeal> {
    const [created] = await db.insert(historicoQuadroIdeal).values(data).returning();
    return created;
  }

  // Histórico de Solicitação de Vaga
  async getHistoricoSolicitacaoVaga(solicitacaoId: string): Promise<HistoricoSolicitacaoVaga[]> {
    return db.select().from(historicoSolicitacaoVaga).where(eq(historicoSolicitacaoVaga.solicitacaoId, solicitacaoId)).orderBy(historicoSolicitacaoVaga.data);
  }

  async createHistoricoSolicitacaoVaga(data: InsertHistoricoSolicitacaoVaga): Promise<HistoricoSolicitacaoVaga> {
    const [created] = await db.insert(historicoSolicitacaoVaga).values(data).returning();
    return created;
  }

  // Modelos de Pipeline methods
  async getModelosPipelineByEmpresa(empresaId: string): Promise<any[]> {
    const { modelosPipeline } = await import("@shared/schema");
    return await db.select().from(modelosPipeline).where(eq(modelosPipeline.empresaId, empresaId));
  }

  async getModeloPipeline(id: string): Promise<any | undefined> {
    const { modelosPipeline } = await import("@shared/schema");
    const [modelo] = await db.select().from(modelosPipeline).where(eq(modelosPipeline.id, id));
    return modelo || undefined;
  }

  async createModeloPipeline(modelo: any): Promise<any> {
    const { modelosPipeline } = await import("@shared/schema");
    const [created] = await db.insert(modelosPipeline).values(modelo).returning();
    return created;
  }

  async updateModeloPipeline(id: string, modelo: Partial<any>): Promise<any | undefined> {
    const { modelosPipeline } = await import("@shared/schema");
    const [updated] = await db
      .update(modelosPipeline)
      .set({ ...modelo, dataAtualizacao: new Date() })
      .where(eq(modelosPipeline.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteModeloPipeline(id: string): Promise<boolean> {
    const { modelosPipeline } = await import("@shared/schema");
    const result = await db.delete(modelosPipeline).where(eq(modelosPipeline.id, id));
    return result.rowCount! > 0;
  }

  async getModeloPipelinePadrao(empresaId: string): Promise<any | undefined> {
    const { modelosPipeline } = await import("@shared/schema");
    const [padrao] = await db.select().from(modelosPipeline).where(and(eq(modelosPipeline.empresaId, empresaId), eq(modelosPipeline.padrao, true)));
    return padrao || undefined;
  }

  async setModeloPipelinePadrao(modeloId: string, empresaId: string): Promise<void> {
    const { modelosPipeline } = await import("@shared/schema");
    await db.update(modelosPipeline).set({ padrao: false }).where(eq(modelosPipeline.empresaId, empresaId));
    await db.update(modelosPipeline).set({ padrao: true }).where(and(eq(modelosPipeline.id, modeloId), eq(modelosPipeline.empresaId, empresaId)));
  }

  async getEtapasPipelineByEmpresa(empresaId: string): Promise<any[]> {
    const { modelosPipeline, etapasModeloPipeline } = await import("@shared/schema");
    
    // Buscar o modelo padrão da empresa
    const modeloPadrao = await db.select()
      .from(modelosPipeline)
      .where(and(
        eq(modelosPipeline.empresaId, empresaId),
        eq(modelosPipeline.padrao, true)
      ))
      .limit(1);
    
    if (modeloPadrao.length === 0) {
      // Se não há modelo padrão, retorna etapas padrão sugeridas
      return [
        { id: "recebidos", nome: "Recebidos", descricao: "Candidatos recém-inscritos", ordem: 1 },
        { id: "triagem_curriculos", nome: "Triagem de Currículos", descricao: "Análise inicial de currículos", ordem: 2 },
        { id: "entrevista_rh", nome: "Entrevista RH", descricao: "Entrevista com Recursos Humanos", ordem: 3 },
        { id: "testes_tecnicos", nome: "Testes Técnicos", descricao: "Avaliações técnicas e comportamentais", ordem: 4 },
        { id: "entrevista_gestor", nome: "Entrevista com Gestor", descricao: "Entrevista com gestor da área", ordem: 5 },
        { id: "aprovacao_final", nome: "Aprovação Final", descricao: "Aprovação final da contratação", ordem: 6 },
        { id: "documentacao_admissional", nome: "Recebimento da Documentação Admissional", descricao: "Coleta de documentos para admissão", ordem: 7 },
        { id: "exames_medicos", nome: "Realização de Exames Médicos", descricao: "Exames médicos admissionais", ordem: 8 },
        { id: "contratacao", nome: "Contratação", descricao: "Assinatura do contrato de trabalho", ordem: 9 },
        { id: "integracao", nome: "Integração e Ambientação", descricao: "Processo de integração do novo colaborador", ordem: 10 },
        { id: "periodo_experiencia", nome: "Período de Experiência – Fase 1", descricao: "Primeiros 30 dias de experiência", ordem: 11 },
        { id: "efetivacao", nome: "Efetivação – Após 90 dias", descricao: "Efetivação após período de experiência", ordem: 12 }
      ];
    }
    
    // Buscar etapas do modelo padrão
    const etapas = await db.select()
      .from(etapasModeloPipeline)
      .where(eq(etapasModeloPipeline.modeloId, modeloPadrao[0].id))
      .orderBy(asc(etapasModeloPipeline.ordem));
    
    // Se há poucas etapas (menos de 10), usar as etapas padrão
    if (etapas.length < 10) {
      return [
        { id: "recebidos", nome: "Recebidos", descricao: "Candidatos recém-inscritos", ordem: 1 },
        { id: "triagem_curriculos", nome: "Triagem de Currículos", descricao: "Análise inicial de currículos", ordem: 2 },
        { id: "entrevista_rh", nome: "Entrevista RH", descricao: "Entrevista com Recursos Humanos", ordem: 3 },
        { id: "testes_tecnicos", nome: "Testes Técnicos", descricao: "Avaliações técnicas e comportamentais", ordem: 4 },
        { id: "entrevista_gestor", nome: "Entrevista com Gestor", descricao: "Entrevista com gestor da área", ordem: 5 },
        { id: "aprovacao_final", nome: "Aprovação Final", descricao: "Aprovação final da contratação", ordem: 6 },
        { id: "documentacao_admissional", nome: "Recebimento da Documentação Admissional", descricao: "Coleta de documentos para admissão", ordem: 7 },
        { id: "exames_medicos", nome: "Realização de Exames Médicos", descricao: "Exames médicos admissionais", ordem: 8 },
        { id: "contratacao", nome: "Contratação", descricao: "Assinatura do contrato de trabalho", ordem: 9 },
        { id: "integracao", nome: "Integração e Ambientação", descricao: "Processo de integração do novo colaborador", ordem: 10 },
        { id: "periodo_experiencia", nome: "Período de Experiência – Fase 1", descricao: "Primeiros 30 dias de experiência", ordem: 11 },
        { id: "efetivacao", nome: "Efetivação – Após 90 dias", descricao: "Efetivação após período de experiência", ordem: 12 }
      ];
    }
    
    return etapas;
  }

  async getEtapasModeloPipeline(modeloId: string): Promise<any[]> {
    const { etapasModeloPipeline } = await import("@shared/schema");
    return await db.select().from(etapasModeloPipeline).where(eq(etapasModeloPipeline.modeloId, modeloId)).orderBy(asc(etapasModeloPipeline.ordem));
  }

  async createEtapaModeloPipeline(etapa: any): Promise<any> {
    const { etapasModeloPipeline } = await import("@shared/schema");
    const [created] = await db.insert(etapasModeloPipeline).values(etapa).returning();
    return created;
  }

  async updateEtapaModeloPipeline(id: string, etapa: Partial<any>): Promise<any | undefined> {
    const { etapasModeloPipeline } = await import("@shared/schema");
    const [updated] = await db
      .update(etapasModeloPipeline)
      .set({ ...etapa, dataAtualizacao: new Date() })
      .where(eq(etapasModeloPipeline.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteEtapaModeloPipeline(id: string): Promise<boolean> {
    const { etapasModeloPipeline } = await import("@shared/schema");
    const result = await db.delete(etapasModeloPipeline).where(eq(etapasModeloPipeline.id, id));
    return result.rowCount! > 0;
  }

  async aplicarModeloPipelineAVaga(vagaId: string, modeloId: string): Promise<void> {
    const { etapasModeloPipeline, pipelineEtapas } = await import("@shared/schema");
    const etapasModelo = await this.getEtapasModeloPipeline(modeloId);
    
    // Limpar etapas existentes da vaga
    await db.delete(pipelineEtapas).where(eq(pipelineEtapas.vagaId, vagaId));
    
    // Aplicar etapas do modelo à vaga
    for (let i = 0; i < etapasModelo.length; i++) {
      const etapaModelo = etapasModelo[i];
      await db.insert(pipelineEtapas).values({
        vagaId,
        nome: etapaModelo.nome,
        descricao: etapaModelo.descricao,
        ordem: i + 1,
        cor: etapaModelo.cor,
        camposObrigatorios: etapaModelo.camposObrigatorios,
        responsaveis: etapaModelo.responsaveis
      });
    }
  }

  // Checklist methods
  async getChecklistsByEtapa(etapaId: string): Promise<any[]> {
    const { checklistsEtapas } = await import("@shared/schema");
    return await db.select().from(checklistsEtapas).where(eq(checklistsEtapas.etapaId, etapaId)).orderBy(asc(checklistsEtapas.ordem));
  }

  async createChecklistEtapa(checklist: any): Promise<any> {
    const { checklistsEtapas } = await import("@shared/schema");
    const [created] = await db.insert(checklistsEtapas).values({
      ...checklist,
      dataAtualizacao: new Date()
    }).returning();
    return created;
  }

  async updateChecklistEtapa(id: string, checklist: Partial<any>): Promise<any | undefined> {
    const { checklistsEtapas } = await import("@shared/schema");
    const [updated] = await db
      .update(checklistsEtapas)
      .set({ ...checklist, dataAtualizacao: new Date() })
      .where(eq(checklistsEtapas.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteChecklistEtapa(id: string): Promise<boolean> {
    const { checklistsEtapas } = await import("@shared/schema");
    const result = await db.delete(checklistsEtapas).where(eq(checklistsEtapas.id, id));
    return result.rowCount! > 0;
  }

  async getItensChecklistByCandidato(vagaCandidatoId: string): Promise<any[]> {
    const { itensChecklistCandidato } = await import("@shared/schema");
    return await db.select().from(itensChecklistCandidato).where(eq(itensChecklistCandidato.vagaCandidatoId, vagaCandidatoId));
  }

  async createItemChecklistCandidato(item: any): Promise<any> {
    const { itensChecklistCandidato } = await import("@shared/schema");
    const [created] = await db.insert(itensChecklistCandidato).values({
      ...item,
      dataAtualizacao: new Date()
    }).returning();
    return created;
  }

  async updateItemChecklistCandidato(id: string, item: Partial<any>): Promise<any | undefined> {
    const { itensChecklistCandidato } = await import("@shared/schema");
    const [updated] = await db
      .update(itensChecklistCandidato)
      .set({ ...item, dataAtualizacao: new Date() })
      .where(eq(itensChecklistCandidato.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteItemChecklistCandidato(id: string): Promise<boolean> {
    const { itensChecklistCandidato } = await import("@shared/schema");
    const result = await db.delete(itensChecklistCandidato).where(eq(itensChecklistCandidato.id, id));
    return result.rowCount! > 0;
  }

  async verificarChecklistCompleto(vagaCandidatoId: string): Promise<boolean> {
    const { itensChecklistCandidato } = await import("@shared/schema");
    const itens = await db.select().from(itensChecklistCandidato).where(eq(itensChecklistCandidato.vagaCandidatoId, vagaCandidatoId));
    return itens.every(item => item.status === 'aprovado');
  }

  async moverCandidatoSeChecklistCompleto(vagaCandidatoId: string): Promise<void> {
    const { vagaCandidatos } = await import("@shared/schema");
    const completado = await this.verificarChecklistCompleto(vagaCandidatoId);
    if (completado) {
      const [vagaCandidato] = await db.select().from(vagaCandidatos).where(eq(vagaCandidatos.id, vagaCandidatoId));
      if (vagaCandidato) {
        // Mover para próxima etapa automaticamente
        await this.moverCandidatoEtapa(
          vagaCandidato.vagaId,
          vagaCandidato.candidatoId,
          'proxima_etapa',
          'Checklist completo - movido automaticamente',
          undefined,
          vagaCandidato.responsavelId
        );
      }
    }
  }

  // Automatização methods
  async getAutomatizacoesByEtapa(etapaId: string): Promise<any[]> {
    const { automatizacoesEtapas } = await import("@shared/schema");
    return await db.select().from(automatizacoesEtapas).where(eq(automatizacoesEtapas.etapaId, etapaId));
  }

  async createAutomatizacaoEtapa(automatizacao: any): Promise<any> {
    const { automatizacoesEtapas } = await import("@shared/schema");
    const [created] = await db.insert(automatizacoesEtapas).values({
      ...automatizacao,
      dataAtualizacao: new Date()
    }).returning();
    return created;
  }

  async updateAutomatizacaoEtapa(id: string, automatizacao: Partial<any>): Promise<any | undefined> {
    const { automatizacoesEtapas } = await import("@shared/schema");
    const [updated] = await db
      .update(automatizacoesEtapas)
      .set({ ...automatizacao, dataAtualizacao: new Date() })
      .where(eq(automatizacoesEtapas.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteAutomatizacaoEtapa(id: string): Promise<boolean> {
    const { automatizacoesEtapas } = await import("@shared/schema");
    const result = await db.delete(automatizacoesEtapas).where(eq(automatizacoesEtapas.id, id));
    return result.rowCount! > 0;
  }

  async getAutomatizacoesPendentes(): Promise<any[]> {
    const { automatizacoesEtapas } = await import("@shared/schema");
    return await db.select().from(automatizacoesEtapas).where(eq(automatizacoesEtapas.ativo, true));
  }

  async executarAutomatizacao(automatizacaoId: string, vagaCandidatoId: string): Promise<any> {
    const { automatizacoesEtapas, vagaCandidatos, logsAutomatizacoes } = await import("@shared/schema");
    const [automatizacao] = await db.select().from(automatizacoesEtapas).where(eq(automatizacoesEtapas.id, automatizacaoId));
    if (!automatizacao) throw new Error("Automatização não encontrada");

    const [vagaCandidato] = await db.select().from(vagaCandidatos).where(eq(vagaCandidatos.id, vagaCandidatoId));
    if (!vagaCandidato) throw new Error("Vaga Candidato não encontrado");

    // Criar log da execução
    const [log] = await db.insert(logsAutomatizacoes).values({
      automatizacaoId,
      vagaCandidatoId,
      status: 'executando',
      dadosEntrada: { automatizacao, vagaCandidato },
      tentativa: 1
    }).returning();

    try {
      // Executar ações baseadas no tipo de automatização
      let resultado = {};
      
      switch (automatizacao.tipo) {
        case 'movimento':
          // Mover candidato para próxima etapa
          resultado = await this.moverCandidatoEtapa(
            vagaCandidato.vagaId,
            vagaCandidato.candidatoId,
            'automatico',
            `Movido automaticamente por: ${automatizacao.nome}`,
            undefined,
            vagaCandidato.responsavelId
          );
          break;
          
        case 'webhook':
          // Executar webhook
          if (automatizacao.webhookUrl) {
            const response = await fetch(automatizacao.webhookUrl, {
              method: automatizacao.webhookMethod || 'POST',
              headers: automatizacao.webhookHeaders || { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                vagaCandidatoId,
                etapaId: automatizacao.etapaId,
                automatizacaoId,
                timestamp: new Date().toISOString()
              })
            });
            resultado = { status: response.status, ok: response.ok };
          }
          break;
          
        case 'notificacao':
          // Enviar notificação (implementar conforme necessário)
          resultado = { tipo: 'notificacao', enviada: true };
          break;
          
        default:
          resultado = { tipo: 'acao_personalizada', executada: true };
      }

      // Atualizar log com sucesso
      await db.update(logsAutomatizacoes)
        .set({ 
          status: 'sucesso', 
          resultado,
          dataExecucao: new Date()
        })
        .where(eq(logsAutomatizacoes.id, log.id));

      // Atualizar automatização
      await db.update(automatizacoesEtapas)
        .set({ 
          ultimaExecucao: new Date(),
          tentativasAtuais: 0
        })
        .where(eq(automatizacoesEtapas.id, automatizacaoId));

      return { ...log, status: 'sucesso', resultado };
    } catch (error) {
      // Atualizar log com erro
      await db.update(logsAutomatizacoes)
        .set({ 
          status: 'erro', 
          erro: error instanceof Error ? error.message : String(error),
          dataExecucao: new Date()
        })
        .where(eq(logsAutomatizacoes.id, log.id));

      // Incrementar tentativas
      await db.update(automatizacoesEtapas)
        .set({ 
          tentativasAtuais: automatizacao.tentativasAtuais + 1,
          ultimaExecucao: new Date()
        })
        .where(eq(automatizacoesEtapas.id, automatizacaoId));

      throw error;
    }
  }

  async criarLogAutomatizacao(log: any): Promise<any> {
    const { logsAutomatizacoes } = await import("@shared/schema");
    const [created] = await db.insert(logsAutomatizacoes).values(log).returning();
    return created;
  }

  async atualizarLogAutomatizacao(id: string, log: Partial<any>): Promise<any | undefined> {
    const { logsAutomatizacoes } = await import("@shared/schema");
    const [updated] = await db
      .update(logsAutomatizacoes)
      .set(log)
      .where(eq(logsAutomatizacoes.id, id))
      .returning();
    return updated || undefined;
  }

  async getLogsAutomatizacao(automatizacaoId: string): Promise<any[]> {
    const { logsAutomatizacoes } = await import("@shared/schema");
    return await db.select().from(logsAutomatizacoes).where(eq(logsAutomatizacoes.automatizacaoId, automatizacaoId)).orderBy(desc(logsAutomatizacoes.dataExecucao));
  }

  // Motivos de Reprovação methods
  async getMotivosReprovacaoByEmpresa(empresaId: string): Promise<any[]> {
    const { motivosReprovacao } = await import("@shared/schema");
    return await db.select().from(motivosReprovacao).where(eq(motivosReprovacao.empresaId, empresaId));
  }

  async createMotivoReprovacao(motivo: any): Promise<any> {
    const { motivosReprovacao } = await import("@shared/schema");
    const [created] = await db.insert(motivosReprovacao).values(motivo).returning();
    return created;
  }

  async updateMotivoReprovacao(id: string, motivo: Partial<any>): Promise<any | undefined> {
    const { motivosReprovacao } = await import("@shared/schema");
    const [updated] = await db
      .update(motivosReprovacao)
      .set({ ...motivo, dataAtualizacao: new Date() })
      .where(eq(motivosReprovacao.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteMotivoReprovacao(id: string): Promise<boolean> {
    const { motivosReprovacao } = await import("@shared/schema");
    const result = await db.delete(motivosReprovacao).where(eq(motivosReprovacao.id, id));
    return result.rowCount! > 0;
  }

  async getHistoricoReprovacoesByCandidato(vagaCandidatoId: string): Promise<any[]> {
    const { historicoReprovacoes } = await import("@shared/schema");
    return await db.select().from(historicoReprovacoes).where(eq(historicoReprovacoes.vagaCandidatoId, vagaCandidatoId)).orderBy(desc(historicoReprovacoes.data));
  }

  async criarHistoricoReprovacao(historico: any): Promise<any> {
    const { historicoReprovacoes } = await import("@shared/schema");
    const [created] = await db.insert(historicoReprovacoes).values(historico).returning();
    return created;
  }

  async reprovarCandidato(vagaCandidatoId: string, motivoId: string, motivoCustomizado: string, observacoes: string, reprovadoPor: string): Promise<any> {
    const { vagaCandidatos, historicoReprovacoes } = await import("@shared/schema");
    const [vagaCandidato] = await db.select().from(vagaCandidatos).where(eq(vagaCandidatos.id, vagaCandidatoId));
    if (!vagaCandidato) throw new Error("Vaga Candidato não encontrado");

    const [motivo] = await db.select().from(motivosReprovacao).where(eq(motivosReprovacao.id, motivoId));
    if (!motivo) throw new Error("Motivo de reprovação não encontrado");

    const [historico] = await db.insert(historicoReprovacoes).values({
      vagaCandidatoId,
      motivoId,
      motivoCustomizado,
      observacoes,
      reprovadoPor,
      data: new Date()
    }).returning();

    // Atualizar o status do candidato para 'reprovado'
    await db.update(vagaCandidatos)
      .set({ status: 'reprovado', dataAtualizacao: new Date() })
      .where(eq(vagaCandidatos.id, vagaCandidatoId));

    return historico;
  }

  // SLA methods
  async getSlasByEtapa(etapaId: string): Promise<any[]> {
    const { slasEtapas } = await import("@shared/schema");
    return await db.select().from(slasEtapas).where(eq(slasEtapas.etapaId, etapaId));
  }

  async createSlaEtapa(sla: any): Promise<any> {
    const { slasEtapas } = await import("@shared/schema");
    const [created] = await db.insert(slasEtapas).values({
      ...sla,
      dataAtualizacao: new Date()
    }).returning();
    return created;
  }

  async updateSlaEtapa(id: string, sla: Partial<any>): Promise<any | undefined> {
    const { slasEtapas } = await import("@shared/schema");
    const [updated] = await db
      .update(slasEtapas)
      .set({ ...sla, dataAtualizacao: new Date() })
      .where(eq(slasEtapas.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteSlaEtapa(id: string): Promise<boolean> {
    const { slasEtapas } = await import("@shared/schema");
    const result = await db.delete(slasEtapas).where(eq(slasEtapas.id, id));
    return result.rowCount! > 0;
  }

  async getAlertasSlaPendentes(): Promise<any[]> {
    const { alertasSla } = await import("@shared/schema");
    return await db.select().from(alertasSla).where(eq(alertasSla.status, 'pendente'));
  }

  async getAlertasSlaByCandidato(vagaCandidatoId: string): Promise<any[]> {
    const { alertasSla } = await import("@shared/schema");
    return await db.select().from(alertasSla).where(eq(alertasSla.vagaCandidatoId, vagaCandidatoId));
  }

  async criarAlertaSla(alerta: any): Promise<any> {
    const { alertasSla } = await import("@shared/schema");
    const [created] = await db.insert(alertasSla).values(alerta).returning();
    return created;
  }

  async atualizarAlertaSla(id: string, alerta: Partial<any>): Promise<any | undefined> {
    const { alertasSla } = await import("@shared/schema");
    const [updated] = await db
      .update(alertasSla)
      .set(alerta)
      .where(eq(alertasSla.id, id))
      .returning();
    return updated || undefined;
  }

  async resolverAlertaSla(id: string, resolvidoPor: string): Promise<any> {
    const { alertasSla } = await import("@shared/schema");
    const [updated] = await db
      .update(alertasSla)
      .set({ 
        status: 'resolvido', 
        resolvidoPor,
        dataResolucao: new Date()
      })
      .where(eq(alertasSla.id, id))
      .returning();
    return updated;
  }

  async getNotificacoesSlaPendentes(): Promise<any[]> {
    const { notificacoesSla } = await import("@shared/schema");
    return await db.select().from(notificacoesSla).where(eq(notificacoesSla.status, 'pendente'));
  }

  async criarNotificacaoSla(notificacao: any): Promise<any> {
    const { notificacoesSla } = await import("@shared/schema");
    const [created] = await db.insert(notificacoesSla).values(notificacao).returning();
    return created;
  }

  async atualizarNotificacaoSla(id: string, notificacao: Partial<any>): Promise<any | undefined> {
    const { notificacoesSla } = await import("@shared/schema");
    const [updated] = await db
      .update(notificacoesSla)
      .set(notificacao)
      .where(eq(notificacoesSla.id, id))
      .returning();
    return updated || undefined;
  }

  async verificarSlasVencidos(): Promise<any[]> {
    const { alertasSla, slasEtapas, vagaCandidatos } = await import("@shared/schema");
    const agora = new Date();
    
    // Buscar alertas vencidos
    const alertasVencidos = await db
      .select()
      .from(alertasSla)
      .where(and(
        eq(alertasSla.status, 'pendente'),
        lt(alertasSla.dataVencimento, agora)
      ));

    return alertasVencidos;
  }

  async calcularPrazoVencimento(slaId: string, dataInicio: Date): Promise<Date> {
    const { slasEtapas } = await import("@shared/schema");
    const [sla] = await db.select().from(slasEtapas).where(eq(slasEtapas.id, slaId));
    
    if (!sla) {
      throw new Error("SLA não encontrado");
    }

    const dataVencimento = new Date(dataInicio);
    
    switch (sla.tipoPrazo) {
      case 'horas':
        dataVencimento.setHours(dataVencimento.getHours() + sla.prazoHoras);
        break;
      case 'dias':
        dataVencimento.setDate(dataVencimento.getDate() + sla.prazoDias);
        break;
      case 'semanas':
        dataVencimento.setDate(dataVencimento.getDate() + (sla.prazoDias * 7));
        break;
      default:
        dataVencimento.setDate(dataVencimento.getDate() + sla.prazoDias);
    }

    return dataVencimento;
  }

  // Alertas/Gaps do Quadro Ideal
  async getAlertasQuadroIdeal(empresaId: string): Promise<any[]> {
    console.info('[ALERTAS] Buscando alertas para empresa:', empresaId);
    const quadrosIdeaisDb = await db.select().from(quadrosIdeais).where(eq(quadrosIdeais.empresaId, empresaId));
    const quadrosReaisDb = await db.select().from(quadrosReais).where(eq(quadrosReais.empresaId, empresaId));
    if (!quadrosIdeaisDb.length) {
      console.info('[ALERTAS] Nenhum quadro ideal encontrado para empresa:', empresaId);
      return [];
    }

    // Indexar quadro real por departamentoId+cargo
    const realMap = new Map<string, number>();
    for (const qr of quadrosReaisDb) {
      const key = `${qr.departamentoId}:${qr.cargo}`;
      realMap.set(key, qr.quantidadeAtual);
    }

    const alertas = quadrosIdeaisDb.map(qi => {
      const key = `${qi.departamentoId}:${qi.cargo}`;
      const atual = realMap.get(key) ?? 0;
      const gap = atual - qi.quantidadeIdeal;
      let status = "ok", cor = "verde", acaoSugerida = "";
      if (gap === 0) {
        status = "ok"; cor = "verde"; acaoSugerida = "";
      } else if (gap < 0) {
        const percentual = Math.abs(gap) / (qi.quantidadeIdeal || 1);
        if (percentual > 0.1) {
          status = "crítico"; cor = "vermelho"; acaoSugerida = "Abrir vaga";
        } else {
          status = "leve_deficit"; cor = "amarelo"; acaoSugerida = "Avaliar contratação";
        }
      } else if (gap > 0) {
        status = "excesso"; cor = "azul"; acaoSugerida = "Avaliar remanejamento";
      }
      return {
        empresaId: qi.empresaId,
        departamentoId: qi.departamentoId,
        cargo: qi.cargo,
        ideal: qi.quantidadeIdeal,
        atual,
        gap,
        status,
        cor,
        acaoSugerida
      };
    });
    return alertas;
  }

  // Fluxo de aprovação automatizado: abertura automática de solicitações de vaga
  async abrirSolicitacoesAutomaticas(empresaId: string, usuarioId: string): Promise<number> {
    const alertas = await this.getAlertasQuadroIdeal(empresaId);
    let criadas = 0;
    for (const alerta of alertas) {
      if (alerta.status === 'crítico') {
        const jaExiste = await db.select().from(solicitacoesVaga)
          .where(
            eq(solicitacoesVaga.empresaId, empresaId),
            eq(solicitacoesVaga.departamentoId, alerta.departamentoId),
            eq(solicitacoesVaga.cargo, alerta.cargo),
            eq(solicitacoesVaga.status, 'pendente')
          );
        if (jaExiste.length === 0) {
          await this.createSolicitacaoVaga({
            empresaId,
            departamentoId: alerta.departamentoId,
            cargo: alerta.cargo,
            quantidadeSolicitada: Math.abs(alerta.gap),
            motivo: 'Déficit identificado automaticamente',
            status: 'pendente',
            criadoPor: usuarioId
          });
          criadas++;
        }
      }
    }
    return criadas;
  }
}

export const storage = new DatabaseStorage();
