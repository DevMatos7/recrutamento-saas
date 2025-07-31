import { db } from '../db';
import { 
  intencoesChatbot, 
  logsNlp,
  candidatos,
  empresas
} from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { NLPService } from '../nlp/analyzer';

const nlpService = new NLPService();
import { WhatsAppDispatcher } from './dispatcher';

export class WhatsAppBot {
  private dispatcher: WhatsAppDispatcher;

  constructor() {
    this.dispatcher = new WhatsAppDispatcher();
  }

  // Processar mensagem recebida
  async processarMensagem(
    candidatoId: string, 
    mensagem: string
  ): Promise<{ success: boolean; resposta?: string; error?: string }> {
    try {
      // Buscar dados do candidato
      const [candidato] = await db
        .select()
        .from(candidatos)
        .where(eq(candidatos.id, candidatoId));

      if (!candidato) {
        return { success: false, error: 'Candidato não encontrado' };
      }

      // Analisar intenção da mensagem
      const analise = await nlpService.analisarIntencao(mensagem);

      // Salvar log da análise
      await this.salvarLogAnalise(candidatoId, mensagem, analise);

      // Se confiança é baixa, usar fallback
      if (analise.confianca < 0.5) {
        return await this.processarFallback(candidato);
      }

      // Buscar intenção configurada no banco
      const [intencaoConfig] = await db
        .select()
        .from(intencoesChatbot)
        .where(
          and(
            eq(intencoesChatbot.empresaId, candidato.empresaId),
            eq(intencoesChatbot.nome, analise.intencao),
            eq(intencoesChatbot.ativo, true)
          )
        );

      if (!intencaoConfig) {
        return await this.processarFallback(candidato);
      }

      // Executar ação baseada na intenção
      const resultado = await this.dispatcher.executarAcao(intencaoConfig.acao, candidatoId);

      if (resultado.success) {
        return {
          success: true,
          resposta: this.gerarRespostaConfirmacao(intencaoConfig.descricao)
        };
      } else {
        return {
          success: false,
          resposta: this.gerarRespostaErro(),
          error: resultado.error
        };
      }

    } catch (error) {
      console.error('Erro ao processar mensagem com chatbot:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  // Processar fallback quando não entende a mensagem
  private async processarFallback(candidato: any): Promise<{ success: boolean; resposta: string }> {
    const respostas = [
      `Olá ${candidato.nome}! Não entendi sua mensagem. Pode reformular?`,
      `Oi ${candidato.nome}! Desculpe, não consegui entender. Pode explicar de outra forma?`,
      `Olá! Não consegui processar sua solicitação. Pode tentar novamente?`
    ];

    const respostaAleatoria = respostas[Math.floor(Math.random() * respostas.length)];

    return {
      success: true,
      resposta: respostaAleatoria
    };
  }

  // Gerar resposta de confirmação
  private gerarRespostaConfirmacao(descricao: string | null): string {
    const respostas = [
      'Entendi! Vou processar sua solicitação.',
      'Perfeito! Estou trabalhando nisso para você.',
      'Ótimo! Sua solicitação foi registrada.',
      'Entendido! Vou cuidar disso agora.'
    ];

    const respostaAleatoria = respostas[Math.floor(Math.random() * respostas.length)];
    
    if (descricao) {
      return `${respostaAleatoria} ${descricao}`;
    }

    return respostaAleatoria;
  }

  // Gerar resposta de erro
  private gerarRespostaErro(): string {
    const respostas = [
      'Desculpe, não consegui processar sua solicitação no momento. Tente novamente mais tarde.',
      'Ops! Houve um problema ao processar sua solicitação. Pode tentar novamente?',
      'Desculpe, ocorreu um erro. Tente novamente em alguns instantes.'
    ];

    return respostas[Math.floor(Math.random() * respostas.length)];
  }

  // Salvar log da análise NLP
  private async salvarLogAnalise(
    candidatoId: string, 
    mensagemOriginal: string, 
    analise: { intencao: string; confianca: number }
  ): Promise<void> {
    try {
      await db.insert(logsNlp).values({
        candidatoId,
        mensagemOriginal,
        intencaoDetectada: analise.intencao,
        confianca: analise.confianca.toString(),
        acaoExecutada: analise.confianca >= 0.5 ? 'processada' : 'fallback',
        dadosAnalise: {
          timestamp: new Date().toISOString(),
          analise
        }
      });
    } catch (error) {
      console.error('Erro ao salvar log de análise:', error);
    }
  }

  // Processar resposta rápida (números 1, 2, 3, etc.)
  async processarRespostaRapida(
    candidatoId: string, 
    resposta: string
  ): Promise<{ success: boolean; resposta?: string; error?: string }> {
    try {
      // Verificar se é uma resposta numérica
      if (!/^\d+$/.test(resposta)) {
        return await this.processarMensagem(candidatoId, resposta);
      }

      // Buscar candidato para obter empresa
      const [candidato] = await db
        .select()
        .from(candidatos)
        .where(eq(candidatos.id, candidatoId));

      if (!candidato) {
        return { success: false, error: 'Candidato não encontrado' };
      }

      // Buscar última mensagem enviada para determinar o contexto
      const ultimaMensagem = await this.buscarUltimaMensagemEnviada(candidatoId);
      
      if (!ultimaMensagem) {
        return await this.processarFallback(candidato);
      }

      // Determinar evento baseado na última mensagem
      const evento = this.determinarEventoPorMensagem(ultimaMensagem);

      if (!evento) {
        return await this.processarFallback(candidato);
      }

      // Processar resposta rápida
      const resultado = await this.dispatcher.executarAcao(
        this.mapearRespostaParaAcao(resposta, evento),
        candidatoId
      );

      if (resultado.success) {
        return {
          success: true,
          resposta: this.gerarRespostaConfirmacao(`Opção ${resposta} processada.`)
        };
      } else {
        return {
          success: false,
          resposta: this.gerarRespostaErro(),
          error: resultado.error
        };
      }

    } catch (error) {
      console.error('Erro ao processar resposta rápida:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  // Buscar última mensagem enviada
  private async buscarUltimaMensagemEnviada(candidatoId: string): Promise<any> {
    try {
      const { mensagensWhatsapp } = await import('@shared/schema');
      
      const [mensagem] = await db
        .select()
        .from(mensagensWhatsapp)
        .where(
          and(
            eq(mensagensWhatsapp.candidatoId, candidatoId),
            eq(mensagensWhatsapp.tipo, 'enviada')
          )
        )
        .orderBy(mensagensWhatsapp.dataEnvio);

      return mensagem;
    } catch (error) {
      console.error('Erro ao buscar última mensagem:', error);
      return null;
    }
  }

  // Determinar evento baseado na mensagem
  private determinarEventoPorMensagem(mensagem: any): string | null {
    if (!mensagem.evento) return null;

    // Mapear eventos para ações
    const mapeamentoEventos: { [key: string]: string } = {
      'entrevista_agendada': 'entrevista',
      'solicitacao_remarcacao': 'entrevista',
      'solicitacao_documentos': 'documentos',
      'link_vaga': 'vaga',
      'candidato_aprovado': 'aprovacao',
      'candidato_reprovado': 'reprovacao'
    };

    return mapeamentoEventos[mensagem.evento] || null;
  }

  // Mapear resposta numérica para ação
  private mapearRespostaParaAcao(resposta: string, evento: string): string {
    const mapeamento: { [key: string]: { [key: string]: string } } = {
      entrevista: {
        '1': 'confirmar_entrevista',
        '2': 'remarcar_entrevista',
        '3': 'falar_com_rh'
      },
      documentos: {
        '1': 'enviar_link_vaga',
        '2': 'falar_com_rh'
      },
      vaga: {
        '1': 'enviar_link_vaga',
        '2': 'falar_com_rh'
      },
      aprovacao: {
        '1': 'falar_com_rh'
      },
      reprovacao: {
        '1': 'falar_com_rh'
      }
    };

    return mapeamento[evento]?.[resposta] || 'falar_com_rh';
  }

  // Treinar intenções do chatbot
  async treinarIntencao(data: {
    empresaId: string;
    nome: string;
    descricao: string;
    palavrasChave: string[];
    acao: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // Verificar se já existe
      const [existente] = await db
        .select()
        .from(intencoesChatbot)
        .where(
          and(
            eq(intencoesChatbot.empresaId, data.empresaId),
            eq(intencoesChatbot.nome, data.nome)
          )
        );

      if (existente) {
        // Atualizar existente
        await db
          .update(intencoesChatbot)
          .set({
            descricao: data.descricao,
            palavrasChave: data.palavrasChave,
            acao: data.acao,
            ativo: true
          })
          .where(eq(intencoesChatbot.id, existente.id));
      } else {
        // Criar nova
        await db.insert(intencoesChatbot).values({
          empresaId: data.empresaId,
          nome: data.nome,
          descricao: data.descricao,
          palavrasChave: data.palavrasChave,
          acao: data.acao,
          ativo: true
        });
      }

      return { success: true };

    } catch (error) {
      console.error('Erro ao treinar intenção:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  // Obter estatísticas do chatbot
  async obterEstatisticas(empresaId: string): Promise<any> {
    try {
      const logs = await db
        .select()
        .from(logsNlp)
        .innerJoin(candidatos, eq(logsNlp.candidatoId, candidatos.id))
        .where(eq(candidatos.empresaId, empresaId));

      const totalMensagens = logs.length;
      const mensagensProcessadas = logs.filter(l => l.logs_nlp.acaoExecutada === 'processada').length;
      const mensagensFallback = logs.filter(l => l.logs_nlp.acaoExecutada === 'fallback').length;
      
      // Top intenções
      const intencoes = logs
        .map(l => l.logs_nlp.intencaoDetectada)
        .filter(Boolean);
      
      const contagemIntencoes = intencoes.reduce((acc: any, intencao) => {
        acc[intencao] = (acc[intencao] || 0) + 1;
        return acc;
      }, {});

      const topIntencoes = Object.entries(contagemIntencoes)
        .sort(([,a]: any, [,b]: any) => b - a)
        .slice(0, 5)
        .map(([intencao, count]) => ({ intencao, count }));

      return {
        totalMensagens,
        mensagensProcessadas,
        mensagensFallback,
        taxaSucesso: totalMensagens > 0 ? (mensagensProcessadas / totalMensagens) * 100 : 0,
        topIntencoes
      };

    } catch (error) {
      console.error('Erro ao obter estatísticas do chatbot:', error);
      return {
        totalMensagens: 0,
        mensagensProcessadas: 0,
        mensagensFallback: 0,
        taxaSucesso: 0,
        topIntencoes: []
      };
    }
  }
}