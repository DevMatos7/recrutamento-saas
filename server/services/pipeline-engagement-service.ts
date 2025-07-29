import { db } from "../db";
import { 
  vagaCandidatos, 
  candidatos, 
  vagas, 
  usuarios, 
  empresas,
  logsMovimentacaoPipeline,
  metricasEngajamento,
  candidatosParados,
  slasEtapas,
  alertasSla,
  pipelineEtapas
} from "../../shared/schema";
import { eq, and, count, avg, sql, desc, asc, gte, lte, isNull, isNotNull, or, lt, gt } from "drizzle-orm";

export class PipelineEngagementService {
  
  // 1. Tempo médio por etapa
  async getTempoMedioPorEtapa(empresaId: string, vagaId?: string) {
    try {
      const query = db
        .select({
          etapa: vagaCandidatos.etapa,
          tempoMedio: avg(sql`EXTRACT(DAY FROM ${vagaCandidatos.dataMovimentacao} - ${vagaCandidatos.dataInscricao})`),
          totalCandidatos: count(),
          candidatosAtivos: count(sql`CASE WHEN ${vagaCandidatos.etapa} NOT IN ('aprovado', 'reprovado', 'contratado') THEN 1 END`)
        })
        .from(vagaCandidatos)
        .innerJoin(vagas, eq(vagaCandidatos.vagaId, vagas.id))
        .where(eq(vagas.empresaId, empresaId));

      if (vagaId) {
        query.where(and(eq(vagas.empresaId, empresaId), eq(vagaCandidatos.vagaId, vagaId)));
      }

      const result = await query.groupBy(vagaCandidatos.etapa);

      return result.map(item => ({
        ...item,
        etapa: this.formatarNomeEtapa(item.etapa), // Formatar nome da etapa
        tempoMedio: Number(item.tempoMedio) || 0,
        taxaEngajamento: item.totalCandidatos > 0 ? 
          ((item.candidatosAtivos / item.totalCandidatos) * 100).toFixed(2) : 0
      }));
    } catch (error) {
      console.error("Erro ao calcular tempo médio por etapa:", error);
      throw error;
    }
  }

