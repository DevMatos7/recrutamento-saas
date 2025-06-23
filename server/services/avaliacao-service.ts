import { db } from "../db";
import { avaliacoes, questoesDisc, respostasDisc, candidatos } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface ResultadoDisc {
  D: number;
  I: number;
  S: number;
  C: number;
  perfilDominante: string;
  descricaoCompleta: string;
}

export class AvaliacaoService {
  // Obter modelo completo das questões DISC (todos os blocos)
  static async obterModeloDisc() {
    try {
      const questoes = await db
        .select()
        .from(questoesDisc)
        .orderBy(questoesDisc.bloco, questoesDisc.ordem);

      // Agrupar por bloco
      const blocos: { [key: string]: any[] } = {};
      
      questoes.forEach(questao => {
        if (!blocos[questao.bloco!]) {
          blocos[questao.bloco!] = [];
        }
        blocos[questao.bloco!].push({
          id: questao.id,
          texto: questao.frase,
          fator: questao.fator
        });
      });

      // Converter para array de blocos
      const blocosArray = Object.keys(blocos).map(bloco => ({
        bloco,
        frases: blocos[bloco]
      }));

      return blocosArray;
    } catch (error) {
      console.error("Erro ao obter modelo DISC:", error);
      throw new Error("Erro ao carregar questões DISC");
    }
  }

  // Iniciar nova avaliação DISC para candidato
  static async iniciarAvaliacao(candidatoId: string) {
    try {
      // Verificar se candidato existe
      const candidato = await db
        .select()
        .from(candidatos)
        .where(eq(candidatos.id, candidatoId))
        .limit(1);

      if (candidato.length === 0) {
        throw new Error("Candidato não encontrado");
      }

      // Verificar se já há avaliação em andamento
      const avaliacaoExistente = await db
        .select()
        .from(avaliacoes)
        .where(
          and(
            eq(avaliacoes.candidatoId, candidatoId),
            eq(avaliacoes.status, "em_andamento")
          )
        )
        .limit(1);

      if (avaliacaoExistente.length > 0) {
        return { id: avaliacaoExistente[0].id };
      }

      // Criar nova avaliação
      const novaAvaliacao = await db
        .insert(avaliacoes)
        .values({
          candidatoId,
          tipo: "DISC",
          status: "em_andamento"
        })
        .returning();

      return { id: novaAvaliacao[0].id };
    } catch (error) {
      console.error("Erro ao iniciar avaliação:", error);
      throw error;
    }
  }

  // Salvar respostas de um bloco
  static async salvarRespostasBloco(avaliacaoId: number, bloco: string, respostas: number[]) {
    try {
      // Validar que respostas são únicas e estão entre 1-4
      const respostasUnicas = new Set(respostas);
      if (respostasUnicas.size !== 4 || 
          !respostas.every(r => r >= 1 && r <= 4)) {
        throw new Error("Respostas inválidas: devem ser valores únicos de 1 a 4");
      }

      // Verificar se avaliação existe e está ativa
      const avaliacao = await db
        .select()
        .from(avaliacoes)
        .where(
          and(
            eq(avaliacoes.id, avaliacaoId),
            eq(avaliacoes.status, "em_andamento")
          )
        )
        .limit(1);

      if (avaliacao.length === 0) {
        throw new Error("Avaliação não encontrada ou já finalizada");
      }

      // Verificar se respostas para este bloco já existem
      const respostaExistente = await db
        .select()
        .from(respostasDisc)
        .where(
          and(
            eq(respostasDisc.avaliacaoId, avaliacaoId),
            eq(respostasDisc.bloco, bloco)
          )
        )
        .limit(1);

      if (respostaExistente.length > 0) {
        // Atualizar respostas existentes
        await db
          .update(respostasDisc)
          .set({ respostas: JSON.stringify(respostas) })
          .where(
            and(
              eq(respostasDisc.avaliacaoId, avaliacaoId),
              eq(respostasDisc.bloco, bloco)
            )
          );
      } else {
        // Inserir novas respostas
        await db
          .insert(respostasDisc)
          .values({
            avaliacaoId,
            bloco,
            respostas: JSON.stringify(respostas)
          });
      }

      return { success: true };
    } catch (error) {
      console.error("Erro ao salvar respostas:", error);
      throw error;
    }
  }

