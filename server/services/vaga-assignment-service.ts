import { db } from '../db';
import { vagas, vagaCandidatos, usuarios } from '@shared/schema';
import { eq, and, isNull } from 'drizzle-orm';

export class VagaAssignmentService {
  
  /**
   * Atribui automaticamente candidatos a uma vaga baseado no responsável da vaga
   */
  async atribuirCandidatosAutomaticamente(vagaId: string): Promise<{ success: boolean; message: string; candidatosAtribuidos: number }> {
    try {
      // 1. Buscar a vaga e verificar se tem responsável
      const vaga = await db
        .select({
          id: vagas.id,
          titulo: vagas.titulo,
          responsavelId: vagas.responsavelId
        })
        .from(vagas)
        .where(eq(vagas.id, vagaId))
        .limit(1);

      if (vaga.length === 0) {
        return { success: false, message: 'Vaga não encontrada', candidatosAtribuidos: 0 };
      }

      const vagaData = vaga[0];

      if (!vagaData.responsavelId) {
        return { success: false, message: 'Vaga não possui recrutador responsável definido', candidatosAtribuidos: 0 };
      }

      // 2. Buscar candidatos da vaga que não têm responsável
      const candidatosSemResponsavel = await db
        .select({
          id: vagaCandidatos.id,
          candidatoId: vagaCandidatos.candidatoId,
          vagaId: vagaCandidatos.vagaId
        })
        .from(vagaCandidatos)
        .where(
          and(
            eq(vagaCandidatos.vagaId, vagaId),
            isNull(vagaCandidatos.responsavelId)
          )
        );

      if (candidatosSemResponsavel.length === 0) {
        return { success: true, message: 'Todos os candidatos já possuem responsável', candidatosAtribuidos: 0 };
      }

      // 3. Atribuir o responsável da vaga a todos os candidatos sem responsável
      const candidatosIds = candidatosSemResponsavel.map(c => c.id);
      
      const [updated] = await db
        .update(vagaCandidatos)
        .set({ responsavelId: vagaData.responsavelId })
        .where(
          and(
            eq(vagaCandidatos.vagaId, vagaId),
            isNull(vagaCandidatos.responsavelId)
          )
        )
        .returning();

      return {
        success: true,
        message: `${candidatosSemResponsavel.length} candidatos atribuídos automaticamente ao recrutador responsável pela vaga`,
        candidatosAtribuidos: candidatosSemResponsavel.length
      };

    } catch (error) {
      console.error('Erro ao atribuir candidatos automaticamente:', error);
      return { success: false, message: 'Erro interno do servidor', candidatosAtribuidos: 0 };
    }
  }

  /**
   * Atribui responsável a uma vaga
   */
  async atribuirResponsavelVaga(vagaId: string, responsavelId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Verificar se o usuário existe e é recrutador
      const usuario = await db
        .select({
          id: usuarios.id,
          nome: usuarios.nome,
          perfil: usuarios.perfil
        })
        .from(usuarios)
        .where(eq(usuarios.id, responsavelId))
        .limit(1);

      if (usuario.length === 0) {
        return { success: false, message: 'Usuário não encontrado' };
      }

      if (!['admin', 'recrutador', 'gestor'].includes(usuario[0].perfil)) {
        return { success: false, message: 'Usuário não tem permissão para ser responsável por vagas' };
      }

      // Atualizar a vaga
      const [updated] = await db
        .update(vagas)
        .set({ responsavelId })
        .where(eq(vagas.id, vagaId))
        .returning();

      if (!updated) {
        return { success: false, message: 'Vaga não encontrada' };
      }

      return { success: true, message: `Responsável ${usuario[0].nome} atribuído à vaga com sucesso` };

    } catch (error) {
      console.error('Erro ao atribuir responsável à vaga:', error);
      return { success: false, message: 'Erro interno do servidor' };
    }
  }

  /**
   * Busca vagas com informações de responsável
   */
  async getVagasComResponsavel(): Promise<any[]> {
    try {
      console.log('Iniciando busca de vagas...');
      
      // Buscar todas as vagas (com ou sem responsável)
      const todasVagas = await db
        .select({
          id: vagas.id,
          titulo: vagas.titulo,
          status: vagas.status,
          responsavelId: vagas.responsavelId,
          responsavelNome: usuarios.nome,
          responsavelEmail: usuarios.email
        })
        .from(vagas)
        .leftJoin(usuarios, eq(vagas.responsavelId, usuarios.id))
        .orderBy(vagas.titulo);

      console.log(`Encontradas ${todasVagas.length} vagas no total`);
      console.log('Primeiras 3 vagas:', todasVagas.slice(0, 3));

      if (todasVagas.length === 0) {
        console.log('Nenhuma vaga encontrada na consulta inicial');
        return [];
      }

      // Para cada vaga, buscar as contagens separadamente
      const vagasComContagens = await Promise.all(
        todasVagas.map(async (vaga) => {
          try {
            // Contar total de candidatos
            const totalCandidatosResult = await db
              .select({ count: db.fn.count() })
              .from(vagaCandidatos)
              .where(eq(vagaCandidatos.vagaId, vaga.id));

            // Contar candidatos sem responsável
            const candidatosSemResponsavelResult = await db
              .select({ count: db.fn.count() })
              .from(vagaCandidatos)
              .where(
                and(
                  eq(vagaCandidatos.vagaId, vaga.id),
                  isNull(vagaCandidatos.responsavelId)
                )
              );

            return {
              ...vaga,
              totalCandidatos: Number(totalCandidatosResult[0]?.count || 0),
              candidatosSemResponsavel: Number(candidatosSemResponsavelResult[0]?.count || 0)
            };
          } catch (error) {
            console.error(`Erro ao processar vaga ${vaga.id}:`, error);
            return {
              ...vaga,
              totalCandidatos: 0,
              candidatosSemResponsavel: 0
            };
          }
        })
      );

      console.log(`Processadas ${vagasComContagens.length} vagas com contagens`);
      console.log('Primeiras 3 vagas processadas:', vagasComContagens.slice(0, 3));
      return vagasComContagens;

    } catch (error) {
      console.error('Erro ao buscar vagas com responsável:', error);
      return [];
    }
  }

  /**
   * Executa atribuição automática para todas as vagas que têm responsável
   */
  async executarAtribuicaoAutomaticaGlobal(): Promise<{ success: boolean; message: string; totalAtribuidos: number }> {
    try {
      // Buscar vagas que têm responsável
      const vagasComResponsavel = await db
        .select({
          id: vagas.id,
          titulo: vagas.titulo,
          responsavelId: vagas.responsavelId
        })
        .from(vagas)
        .where(eq(vagas.responsavelId, vagas.responsavelId))
        .where(isNull(vagas.responsavelId).not());

      let totalAtribuidos = 0;
      const resultados = [];

      for (const vaga of vagasComResponsavel) {
        const resultado = await this.atribuirCandidatosAutomaticamente(vaga.id);
        if (resultado.success) {
          totalAtribuidos += resultado.candidatosAtribuidos;
        }
        resultados.push({ vaga: vaga.titulo, ...resultado });
      }

      return {
        success: true,
        message: `Atribuição automática concluída. ${totalAtribuidos} candidatos atribuídos em ${vagasComResponsavel.length} vagas`,
        totalAtribuidos
      };

    } catch (error) {
      console.error('Erro na atribuição automática global:', error);
      return { success: false, message: 'Erro interno do servidor', totalAtribuidos: 0 };
    }
  }
}

export const vagaAssignmentService = new VagaAssignmentService(); 