  // 2. Etapas com maior desistência
  async getEtapasComMaiorDesistencia(empresaId: string, periodoDias: number = 30) {
    try {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - periodoDias);

      const result = await db
        .select({
          etapa: vagaCandidatos.etapa,
          totalCandidatos: count(),
          candidatosReprovados: count(sql`CASE WHEN ${vagaCandidatos.etapa} = 'reprovado' THEN 1 END`),
          candidatosDesistiram: count(sql`CASE WHEN ${vagaCandidatos.comentarios} ILIKE '%desistiu%' OR ${vagaCandidatos.comentarios} ILIKE '%abandonou%' THEN 1 END`)
        })
        .from(vagaCandidatos)
        .innerJoin(vagas, eq(vagaCandidatos.vagaId, vagas.id))
        .where(
          and(
            eq(vagas.empresaId, empresaId),
            gte(vagaCandidatos.dataMovimentacao, dataLimite)
          )
        )
        .groupBy(vagaCandidatos.etapa)
        .orderBy(desc(sql`(count(CASE WHEN ${vagaCandidatos.etapa} = 'reprovado' THEN 1 END) + count(CASE WHEN ${vagaCandidatos.comentarios} ILIKE '%desistiu%' OR ${vagaCandidatos.comentarios} ILIKE '%abandonou%' THEN 1 END))::float / count(*)`));

      return result.map(item => ({
        ...item,
        etapa: this.formatarNomeEtapa(item.etapa), // Formatar nome da etapa
        taxaDesistencia: item.totalCandidatos > 0 ? 
          (((item.candidatosReprovados + item.candidatosDesistiram) / item.totalCandidatos) * 100).toFixed(2) : 0
      }));
    } catch (error) {
      console.error("Erro ao calcular etapas com maior desistência:", error);
      throw error;
    }
  }

  // 3. Taxa de movimentação
  async getTaxaMovimentacao(empresaId: string, periodoDias: number = 7) {
    try {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - periodoDias);

      const movimentacoes = await db
        .select({
          data: sql`DATE(${vagaCandidatos.dataMovimentacao})`,
          total: count()
        })
        .from(vagaCandidatos)
        .innerJoin(vagas, eq(vagaCandidatos.vagaId, vagas.id))
        .where(
          and(
            eq(vagas.empresaId, empresaId),
            gte(vagaCandidatos.dataMovimentacao, dataLimite)
          )
        )
        .groupBy(sql`DATE(${vagaCandidatos.dataMovimentacao})`)
        .orderBy(asc(sql`DATE(${vagaCandidatos.dataMovimentacao})`));

      const totalCandidatos = await db
        .select({ total: count() })
        .from(vagaCandidatos)
        .innerJoin(vagas, eq(vagaCandidatos.vagaId, vagas.id))
        .where(eq(vagas.empresaId, empresaId));

      return {
        movimentacoes,
        totalCandidatos: totalCandidatos[0]?.total || 0,
        taxaMovimentacao: totalCandidatos[0]?.total > 0 ? 
          (movimentacoes.reduce((acc, m) => acc + m.total, 0) / totalCandidatos[0].total * 100).toFixed(2) : 0
      };
    } catch (error) {
      console.error("Erro ao calcular taxa de movimentação:", error);
      throw error;
    }
  }

  // 4. SLA estourado
  async getSlaEstourado(empresaId: string) {
    try {
      // Query simplificada para evitar problemas de JOIN
      const candidatosComSlaEstourado = await db
        .select({
          candidatoId: candidatos.id,
          candidatoNome: candidatos.nome,
          vagaId: vagas.id,
          vagaTitulo: vagas.titulo,
          etapa: vagaCandidatos.etapa,
          diasNaEtapa: sql`EXTRACT(DAY FROM CURRENT_DATE - ${vagaCandidatos.dataMovimentacao})`,
          responsavelId: vagaCandidatos.responsavelId,
          responsavelNome: usuarios.nome
        })
        .from(vagaCandidatos)
        .innerJoin(vagas, eq(vagaCandidatos.vagaId, vagas.id))
        .innerJoin(candidatos, eq(vagaCandidatos.candidatoId, candidatos.id))
        .leftJoin(usuarios, eq(vagaCandidatos.responsavelId, usuarios.id))
        .where(
          and(
            eq(vagas.empresaId, empresaId),
            sql`EXTRACT(DAY FROM CURRENT_DATE - ${vagaCandidatos.dataMovimentacao}) > 7`, // SLA padrão de 7 dias
            sql`${vagaCandidatos.etapa} NOT IN ('aprovado', 'reprovado', 'contratado')`
          )
        );

      return candidatosComSlaEstourado.map(item => ({
        ...item,
        etapa: this.formatarNomeEtapa(item.etapa), // Formatar nome da etapa
        diasExcedidos: Number(item.diasNaEtapa) - 7, // SLA padrão
        limiteSla: 7,
        nivelUrgencia: this.calcularNivelUrgencia(Number(item.diasNaEtapa), 7)
      }));
    } catch (error) {
      console.error("Erro ao buscar SLA estourado:", error);
      throw error;
    }
  }

  // 5. Conversão por etapa
  async getConversaoPorEtapa(empresaId: string, vagaId?: string) {
    try {
      const etapas = await db
        .select({
          etapa: vagaCandidatos.etapa,
          totalCandidatos: count()
        })
        .from(vagaCandidatos)
        .innerJoin(vagas, eq(vagaCandidatos.vagaId, vagas.id))
        .where(vagaId ? eq(vagaCandidatos.vagaId, vagaId) : eq(vagas.empresaId, empresaId))
        .groupBy(vagaCandidatos.etapa)
        .orderBy(asc(vagaCandidatos.etapa));

      // Calcular taxas de conversão
      const conversoes = [];
      for (let i = 0; i < etapas.length - 1; i++) {
        const etapaAtual = etapas[i];
        const proximaEtapa = etapas[i + 1];
        
        const candidatosProximaEtapa = await db
          .select({ total: count() })
          .from(vagaCandidatos)
          .innerJoin(vagas, eq(vagaCandidatos.vagaId, vagas.id))
          .where(
            and(
              vagaId ? eq(vagaCandidatos.vagaId, vagaId) : eq(vagas.empresaId, empresaId),
              eq(vagaCandidatos.etapa, proximaEtapa.etapa)
            )
          );

        const taxaConversao = etapaAtual.totalCandidatos > 0 ? 
          ((candidatosProximaEtapa[0]?.total || 0) / etapaAtual.totalCandidatos * 100).toFixed(2) : 0;

        conversoes.push({
          etapaAtual: this.formatarNomeEtapa(etapaAtual.etapa),
          proximaEtapa: this.formatarNomeEtapa(proximaEtapa.etapa),
          candidatosEtapaAtual: etapaAtual.totalCandidatos,
          candidatosProximaEtapa: candidatosProximaEtapa[0]?.total || 0,
          taxaConversao: Number(taxaConversao)
        });
      }

      return conversoes;
    } catch (error) {
      console.error("Erro ao calcular conversão por etapa:", error);
      throw error;
    }
  }

  // 6. Candidatos parados
  async getCandidatosParados(empresaId: string, diasMinimo: number = 3) {
    try {
      const candidatosParados = await db
        .select({
          candidatoId: candidatos.id,
          candidatoNome: candidatos.nome,
          candidatoEmail: candidatos.email,
          vagaId: vagas.id,
          vagaTitulo: vagas.titulo,
          etapa: vagaCandidatos.etapa,
          diasParado: sql`EXTRACT(DAY FROM CURRENT_DATE - ${vagaCandidatos.dataMovimentacao})`,
          responsavelId: vagaCandidatos.responsavelId,
          responsavelNome: usuarios.nome,
          ultimaAtividade: vagaCandidatos.dataMovimentacao
        })
        .from(vagaCandidatos)
        .innerJoin(vagas, eq(vagaCandidatos.vagaId, vagas.id))
        .innerJoin(candidatos, eq(vagaCandidatos.candidatoId, candidatos.id))
        .leftJoin(usuarios, eq(vagaCandidatos.responsavelId, usuarios.id))
        .where(
          and(
            eq(vagas.empresaId, empresaId),
            sql`EXTRACT(DAY FROM CURRENT_DATE - ${vagaCandidatos.dataMovimentacao}) >= ${diasMinimo}`,
            sql`${vagaCandidatos.etapa} NOT IN ('aprovado', 'reprovado', 'contratado')`
          )
        )
        .orderBy(desc(sql`EXTRACT(DAY FROM CURRENT_DATE - ${vagaCandidatos.dataMovimentacao})`));

      return candidatosParados.map(item => ({
        ...item,
        etapa: this.formatarNomeEtapa(item.etapa), // Formatar nome da etapa
        diasParado: Number(item.diasParado),
        statusAlerta: this.calcularStatusAlerta(Number(item.diasParado))
      }));
    } catch (error) {
      console.error("Erro ao buscar candidatos parados:", error);
      throw error;
    }
  }

  // 7. Produtividade por recrutador
  async getProdutividadeRecrutadores(empresaId: string, periodoDias: number = 30) {
    try {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - periodoDias);

      // Buscar todos os recrutadores de todas as empresas
      const recrutadores = await db
        .select({
          recrutadorId: usuarios.id,
          recrutadorNome: usuarios.nome,
          recrutadorEmail: usuarios.email,
          empresaNome: empresas.nome,
          empresaId: usuarios.empresaId
        })
        .from(usuarios)
        .innerJoin(empresas, eq(usuarios.empresaId, empresas.id))
        .where(sql`${usuarios.perfil} IN ('recrutador', 'admin', 'gestor')`);

      console.log(`Encontrados ${recrutadores.length} recrutadores para empresa ${empresaId}:`, recrutadores.map(r => r.recrutadorNome));

      // Para cada recrutador, calcular suas métricas
      const produtividade = await Promise.all(
        recrutadores.map(async (recrutador) => {
          const metricas = await db
            .select({
              totalCandidatosResponsavel: count(),
              candidatosMovimentados: count(sql`CASE WHEN ${vagaCandidatos.dataMovimentacao} >= ${dataLimite} THEN 1 END`),
              tempoMedioResposta: avg(sql`EXTRACT(DAY FROM ${vagaCandidatos.dataMovimentacao} - ${vagaCandidatos.dataInscricao})`),
              entrevistasMarcadas: count(sql`CASE WHEN ${vagaCandidatos.etapa} = 'entrevista' THEN 1 END`)
            })
            .from(vagaCandidatos)
            .innerJoin(vagas, eq(vagaCandidatos.vagaId, vagas.id))
            .where(
              and(
                eq(vagas.empresaId, empresaId),
                eq(vagaCandidatos.responsavelId, recrutador.recrutadorId)
              )
            );

          const metricasRecrutador = metricas[0] || {
            totalCandidatosResponsavel: 0,
            candidatosMovimentados: 0,
            tempoMedioResposta: 0,
            entrevistasMarcadas: 0
          };

          return {
            ...recrutador,
            ...metricasRecrutador,
            tempoMedioResposta: Number(metricasRecrutador.tempoMedioResposta) || 0,
            taxaProdutividade: metricasRecrutador.totalCandidatosResponsavel > 0 ? 
              ((metricasRecrutador.candidatosMovimentados / metricasRecrutador.totalCandidatosResponsavel) * 100).toFixed(2) : "0.00"
          };
        })
      );

      // Ordenar por produtividade (candidatos movimentados)
      return produtividade.sort((a, b) => Number(b.candidatosMovimentados) - Number(a.candidatosMovimentados));
    } catch (error) {
      console.error("Erro ao calcular produtividade dos recrutadores:", error);
      throw error;
    }
  }

  // 8. Dashboard completo de engajamento
  async getDashboardEngajamento(empresaId: string, vagaId?: string) {
    try {
      const [
        tempoMedioPorEtapa,
        etapasComDesistencia,
        taxaMovimentacao,
        slaEstourado,
        conversaoPorEtapa,
        candidatosParados,
        produtividadeRecrutadores
      ] = await Promise.all([
        this.getTempoMedioPorEtapa(empresaId, vagaId),
        this.getEtapasComMaiorDesistencia(empresaId),
        this.getTaxaMovimentacao(empresaId),
        this.getSlaEstourado(empresaId),
        this.getConversaoPorEtapa(empresaId, vagaId),
        this.getCandidatosParados(empresaId),
        this.getProdutividadeRecrutadores(empresaId)
      ]);

      // Calcular métricas resumidas
      const totalCandidatos = tempoMedioPorEtapa.reduce((acc, item) => acc + item.totalCandidatos, 0);
      const totalSlaEstourado = slaEstourado.length;
      const totalCandidatosParados = candidatosParados.length;
      const tempoMedioGeral = tempoMedioPorEtapa.reduce((acc, item) => acc + item.tempoMedio, 0) / tempoMedioPorEtapa.length;

      return {
        resumo: {
          totalCandidatos,
          totalSlaEstourado,
          totalCandidatosParados,
          tempoMedioGeral: Number(tempoMedioGeral.toFixed(2)),
          taxaMovimentacaoGeral: Number(taxaMovimentacao.taxaMovimentacao)
        },
        tempoMedioPorEtapa,
        etapasComDesistencia,
        taxaMovimentacao,
        slaEstourado,
        conversaoPorEtapa,
        candidatosParados,
        produtividadeRecrutadores
      };
    } catch (error) {
      console.error("Erro ao gerar dashboard de engajamento:", error);
      throw error;
    }
  }

  // Métodos auxiliares
  private formatarNomeEtapa(etapa: string): string {
    const nomesEtapas: { [key: string]: string } = {
      'recebido': 'Recebido',
      'triagem': 'Triagem',
      'entrevista': 'Entrevista',
      'avaliacao': 'Avaliação',
      'aprovado': 'Aprovado',
      'reprovado': 'Reprovado',
      'contratado': 'Contratado',
      'ba2ca055-8ff3-407b-ab0f-cdacf145cba6': 'Recebido', // Fallback para UUID conhecido
    };
    
    return nomesEtapas[etapa] || etapa;
  }

  private calcularNivelUrgencia(diasNaEtapa: number, limiteSla: number): string {
    const diasExcedidos = diasNaEtapa - limiteSla;
    if (diasExcedidos <= 0) return "normal";
    if (diasExcedidos <= 3) return "atencao";
    if (diasExcedidos <= 7) return "alto";
    return "critico";
  }

  private calcularStatusAlerta(diasParado: number): string {
    if (diasParado <= 3) return "normal";
    if (diasParado <= 7) return "atencao";
    if (diasParado <= 14) return "alto";
    return "critico";
  }

  // 9. Log de movimentação (chamado quando candidato é movimentado)
  async registrarMovimentacao(vagaCandidatoId: string, etapaAnterior: string, etapaNova: string, responsavelId?: string, motivo?: string, comentarios?: string) {
    try {
      // Calcular tempo na etapa anterior
      const candidato = await db
        .select({ dataMovimentacao: vagaCandidatos.dataMovimentacao })
        .from(vagaCandidatos)
        .where(eq(vagaCandidatos.id, vagaCandidatoId));

      const tempoNaEtapa = candidato[0] ? 
        Math.floor((Date.now() - new Date(candidato[0].dataMovimentacao).getTime()) / (1000 * 60 * 60 * 24)) : 0;

      await db.insert(logsMovimentacaoPipeline).values({
        vagaCandidatoId,
        etapaAnterior,
        etapaNova,
        tempoNaEtapa,
        responsavelId,
        motivoMovimentacao: motivo,
        comentarios
      });

      // Atualizar candidatos parados
      await this.atualizarCandidatosParados(vagaCandidatoId);
    } catch (error) {
      console.error("Erro ao registrar movimentação:", error);
      throw error;
    }
  }

  // 10. Atualizar candidatos parados
  async atualizarCandidatosParados(vagaCandidatoId?: string) {
    try {
      if (vagaCandidatoId) {
        // Atualizar candidato específico
        await db.delete(candidatosParados).where(eq(candidatosParados.vagaCandidatoId, vagaCandidatoId));
      } else {
        // Atualizar todos os candidatos parados
        await db.delete(candidatosParados);
      }

      // Recalcular candidatos parados
      const candidatosParaAnalisar = await db
        .select({
          vagaCandidatoId: vagaCandidatos.id,
          etapa: vagaCandidatos.etapa,
          responsavelId: vagaCandidatos.responsavelId,
          ultimaAtividade: vagaCandidatos.dataMovimentacao,
          limiteSla: slasEtapas.limiteDias
        })
        .from(vagaCandidatos)
        .leftJoin(slasEtapas, and(
          eq(slasEtapas.etapaId, sql`${vagaCandidatos.etapa}`),
          eq(slasEtapas.vagaId, vagaCandidatos.vagaId)
        ))
        .where(
          and(
            vagaCandidatoId ? eq(vagaCandidatos.id, vagaCandidatoId) : undefined,
            sql`${vagaCandidatos.etapa} NOT IN ('aprovado', 'reprovado', 'contratado')`
          )
        );

      for (const candidato of candidatosParaAnalisar) {
        const diasParado = Math.floor((Date.now() - new Date(candidato.ultimaAtividade).getTime()) / (1000 * 60 * 60 * 24));
        
        if (diasParado >= 3) { // Só registrar se estiver parado há 3+ dias
          await db.insert(candidatosParados).values({
            vagaCandidatoId: candidato.vagaCandidatoId,
            etapa: candidato.etapa,
            diasParado,
            limiteSla: candidato.limiteSla,
            statusAlerta: this.calcularStatusAlerta(diasParado),
            responsavelId: candidato.responsavelId,
            ultimaAtividade: candidato.ultimaAtividade
          });
        }
      }
    } catch (error) {
      console.error("Erro ao atualizar candidatos parados:", error);
      throw error;
    }
  }
} 