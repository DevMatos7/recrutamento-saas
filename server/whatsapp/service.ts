import { db } from '../db';
import { 
  mensagensWhatsapp, 
  templatesMensagem, 
  respostasRapidas,
  filaEnvio,
  configuracoesHorario,
  candidatos,
  vagas,
  vagaCandidatos
} from '@shared/schema';
import { eq, and, gte, lte, inArray } from 'drizzle-orm';
import { whatsappSessionManager } from './session';
import { WhatsAppDispatcher } from './dispatcher';
import { WhatsAppBot } from './bot';
import { wsService } from '../websocket';

export interface TemplateVariables {
  nome?: string;
  vaga?: string;
  empresa?: string;
  data?: string;
  local?: string;
  link?: string;
  observacoes?: string;
  [key: string]: string | undefined;
}

export class WhatsAppService {
  private dispatcher: WhatsAppDispatcher;
  private bot: WhatsAppBot;

  constructor() {
    this.dispatcher = new WhatsAppDispatcher();
    this.bot = new WhatsAppBot();
  }

  // Enviar mensagem direta
  async enviarMensagem(data: {
    sessaoId: string;
    candidatoId: string;
    mensagem: string;
    evento?: string;
    enviadoPor?: string;
  }): Promise<{ success: boolean; error?: string; mensagemId?: string }> {
    try {
      // Buscar dados do candidato
      const [candidato] = await db
        .select()
        .from(candidatos)
        .where(eq(candidatos.id, data.candidatoId));

      if (!candidato) {
        return { success: false, error: 'Candidato não encontrado' };
      }

      if (!candidato.telefone) {
        return { success: false, error: 'Candidato não possui telefone cadastrado' };
      }

      // Verificar se a sessão está conectada
      if (!whatsappSessionManager.isSessionConnected(data.sessaoId)) {
        return { success: false, error: 'Sessão WhatsApp não está conectada' };
      }

      // Enviar mensagem
      const enviado = await whatsappSessionManager.sendMessage(
        data.sessaoId,
        candidato.telefone,
        data.mensagem
      );

      if (!enviado) {
        return { success: false, error: 'Falha ao enviar mensagem' };
      }

      // Salvar mensagem no banco
      const [mensagemSalva] = await db
        .insert(mensagensWhatsapp)
        .values({
          candidatoId: data.candidatoId,
          sessaoId: data.sessaoId,
          telefone: candidato.telefone,
          tipo: 'enviada',
          evento: data.evento,
          mensagem: data.mensagem,
          status: 'enviado',
          enviadoPor: data.enviadoPor,
          dataEnvio: new Date()
        })
        .returning();

      // Notificar via WebSocket
      if (wsService) {
        wsService.notifyNewMessage(data.sessaoId, data.candidatoId, {
          id: mensagemSalva.id,
          tipo: 'enviada',
          mensagem: data.mensagem,
          status: 'enviado',
          dataEnvio: new Date().toISOString()
        });
      }

      return { 
        success: true, 
        mensagemId: mensagemSalva.id 
      };

    } catch (error) {
      console.error('Erro ao enviar mensagem WhatsApp:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  // Enviar mensagem para telefone (não candidato)
  async enviarMensagemParaTelefone(data: {
    sessaoId: string;
    telefone: string;
    mensagem: string;
    evento?: string;
    enviadoPor?: string;
  }): Promise<{ success: boolean; error?: string; mensagemId?: string }> {
    try {
      // Verificar se a sessão está conectada
      if (!whatsappSessionManager.isSessionConnected(data.sessaoId)) {
        return { success: false, error: 'Sessão WhatsApp não está conectada' };
      }

      // Enviar mensagem
      const enviado = await whatsappSessionManager.sendMessage(
        data.sessaoId,
        data.telefone,
        data.mensagem
      );

      if (!enviado) {
        return { success: false, error: 'Falha ao enviar mensagem' };
      }

      // Salvar mensagem no banco (sem candidatoId)
      const [mensagemSalva] = await db
        .insert(mensagensWhatsapp)
        .values({
          candidatoId: null,
          sessaoId: data.sessaoId,
          telefone: data.telefone,
          tipo: 'enviada',
          evento: data.evento,
          mensagem: data.mensagem,
          status: 'enviado',
          enviadoPor: data.enviadoPor,
          dataEnvio: new Date()
        })
        .returning();

      // Notificar via WebSocket
      if (wsService) {
        wsService.notifyNewMessage(data.sessaoId, data.telefone, {
          id: mensagemSalva.id,
          tipo: 'enviada',
          mensagem: data.mensagem,
          status: 'enviado',
          dataEnvio: new Date().toISOString()
        });
      }

      return { 
        success: true, 
        mensagemId: mensagemSalva.id 
      };

    } catch (error) {
      console.error('Erro ao enviar mensagem WhatsApp para telefone:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  // Enviar mensagem usando template
  async enviarMensagemComTemplate(data: {
    sessaoId: string;
    candidatoId: string;
    templateId: string;
    variables?: TemplateVariables;
    enviadoPor?: string;
  }): Promise<{ success: boolean; error?: string; mensagemId?: string }> {
    try {
      // Buscar template
      const [template] = await db
        .select()
        .from(templatesMensagem)
        .where(eq(templatesMensagem.id, data.templateId));

      if (!template) {
        return { success: false, error: 'Template não encontrado' };
      }

      if (!template.ativo) {
        return { success: false, error: 'Template está inativo' };
      }

      // Processar template com variáveis
      const mensagemProcessada = this.processarTemplate(template.corpo, data.variables);

      // Enviar mensagem
      return await this.enviarMensagem({
        sessaoId: data.sessaoId,
        candidatoId: data.candidatoId,
        mensagem: mensagemProcessada,
        evento: template.evento,
        enviadoPor: data.enviadoPor
      });

    } catch (error) {
      console.error('Erro ao enviar mensagem com template:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  // Disparar mensagem por evento
  async dispararPorEvento(data: {
    sessaoId: string;
    candidatoId: string;
    evento: string;
    variables?: TemplateVariables;
    enviadoPor?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // Verificar configuração de horário
      const podeEnviar = await this.verificarHorarioPermitido(data.sessaoId, data.evento);
      
      if (!podeEnviar) {
        // Agendar para envio posterior
        await this.agendarMensagem(data);
        return { success: true };
      }

      // Buscar template para o evento
      const [template] = await db
        .select()
        .from(templatesMensagem)
        .where(
          and(
            eq(templatesMensagem.evento, data.evento),
            eq(templatesMensagem.ativo, true)
          )
        );

      if (!template) {
        return { success: false, error: `Template não encontrado para evento: ${data.evento}` };
      }

      // Processar template
      const mensagemProcessada = this.processarTemplate(template.corpo, data.variables);

      // Enviar mensagem
      const resultado = await this.enviarMensagem({
        sessaoId: data.sessaoId,
        candidatoId: data.candidatoId,
        mensagem: mensagemProcessada,
        evento: data.evento,
        enviadoPor: data.enviadoPor
      });

      if (resultado.success) {
        // Processar respostas rápidas se houver
        await this.processarRespostasRapidas(data.candidatoId, data.evento, mensagemProcessada);
      }

      return resultado;

    } catch (error) {
      console.error('Erro ao disparar mensagem por evento:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  // Processar template com variáveis
  private processarTemplate(template: string, variables?: TemplateVariables): string {
    if (!variables) return template;

    let processado = template;
    Object.entries(variables).forEach(([key, value]) => {
      if (value !== undefined) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        processado = processado.replace(regex, value);
      }
    });

    return processado;
  }

  // Verificar se está no horário permitido para envio
  private async verificarHorarioPermitido(sessaoId: string, evento: string): Promise<boolean> {
    try {
      // Buscar configuração de horário
      const [config] = await db
        .select()
        .from(configuracoesHorario)
        .where(
          and(
            eq(configuracoesHorario.evento, evento),
            eq(configuracoesHorario.ativo, true)
          )
        );

      if (!config) {
        // Se não há configuração, permitir envio
        return true;
      }

      const agora = new Date();
      const horaAtual = agora.getHours() * 60 + agora.getMinutes(); // Minutos desde meia-noite
      const diaSemana = agora.getDay(); // 0 = domingo, 1 = segunda, etc.

      // Verificar dia da semana
      const diasSemana = config.diasSemana as number[];
      if (!diasSemana.includes(diaSemana)) {
        return false;
      }

      // Verificar horário
      const [horaInicioMin, horaFimMin] = [
        this.timeToMinutes(config.horaInicio),
        this.timeToMinutes(config.horaFim)
      ];

      return horaAtual >= horaInicioMin && horaAtual <= horaFimMin;

    } catch (error) {
      console.error('Erro ao verificar horário permitido:', error);
      return true; // Em caso de erro, permitir envio
    }
  }

  // Converter horário HH:MM para minutos
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Agendar mensagem para envio posterior
  private async agendarMensagem(data: {
    sessaoId: string;
    candidatoId: string;
    evento: string;
    variables?: TemplateVariables;
    enviadoPor?: string;
  }): Promise<void> {
    try {
      // Buscar template
      const [template] = await db
        .select()
        .from(templatesMensagem)
        .where(
          and(
            eq(templatesMensagem.evento, data.evento),
            eq(templatesMensagem.ativo, true)
          )
        );

      if (!template) return;

      // Processar template
      const mensagemProcessada = this.processarTemplate(template.corpo, data.variables);

      // Calcular próximo horário permitido
      const proximoHorario = await this.calcularProximoHorarioPermitido(data.evento);

      // Inserir na fila de envio
      await db.insert(filaEnvio).values({
        candidatoId: data.candidatoId,
        sessaoId: data.sessaoId,
        evento: data.evento,
        mensagem: mensagemProcessada,
        dataAgendada: proximoHorario,
        status: 'pendente'
      });

    } catch (error) {
      console.error('Erro ao agendar mensagem:', error);
    }
  }

  // Calcular próximo horário permitido
  private async calcularProximoHorarioPermitido(evento: string): Promise<Date> {
    try {
      const [config] = await db
        .select()
        .from(configuracoesHorario)
        .where(
          and(
            eq(configuracoesHorario.evento, evento),
            eq(configuracoesHorario.ativo, true)
          )
        );

      if (!config) {
        // Se não há configuração, agendar para daqui a 1 hora
        return new Date(Date.now() + 60 * 60 * 1000);
      }

      const agora = new Date();
      const [horaInicioMin, horaFimMin] = [
        this.timeToMinutes(config.horaInicio),
        this.timeToMinutes(config.horaFim)
      ];

      // Implementar lógica para calcular próximo horário permitido
      // Por simplicidade, agendar para o próximo dia útil
      const proximoDia = new Date(agora);
      proximoDia.setDate(proximoDia.getDate() + 1);
      proximoDia.setHours(9, 0, 0, 0); // 9:00 da manhã

      return proximoDia;

    } catch (error) {
      console.error('Erro ao calcular próximo horário:', error);
      return new Date(Date.now() + 60 * 60 * 1000); // 1 hora
    }
  }

  // Processar respostas rápidas
  private async processarRespostasRapidas(
    candidatoId: string, 
    evento: string, 
    mensagemEnviada: string
  ): Promise<void> {
    try {
      // Buscar respostas rápidas para o evento
      const respostas = await db
        .select()
        .from(respostasRapidas)
        .where(
          and(
            eq(respostasRapidas.evento, evento),
            eq(respostasRapidas.ativo, true)
          )
        );

      if (respostas.length === 0) return;

      // Adicionar opções de resposta rápida à mensagem
      const opcoes = respostas
        .map(r => `${r.opcao} - ${r.texto}`)
        .join('\n');

      const mensagemComOpcoes = `${mensagemEnviada}\n\nResponda com o número da opção:\n${opcoes}`;

      // Atualizar mensagem no banco
      // Implementar conforme necessário

    } catch (error) {
      console.error('Erro ao processar respostas rápidas:', error);
    }
  }

  // Processar resposta rápida recebida
  async processarRespostaRapida(data: {
    candidatoId: string;
    evento: string;
    resposta: string; // "1", "2", etc.
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // Buscar resposta rápida
      const [respostaRapida] = await db
        .select()
        .from(respostasRapidas)
        .where(
          and(
            eq(respostasRapidas.evento, data.evento),
            eq(respostasRapidas.opcao, data.resposta),
            eq(respostasRapidas.ativo, true)
          )
        );

      if (!respostaRapida) {
        return { success: false, error: 'Opção inválida' };
      }

      // Executar ação correspondente
      return await this.dispatcher.executarAcao(respostaRapida.acao, data.candidatoId);

    } catch (error) {
      console.error('Erro ao processar resposta rápida:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  // Obter histórico de mensagens
  async obterHistorico(candidatoId: string): Promise<any[]> {
    try {
      const mensagens = await db
        .select()
        .from(mensagensWhatsapp)
        .where(eq(mensagensWhatsapp.candidatoId, candidatoId))
        .orderBy(mensagensWhatsapp.dataEnvio);

      return mensagens;
    } catch (error) {
      console.error('Erro ao obter histórico:', error);
      return [];
    }
  }

  // Obter histórico de mensagens por telefone
  async obterHistoricoPorTelefone(telefone: string): Promise<any[]> {
    try {
      const mensagens = await db
        .select()
        .from(mensagensWhatsapp)
        .where(eq(mensagensWhatsapp.telefone, telefone))
        .orderBy(mensagensWhatsapp.dataEnvio);

      return mensagens;
    } catch (error) {
      console.error('Erro ao obter histórico por telefone:', error);
      return [];
    }
  }

  // Processar mensagem recebida com chatbot
  async processarMensagemRecebida(data: {
    candidatoId: string;
    mensagem: string;
  }): Promise<{ success: boolean; resposta?: string; error?: string }> {
    try {
      return await this.bot.processarMensagem(data.candidatoId, data.mensagem);
    } catch (error) {
      console.error('Erro ao processar mensagem com chatbot:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  // Obter estatísticas de mensagens
  async obterEstatisticas(empresaId: string, periodo?: { inicio: Date; fim: Date }): Promise<any> {
    try {
      let query = db
        .select({
          total: mensagensWhatsapp.id,
          enviadas: mensagensWhatsapp.tipo,
          recebidas: mensagensWhatsapp.tipo,
          entregues: mensagensWhatsapp.status,
          lidas: mensagensWhatsapp.status
        })
        .from(mensagensWhatsapp)
        .innerJoin(candidatos, eq(mensagensWhatsapp.candidatoId, candidatos.id))
        .where(eq(candidatos.empresaId, empresaId));

      let resultado;
      if (periodo) {
        resultado = await query.where(
          and(
            gte(mensagensWhatsapp.dataEnvio, periodo.inicio),
            lte(mensagensWhatsapp.dataEnvio, periodo.fim)
          )
        );
      } else {
        resultado = await query;
      }

      // resultado já foi definido acima

      // Processar estatísticas
      const stats = {
        total: resultado.length,
        enviadas: resultado.filter(r => r.enviadas === 'enviada').length,
        recebidas: resultado.filter(r => r.recebidas === 'recebida').length,
        entregues: resultado.filter(r => r.entregues === 'entregue').length,
        lidas: resultado.filter(r => r.lidas === 'lido').length
      };

      return stats;

    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return {
        total: 0,
        enviadas: 0,
        recebidas: 0,
        entregues: 0,
        lidas: 0
      };
    }
  }

  // Listar conversas (incluindo não candidatos)
  async listarConversas(): Promise<any[]> {
    try {
      console.log('🔍 Buscando conversas no banco...');
      
      // Buscar todas as mensagens
      const todasMensagens = await db
        .select()
        .from(mensagensWhatsapp)
        .orderBy(mensagensWhatsapp.dataEnvio);

      console.log(`📊 Encontradas ${todasMensagens.length} mensagens no banco`);

      // Agrupar por telefone e pegar a última mensagem de cada conversa
      const conversasMap = new Map();
      
      todasMensagens.forEach(mensagem => {
        const key = mensagem.telefone;
        if (!conversasMap.has(key) || new Date(mensagem.dataEnvio) > new Date(conversasMap.get(key).ultimaData)) {
          conversasMap.set(key, {
            telefone: mensagem.telefone,
            candidatoId: mensagem.candidatoId,
            ultimaMensagem: mensagem.mensagem,
            ultimaData: mensagem.dataEnvio,
            tipo: mensagem.tipo,
            totalMensagens: 1
          });
        } else {
          conversasMap.get(key).totalMensagens++;
        }
      });

      const conversas = Array.from(conversasMap.values());
      console.log(`📱 Agrupadas em ${conversas.length} conversas únicas`);

      // Buscar dados dos candidatos para as conversas que têm candidatoId
      const candidatosIds = conversas
        .filter(c => c.candidatoId)
        .map(c => c.candidatoId);

      const candidatosData = candidatosIds.length > 0 
        ? await db.select().from(candidatos).where(inArray(candidatos.id, candidatosIds))
        : [];

      // Combinar dados
      const conversasCompletas = conversas.map(conversa => {
        const candidato = candidatosData.find(c => c.id === conversa.candidatoId);
        return {
          telefone: conversa.telefone,
          candidatoId: conversa.candidatoId,
          nome: candidato?.nome || `Não cadastrado (${conversa.telefone})`,
          email: candidato?.email || null,
          ultimaMensagem: conversa.ultimaMensagem,
          ultimaData: conversa.ultimaData,
          tipo: conversa.tipo,
          totalMensagens: conversa.totalMensagens,
          isCandidato: !!candidato
        };
      });

      console.log(`✅ Retornando ${conversasCompletas.length} conversas completas`);
      return conversasCompletas;

    } catch (error) {
      console.error('Erro ao listar conversas:', error);
      return [];
    }
  }
}

export const whatsappService = new WhatsAppService();