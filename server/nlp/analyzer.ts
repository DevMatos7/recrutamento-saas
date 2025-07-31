import OpenAI from 'openai';
import { db } from '../db';
import { logsNlp, intencoesChatbot } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

export class NLPService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  // Analisar intenção de uma mensagem
  async analisarIntencao(mensagem: string): Promise<{ intencao: string; confianca: number }> {
    try {
      // Primeiro, tentar com OpenAI
      if (process.env.OPENAI_API_KEY) {
        return await this.analisarComOpenAI(mensagem);
      }

      // Fallback para análise local
      return this.analisarLocalmente(mensagem);
    } catch (error) {
      console.error('Erro na análise NLP:', error);
      return this.analisarLocalmente(mensagem);
    }
  }

  // Análise usando OpenAI
  private async analisarComOpenAI(mensagem: string): Promise<{ intencao: string; confianca: number }> {
    try {
      const prompt = `
Analise a seguinte mensagem e identifique a intenção do usuário.
Retorne apenas um JSON com "intencao" e "confianca" (número entre 0 e 1).

Mensagem: "${mensagem}"

Intenções possíveis:
- remarcar_entrevista: quando o usuário quer remarcar ou adiar uma entrevista
- confirmar_entrevista: quando o usuário confirma presença em entrevista
- solicitar_documentos: quando o usuário pergunta sobre documentos
- falar_com_rh: quando o usuário quer falar com alguém do RH
- enviar_link_vaga: quando o usuário pede link da vaga
- agendar_entrevista: quando o usuário quer agendar entrevista
- duvida_geral: quando o usuário tem dúvidas gerais
- cancelar_candidatura: quando o usuário quer cancelar
- status_candidatura: quando o usuário pergunta sobre status
- outros: quando não se encaixa nas outras categorias

Resposta (apenas JSON):
`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 100
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Resposta vazia da OpenAI');
      }

      const resultado = JSON.parse(content);
      return {
        intencao: resultado.intencao || 'outros',
        confianca: Math.min(Math.max(resultado.confianca || 0.5, 0), 1)
      };

    } catch (error) {
      console.error('Erro na análise OpenAI:', error);
      return this.analisarLocalmente(mensagem);
    }
  }

  // Análise local baseada em palavras-chave
  private analisarLocalmente(mensagem: string): { intencao: string; confianca: number } {
    const mensagemLower = mensagem.toLowerCase();

    // Mapeamento de palavras-chave para intenções
    const mapeamento: { [key: string]: { palavras: string[]; confianca: number } } = {
      remarcar_entrevista: {
        palavras: ['remarcar', 'adiar', 'mudar data', 'mudar horário', 'postergar', 'transferir'],
        confianca: 0.8
      },
      confirmar_entrevista: {
        palavras: ['confirmar', 'confirmo', 'vou estar', 'estarei presente', 'ok', 'sim'],
        confianca: 0.7
      },
      solicitar_documentos: {
        palavras: ['documentos', 'documentação', 'cpf', 'rg', 'certificado', 'comprovante'],
        confianca: 0.8
      },
      falar_com_rh: {
        palavras: ['falar com rh', 'recursos humanos', 'recrutador', 'contato', 'atendimento'],
        confianca: 0.7
      },
      enviar_link_vaga: {
        palavras: ['link', 'vaga', 'descrição', 'detalhes', 'mais informações'],
        confianca: 0.6
      },
      agendar_entrevista: {
        palavras: ['agendar', 'marcar', 'entrevista', 'reunião', 'encontro'],
        confianca: 0.7
      },
      duvida_geral: {
        palavras: ['dúvida', 'pergunta', 'como', 'quando', 'onde', 'o que'],
        confianca: 0.5
      },
      cancelar_candidatura: {
        palavras: ['cancelar', 'desistir', 'não quero mais', 'retirar'],
        confianca: 0.8
      },
      status_candidatura: {
        palavras: ['status', 'andamento', 'processo', 'resultado', 'aprovado', 'reprovado'],
        confianca: 0.6
      }
    };

    // Verificar cada intenção
    for (const [intencao, config] of Object.entries(mapeamento)) {
      for (const palavra of config.palavras) {
        if (mensagemLower.includes(palavra)) {
          return {
            intencao,
            confianca: config.confianca
          };
        }
      }
    }

    // Se não encontrou nada específico
    return {
      intencao: 'outros',
      confianca: 0.3
    };
  }

  // Treinar intenção com exemplos
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

  // Obter estatísticas de análise
  async obterEstatisticas(empresaId: string): Promise<any> {
    try {
      const logs = await db
        .select()
        .from(logsNlp)
        .innerJoin(intencoesChatbot, eq(logsNlp.candidatoId, intencoesChatbot.empresaId))
        .where(eq(intencoesChatbot.empresaId, empresaId));

      const totalAnalises = logs.length;
      const analisesComIntencao = logs.filter(l => l.logs_nlp.intencaoDetectada).length;
      const confiancaMedia = logs.reduce((acc, l) => acc + parseFloat(l.logs_nlp.confianca || '0'), 0) / totalAnalises;

      return {
        totalAnalises,
        analisesComIntencao,
        confiancaMedia: isNaN(confiancaMedia) ? 0 : confiancaMedia,
        taxaSucesso: totalAnalises > 0 ? (analisesComIntencao / totalAnalises) * 100 : 0
      };

    } catch (error) {
      console.error('Erro ao obter estatísticas NLP:', error);
      return {
        totalAnalises: 0,
        analisesComIntencao: 0,
        confiancaMedia: 0,
        taxaSucesso: 0
      };
    }
  }
}