import { eq, and, gte, desc, ne, lte } from "drizzle-orm";
import { db } from "../db.js";
import { entrevistas, candidatos, vagas, usuarios } from "../../shared/schema.js";
import type { InsertEntrevista, Entrevista, Usuario } from "../../shared/schema.js";

export class EntrevistaServiceError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "EntrevistaServiceError";
  }
}

/**
 * Service for managing interview scheduling and management
 */
export class EntrevistaService {
  
  /**
   * Validates if user has permission to manage interviews
   */
  private static validateUserPermissions(usuario: Usuario, action: 'create' | 'edit' | 'view'): void {
    if (action === 'create' && !['admin', 'recrutador'].includes(usuario.perfil)) {
      throw new EntrevistaServiceError("Apenas administradores e recrutadores podem agendar entrevistas", "PERMISSION_DENIED");
    }
    
    if (action === 'edit' && !['admin', 'recrutador', 'gestor'].includes(usuario.perfil)) {
      throw new EntrevistaServiceError("Apenas administradores, recrutadores e gestores podem editar entrevistas", "PERMISSION_DENIED");
    }
    
    if (action === 'view' && !['admin', 'recrutador', 'gestor'].includes(usuario.perfil)) {
      throw new EntrevistaServiceError("Sem permissão para visualizar entrevistas", "PERMISSION_DENIED");
    }
  }

  /**
   * Validates if interview status is valid
   */
  private static validateStatus(status: string): asserts status is 'agendada' | 'realizada' | 'cancelada' | 'faltou' {
    if (!['agendada', 'realizada', 'cancelada', 'faltou'].includes(status)) {
      throw new EntrevistaServiceError("Status inválido. Use: agendada, realizada, cancelada, faltou", "INVALID_STATUS");
    }
  }

  /**
   * Check if candidate exists
   */
  private static async validateCandidatoExiste(candidatoId: string): Promise<void> {
    const candidato = await db.query.candidatos.findFirst({
      where: eq(candidatos.id, candidatoId)
    });
    
    if (!candidato) {
      throw new EntrevistaServiceError("Candidato não encontrado", "CANDIDATE_NOT_FOUND");
    }
  }

  /**
   * Check if job exists and is active
   */
  private static async validateVagaAtiva(vagaId: string): Promise<void> {
    const vaga = await db.query.vagas.findFirst({
      where: eq(vagas.id, vagaId)
    });
    
    if (!vaga) {
      throw new EntrevistaServiceError("Vaga não encontrada", "JOB_NOT_FOUND");
    }
    
    if (vaga.status === 'encerrada' || vaga.status === 'cancelada') {
      throw new EntrevistaServiceError("Não é possível agendar entrevistas para vagas encerradas ou canceladas", "JOB_INACTIVE");
    }
  }

  /**
   * Check if interviewer exists and has permission
   */
  private static async validateEntrevistador(entrevistadorId: string): Promise<void> {
    const entrevistador = await db.query.usuarios.findFirst({
      where: eq(usuarios.id, entrevistadorId)
    });
    
    if (!entrevistador) {
      throw new EntrevistaServiceError("Entrevistador não encontrado", "INTERVIEWER_NOT_FOUND");
    }
    
    if (!['admin', 'recrutador', 'gestor'].includes(entrevistador.perfil)) {
      throw new EntrevistaServiceError("Apenas administradores, recrutadores e gestores podem realizar entrevistas", "INVALID_INTERVIEWER");
    }
  }

  /**
   * Check if candidate already has an active interview for this job
   */
  private static async validateEntrevistaUnica(vagaId: string, candidatoId: string, entrevistaId?: string): Promise<void> {
    const whereConditions = [
      eq(entrevistas.vagaId, vagaId),
      eq(entrevistas.candidatoId, candidatoId),
      eq(entrevistas.status, 'agendada')
    ];

    // If updating, exclude current interview from check
    if (entrevistaId) {
      whereConditions.push(ne(entrevistas.id, entrevistaId));
    }

    const existingInterview = await db.query.entrevistas.findFirst({
      where: and(...whereConditions)
    });
    
    if (existingInterview) {
      throw new EntrevistaServiceError("Este candidato já possui uma entrevista agendada para esta vaga", "INTERVIEW_ALREADY_EXISTS");
    }
  }

  /**
   * Validate interview date is in the future
   */
  private static validateDataFutura(dataHora: Date): void {
    const now = new Date();
    if (dataHora <= now) {
      throw new EntrevistaServiceError("A data/hora da entrevista deve ser futura", "INVALID_DATE");
    }
  }

