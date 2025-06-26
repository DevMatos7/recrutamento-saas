import { db } from "../db";
import { vagaCandidatos, candidatos, vagas, empresas } from "../../shared/schema";
import { eq, and } from "drizzle-orm";

export class ApprovalService {
  // Submeter candidatura (criar com status pendente)
  static async submitApplication(candidateId: string, jobId: string) {
    try {
      // Verificar se já existe candidatura
      const existing = await db
        .select()
        .from(vagaCandidatos)
        .where(and(
          eq(vagaCandidatos.candidatoId, candidateId),
          eq(vagaCandidatos.vagaId, jobId)
        ))
        .limit(1);

      if (existing.length > 0) {
        throw new Error('Candidatura já existe para esta vaga');
      }

      // Criar candidatura pendente
      const [application] = await db
        .insert(vagaCandidatos)
        .values({
          candidatoId: candidateId,
          vagaId: jobId,
          etapa: 'pendente',
          comentarios: 'Candidatura submetida - aguardando aprovação do recrutador'
        })
        .returning();

      return application;
    } catch (error) {
      console.error('Erro ao submeter candidatura:', error);
      throw error;
    }
  }

  // Obter candidaturas pendentes
  static async getPendingApplications(empresaId: string) {
    try {
      const pendingApplications = await db
        .select({
          id: vagaCandidatos.id,
          candidateId: vagaCandidatos.candidatoId,
          candidateName: candidatos.nome,
          candidateEmail: candidatos.email,
          jobId: vagaCandidatos.vagaId,
          jobTitle: vagas.titulo,
          applicationDate: vagaCandidatos.dataInscricao,
          comments: vagaCandidatos.comentarios
        })
        .from(vagaCandidatos)
        .innerJoin(candidatos, eq(vagaCandidatos.candidatoId, candidatos.id))
        .innerJoin(vagas, eq(vagaCandidatos.vagaId, vagas.id))
        .innerJoin(empresas, eq(vagas.empresaId, empresas.id))
        .where(and(
          eq(vagaCandidatos.etapa, 'pendente'),
          eq(empresas.id, empresaId)
        ))
        .orderBy(vagaCandidatos.dataInscricao);

      return pendingApplications;
    } catch (error) {
      console.error('Erro ao buscar candidaturas pendentes:', error);
      throw error;
    }
  }

  // Aprovar candidatura
  static async approveApplication(applicationId: string, approverId: string, comments?: string) {
    try {
      const [updatedApplication] = await db
        .update(vagaCandidatos)
        .set({
          etapa: 'recebido', // Move para a primeira etapa do pipeline
          comentarios: comments || 'Candidatura aprovada pelo recrutador',
          responsavelId: approverId,
          dataMovimentacao: new Date()
        })
        .where(eq(vagaCandidatos.id, applicationId))
        .returning();

      if (!updatedApplication) {
        throw new Error('Candidatura não encontrada');
      }

      return updatedApplication;
    } catch (error) {
      console.error('Erro ao aprovar candidatura:', error);
      throw error;
    }
  }

  // Rejeitar candidatura
  static async rejectApplication(applicationId: string, approverId: string, comments?: string) {
    try {
      const [updatedApplication] = await db
        .update(vagaCandidatos)
        .set({
          etapa: 'reprovado',
          comentarios: comments || 'Candidatura rejeitada pelo recrutador',
          responsavelId: approverId,
          dataMovimentacao: new Date()
        })
        .where(eq(vagaCandidatos.id, applicationId))
        .returning();

      if (!updatedApplication) {
        throw new Error('Candidatura não encontrada');
      }

      return updatedApplication;
    } catch (error) {
      console.error('Erro ao rejeitar candidatura:', error);
      throw error;
    }
  }
}