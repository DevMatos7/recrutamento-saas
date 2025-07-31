import { whatsappSessionManager } from './whatsapp/session';

async function testSessionManager() {
  try {
    console.log('Testando whatsappSessionManager...');
    
    // Testar se o manager foi importado corretamente
    console.log('whatsappSessionManager:', typeof whatsappSessionManager);
    console.log('initializeSession:', typeof whatsappSessionManager.initializeSession);
    
    // Testar com uma sessão existente
    const sessaoId = '109f90dc-e2ef-4013-8d72-014741804a79';
    console.log('Tentando inicializar sessão:', sessaoId);
    
    const sessao = await whatsappSessionManager.initializeSession(sessaoId);
    console.log('Resultado:', sessao ? 'Sessão criada' : 'Sessão não encontrada');
    
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

testSessionManager();