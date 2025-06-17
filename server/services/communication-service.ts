import nodemailer from 'nodemailer';
import { storage } from '../storage';
import type { Candidato, InsertComunicacao } from '@shared/schema';

// Template variables interface
interface TemplateVariables {
  nome?: string;
  vaga?: string;
  empresa?: string;
  data_entrevista?: string;
  link_teste?: string;
  observacoes?: string;
  [key: string]: string | undefined;
}

// Communication service class
export class CommunicationService {
  private emailTransporter: nodemailer.Transporter;

  constructor() {
    // Initialize email transporter with environment variables
    this.emailTransporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Generic method to send communications
  async enviarComunicacao(
    tipo: 'whatsapp' | 'email',
    candidato: Candidato,
    mensagem: string,
    assunto?: string,
    variables?: TemplateVariables
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const mensagemProcessada = this.processTemplate(mensagem, variables);
      const assuntoProcessado = assunto ? this.processTemplate(assunto, variables) : undefined;

      if (tipo === 'email') {
        return await this.enviarEmail(candidato, mensagemProcessada, assuntoProcessado);
      } else if (tipo === 'whatsapp') {
        return await this.enviarWhatsApp(candidato, mensagemProcessada);
      }

      return { success: false, error: 'Tipo de comunicação inválido' };
    } catch (error) {
      console.error('Erro ao enviar comunicação:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  // Send email method
  private async enviarEmail(
    candidato: Candidato,
    mensagem: string,
    assunto?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!candidato.email) {
        return { success: false, error: 'Candidato não possui email cadastrado' };
      }

      // In production, use actual SMTP credentials
      // For development/testing, simulate the sending
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 SIMULANDO ENVIO DE EMAIL:');
        console.log(`Para: ${candidato.email} (${candidato.nome})`);
        console.log(`Assunto: ${assunto || 'Comunicação GentePRO'}`);
        console.log(`Mensagem: ${mensagem}`);
        console.log('✅ Email simulado enviado com sucesso!');
        return { success: true };
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@gentepro.com',
        to: candidato.email,
        subject: assunto || 'Comunicação GentePRO',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
              <h2 style="color: #333; margin-bottom: 20px;">Olá, ${candidato.nome}!</h2>
              <div style="background-color: white; padding: 20px; border-radius: 4px; line-height: 1.6;">
                ${mensagem.replace(/\n/g, '<br>')}
              </div>
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                Esta é uma comunicação automática do sistema GentePRO.
              </p>
            </div>
          </div>
        `,
      };

      await this.emailTransporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro no envio do email' };
    }
  }

  // Send WhatsApp method
  private async enviarWhatsApp(
    candidato: Candidato,
    mensagem: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!candidato.telefone) {
        return { success: false, error: 'Candidato não possui telefone cadastrado' };
      }

      // In production, integrate with WhatsApp API (Z-API, Twilio, etc.)
      // For development/testing, simulate the sending
      console.log('📱 SIMULANDO ENVIO DE WHATSAPP:');
      console.log(`Para: ${candidato.telefone} (${candidato.nome})`);
      console.log(`Mensagem: ${mensagem}`);
      console.log('✅ WhatsApp simulado enviado com sucesso!');

      // TODO: Implement actual WhatsApp API integration
      // Example with Z-API:
      // const response = await fetch(`${ZAPI_URL}/send-text`, {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${ZAPI_TOKEN}` },
      //   body: JSON.stringify({
      //     phone: candidato.telefone,
      //     message: mensagem
      //   })
      // });

      return { success: true };
    } catch (error) {
      console.error('Erro ao enviar WhatsApp:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro no envio do WhatsApp' };
    }
  }

  // Process template variables
  private processTemplate(template: string, variables?: TemplateVariables): string {
    if (!variables) return template;

    let processed = template;
    Object.entries(variables).forEach(([key, value]) => {
      if (value !== undefined) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        processed = processed.replace(regex, value);
      }
    });

