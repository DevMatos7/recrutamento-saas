import { db } from "../db";
import { eq, and } from "drizzle-orm";
import { 
  vagaCandidatos, 
  vagas, 
  candidatos, 
  usuarios,
  type VagaCandidato,
  type Usuario
} from "@shared/schema";

// Valid pipeline stages
export const ETAPAS_VALIDAS = [
  "recebido",
  "triagem", 
  "entrevista",
  "avaliacao",
  "aprovado",
  "reprovado"
] as const;

export type EtapaValida = typeof ETAPAS_VALIDAS[number];

// Service errors
export class PipelineServiceError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "PipelineServiceError";
  }
}

// Movement history entry
export interface MovimentacaoHistorico {
  id: string;
  vagaId: string;
  candidatoId: string;
  etapaAnterior: string | null;
  etapaNova: string;
  nota: string | null;
  comentarios: string | null;
  responsavelId: string;
  dataMovimentacao: Date;
  responsavel: {
    id: string;
    nome: string;
    email: string;
  };
}

/**
 * Service for managing candidate movements through pipeline stages
 */
export class PipelineService {
  
  /**
   * Validates if user has permission to move candidates
   */
  private static validateUserPermissions(usuario: Usuario): void {
    if (!["admin", "recrutador"].includes(usuario.perfil)) {
      throw new PipelineServiceError(
        "Usuário não tem permissão para mover candidatos no pipeline",
        "PERMISSION_DENIED"
      );
    }
  }

  /**
   * Validates if the stage is valid
   */
  private static validateEtapa(etapa: string): asserts etapa is EtapaValida {
    if (!ETAPAS_VALIDAS.includes(etapa as EtapaValida)) {
      throw new PipelineServiceError(
        `Etapa inválida: ${etapa}. Etapas válidas: ${ETAPAS_VALIDAS.join(", ")}`,
        "INVALID_STAGE"
      );
    }
  }

  /**
   * Validates if note is within acceptable range
   */
  private static validateNota(nota?: number): void {
    if (nota !== undefined && (nota < 0 || nota > 10)) {
      throw new PipelineServiceError(
        "Nota deve estar entre 0 e 10",
        "INVALID_NOTE"
      );
    }
  }

  /**
   * Check if candidate is enrolled in the job
   */
  private static async validateCandidatoInscrito(
    vagaId: string, 
    candidatoId: string
  ): Promise<VagaCandidato> {
    const [inscricao] = await db
      .select()
      .from(vagaCandidatos)
      .where(and(
        eq(vagaCandidatos.vagaId, vagaId),
        eq(vagaCandidatos.candidatoId, candidatoId)
      ));

    if (!inscricao) {
      throw new PipelineServiceError(
        "Candidato não está inscrito nesta vaga",
        "CANDIDATE_NOT_ENROLLED"
      );
    }

    return inscricao;
  }

  /**
   * Check if job exists and is active
   */
  private static async validateVagaAtiva(vagaId: string): Promise<void> {
    const [vaga] = await db
      .select()
      .from(vagas)
      .where(eq(vagas.id, vagaId));

    if (!vaga) {
      throw new PipelineServiceError(
        "Vaga não encontrada",
        "JOB_NOT_FOUND"
      );
    }

    if (vaga.status === "encerrada" || vaga.status === "cancelada") {
      throw new PipelineServiceError(
        "Não é possível mover candidatos em vaga encerrada ou cancelada",
        "JOB_INACTIVE"
      );
    }
  }

  /**
   * Check if candidate exists
   */
  private static async validateCandidatoExiste(candidatoId: string): Promise<void> {
    const [candidato] = await db
      .select()
      .from(candidatos)
      .where(eq(candidatos.id, candidatoId));

    if (!candidato) {
      throw new PipelineServiceError(
        "Candidato não encontrado",
        "CANDIDATE_NOT_FOUND"
      );
    }

    if (candidato.status !== "ativo") {
      throw new PipelineServiceError(
        "Candidato não está ativo",
        "CANDIDATE_INACTIVE"
      );
    }
  }

  /**
   * Create movement history entry
   */
  private static async criarHistoricoMovimentacao(
    inscricaoAnterior: VagaCandidato,
    novaEtapa: string,
    responsavelId: string,
    nota?: number,
    comentarios?: string
  ): Promise<MovimentacaoHistorico> {
    const [responsavel] = await db
      .select({
        id: usuarios.id,
        nome: usuarios.nome,
        email: usuarios.email,
      })
      .from(usuarios)
      .where(eq(usuarios.id, responsavelId));

    return {
      id: inscricaoAnterior.id,
      vagaId: inscricaoAnterior.vagaId,
      candidatoId: inscricaoAnterior.candidatoId,
      etapaAnterior: inscricaoAnterior.etapa,
      etapaNova: novaEtapa,
      nota: nota?.toString() || null,
      comentarios: comentarios || null,
      responsavelId,
      dataMovimentacao: new Date(),
      responsavel: responsavel || { id: responsavelId, nome: "Sistema", email: "" }
    };
  }

