import {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  proto,
  downloadMediaMessage,
  jidDecode,
  isJidBroadcast
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { writeFile, readFile, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { db } from '../db';
import { whatsappSessoes } from '@shared/schema';
import { eq } from 'drizzle-orm';
import QRCode from 'qrcode';
import { webcrypto } from 'crypto';
import P from 'pino';
import { wsService } from '../websocket';

// Configurar crypto global para o Baileys
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as any;
}

export interface WhatsAppSession {
  id: string;
  empresaId: string;
  nome: string;
  numero: string;
  status: 'conectado' | 'desconectado' | 'erro';
  sock?: WASocket;
  qrCode?: string; // QR Code em base64
}

class WhatsAppSessionManager {
  private sessions: Map<string, WhatsAppSession> = new Map();
  private authDir = join(process.cwd(), 'whatsapp-auth');

  constructor() {
    if (!existsSync(this.authDir)) {
      mkdirSync(this.authDir, { recursive: true });
    }
    
    // Reconectar sessões automaticamente na inicialização
    this.reconectarSessoesAutomaticamente();
  }

  // Reconectar sessões que estavam conectadas
  private async reconectarSessoesAutomaticamente() {
    try {
      console.log('🔄 Reconectando sessões automaticamente...');
      
      const sessoesConectadas = await db
        .select()
        .from(whatsappSessoes)
        .where(eq(whatsappSessoes.status, 'conectado'));

      console.log(`📱 Encontradas ${sessoesConectadas.length} sessões para reconectar`);

      for (const sessao of sessoesConectadas) {
        // Verificar se a sessão já está na memória e conectada
        const sessionInMemory = this.sessions.get(sessao.id);
        if (sessionInMemory && this.isSessionConnected(sessao.id)) {
          console.log(`✅ Sessão ${sessao.nome} (${sessao.id}) já está conectada na memória`);
          continue;
        }

        console.log(`🔄 Reconectando sessão: ${sessao.nome} (${sessao.id})`);
        try {
          const sessionReconectada = await this.initializeSession(sessao.id);
          
          if (sessionReconectada) {
            console.log(`✅ Sessão ${sessao.id} reconectada com sucesso`);
            // Aguardar um pouco para a conexão se estabelecer
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Verificar se realmente conectou
            if (this.isSessionConnected(sessao.id)) {
              console.log(`✅ Sessão ${sessao.id} está realmente conectada`);
            } else {
              console.log(`❌ Sessão ${sessao.id} falhou na reconexão`);
              // Atualizar status no banco para desconectado
              await this.updateSessionStatus(sessao.id, 'desconectado');
            }
          } else {
            console.log(`❌ Falha ao reconectar sessão ${sessao.id}`);
            // Atualizar status no banco para desconectado
            await this.updateSessionStatus(sessao.id, 'desconectado');
          }
          
          // Aguardar um pouco entre cada reconexão
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`❌ Erro ao reconectar sessão ${sessao.id}:`, error);
          // Atualizar status no banco para desconectado
          await this.updateSessionStatus(sessao.id, 'desconectado');
        }
      }

      console.log('✅ Reconexão automática concluída');
    } catch (error) {
      console.error('❌ Erro na reconexão automática:', error);
    }
  }

  async reinitializeSession(sessaoId: string): Promise<WhatsAppSession | null> {
    try {
      console.log(`Reinicializando sessão ${sessaoId} após scan do QR Code...`);
      
      // Aguardar um pouco antes de reinicializar
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Reinicializar a sessão
      return await this.initializeSession(sessaoId);
    } catch (error) {
      console.error(`Erro ao reinicializar sessão ${sessaoId}:`, error);
      return null;
    }
  }

  // Inicializar sessão do WhatsApp
  async initializeSession(sessaoId: string): Promise<WhatsAppSession | null> {
    try {
      // Buscar dados da sessão no banco
      const [sessaoData] = await db
        .select()
        .from(whatsappSessoes)
        .where(eq(whatsappSessoes.id, sessaoId));

      if (!sessaoData) {
        console.error(`Sessão ${sessaoId} não encontrada no banco`);
        return null;
      }

      console.log(`Inicializando sessão WhatsApp: ${sessaoData.nome}`);

      // Criar diretório de auth para esta sessão
      const authDir = join(process.cwd(), 'whatsapp-auth', sessaoId);
      if (!existsSync(authDir)) {
        mkdirSync(authDir, { recursive: true });
      }

      // Carregar estado de autenticação
      const { state, saveCreds } = await useMultiFileAuthState(authDir);

      // Tentar diferentes configurações
      const configs = [
        {
          name: 'Configuração 1 - Versão Específica (Solução)',
          options: {
            auth: state,
            printQRInTerminal: true,
            logger: P({ level: 'silent' }),
            version: [2, 2413, 1],
            syncFullHistory: false,
            defaultQueryTimeoutMs: undefined
          }
        },
        {
          name: 'Configuração 2 - Mínima',
          options: {
            auth: state,
            printQRInTerminal: true,
            logger: P({ level: 'silent' })
          }
        },
        {
          name: 'Configuração 3 - Com Browser',
          options: {
            auth: state,
            printQRInTerminal: true,
            logger: P({ level: 'silent' }),
            browser: ['GentePRO', 'Chrome', '1.0.0']
          }
        }
      ];

      for (const config of configs) {
        console.log(`Tentando ${config.name}...`);
        
        try {
          // Criar conexão Baileys
          const sock = makeWASocket(config.options);

          // Configurar handlers de eventos
          this.setupEventHandlers(sock, sessaoId, saveCreds);

          // Criar objeto de sessão
          const session: WhatsAppSession = {
            id: sessaoId,
            empresaId: sessaoData.empresaId,
            nome: sessaoData.nome,
            numero: sessaoData.numero,
            status: 'desconectado',
            sock
          };

          // Armazenar na memória
          this.sessions.set(sessaoId, session);

          // Aguardar um pouco para ver se a conexão funciona
          await new Promise(resolve => setTimeout(resolve, 5000));

          // Se chegou aqui sem erro, a configuração funcionou
          console.log(`✅ ${config.name} funcionou!`);
          return session;

        } catch (error) {
          console.error(`❌ ${config.name} falhou:`, error);
          continue;
        }
      }

      console.error('Todas as configurações falharam');
      await this.updateSessionStatus(sessaoId, 'erro');
      return null;

    } catch (error) {
      console.error('Erro ao inicializar sessão WhatsApp:', error);
      await this.updateSessionStatus(sessaoId, 'erro');
      return null;
    }
  }

  // Configurar handlers de eventos do Baileys
  private setupEventHandlers(
    sock: WASocket,
    sessaoId: string,
    saveCreds: () => Promise<void>
  ) {
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      console.log(`[DEBUG] Evento connection.update para sessão ${sessaoId}:`, {
        connection,
        hasQR: !!qr,
        hasLastDisconnect: !!lastDisconnect,
        statusCode: lastDisconnect?.error ? (lastDisconnect.error as Boom)?.output?.statusCode : null
      });

      // on a qr event, the connection and lastDisconnect fields will be empty
      if (qr) {
        console.log(`QR Code disponível para sessão ${sessaoId}`);
        try {
          // Gerar QR Code como string para terminal (debug)
          const qrTerminal = await QRCode.toString(qr, { type: 'terminal' });
          console.log('QR Code Terminal:', qrTerminal);
          
          // Gerar QR Code como base64 para frontend
          const qrCodeDataURL = await QRCode.toDataURL(qr, {
            width: 300,
            margin: 2,
            color: { dark: '#000000', light: '#FFFFFF' }
          });
          
          const session = this.sessions.get(sessaoId);
          if (session) {
            session.qrCode = qrCodeDataURL;
            console.log(`QR Code armazenado para sessão ${sessaoId}`);
          }
          await this.updateSessionStatus(sessaoId, 'desconectado');
        } catch (error) {
          console.error('Erro ao gerar QR Code:', error);
        }
      }

      if (connection === 'open') {
        console.log(`Sessão ${sessaoId} conectada com sucesso!`);
        await this.updateSessionStatus(sessaoId, 'conectado');
        
        // Salvar o número do WhatsApp
        try {
          const session = this.sessions.get(sessaoId);
          if (session?.sock) {
            const me = session.sock.user;
            if (me?.id) {
              const numero = me.id.split('@')[0];
              console.log(`📱 Número do WhatsApp: ${numero}`);
              
              // Atualizar número no banco
              await db
                .update(whatsappSessoes)
                .set({ 
                  numero: numero,
                  atualizadoEm: new Date() 
                })
                .where(eq(whatsappSessoes.id, sessaoId));
            }
          }
        } catch (error) {
          console.error('Erro ao salvar número:', error);
        }
        
        // Limpar QR Code após conexão bem-sucedida
        this.clearSessionQRCode(sessaoId);
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        
        if (statusCode === DisconnectReason.restartRequired) {
          console.log(`Sessão ${sessaoId} requer reinicialização após scan do QR Code`);
          // Criar nova sessão após scan do QR Code
          await this.reinitializeSession(sessaoId);
        } else if (statusCode === DisconnectReason.loggedOut) {
          console.log(`Sessão ${sessaoId} desconectada permanentemente (logged out)`);
          await this.updateSessionStatus(sessaoId, 'desconectado');
          // Limpar sessão da memória
          this.sessions.delete(sessaoId);
        } else {
          console.log(`Conexão perdida para sessão ${sessaoId}, aguardando reconexão automática...`);
          await this.updateSessionStatus(sessaoId, 'desconectado');
        }
      }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
      console.log('Mensagem recebida:', JSON.stringify(m, undefined, 2));
      
      // Processar mensagens recebidas
      if (m.type === 'notify') {
        for (const msg of m.messages) {
          if (!msg.key.fromMe) {
            await this.handleIncomingMessage(sessaoId, msg);
          }
        }
      }
    });

    sock.ev.on('messages.update', async (m) => {
      console.log('Mensagem atualizada:', JSON.stringify(m, undefined, 2));
    });
  }

  // Processar mensagem recebida
  private async handleIncomingMessage(sessaoId: string, msg: proto.IWebMessageInfo) {
    try {
      console.log(`📨 Processando mensagem recebida para sessão: ${sessaoId}`);
      
      const session = this.sessions.get(sessaoId);
      if (!session) {
        console.log(`❌ Sessão não encontrada: ${sessaoId}`);
        return;
      }

      const jid = msg.key.remoteJid!;
      const phone = jidDecode(jid)?.user;

      if (!phone) {
        console.log(`❌ Telefone não encontrado no JID: ${jid}`);
        return;
      }

      console.log(`📱 Telefone extraído: ${phone}`);

      let messageText = '';
      let mediaData: any = null;

      // Extrair texto da mensagem
      if (msg.message?.conversation) {
        messageText = msg.message.conversation;
      } else if (msg.message?.extendedTextMessage?.text) {
        messageText = msg.message.extendedTextMessage.text;
      }

      // Extrair mídia se houver
      if (msg.message?.imageMessage || msg.message?.videoMessage || msg.message?.audioMessage) {
        try {
          const buffer = await downloadMediaMessage(msg, 'buffer', {});
          mediaData = {
            type: msg.message.imageMessage ? 'image' :
                  msg.message.videoMessage ? 'video' : 'audio',
            data: buffer.toString('base64')
          };
        } catch (error) {
          console.error('Erro ao baixar mídia:', error);
        }
      }

      console.log(`📝 Texto da mensagem: ${messageText}`);

      // Buscar candidato pelo telefone
      const candidato = await this.findCandidatoByPhone(phone);
      
      if (candidato) {
        console.log(`✅ Candidato encontrado: ${candidato.nome} (${candidato.id})`);
        // Salvar mensagem no banco com candidato
        await this.saveIncomingMessage(sessaoId, candidato.id, phone, messageText, mediaData);
        
        // Processar com chatbot se configurado
        await this.processWithChatbot(candidato.id, messageText);
      } else {
        console.log(`📞 Candidato não encontrado para telefone: ${phone}`);
        // Salvar mensagem de não candidato
        await this.saveIncomingMessage(sessaoId, null, phone, messageText, mediaData);
        console.log(`✅ Mensagem salva para não candidato: ${phone}`);
      }

    } catch (error) {
      console.error('Erro ao processar mensagem recebida:', error);
    }
  }

  // Processar atualização de status de mensagem
  private async handleMessageStatusUpdate(sessaoId: string, update: any) {
    try {
      // Atualizar status da mensagem no banco
      // Implementar conforme necessário
    } catch (error) {
      console.error('Erro ao processar atualização de status:', error);
    }
  }

  // Buscar candidato pelo telefone
  private async findCandidatoByPhone(phone: string) {
    try {
      const { candidatos } = await import('@shared/schema');
      
      // Buscar candidato pelo telefone
      const [candidato] = await db
        .select()
        .from(candidatos)
        .where(eq(candidatos.telefone, phone));
      
      return candidato || null;
    } catch (error) {
      console.error('Erro ao buscar candidato:', error);
      return null;
    }
  }

  // Salvar mensagem recebida no banco
  private async saveIncomingMessage(
    sessaoId: string,
    candidatoId: string | null,
    telefone: string,
    mensagem: string,
    mediaData?: any
  ) {
    try {
      const { mensagensWhatsapp } = await import('@shared/schema');

      await db.insert(mensagensWhatsapp).values({
        candidatoId,
        sessaoId,
        telefone,
        tipo: 'recebida',
        mensagem,
        status: 'recebido',
        dadosAdicionais: mediaData ? { media: mediaData } : undefined,
        dataRecebimento: new Date()
      });
      
      console.log(`✅ Mensagem salva: ${telefone} - ${mensagem.substring(0, 50)}...`);
    } catch (error) {
      console.error('Erro ao salvar mensagem recebida:', error);
    }
  }

  // Processar mensagem com chatbot
  private async processWithChatbot(candidatoId: string, mensagem: string) {
    try {
      // Importar e usar o serviço de NLP
      const { NLPService } = await import('../nlp/analyzer');
      const nlpService = new NLPService();
      const analise = await nlpService.analisarIntencao(mensagem);

      if (analise.intencao && analise.confianca > 0.7) {
        // Executar ação baseada na intenção
        await this.executeChatbotAction(candidatoId, analise.intencao, mensagem);
      }
    } catch (error) {
      console.error('Erro ao processar com chatbot:', error);
    }
  }

  // Executar ação do chatbot
  private async executeChatbotAction(candidatoId: string, intencao: string, mensagemOriginal: string) {
    try {
      // Implementar ações baseadas na intenção
      // Por exemplo: remarcar entrevista, solicitar documentos, etc.
      console.log(`Executando ação do chatbot: ${intencao} para candidato ${candidatoId}`);
    } catch (error) {
      console.error('Erro ao executar ação do chatbot:', error);
    }
  }

  // Enviar mensagem
  async sendMessage(sessaoId: string, phone: string, message: string): Promise<boolean> {
    try {
      const session = this.sessions.get(sessaoId);
      if (!session || !session.sock || session.status !== 'conectado') {
        console.error(`Sessão ${sessaoId} não está conectada`);
        return false;
      }

      // Formatar número do telefone
      const formattedPhone = this.formatPhoneNumber(phone);

      // Enviar mensagem
      await session.sock.sendMessage(`${formattedPhone}@s.whatsapp.net`, {
        text: message
      });

      return true;
    } catch (error) {
      console.error('Erro ao enviar mensagem WhatsApp:', error);
      return false;
    }
  }

  // Formatar número do telefone
  private formatPhoneNumber(phone: string): string {
    // Remover caracteres não numéricos
    let cleaned = phone.replace(/\D/g, '');

    // Adicionar código do país se não tiver
    if (!cleaned.startsWith('55')) {
      cleaned = '55' + cleaned;
    }

    return cleaned;
  }

  // Atualizar status da sessão no banco
  private async updateSessionStatus(sessaoId: string, status: string) {
    try {
      await db
        .update(whatsappSessoes)
        .set({
          status,
          ultimaConexao: status === 'conectado' ? new Date() : undefined,
          atualizadoEm: new Date()
        })
        .where(eq(whatsappSessoes.id, sessaoId));
      
      // Notificar via WebSocket
      if (wsService) {
        wsService.notifySessionStatus(sessaoId, { status, timestamp: new Date().toISOString() });
      }
    } catch (error) {
      console.error('Erro ao atualizar status da sessão:', error);
    }
  }

  // Obter sessão
  getSession(sessaoId: string): WhatsAppSession | undefined {
    return this.sessions.get(sessaoId);
  }

  // Listar todas as sessões
  getAllSessions(): WhatsAppSession[] {
    return Array.from(this.sessions.values());
  }

  // Desconectar sessão
  async disconnectSession(sessaoId: string): Promise<boolean> {
    try {
      const session = this.sessions.get(sessaoId);
      if (session?.sock) {
        await session.sock.logout();
        session.sock.end(undefined);
      }

      this.sessions.delete(sessaoId);
      await this.updateSessionStatus(sessaoId, 'desconectado');

      return true;
    } catch (error) {
      console.error('Erro ao desconectar sessão:', error);
      return false;
    }
  }

  // Verificar se sessão está conectada
  isSessionConnected(sessaoId: string): boolean {
    const session = this.sessions.get(sessaoId);
    return session?.status === 'conectado' || false;
  }

  // Obter QR Code da sessão
  getSessionQRCode(sessaoId: string): string | null {
    const session = this.sessions.get(sessaoId);
    return session?.qrCode || null;
  }

  // Limpar QR Code após conexão
  private clearSessionQRCode(sessaoId: string): void {
    const session = this.sessions.get(sessaoId);
    if (session) {
      session.qrCode = undefined;
    }
    
    // Notificar via WebSocket
    if (wsService) {
      wsService.notifyQRCodeUpdate(sessaoId, null);
    }
  }
}

export const whatsappSessionManager = new WhatsAppSessionManager();