    return processed;
  }

  // Method to send communication and store in database
  async enviarEArmazenar(data: {
    candidatoId: string;
    tipo: 'whatsapp' | 'email';
    canal: 'inscricao' | 'pipeline' | 'entrevista' | 'teste' | 'outros';
    assunto?: string;
    mensagem: string;
    enviadoPor?: string;
    dataAgendada?: Date;
    variables?: TemplateVariables;
  }): Promise<{ success: boolean; comunicacao?: any; error?: string }> {
    try {
      // Get candidate data
      const candidato = await storage.getCandidato(data.candidatoId);
      if (!candidato) {
        return { success: false, error: 'Candidato não encontrado' };
      }

      // Create communication record
      const comunicacaoData: InsertComunicacao = {
        candidatoId: data.candidatoId,
        tipo: data.tipo,
        canal: data.canal,
        assunto: data.assunto,
        mensagem: data.mensagem,
        enviadoPor: data.enviadoPor,
        dataAgendada: data.dataAgendada,
        statusEnvio: 'pendente'
      };

      const comunicacao = await storage.createComunicacao(comunicacaoData);

      // Send immediately if no schedule date or if scheduled time has passed
      const shouldSendNow = !data.dataAgendada || data.dataAgendada <= new Date();

      if (shouldSendNow) {
        const result = await this.enviarComunicacao(
          data.tipo,
          candidato,
          data.mensagem,
          data.assunto,
          data.variables
        );

        // Update communication status
        await storage.updateComunicacao(comunicacao.id, {
          statusEnvio: result.success ? 'enviado' : 'erro',
          erro: result.error,
          dataEnvio: result.success ? new Date() : undefined
        });

        return { 
          success: result.success, 
          comunicacao, 
          error: result.error 
        };
      }

      return { success: true, comunicacao };
    } catch (error) {
      console.error('Erro ao enviar e armazenar comunicação:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  // Process pending communications (for scheduled messages)
  async processarPendentes(): Promise<void> {
    try {
      const pendentes = await storage.getComunicacoesPendentes();
      
      for (const comunicacao of pendentes) {
        const result = await this.enviarComunicacao(
          comunicacao.tipo as 'whatsapp' | 'email',
          comunicacao.candidato,
          comunicacao.mensagem,
          comunicacao.assunto
        );

        await storage.updateComunicacao(comunicacao.id, {
          statusEnvio: result.success ? 'enviado' : 'erro',
          erro: result.error,
          dataEnvio: result.success ? new Date() : undefined
        });
      }
    } catch (error) {
      console.error('Erro ao processar comunicações pendentes:', error);
    }
  }

  // Predefined message templates
  static getTemplates() {
    return {
      inscricao: {
        whatsapp: "Olá {{nome}}! Sua candidatura para a vaga {{vaga}} foi recebida com sucesso. Em breve entraremos em contato.",
        email: {
          assunto: "Candidatura recebida - {{vaga}}",
          mensagem: "Olá {{nome}},\n\nSua candidatura para a vaga {{vaga}} foi recebida com sucesso em nosso sistema.\n\nEm breve nossa equipe de recrutamento entrará em contato.\n\nAtenciosamente,\nEquipe {{empresa}}"
        }
      },
      pipeline: {
        whatsapp: "Olá {{nome}}! Sua candidatura para {{vaga}} avançou para a próxima etapa do processo seletivo.",
        email: {
          assunto: "Atualização do processo seletivo - {{vaga}}",
          mensagem: "Olá {{nome}},\n\nTemos uma atualização sobre sua candidatura para a vaga {{vaga}}.\n\nSua candidatura avançou para a próxima etapa do nosso processo seletivo.\n\n{{observacoes}}\n\nAtenciosamente,\nEquipe {{empresa}}"
        }
      },
      entrevista: {
        whatsapp: "Olá {{nome}}! Sua entrevista para a vaga {{vaga}} está agendada para {{data_entrevista}}.",
        email: {
          assunto: "Entrevista agendada - {{vaga}}",
          mensagem: "Olá {{nome}},\n\nSua entrevista para a vaga {{vaga}} foi agendada.\n\nData e hora: {{data_entrevista}}\n\n{{observacoes}}\n\nPor favor, confirme sua presença.\n\nAtenciosamente,\nEquipe {{empresa}}"
        }
      },
      teste: {
        whatsapp: "Olá {{nome}}! Foi disponibilizado um teste para sua candidatura. Acesse: {{link_teste}}",
        email: {
          assunto: "Teste disponível - {{vaga}}",
          mensagem: "Olá {{nome}},\n\nFoi disponibilizado um teste para sua candidatura da vaga {{vaga}}.\n\nPara acessar o teste, clique no link: {{link_teste}}\n\n{{observacoes}}\n\nAtenciosamente,\nEquipe {{empresa}}"
        }
      }
    };
  }
}

export const communicationService = new CommunicationService();