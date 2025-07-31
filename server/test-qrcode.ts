import { whatsappSessionManager } from './whatsapp/session';
import { db } from './db';
import { whatsappSessoes } from '@shared/schema';

async function testQRCode() {
  try {
    console.log('🧪 Testando geração de QR Code...');
    
    // Buscar sessões do banco de dados
    const sessoesDB = await db.select().from(whatsappSessoes);
    console.log('Sessões no banco:', sessoesDB.length);
    
    if (sessoesDB.length === 0) {
      console.log('❌ Nenhuma sessão encontrada no banco');
      return;
    }
    
    const sessaoId = sessoesDB[0].id;
    console.log('📱 Testando sessão:', sessaoId);
    
    // Inicializar sessão
    const sessao = await whatsappSessionManager.initializeSession(sessaoId);
    if (!sessao) {
      console.log('❌ Falha ao inicializar sessão');
      return;
    }
    
    console.log('✅ Sessão inicializada');
    
    // Aguardar um pouco para o QR Code ser gerado
    setTimeout(() => {
      const qrCode = whatsappSessionManager.getSessionQRCode(sessaoId);
      if (qrCode) {
        console.log('✅ QR Code gerado com sucesso!');
        console.log('📏 Tamanho do QR Code:', qrCode.length);
        console.log('🔗 Início do QR Code:', qrCode.substring(0, 50) + '...');
      } else {
        console.log('❌ QR Code não foi gerado');
        console.log('🔍 Verificando novamente em 2 segundos...');
        
        setTimeout(() => {
          const qrCode2 = whatsappSessionManager.getSessionQRCode(sessaoId);
          if (qrCode2) {
            console.log('✅ QR Code gerado na segunda tentativa!');
            console.log('📏 Tamanho do QR Code:', qrCode2.length);
          } else {
            console.log('❌ QR Code ainda não foi gerado');
          }
        }, 2000);
      }
    }, 5000);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testQRCode();