  /**
   * Main service method: Move candidate between pipeline stages
   * 
   * @param vagaId - Job ID
   * @param candidatoId - Candidate ID  
   * @param novaEtapa - New pipeline stage
   * @param usuarioLogado - Logged in user performing the action
   * @param nota - Optional score (0-10)
   * @param comentarios - Optional comments about the movement
   * @returns Updated VagaCandidato record and movement history
   */
  static async moverCandidatoPipeline(
    vagaId: string,
    candidatoId: string,
    novaEtapa: string,
    usuarioLogado: Usuario,
    nota?: number,
    comentarios?: string
  ): Promise<{
    vagaCandidato: VagaCandidato;
    historico: MovimentacaoHistorico;
  }> {
    // 1. Validate user permissions
    this.validateUserPermissions(usuarioLogado);

    // 2. Validate input parameters
    this.validateEtapa(novaEtapa);
    this.validateNota(nota);

    // 3. Validate entities exist and are active
    await this.validateVagaAtiva(vagaId);
    await this.validateCandidatoExiste(candidatoId);

    // 4. Validate candidate is enrolled in the job
    const inscricaoAtual = await this.validateCandidatoInscrito(vagaId, candidatoId);

    // 5. Check if movement is necessary
    if (inscricaoAtual.etapa === novaEtapa) {
      throw new PipelineServiceError(
        `Candidato já está na etapa "${novaEtapa}"`,
        "NO_MOVEMENT_NEEDED"
      );
    }

    // 6. Create movement history before updating
    const historico = await this.criarHistoricoMovimentacao(
      inscricaoAtual,
      novaEtapa,
      usuarioLogado.id,
      nota,
      comentarios
    );

    // 7. Update candidate stage with complete audit trail
    const [vagaCandidatoAtualizado] = await db
      .update(vagaCandidatos)
      .set({
        etapa: novaEtapa,
        nota: nota?.toString(),
        comentarios: comentarios || inscricaoAtual.comentarios,
        responsavelId: usuarioLogado.id,
        dataMovimentacao: new Date()
      })
      .where(and(
        eq(vagaCandidatos.vagaId, vagaId),
        eq(vagaCandidatos.candidatoId, candidatoId)
      ))
      .returning();

    if (!vagaCandidatoAtualizado) {
      throw new PipelineServiceError(
        "Erro ao atualizar candidato no pipeline",
        "UPDATE_FAILED"
      );
    }

    return {
      vagaCandidato: vagaCandidatoAtualizado,
      historico
    };
  }

  /**
   * Get complete movement history for a candidate across all jobs
   */
  static async obterHistoricoCompleto(candidatoId: string): Promise<MovimentacaoHistorico[]> {
    const historico = await db
      .select({
        id: vagaCandidatos.id,
        vagaId: vagaCandidatos.vagaId,
        candidatoId: vagaCandidatos.candidatoId,
        etapa: vagaCandidatos.etapa,
        nota: vagaCandidatos.nota,
        comentarios: vagaCandidatos.comentarios,
        dataMovimentacao: vagaCandidatos.dataMovimentacao,
        dataInscricao: vagaCandidatos.dataInscricao,
        responsavelId: vagaCandidatos.responsavelId,
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
      .orderBy(vagaCandidatos.dataMovimentacao);

    return historico.map(h => ({
      id: h.id,
      vagaId: h.vagaId,
      candidatoId: h.candidatoId,
      etapaAnterior: null,
      etapaNova: h.etapa,
      nota: h.nota,
      comentarios: h.comentarios,
      responsavelId: h.responsavelId || "sistema",
      dataMovimentacao: h.dataMovimentacao,
      responsavel: h.responsavel || { id: "sistema", nome: "Sistema", email: "" }
    }));
  }

  /**
   * Get pipeline statistics for a job
   */
  static async obterEstatisticasPipeline(vagaId: string): Promise<{
    total: number;
    porEtapa: Record<EtapaValida, number>;
    taxaConversao: Record<string, number>;
  }> {
    const candidatos = await db
      .select({
        etapa: vagaCandidatos.etapa
      })
      .from(vagaCandidatos)
      .where(eq(vagaCandidatos.vagaId, vagaId));

    const total = candidatos.length;
    const porEtapa = ETAPAS_VALIDAS.reduce((acc, etapa) => {
      acc[etapa] = candidatos.filter(c => c.etapa === etapa).length;
      return acc;
    }, {} as Record<EtapaValida, number>);

    // Calculate conversion rates between stages
    const taxaConversao: Record<string, number> = {};
    if (porEtapa.recebido > 0) {
      taxaConversao.recebido_para_triagem = (porEtapa.triagem / porEtapa.recebido) * 100;
    }
    if (porEtapa.triagem > 0) {
      taxaConversao.triagem_para_entrevista = (porEtapa.entrevista / porEtapa.triagem) * 100;
    }
    if (porEtapa.entrevista > 0) {
      taxaConversao.entrevista_para_avaliacao = (porEtapa.avaliacao / porEtapa.entrevista) * 100;
    }
    if (porEtapa.avaliacao > 0) {
      taxaConversao.avaliacao_para_aprovado = (porEtapa.aprovado / porEtapa.avaliacao) * 100;
    }

    return {
      total,
      porEtapa,
      taxaConversao
    };
  }
}