  /**
   * Check if interview can be edited (not realized or cancelled)
   */
  private static validatePodeEditar(entrevista: Entrevista): void {
    if (entrevista.status === 'realizada') {
      throw new EntrevistaServiceError("Não é possível editar entrevistas já realizadas", "CANNOT_EDIT_COMPLETED");
    }
    
    if (entrevista.status === 'cancelada') {
      throw new EntrevistaServiceError("Não é possível editar entrevistas canceladas", "CANNOT_EDIT_CANCELLED");
    }
  }

  /**
   * Create new interview
   */
  static async agendarEntrevista(entrevista: InsertEntrevista, usuarioLogado: Usuario): Promise<Entrevista> {
    this.validateUserPermissions(usuarioLogado, 'create');
    
    // Validate all entities exist and are valid
    await this.validateCandidatoExiste(entrevista.candidatoId);
    await this.validateVagaAtiva(entrevista.vagaId);
    await this.validateEntrevistador(entrevista.entrevistadorId);
    
    // Validate business rules
    this.validateDataFutura(entrevista.dataHora);
    await this.validateEntrevistaUnica(entrevista.vagaId, entrevista.candidatoId);
    
    const [novaEntrevista] = await db.insert(entrevistas)
      .values({
        ...entrevista,
        dataCriacao: new Date(),
        dataAtualizacao: new Date()
      })
      .returning();
    
    return novaEntrevista;
  }

  /**
   * List interviews with filters
   */
  static async listarEntrevistas(
    filtros: {
      vagaId?: string;
      candidatoId?: string;
      entrevistadorId?: string;
      status?: string;
      dataInicio?: Date;
      dataFim?: Date;
    },
    usuarioLogado: Usuario
  ): Promise<any[]> {
    this.validateUserPermissions(usuarioLogado, 'view');
    
    const whereConditions: any[] = [];
    
    if (filtros.vagaId) {
      whereConditions.push(eq(entrevistas.vagaId, filtros.vagaId));
    }
    
    if (filtros.candidatoId) {
      whereConditions.push(eq(entrevistas.candidatoId, filtros.candidatoId));
    }
    
    if (filtros.entrevistadorId) {
      whereConditions.push(eq(entrevistas.entrevistadorId, filtros.entrevistadorId));
    }
    
    if (filtros.status) {
      this.validateStatus(filtros.status);
      whereConditions.push(eq(entrevistas.status, filtros.status));
    }
    
    if (filtros.dataInicio) {
      whereConditions.push(gte(entrevistas.dataHora, filtros.dataInicio));
    }
    
    if (filtros.dataFim) {
      whereConditions.push(lte(entrevistas.dataHora, filtros.dataFim));
    }

    return await db.query.entrevistas.findMany({
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      with: {
        candidato: true,
        vaga: true,
        entrevistador: {
          columns: {
            id: true,
            nome: true,
            email: true,
            perfil: true
          }
        }
      },
      orderBy: [desc(entrevistas.dataHora)]
    });
  }

  /**
   * Get interview by ID
   */
  static async obterEntrevista(id: string, usuarioLogado: Usuario): Promise<any | null> {
    this.validateUserPermissions(usuarioLogado, 'view');
    
    const entrevista = await db.query.entrevistas.findFirst({
      where: eq(entrevistas.id, id),
      with: {
        candidato: true,
        vaga: true,
        entrevistador: {
          columns: {
            id: true,
            nome: true,
            email: true,
            perfil: true
          }
        }
      }
    });
    
    return entrevista || null;
  }

  /**
   * Update interview
   */
  static async atualizarEntrevista(
    id: string, 
    dadosAtualizacao: Partial<InsertEntrevista>, 
    usuarioLogado: Usuario
  ): Promise<Entrevista | null> {
    this.validateUserPermissions(usuarioLogado, 'edit');
    
    // Get current interview
    const entrevistaAtual = await db.query.entrevistas.findFirst({
      where: eq(entrevistas.id, id)
    });
    
    if (!entrevistaAtual) {
      throw new EntrevistaServiceError("Entrevista não encontrada", "INTERVIEW_NOT_FOUND");
    }
    
    // Check if can be edited
    this.validatePodeEditar(entrevistaAtual);
    
    // Validate updated data
    if (dadosAtualizacao.dataHora) {
      this.validateDataFutura(dadosAtualizacao.dataHora);
    }
    
    if (dadosAtualizacao.entrevistadorId) {
      await this.validateEntrevistador(dadosAtualizacao.entrevistadorId);
    }
    
    // If changing candidate or job, validate uniqueness
    if (dadosAtualizacao.candidatoId || dadosAtualizacao.vagaId) {
      const vagaId = dadosAtualizacao.vagaId || entrevistaAtual.vagaId;
      const candidatoId = dadosAtualizacao.candidatoId || entrevistaAtual.candidatoId;
      await this.validateEntrevistaUnica(vagaId, candidatoId, id);
    }
    
    const [entrevistaAtualizada] = await db.update(entrevistas)
      .set({
        ...dadosAtualizacao,
        dataAtualizacao: new Date()
      })
      .where(eq(entrevistas.id, id))
      .returning();
    
    return entrevistaAtualizada || null;
  }

