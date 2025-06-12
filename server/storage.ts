import { 
  empresas, 
  departamentos, 
  usuarios, 
  vagas,
  candidatos,
  vagaCandidatos,
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
  type InsertVagaCandidato
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

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
  getCandidatosByVaga(vagaId: string): Promise<VagaCandidato[]>;
  getVagasByCanditato(candidatoId: string): Promise<VagaCandidato[]>;
  inscreverCandidatoVaga(data: InsertVagaCandidato): Promise<VagaCandidato>;
  moverCandidatoEtapa(vagaId: string, candidatoId: string, etapa: string, comentarios?: string): Promise<VagaCandidato | undefined>;
  
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
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
  async getCandidatosByVaga(vagaId: string): Promise<VagaCandidato[]> {
    return await db.select().from(vagaCandidatos).where(eq(vagaCandidatos.vagaId, vagaId)).orderBy(desc(vagaCandidatos.dataMovimentacao));
  }

  async getVagasByCanditato(candidatoId: string): Promise<VagaCandidato[]> {
    return await db.select().from(vagaCandidatos).where(eq(vagaCandidatos.candidatoId, candidatoId)).orderBy(desc(vagaCandidatos.dataMovimentacao));
  }

  async inscreverCandidatoVaga(data: InsertVagaCandidato): Promise<VagaCandidato> {
    const [inscricao] = await db.insert(vagaCandidatos).values(data).returning();
    return inscricao;
  }

  async moverCandidatoEtapa(vagaId: string, candidatoId: string, etapa: string, comentarios?: string): Promise<VagaCandidato | undefined> {
    const [updated] = await db
      .update(vagaCandidatos)
      .set({ etapa, comentarios, dataMovimentacao: new Date() })
      .where(eq(vagaCandidatos.vagaId, vagaId))
      .returning();
    return updated || undefined;
  }
}

export const storage = new DatabaseStorage();
