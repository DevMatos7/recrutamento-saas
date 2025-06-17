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
  type InsertComunicacao
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, asc, lte, isNull } from "drizzle-orm";
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
    return db.select().from(departamentos).orderBy(departamentos.nome);
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
      .set(departamento)
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
    return candidato || undefined;
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
      const [deleted] = await db.delete(candidatos).where(eq(candidatos.id, id)).returning();
      return !!deleted;
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
    
    const pipeline = {
      recebido: candidatos.filter(c => c.etapa === 'recebido'),
      triagem: candidatos.filter(c => c.etapa === 'triagem'),
      entrevista: candidatos.filter(c => c.etapa === 'entrevista'),
      avaliacao: candidatos.filter(c => c.etapa === 'avaliacao'),
      aprovado: candidatos.filter(c => c.etapa === 'aprovado'),
      reprovado: candidatos.filter(c => c.etapa === 'reprovado'),
    };
    
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
}

export const storage = new DatabaseStorage();
