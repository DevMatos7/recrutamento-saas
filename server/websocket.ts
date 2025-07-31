import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { whatsappSessionManager } from './whatsapp/session';
import { whatsappService } from './whatsapp/service';

interface WebSocketMessage {
  type: string;
  data: any;
  sessionId?: string;
  candidatoId?: string;
}

interface ConnectedClient {
  ws: WebSocket;
  sessionId?: string;
  empresaId?: string;
  userId?: string;
}

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Map<string, ConnectedClient> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server });
    this.setupWebSocket();
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('🔌 Nova conexão WebSocket estabelecida');
      
      const clientId = this.generateClientId();
      this.clients.set(clientId, { ws });

      // Enviar ID do cliente
      ws.send(JSON.stringify({
        type: 'connection_established',
        data: { clientId }
      }));

      ws.on('message', (message: string) => {
        try {
          const parsedMessage: WebSocketMessage = JSON.parse(message);
          this.handleMessage(clientId, parsedMessage);
        } catch (error) {
          console.error('Erro ao processar mensagem WebSocket:', error);
          ws.send(JSON.stringify({
            type: 'error',
            data: { message: 'Mensagem inválida' }
          }));
        }
      });

      ws.on('close', () => {
        console.log('🔌 Cliente WebSocket desconectado:', clientId);
        this.clients.delete(clientId);
      });

      ws.on('error', (error) => {
        console.error('Erro no WebSocket:', error);
        this.clients.delete(clientId);
      });
    });
  }

  private handleMessage(clientId: string, message: WebSocketMessage) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (message.type) {
      case 'subscribe_session':
        this.handleSubscribeSession(clientId, message.data);
        break;
      
      case 'subscribe_candidato':
        this.handleSubscribeCandidato(clientId, message.data);
        break;
      
      case 'send_message':
        this.handleSendMessage(clientId, message.data);
        break;
      
      case 'get_session_status':
        this.handleGetSessionStatus(clientId, message.data);
        break;
      
      case 'get_qr_code':
        this.handleGetQRCode(clientId, message.data);
        break;
      
      default:
        client.ws.send(JSON.stringify({
          type: 'error',
          data: { message: 'Tipo de mensagem não reconhecido' }
        }));
    }
  }

  private async handleSubscribeSession(clientId: string, data: { sessionId: string; empresaId: string; userId: string }) {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.sessionId = data.sessionId;
    client.empresaId = data.empresaId;
    client.userId = data.userId;

    // Enviar status atual da sessão
    const session = whatsappSessionManager.getSession(data.sessionId);
    const isConnected = whatsappSessionManager.isSessionConnected(data.sessionId);
    const qrCode = whatsappSessionManager.getSessionQRCode(data.sessionId);

    client.ws.send(JSON.stringify({
      type: 'session_status',
      data: {
        sessionId: data.sessionId,
        connected: isConnected,
        qrCode,
        session
      }
    }));

    console.log(`📱 Cliente ${clientId} inscrito na sessão ${data.sessionId}`);
  }

  private async handleSubscribeCandidato(clientId: string, data: { candidatoId: string }) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Enviar histórico de mensagens do candidato
    try {
      const historico = await whatsappService.obterHistorico(data.candidatoId);
      
      client.ws.send(JSON.stringify({
        type: 'candidato_historico',
        data: {
          candidatoId: data.candidatoId,
          historico
        }
      }));
    } catch (error) {
      console.error('Erro ao obter histórico do candidato:', error);
    }
  }

  private async handleSendMessage(clientId: string, data: { sessionId: string; candidatoId: string; mensagem: string }) {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      const resultado = await whatsappService.enviarMensagem({
        sessaoId: data.sessionId,
        candidatoId: data.candidatoId,
        mensagem: data.mensagem,
        enviadoPor: client.userId
      });

      client.ws.send(JSON.stringify({
        type: 'message_sent',
        data: resultado
      }));

      // Notificar outros clientes sobre a nova mensagem
      this.broadcastToSession(data.sessionId, {
        type: 'new_message',
        data: {
          candidatoId: data.candidatoId,
          mensagem: data.mensagem,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      client.ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Erro ao enviar mensagem' }
      }));
    }
  }

  private async handleGetSessionStatus(clientId: string, data: { sessionId: string }) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const isConnected = whatsappSessionManager.isSessionConnected(data.sessionId);
    const session = whatsappSessionManager.getSession(data.sessionId);

    client.ws.send(JSON.stringify({
      type: 'session_status',
      data: {
        sessionId: data.sessionId,
        connected: isConnected,
        session
      }
    }));
  }

  private async handleGetQRCode(clientId: string, data: { sessionId: string }) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const qrCode = whatsappSessionManager.getSessionQRCode(data.sessionId);

    client.ws.send(JSON.stringify({
      type: 'qr_code',
      data: {
        sessionId: data.sessionId,
        qrCode
      }
    }));
  }

  // Métodos públicos para broadcast
  public broadcastToSession(sessionId: string, message: WebSocketMessage) {
    this.clients.forEach((client, clientId) => {
      if (client.sessionId === sessionId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }

  public broadcastToEmpresa(empresaId: string, message: WebSocketMessage) {
    this.clients.forEach((client, clientId) => {
      if (client.empresaId === empresaId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }

  public broadcastToAll(message: WebSocketMessage) {
    this.clients.forEach((client, clientId) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }

  public notifyNewMessage(sessionId: string, candidatoId: string, mensagem: any) {
    this.broadcastToSession(sessionId, {
      type: 'new_message',
      data: {
        candidatoId,
        mensagem,
        timestamp: new Date().toISOString()
      }
    });
  }

  public notifySessionStatus(sessionId: string, status: any) {
    this.broadcastToSession(sessionId, {
      type: 'session_status_update',
      data: {
        sessionId,
        status
      }
    });
  }

  public notifyQRCodeUpdate(sessionId: string, qrCode: string | null) {
    this.broadcastToSession(sessionId, {
      type: 'qr_code_update',
      data: {
        sessionId,
        qrCode
      }
    });
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public getConnectedClientsCount(): number {
    return this.clients.size;
  }

  public getSessionClientsCount(sessionId: string): number {
    let count = 0;
    this.clients.forEach(client => {
      if (client.sessionId === sessionId) count++;
    });
    return count;
  }
}

export let wsService: WebSocketService;

export function initializeWebSocket(server: Server) {
  wsService = new WebSocketService(server);
  console.log('✅ WebSocket inicializado');
  return wsService;
} 