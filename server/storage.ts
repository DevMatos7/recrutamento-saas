import { 
  empresas, 
  departamentos, 
  usuarios, 
  vagas,
  candidatos,
  vagaCandidatos,
  testes,
  testesResultados,
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
  type InsertTesteResultado
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
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
}

export const storage = new DatabaseStorage();