  /**
   * Update interview status
   */
  static async atualizarStatus(
    id: string, 
    novoStatus: string, 
    observacoes?: string, 
    usuarioLogado?: Usuario
  ): Promise<Entrevista | null> {
    if (usuarioLogado) {
      this.validateUserPermissions(usuarioLogado, 'edit');
    }
    
    this.validateStatus(novoStatus);
    
    // Get current interview
    const entrevistaAtual = await db.query.entrevistas.findFirst({
      where: eq(entrevistas.id, id)
    });
    
    if (!entrevistaAtual) {
      throw new EntrevistaServiceError("Entrevista não encontrada", "INTERVIEW_NOT_FOUND");
    }
    
    const updateData: any = {
      status: novoStatus,
      dataAtualizacao: new Date()
    };
    
    if (observacoes !== undefined) {
      updateData.observacoes = observacoes;
    }
    
    const [entrevistaAtualizada] = await db.update(entrevistas)
      .set(updateData)
      .where(eq(entrevistas.id, id))
      .returning();
    
    return entrevistaAtualizada || null;
  }

  /**
   * Delete interview (only if not completed)
   */
  static async removerEntrevista(id: string, usuarioLogado: Usuario): Promise<boolean> {
    this.validateUserPermissions(usuarioLogado, 'edit');
    
    // Get current interview
    const entrevistaAtual = await db.query.entrevistas.findFirst({
      where: eq(entrevistas.id, id)
    });
    
    if (!entrevistaAtual) {
      throw new EntrevistaServiceError("Entrevista não encontrada", "INTERVIEW_NOT_FOUND");
    }
    
    if (entrevistaAtual.status === 'realizada') {
      throw new EntrevistaServiceError("Não é possível remover entrevistas já realizadas", "CANNOT_DELETE_COMPLETED");
    }
    
    const result = await db.delete(entrevistas)
      .where(eq(entrevistas.id, id));
    
    return result.rowCount > 0;
  }

  /**
   * Get upcoming interviews for a user
   */
  static async obterProximasEntrevistas(entrevistadorId: string, usuarioLogado: Usuario): Promise<any[]> {
    this.validateUserPermissions(usuarioLogado, 'view');
    
    const agora = new Date();
    
    return await db.query.entrevistas.findMany({
      where: and(
        eq(entrevistas.entrevistadorId, entrevistadorId),
        eq(entrevistas.status, 'agendada'),
        gte(entrevistas.dataHora, agora)
      ),
      with: {
        candidato: true,
        vaga: {
          columns: {
            id: true,
            titulo: true,
            status: true
          }
        }
      },
      orderBy: [entrevistas.dataHora]
    });
  }

  /**
   * Get interview statistics
   */
  static async obterEstatisticas(usuarioLogado: Usuario): Promise<{
    total: number;
    agendadas: number;
    realizadas: number;
    canceladas: number;
    faltaram: number;
  }> {
    this.validateUserPermissions(usuarioLogado, 'view');
    
    const todasEntrevistas = await db.query.entrevistas.findMany({
      columns: {
        status: true
      }
    });
    
    const stats = {
      total: todasEntrevistas.length,
      agendadas: 0,
      realizadas: 0,
      canceladas: 0,
      faltaram: 0
    };
    
    todasEntrevistas.forEach(entrevista => {
      switch (entrevista.status) {
        case 'agendada':
          stats.agendadas++;
          break;
        case 'realizada':
          stats.realizadas++;
          break;
        case 'cancelada':
          stats.canceladas++;
          break;
        case 'faltou':
          stats.faltaram++;
          break;
      }
    });
    
    return stats;
  }
}

