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

      // Títulos dos blocos conforme definidos no seed
      const titulosBloco = {
        "A": "Tenho a agilidade de tornar...",
        "B": "Confunde-me com...",
        "C": "Desejo ser...",
        "D": "Quando em conflito, esse estilo...",
        "E": "Força aparente...",
        "F": "Com erros...",
        "G": "Sob estresse pode se tornar...",
        "H": "Característica principal...",
        "I": "Necessita de...",
        "J": "Limitação desse perfil...",
        "K": "Possui medo de...",
        "L": "Abordagem principal...",
        "M": "Outra limitação desse perfil...",
        "N": "Ponto cego...",
        "O": "Mensura desempenho com...",
        "P": "Mensura desempenho com...",
        "Q": "Com subalternos, costuma ser...",
        "R": "Prefere tarefas...",
        "S": "Em uma situação do...",
        "T": "Quando muito comprar...",
        "U": "Pode ser considerado...",
        "V": "Pode ser considerado...",
        "W": "Pode ser considerado...",
        "X": "Pode ser considerado..."
      };

      // Agrupar por bloco
      const blocos: { [key: string]: any[] } = {};
      
      questoes.forEach(questao => {
        if (!blocos[questao.bloco!]) {
          blocos[questao.bloco!] = [];
        }
        blocos[questao.bloco!].push({
          id: questao.id,
          frase: questao.frase,
          fator: questao.fator
        });
      });

      // Converter para array de blocos com títulos
      const blocosArray = Object.keys(blocos).map(bloco => ({
        bloco,
        titulo: titulosBloco[bloco as keyof typeof titulosBloco] || bloco,
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
      console.log("Iniciando avaliação para candidato:", candidatoId);
      
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
        console.log("Encontrada avaliação em andamento:", avaliacaoExistente[0].id);
        return { id: avaliacaoExistente[0].id, continuando: true };
      }

      console.log("Criando nova avaliação...");
      // Criar nova avaliação
      const novaAvaliacao = await db
        .insert(avaliacoes)
        .values({
          candidatoId,
          tipo: "DISC",
          status: "em_andamento",
          dataInicio: new Date()
        })
        .returning();

      console.log("Nova avaliação criada:", novaAvaliacao[0].id);
      return { id: novaAvaliacao[0].id, continuando: false };
    } catch (error) {
      console.error("Erro ao iniciar avaliação:", error);
      throw error;
    }
  }

  // Salvar respostas de um bloco
  static async salvarRespostasBloco(avaliacaoId: number, bloco: string, respostas: number[]) {
    try {
      console.log("AvaliacaoService.salvarRespostasBloco - Input:", { avaliacaoId, bloco, respostas });
      
      // Validar dados de entrada
      if (!Array.isArray(respostas) || respostas.length !== 4) {
        throw new Error("Respostas deve ser um array com 4 elementos");
      }

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
          .set({ respostas: respostas })
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
            respostas: respostas
          });
      }

      console.log("Respostas salvas com sucesso para bloco:", bloco);
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
        let respostasArray: number[];
        try {
          console.log(`Processando bloco ${resposta.bloco}, dados:`, resposta.respostas);
          
          // Como agora salvamos diretamente como JSONB, deve ser um array
          if (Array.isArray(resposta.respostas)) {
            respostasArray = resposta.respostas;
          } else {
            console.error("Respostas não é um array:", resposta.respostas);
            return;
          }
          
          console.log(`Respostas processadas para bloco ${resposta.bloco}:`, respostasArray);
        } catch (error) {
          console.error(`Erro ao fazer parse das respostas do bloco ${resposta.bloco}:`, error, "Data:", resposta.respostas);
          return; // Pular esta resposta inválida
        }
        
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

      return avaliacoesCandidato.map(avaliacao => {
        let resultado = null;
        if (avaliacao.resultadoJson) {
          try {
            // Handle both string and object types
            if (typeof avaliacao.resultadoJson === 'string') {
              resultado = JSON.parse(avaliacao.resultadoJson);
            } else {
              resultado = avaliacao.resultadoJson;
            }
          } catch (error) {
            console.error("Erro ao parsear JSON do resultado:", error);
            resultado = null;
          }
        }
        
        return {
          id: avaliacao.id,
          dataInicio: avaliacao.dataInicio,
          dataFim: avaliacao.dataFim,
          status: avaliacao.status,
          resultado
        };
      });
    } catch (error) {
      console.error("Erro ao obter histórico:", error);
      throw error;
    }
  }

  // Buscar progresso de uma avaliação
  static async buscarProgressoAvaliacao(avaliacaoId: number) {
    try {
      console.log("Buscando progresso para avaliação:", avaliacaoId);
      
      // Buscar todas as respostas salvas
      const respostasSalvas = await db
        .select()
        .from(respostasDisc)
        .where(eq(respostasDisc.avaliacaoId, avaliacaoId))
        .orderBy(respostasDisc.bloco);

      console.log("Respostas encontradas:", respostasSalvas.length);

      // Organizar respostas por bloco
      const respostasOrganizadas: { [bloco: string]: number[] } = {};
      let proximoBloco = 0;

      respostasSalvas.forEach((resposta) => {
        respostasOrganizadas[resposta.bloco] = resposta.respostas as number[];
        proximoBloco = Math.max(proximoBloco, this.obterIndiceBlocoSequencial(resposta.bloco) + 1);
      });

      // Limitar ao máximo de 24 blocos
      proximoBloco = Math.min(proximoBloco, 23);

      console.log("Progresso calculado:", { proximoBloco, blocosSalvos: respostasSalvas.length });

      return {
        respostas: respostasOrganizadas,
        proximoBloco,
        blocosSalvos: respostasSalvas.length
      };
    } catch (error) {
      console.error("Erro ao buscar progresso:", error);
      return { respostas: {}, proximoBloco: 0, blocosSalvos: 0 };
    }
  }

  // Helper para converter letra do bloco em índice numérico
  private static obterIndiceBlocoSequencial(bloco: string): number {
    return bloco.charCodeAt(0) - 65; // A=0, B=1, C=2, etc.
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
          try {
            // Verificar se é string antes de fazer parse
            const resultado = typeof avaliacao.resultadoJson === 'string' 
              ? JSON.parse(avaliacao.resultadoJson) 
              : avaliacao.resultadoJson;
            
            resultadosPorCandidato[avaliacao.candidatoId!] = {
              ...resultado,
              dataAvaliacao: avaliacao.dataFim
            };
          } catch (error) {
            console.error("Erro ao fazer parse do resultado JSON:", error, avaliacao.resultadoJson);
          }
        }
      });

      return resultadosPorCandidato;
    } catch (error) {
      console.error("Erro ao obter resultados de todos candidatos:", error);
      throw error;
    }
  }
}