  // Finalizar avaliação e calcular resultado DISC
  static async finalizarAvaliacao(avaliacaoId: number): Promise<ResultadoDisc> {
    try {
      // Obter todas as respostas da avaliação
      const respostas = await db
        .select()
        .from(respostasDisc)
        .where(eq(respostasDisc.avaliacaoId, avaliacaoId));

      if (respostas.length === 0) {
        throw new Error("Nenhuma resposta encontrada para esta avaliação");
      }

      // Obter questões para mapeamento
      const questoes = await db
        .select()
        .from(questoesDisc)
        .orderBy(questoesDisc.bloco, questoesDisc.ordem);

      // Calcular pontuação DISC
      const pontuacao = { D: 0, I: 0, S: 0, C: 0 };

      respostas.forEach(resposta => {
        const respostasArray = JSON.parse(resposta.respostas as string) as number[];
        const questoesBloco = questoes.filter(q => q.bloco === resposta.bloco);

        respostasArray.forEach((pontos, index) => {
          const fator = questoesBloco[index]?.fator as keyof typeof pontuacao;
          if (fator) {
            pontuacao[fator] += pontos;
          }
        });
      });

      // Determinar perfil dominante
      const perfilDominante = Object.entries(pontuacao)
        .reduce((a, b) => a[1] > b[1] ? a : b)[0];

      // Descrição baseada no perfil dominante
      const descricoes = {
        D: "Dominante - Pessoa assertiva, direta e focada em resultados. Gosta de desafios e tomar decisões rápidas.",
        I: "Influente - Pessoa comunicativa, otimista e sociável. Trabalha bem em equipe e motiva outros.",
        S: "Estável - Pessoa confiável, paciente e leal. Valoriza estabilidade e harmonia no ambiente de trabalho.",
        C: "Cauteloso - Pessoa analítica, precisa e orientada por padrões. Foca na qualidade e exatidão."
      };

      const resultado: ResultadoDisc = {
        D: pontuacao.D,
        I: pontuacao.I,
        S: pontuacao.S,
        C: pontuacao.C,
        perfilDominante,
        descricaoCompleta: descricoes[perfilDominante as keyof typeof descricoes]
      };

      // Salvar resultado na avaliação
      await db
        .update(avaliacoes)
        .set({
          resultadoJson: JSON.stringify(resultado),
          dataFim: new Date(),
          status: "finalizada"
        })
        .where(eq(avaliacoes.id, avaliacaoId));

      return resultado;
    } catch (error) {
      console.error("Erro ao finalizar avaliação:", error);
      throw error;
    }
  }

  // Obter resultado de uma avaliação
  static async obterResultado(avaliacaoId: number) {
    try {
      const avaliacao = await db
        .select()
        .from(avaliacoes)
        .where(eq(avaliacoes.id, avaliacaoId))
        .limit(1);

      if (avaliacao.length === 0) {
        throw new Error("Avaliação não encontrada");
      }

      if (avaliacao[0].status !== "finalizada") {
        throw new Error("Avaliação ainda não foi finalizada");
      }

      return {
        id: avaliacao[0].id,
        candidatoId: avaliacao[0].candidatoId,
        dataInicio: avaliacao[0].dataInicio,
        dataFim: avaliacao[0].dataFim,
        resultado: JSON.parse(avaliacao[0].resultadoJson as string) as ResultadoDisc
      };
    } catch (error) {
      console.error("Erro ao obter resultado:", error);
      throw error;
    }
  }

  // Obter histórico de avaliações de um candidato
  static async obterHistoricoCandidato(candidatoId: string) {
    try {
      const avaliacoesCandidato = await db
        .select()
        .from(avaliacoes)
        .where(eq(avaliacoes.candidatoId, candidatoId))
        .orderBy(desc(avaliacoes.dataInicio));

      return avaliacoesCandidato.map(avaliacao => ({
        id: avaliacao.id,
        dataInicio: avaliacao.dataInicio,
        dataFim: avaliacao.dataFim,
        status: avaliacao.status,
        resultado: avaliacao.resultadoJson ? 
          JSON.parse(avaliacao.resultadoJson as string) : null
      }));
    } catch (error) {
      console.error("Erro ao obter histórico:", error);
      throw error;
    }
  }

  // Obter resultados DISC de todos os candidatos
  static async obterResultadosTodosCandidatos() {
    try {
      const todasAvaliacoes = await db
        .select()
        .from(avaliacoes)
        .where(eq(avaliacoes.status, "finalizada"))
        .orderBy(desc(avaliacoes.dataFim));

      // Organizar por candidato (pegar o resultado mais recente)
      const resultadosPorCandidato: { [candidatoId: string]: any } = {};
      
      todasAvaliacoes.forEach(avaliacao => {
        if (!resultadosPorCandidato[avaliacao.candidatoId!] && avaliacao.resultadoJson) {
          resultadosPorCandidato[avaliacao.candidatoId!] = {
            ...JSON.parse(avaliacao.resultadoJson as string),
            dataAvaliacao: avaliacao.dataFim
          };
        }
      });

      return resultadosPorCandidato;
    } catch (error) {
      console.error("Erro ao obter resultados de todos candidatos:", error);
      throw error;
    }
  }
}