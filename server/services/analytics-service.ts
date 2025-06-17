import { db } from "../db";
import { 
  vagas, 
  candidatos, 
  vagaCandidatos, 
  entrevistas, 
  testesResultados, 
  comunicacoes,
  departamentos,
  empresas 
} from "../../shared/schema";
import { eq, and, count, avg, sql, desc, asc } from "drizzle-orm";

export class AnalyticsService {
  
  // Dashboard Geral - KPIs principais
  async getDashboardGeral(empresaId: string) {
    try {
      // Total de vagas por status
      const vagasStatus = await db
        .select({
          status: vagas.status,
          total: count()
        })
        .from(vagas)
        .where(eq(vagas.empresaId, empresaId))
        .groupBy(vagas.status);

      // Total de candidatos por status no pipeline
      const candidatosStatus = await db
        .select({
          etapa: vagaCandidatos.etapa,
          total: count()
        })
        .from(vagaCandidatos)
        .innerJoin(vagas, eq(vagaCandidatos.vagaId, vagas.id))
        .where(eq(vagas.empresaId, empresaId))
        .groupBy(vagaCandidatos.etapa);

      // Tempo médio até contratação (em dias)
      const tempoMedioContratacao = await db
        .select({
          tempoMedio: avg(sql`EXTRACT(DAY FROM ${vagaCandidatos.dataMovimentacao} - ${candidatos.dataCriacao})`)
        })
        .from(vagaCandidatos)
        .innerJoin(vagas, eq(vagaCandidatos.vagaId, vagas.id))
        .innerJoin(candidatos, eq(vagaCandidatos.candidatoId, candidatos.id))
        .where(
          and(
            eq(vagas.empresaId, empresaId),
            eq(vagaCandidatos.etapa, 'aprovado')
          )
        );

      // Taxa de conversão por etapa
      const totalCandidatos = await db
        .select({ total: count() })
        .from(vagaCandidatos)
        .innerJoin(vagas, eq(vagaCandidatos.vagaId, vagas.id))
        .where(eq(vagas.empresaId, empresaId));

      const aprovados = await db
        .select({ total: count() })
        .from(vagaCandidatos)
        .innerJoin(vagas, eq(vagaCandidatos.vagaId, vagas.id))
        .where(
          and(
            eq(vagas.empresaId, empresaId),
            eq(vagaCandidatos.etapa, 'aprovado')
          )
        );

      // Entrevistas realizadas no mês atual
      const entrevistasRealizadas = await db
        .select({ total: count() })
        .from(entrevistas)
        .innerJoin(vagas, eq(entrevistas.vagaId, vagas.id))
        .where(
          and(
            eq(vagas.empresaId, empresaId),
            eq(entrevistas.status, 'realizada'),
            sql`EXTRACT(MONTH FROM ${entrevistas.dataHora}) = EXTRACT(MONTH FROM CURRENT_DATE)`
          )
        );

      return {
        vagas: {
          total: vagasStatus.reduce((acc, v) => acc + v.total, 0),
          abertas: vagasStatus.find(v => v.status === 'aberta')?.total || 0,
          emTriagem: vagasStatus.find(v => v.status === 'em_triagem')?.total || 0,
          encerradas: vagasStatus.find(v => v.status === 'encerrada')?.total || 0
        },
        candidatos: {
          total: candidatosStatus.reduce((acc, c) => acc + c.total, 0),
          recebidos: candidatosStatus.find(c => c.etapa === 'recebidos')?.total || 0,
          triagem: candidatosStatus.find(c => c.etapa === 'triagem')?.total || 0,
          entrevista: candidatosStatus.find(c => c.etapa === 'entrevista')?.total || 0,
          aprovados: candidatosStatus.find(c => c.etapa === 'aprovado')?.total || 0,
          reprovados: candidatosStatus.find(c => c.etapa === 'reprovado')?.total || 0
        },
        tempoMedioContratacao: Math.round(Number(tempoMedioContratacao[0]?.tempoMedio) || 0),
        taxaConversao: totalCandidatos[0]?.total > 0 
          ? Math.round((aprovados[0]?.total / totalCandidatos[0]?.total) * 100) 
          : 0,
        entrevistasRealizadas: entrevistasRealizadas[0]?.total || 0
      };
    } catch (error) {
      console.error('Erro ao buscar dashboard geral:', error);
      throw error;
    }
  }

