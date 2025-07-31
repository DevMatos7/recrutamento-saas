import { makeWASocket, useMultiFileAuthState } from 'baileys';
import { webcrypto } from 'crypto';
import P from 'pino';

// Configurar crypto global para o Baileys
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as any;
}

async function testSimpleBaileys() {
  try {
    console.log('🧪 Testando Baileys simples...');
    
    // Criar diretório de auth temporário
    const authDir = './temp-auth';
    
    // Carregar estado de autenticação
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    
    console.log('✅ Estado de auth carregado');
    
    // Criar conexão Baileys
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      logger: P({ level: 'silent' })
    });
    
    console.log('✅ Socket Baileys criado');
    
    // Configurar handler de eventos
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      console.log('📡 Evento connection.update:', {
        connection,
        hasQR: !!qr,
        hasLastDisconnect: !!lastDisconnect
      });
      
      if (qr) {
        console.log('🎯 QR Code detectado!');
        console.log('QR:', qr.substring(0, 50) + '...');
      }
      
      if (connection === 'open') {
        console.log('✅ Conectado com sucesso!');
        await saveCreds();
      }
      
      if (connection === 'close') {
        console.log('❌ Conexão fechada');
      }
    });
    
    console.log('⏳ Aguardando eventos...');
    
    // Manter o processo rodando por 30 segundos
    setTimeout(() => {
      console.log('⏰ Teste concluído');
      process.exit(0);
    }, 30000);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testSimpleBaileys();