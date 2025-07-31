import { makeWASocket, useMultiFileAuthState, DisconnectReason } from 'baileys';
import { Boom } from '@hapi/boom';
import { webcrypto } from 'crypto';
import QRCode from 'qrcode';

// Configurar crypto global para o Baileys
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as any;
}

async function testForceQR() {
  try {
    console.log('🧪 Forçando geração do QR Code...');
    
    // Criar diretório de auth temporário
    const authDir = './temp-auth-force';
    
    // Carregar estado de autenticação
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    
    console.log('✅ Estado de auth carregado');
    
    // Tentar diferentes configurações
    const configs = [
      {
        name: 'Configuração 1 - Mínima',
        options: {
          auth: state,
          printQRInTerminal: true
        }
      },
      {
        name: 'Configuração 2 - Com Browser',
        options: {
          auth: state,
          printQRInTerminal: true,
          browser: ['GentePRO', 'Chrome', '1.0.0']
        }
      },
      {
        name: 'Configuração 3 - Com Version',
        options: {
          auth: state,
          printQRInTerminal: true,
          browser: ['GentePRO', 'Chrome', '1.0.0'],
          version: [2, 2323, 4]
        }
      },
      {
        name: 'Configuração 4 - Com Timeout',
        options: {
          auth: state,
          printQRInTerminal: true,
          browser: ['GentePRO', 'Chrome', '1.0.0'],
          connectTimeoutMs: 60_000,
          defaultQueryTimeoutMs: 60_000
        }
      }
    ];
    
    for (const config of configs) {
      console.log(`\n🔄 Tentando ${config.name}...`);
      
      try {
        // Criar conexão Baileys
        const sock = makeWASocket(config.options);
        
        console.log('✅ Socket Baileys criado');
        
        let qrGenerated = false;
        let connectionClosed = false;
        
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
            qrGenerated = true;
            
            try {
              // Gerar QR Code como string para terminal
              const qrTerminal = await QRCode.toString(qr, { type: 'terminal' });
              console.log('QR Code Terminal:');
              console.log(qrTerminal);
              
              // Gerar QR Code como base64
              const qrBase64 = await QRCode.toDataURL(qr);
              console.log('QR Code Base64 (primeiros 100 chars):', qrBase64.substring(0, 100) + '...');
              
              // Aguardar 10 segundos para dar tempo de escanear
              setTimeout(() => {
                console.log('⏰ Tempo para scan expirado');
                process.exit(0);
              }, 10000);
              
            } catch (error) {
              console.error('Erro ao gerar QR Code:', error);
            }
          }
          
          if (connection === 'open') {
            console.log('✅ Conectado com sucesso!');
            await saveCreds();
            process.exit(0);
          }
          
          if (connection === 'close') {
            connectionClosed = true;
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
        
        // Aguardar 15 segundos para cada configuração
        await new Promise(resolve => setTimeout(resolve, 15000));
        
        // Se chegou aqui sem gerar QR Code, tentar próxima configuração
        if (!qrGenerated && connectionClosed) {
          console.log('❌ Configuração falhou, tentando próxima...');
          continue;
        }
        
      } catch (error) {
        console.error(`❌ Erro com ${config.name}:`, error);
        continue;
      }
    }
    
    console.log('⏰ Todas as configurações testadas');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testForceQR();