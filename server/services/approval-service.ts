import { db } from "../db";
import { vagaCandidatos, candidatos, vagas, usuarios } from "../../shared/schema";
import { eq, and } from "drizzle-orm";

export class ApprovalService {
  // Submeter candidatura para aprovação (etapa "pendente")
  static async submitApplication(candidateId: string, jobId: string) {
    try {
      // Verificar se já existe candidatura
      const existingApplication = await db
        .select()
        .from(vagaCandidatos)
        .where(and(
          eq(vagaCandidatos.candidatoId, candidateId),
          eq(vagaCandidatos.vagaId, jobId)
        ))
        .limit(1);

      if (existingApplication.length > 0) {
        throw new Error('Você já se candidatou a esta vaga');
      }

      // Criar nova candidatura em status "pendente"
      const application = await db
        .insert(vagaCandidatos)
        .values({
          candidatoId: candidateId,
          vagaId: jobId,
          etapa: "pendente", // Aguardando aprovação
          comentarios: "Candidatura submetida - aguardando aprovação do recrutador"
        })
        .returning();

      return application[0];
    } catch (error) {
      console.error('Erro ao submeter candidatura:', error);
      throw error;
    }
  }

  // Listar candidaturas pendentes de aprovação
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
        .where(and(
          eq(vagaCandidatos.etapa, "pendente"),
          eq(vagas.empresaId, empresaId)
        ));

      return pendingApplications;
    } catch (error) {
      console.error('Erro ao buscar candidaturas pendentes:', error);
      throw error;
    }
  }

  // Aprovar candidatura
  static async approveApplication(applicationId: string, approverId: string, comments?: string) {
    try {
      const updatedApplication = await db
        .update(vagaCandidatos)
        .set({
          etapa: "recebido", // Move para o pipeline normal
          responsavelId: approverId,
          comentarios: comments || "Candidatura aprovada pelo recrutador",
          dataMovimentacao: new Date()
        })
        .where(eq(vagaCandidatos.id, applicationId))
        .returning();

      if (updatedApplication.length === 0) {
        throw new Error('Candidatura não encontrada');
      }

      return updatedApplication[0];
    } catch (error) {
      console.error('Erro ao aprovar candidatura:', error);
      throw error;
    }
  }

  // Rejeitar candidatura
  static async rejectApplication(applicationId: string, approverId: string, comments?: string) {
    try {
      const updatedApplication = await db
        .update(vagaCandidatos)
        .set({
          etapa: "reprovado",
          responsavelId: approverId,
          comentarios: comments || "Candidatura rejeitada pelo recrutador",
          dataMovimentacao: new Date()
        })
        .where(eq(vagaCandidatos.id, applicationId))
        .returning();

      if (updatedApplication.length === 0) {
        throw new Error('Candidatura não encontrada');
      }

      return updatedApplication[0];
    } catch (error) {
      console.error('Erro ao rejeitar candidatura:', error);
      throw error;
    }
  }
}