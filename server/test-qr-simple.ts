import { makeWASocket, useMultiFileAuthState, DisconnectReason } from 'baileys';
import { Boom } from '@hapi/boom';
import { webcrypto } from 'crypto';
import QRCode from 'qrcode';

// Configurar crypto global para o Baileys
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as any;
}

async function testQRSimple() {
  try {
    console.log('🧪 Testando QR Code simples...');
    
    // Criar diretório de auth temporário
    const authDir = './temp-auth-simple';
    
    // Carregar estado de autenticação
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    
    console.log('✅ Estado de auth carregado');
    
    // Criar conexão Baileys - configuração mínima
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: true
    });
    
    console.log('✅ Socket Baileys criado');
    
    // Configurar handler de eventos
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      console.log('📡 Evento connection.update:', {
        connection,
        hasQR: !!qr,
        hasLastDisconnect: !!lastDisconnect,
        statusCode: lastDisconnect?.error ? (lastDisconnect.error as Boom)?.output?.statusCode : null
      });
      
      if (qr) {
        console.log('🎯 QR Code detectado!');
        try {
          // Gerar QR Code como string para terminal
          const qrTerminal = await QRCode.toString(qr, { type: 'terminal' });
          console.log('QR Code Terminal:');
          console.log(qrTerminal);
          
          // Gerar QR Code como base64
          const qrBase64 = await QRCode.toDataURL(qr);
          console.log('QR Code Base64 (primeiros 100 chars):', qrBase64.substring(0, 100) + '...');
        } catch (error) {
          console.error('Erro ao gerar QR Code:', error);
        }
      }
      
      if (connection === 'open') {
        console.log('✅ Conectado com sucesso!');
        await saveCreds();
      }
      
      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        
        if (statusCode === DisconnectReason.restartRequired) {
          console.log('🔄 Restart required após scan do QR Code');
        } else if (statusCode === DisconnectReason.loggedOut) {
          console.log('❌ Logged out permanentemente');
        } else {
          console.log('❌ Conexão fechada, status code:', statusCode);
        }
      }
    });
    
    // Handler para salvar credenciais
    sock.ev.on('creds.update', saveCreds);
    
    console.log('⏳ Aguardando eventos...');
    
    // Manter o processo rodando por 60 segundos
    setTimeout(() => {
      console.log('⏰ Teste concluído');
      process.exit(0);
    }, 60000);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testQRSimple();