  // Análise detalhada por vaga
  async getAnaliseVaga(vagaId: string, empresaId: string) {
    try {
      // Verificar se a vaga pertence à empresa
      const vaga = await db
        .select()
        .from(vagas)
        .where(and(eq(vagas.id, vagaId), eq(vagas.empresaId, empresaId)))
        .limit(1);

      if (!vaga.length) {
        throw new Error('Vaga não encontrada ou sem permissão');
      }

      // Candidatos por etapa
      const candidatosPorEtapa = await db
        .select({
          etapa: vagaCandidatos.etapa,
          total: count()
        })
        .from(vagaCandidatos)
        .where(eq(vagaCandidatos.vagaId, vagaId))
        .groupBy(vagaCandidatos.etapa);

      // Entrevistas da vaga
      const entrevistasVaga = await db
        .select({
          status: entrevistas.status,
          total: count()
        })
        .from(entrevistas)
        .where(eq(entrevistas.vagaId, vagaId))
        .groupBy(entrevistas.status);

      // Resultados de testes da vaga
      const resultadosTestes = await db
        .select({
          resultado: testesResultados.resultado,
          pontuacaoMedia: avg(testesResultados.pontuacao),
          total: count()
        })
        .from(testesResultados)
        .where(eq(testesResultados.vagaId, vagaId))
        .groupBy(testesResultados.resultado);

      // Origem dos candidatos (se disponível)
      const origemCandidatos = await db
        .select({
          origem: candidatos.origem,
          total: count()
        })
        .from(candidatos)
        .innerJoin(vagaCandidatos, eq(candidatos.id, vagaCandidatos.candidatoId))
        .where(eq(vagaCandidatos.vagaId, vagaId))
        .groupBy(candidatos.origem);

      return {
        vaga: vaga[0],
        pipeline: candidatosPorEtapa,
        entrevistas: entrevistasVaga,
        testes: resultadosTestes,
        origens: origemCandidatos
      };
    } catch (error) {
      console.error('Erro ao buscar análise da vaga:', error);
      throw error;
    }
  }

  // Análise por departamento
  async getAnaliseDepartamento(departamentoId: string, empresaId: string) {
    try {
      // Verificar se o departamento pertence à empresa
      const departamento = await db
        .select()
        .from(departamentos)
        .where(and(eq(departamentos.id, departamentoId), eq(departamentos.empresaId, empresaId)))
        .limit(1);

      if (!departamento.length) {
        throw new Error('Departamento não encontrado ou sem permissão');
      }

      // Vagas do departamento
      const vagasDepartamento = await db
        .select({
          status: vagas.status,
          total: count()
        })
        .from(vagas)
        .where(
          and(
            eq(vagas.departamentoId, departamentoId),
            eq(vagas.empresaId, empresaId)
          )
        )
        .groupBy(vagas.status);

      // Candidatos por vaga do departamento
      const candidatosPorVaga = await db
        .select({
          vagaId: vagas.id,
          titulo: vagas.titulo,
          totalCandidatos: count(),
          aprovados: sql<number>`COUNT(CASE WHEN ${vagaCandidatos.etapa} = 'aprovado' THEN 1 END)`
        })
        .from(vagas)
        .leftJoin(vagaCandidatos, eq(vagas.id, vagaCandidatos.vagaId))
        .where(
          and(
            eq(vagas.departamentoId, departamentoId),
            eq(vagas.empresaId, empresaId)
          )
        )
        .groupBy(vagas.id, vagas.titulo);

      return {
        departamento: departamento[0],
        vagas: vagasDepartamento,
        performance: candidatosPorVaga
      };
    } catch (error) {
      console.error('Erro ao buscar análise do departamento:', error);
      throw error;
    }
  }

