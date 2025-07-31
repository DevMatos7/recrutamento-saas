import { Request, Response } from 'express';
import { db } from './db';
import { 
  candidatos, 
  vagas, 
  vagaCandidatos, 
  entrevistas,
  pipelineEtapas,
  whatsappSessoes
} from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { whatsappService } from './whatsapp/service';
import { wsService } from './websocket';

export interface WebhookEvent {
  tipo: string;
  candidatoId: string;
  vagaId?: string;
  dados?: any;
  empresaId: string;
  usuarioId?: string;
}

export class WebhookService {
  
  // Processar webhook de evento de recrutamento
  async processarEventoRecrutamento(evento: WebhookEvent): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📨 Processando webhook: ${evento.tipo} para candidato ${evento.candidatoId}`);
      
      // Buscar sessão WhatsApp da empresa
      const [sessao] = await db
        .select()
        .from(whatsappSessoes)
        .where(
          and(
            eq(whatsappSessoes.empresaId, evento.empresaId),
            eq(whatsappSessoes.status, 'conectado')
          )
        );

      if (!sessao) {
        return { success: false, error: 'Nenhuma sessão WhatsApp conectada para esta empresa' };
      }

      // Processar evento específico
      switch (evento.tipo) {
        case 'triagem_aprovada':
          return await this.processarTriagemAprovada(evento, sessao.id);
        
        case 'entrevista_agendada':
          return await this.processarEntrevistaAgendada(evento, sessao.id);
        
        case 'solicitar_documentos':
          return await this.processarSolicitarDocumentos(evento, sessao.id);
        
        case 'feedback_aprovado':
          return await this.processarFeedbackAprovado(evento, sessao.id);
        
        case 'feedback_reprovado':
          return await this.processarFeedbackReprovado(evento, sessao.id);
        
        case 'mudanca_etapa':
          return await this.processarMudancaEtapa(evento, sessao.id);
        
        case 'mensagem_direta':
          return await this.processarMensagemDireta(evento, sessao.id);
        
        case 'link_vaga':
          return await this.processarLinkVaga(evento, sessao.id);
        
        default:
          return { success: false, error: `Tipo de evento não reconhecido: ${evento.tipo}` };
      }

    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  // Triagem aprovada
  private async processarTriagemAprovada(evento: WebhookEvent, sessaoId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const [candidato] = await db
        .select()
        .from(candidatos)
        .where(eq(candidatos.id, evento.candidatoId));

      const [vaga] = await db
        .select()
        .from(vagas)
        .where(eq(vagas.id, evento.vagaId!));

      const resultado = await whatsappService.dispararPorEvento({
        sessaoId,
        candidatoId: evento.candidatoId,
        evento: 'triagem_aprovada',
        variables: {
          nome: candidato.nome,
          vaga: vaga.titulo,
          empresa: 'Empresa', // TODO: buscar nome da empresa
          data: new Date().toLocaleDateString('pt-BR'),
          link: `${process.env.FRONTEND_URL}/candidato/vaga/${evento.vagaId}`
        },
        enviadoPor: evento.usuarioId
      });

      return resultado;

    } catch (error) {
      console.error('Erro ao processar triagem aprovada:', error);
      return { success: false, error: 'Erro interno' };
    }
  }

  // Entrevista agendada
  private async processarEntrevistaAgendada(evento: WebhookEvent, sessaoId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const [candidato] = await db
        .select()
        .from(candidatos)
        .where(eq(candidatos.id, evento.candidatoId));

      const [entrevista] = await db
        .select()
        .from(entrevistas)
        .where(
          and(
            eq(entrevistas.candidatoId, evento.candidatoId),
            eq(entrevistas.status, 'agendada')
          )
        )
        .orderBy(entrevistas.dataHora);

      const [vaga] = await db
        .select()
        .from(vagas)
        .where(eq(vagas.id, entrevista.vagaId));

      const resultado = await whatsappService.dispararPorEvento({
        sessaoId,
        candidatoId: evento.candidatoId,
        evento: 'entrevista_agendada',
        variables: {
          nome: candidato.nome,
          vaga: vaga.titulo,
          data: new Date(entrevista.dataHora).toLocaleDateString('pt-BR'),
          hora: new Date(entrevista.dataHora).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          local: entrevista.local || 'A ser definido',
          link: entrevista.linkEntrevista || ''
        },
        enviadoPor: evento.usuarioId
      });

      return resultado;

    } catch (error) {
      console.error('Erro ao processar entrevista agendada:', error);
      return { success: false, error: 'Erro interno' };
    }
  }

  // Solicitar documentos
  private async processarSolicitarDocumentos(evento: WebhookEvent, sessaoId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const [candidato] = await db
        .select()
        .from(candidatos)
        .where(eq(candidatos.id, evento.candidatoId));

      const resultado = await whatsappService.dispararPorEvento({
        sessaoId,
        candidatoId: evento.candidatoId,
        evento: 'solicitar_documentos',
        variables: {
          nome: candidato.nome,
          documentos: evento.dados?.documentos || 'RG, CPF, Comprovante de Residência',
          prazo: evento.dados?.prazo || '7 dias',
          link: `${process.env.FRONTEND_URL}/candidato/documentos/${evento.candidatoId}`
        },
        enviadoPor: evento.usuarioId
      });

      return resultado;

    } catch (error) {
      console.error('Erro ao processar solicitação de documentos:', error);
      return { success: false, error: 'Erro interno' };
    }
  }

  // Feedback aprovado
  private async processarFeedbackAprovado(evento: WebhookEvent, sessaoId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const [candidato] = await db
        .select()
        .from(candidatos)
        .where(eq(candidatos.id, evento.candidatoId));

      const [vaga] = await db
        .select()
        .from(vagas)
        .where(eq(vagas.id, evento.vagaId!));

      const resultado = await whatsappService.dispararPorEvento({
        sessaoId,
        candidatoId: evento.candidatoId,
        evento: 'feedback_aprovado',
        variables: {
          nome: candidato.nome,
          vaga: vaga.titulo,
          observacoes: evento.dados?.observacoes || '',
          proximosPassos: evento.dados?.proximosPassos || 'Entraremos em contato em breve'
        },
        enviadoPor: evento.usuarioId
      });

      return resultado;

    } catch (error) {
      console.error('Erro ao processar feedback aprovado:', error);
      return { success: false, error: 'Erro interno' };
    }
  }

  // Feedback reprovado
  private async processarFeedbackReprovado(evento: WebhookEvent, sessaoId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const [candidato] = await db
        .select()
        .from(candidatos)
        .where(eq(candidatos.id, evento.candidatoId));

      const [vaga] = await db
        .select()
        .from(vagas)
        .where(eq(vagas.id, evento.vagaId!));

      const resultado = await whatsappService.dispararPorEvento({
        sessaoId,
        candidatoId: evento.candidatoId,
        evento: 'feedback_reprovado',
        variables: {
          nome: candidato.nome,
          vaga: vaga.titulo,
          motivo: evento.dados?.motivo || 'Não especificado',
          feedback: evento.dados?.feedback || ''
        },
        enviadoPor: evento.usuarioId
      });

      return resultado;

    } catch (error) {
      console.error('Erro ao processar feedback reprovado:', error);
      return { success: false, error: 'Erro interno' };
    }
  }

  // Mudança de etapa
  private async processarMudancaEtapa(evento: WebhookEvent, sessaoId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const [candidato] = await db
        .select()
        .from(candidatos)
        .where(eq(candidatos.id, evento.candidatoId));

      const [etapa] = await db
        .select()
        .from(pipelineEtapas)
        .where(eq(pipelineEtapas.id, evento.dados?.etapaId));

      const resultado = await whatsappService.dispararPorEvento({
        sessaoId,
        candidatoId: evento.candidatoId,
        evento: 'mudanca_etapa',
        variables: {
          nome: candidato.nome,
          etapa: etapa.nome,
          descricao: etapa.nome || '',
          prazo: 'Não definido'
        },
        enviadoPor: evento.usuarioId
      });

      return resultado;

    } catch (error) {
      console.error('Erro ao processar mudança de etapa:', error);
      return { success: false, error: 'Erro interno' };
    }
  }

  // Mensagem direta
  private async processarMensagemDireta(evento: WebhookEvent, sessaoId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const resultado = await whatsappService.enviarMensagem({
        sessaoId,
        candidatoId: evento.candidatoId,
        mensagem: evento.dados?.mensagem || 'Mensagem do RH',
        evento: 'mensagem_direta',
        enviadoPor: evento.usuarioId
      });

      return resultado;

    } catch (error) {
      console.error('Erro ao processar mensagem direta:', error);
      return { success: false, error: 'Erro interno' };
    }
  }

  // Link da vaga
  private async processarLinkVaga(evento: WebhookEvent, sessaoId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const [candidato] = await db
        .select()
        .from(candidatos)
        .where(eq(candidatos.id, evento.candidatoId));

      const [vaga] = await db
        .select()
        .from(vagas)
        .where(eq(vagas.id, evento.vagaId!));

      const resultado = await whatsappService.dispararPorEvento({
        sessaoId,
        candidatoId: evento.candidatoId,
        evento: 'link_vaga',
        variables: {
          nome: candidato.nome,
          vaga: vaga.titulo,
          link: `${process.env.FRONTEND_URL}/vaga/${evento.vagaId}`,
          descricao: vaga.descricao.substring(0, 100) + '...'
        },
        enviadoPor: evento.usuarioId
      });

      return resultado;

    } catch (error) {
      console.error('Erro ao processar link da vaga:', error);
      return { success: false, error: 'Erro interno' };
    }
  }

  // Notificar via WebSocket
  async notificarViaWebSocket(evento: WebhookEvent): Promise<void> {
    try {
      if (wsService) {
        wsService.broadcastToEmpresa(evento.empresaId, {
          type: 'webhook_event',
          data: {
            tipo: evento.tipo,
            candidatoId: evento.candidatoId,
            vagaId: evento.vagaId,
            dados: evento.dados,
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error('Erro ao notificar via WebSocket:', error);
    }
  }
}

export const webhookService = new WebhookService();

// Middleware para validar webhook
export function validateWebhook(req: Request, res: Response, next: any) {
  const signature = req.headers['x-webhook-signature'];
  const secret = process.env.WEBHOOK_SECRET;

  if (!secret) {
    console.warn('WEBHOOK_SECRET não configurado, pulando validação');
    return next();
  }

  if (!signature) {
    return res.status(401).json({ error: 'Assinatura não fornecida' });
  }

  // TODO: Implementar validação de assinatura HMAC
  // Por enquanto, apenas verificar se existe
  
  next();
} 