  // Distribuição de perfis DISC e médias técnicas
  async getAnaliseTestesVaga(vagaId: string, empresaId: string) {
    try {
      // Verificar permissão
      const vaga = await db
        .select()
        .from(vagas)
        .where(and(eq(vagas.id, vagaId), eq(vagas.empresaId, empresaId)))
        .limit(1);

      if (!vaga.length) {
        throw new Error('Vaga não encontrada ou sem permissão');
      }

      // Distribuição de resultados de testes
      const resultadosTestes = await db
        .select({
          resultado: testesResultados.resultado,
          total: count()
        })
        .from(testesResultados)
        .where(eq(testesResultados.vagaId, vagaId))
        .groupBy(testesResultados.resultado);

      // Média de pontuação
      const mediaPontuacao = await db
        .select({
          pontuacaoMedia: avg(testesResultados.pontuacao),
          total: count()
        })
        .from(testesResultados)
        .where(eq(testesResultados.vagaId, vagaId));

      // Top candidatos por pontuação
      const topCandidatos = await db
        .select({
          candidatoId: candidatos.id,
          nome: candidatos.nome,
          pontuacao: testesResultados.pontuacao,
          resultado: testesResultados.resultado
        })
        .from(testesResultados)
        .innerJoin(candidatos, eq(testesResultados.candidatoId, candidatos.id))
        .where(eq(testesResultados.vagaId, vagaId))
        .orderBy(desc(testesResultados.pontuacao))
        .limit(10);

      return {
        resultadosTestes,
        mediaPontuacao: Math.round(Number(mediaPontuacao[0]?.pontuacaoMedia) || 0),
        totalTestes: mediaPontuacao[0]?.total || 0,
        topCandidatos
      };
    } catch (error) {
      console.error('Erro ao buscar análise de testes:', error);
      throw error;
    }
  }

  // Análise de origens das candidaturas
  async getAnaliseOrigens(empresaId: string) {
    try {
      const origens = await db
        .select({
          origem: candidatos.origem,
          total: count(),
          aprovados: sql<number>`COUNT(CASE WHEN ${vagaCandidatos.etapa} = 'aprovado' THEN 1 END)`
        })
        .from(candidatos)
        .innerJoin(vagaCandidatos, eq(candidatos.id, vagaCandidatos.candidatoId))
        .innerJoin(vagas, eq(vagaCandidatos.vagaId, vagas.id))
        .where(eq(vagas.empresaId, empresaId))
        .groupBy(candidatos.origem);

      return origens.map(origem => ({
        ...origem,
        taxaConversao: origem.total > 0 
          ? Math.round((origem.aprovados / origem.total) * 100) 
          : 0
      }));
    } catch (error) {
      console.error('Erro ao buscar análise de origens:', error);
      throw error;
    }
  }

  // Métricas de tempo por etapa
  async getTemposPorEtapa(empresaId: string) {
    try {
      const tempos = await db
        .select({
          etapa: vagaCandidatos.etapa,
          tempoMedio: avg(sql`EXTRACT(DAY FROM ${vagaCandidatos.dataMovimentacao} - LAG(${vagaCandidatos.dataMovimentacao}) OVER (PARTITION BY ${vagaCandidatos.candidatoId}, ${vagaCandidatos.vagaId} ORDER BY ${vagaCandidatos.dataMovimentacao}))`)
        })
        .from(vagaCandidatos)
        .innerJoin(vagas, eq(vagaCandidatos.vagaId, vagas.id))
        .where(eq(vagas.empresaId, empresaId))
        .groupBy(vagaCandidatos.etapa);

      return tempos.map(tempo => ({
        etapa: tempo.etapa,
        tempoMedioDias: Math.round(Number(tempo.tempoMedio) || 0)
      }));
    } catch (error) {
      console.error('Erro ao buscar tempos por etapa:', error);
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService();