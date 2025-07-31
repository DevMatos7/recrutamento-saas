import { db } from './db';
import { whatsappSessoes } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function testSession() {
  try {
    console.log('Testando busca de sessão...');
    
    // Buscar uma sessão existente
    const sessoes = await db.select().from(whatsappSessoes);
    console.log('Sessões encontradas:', sessoes.length);
    
    if (sessoes.length > 0) {
      const sessao = sessoes[0];
      console.log('Primeira sessão:', sessao.id);
      
      // Testar busca por ID
      const [sessaoData] = await db
        .select()
        .from(whatsappSessoes)
        .where(eq(whatsappSessoes.id, sessao.id));
      
      if (sessaoData) {
        console.log('✅ Sessão encontrada por ID');
      } else {
        console.log('❌ Sessão não encontrada por ID');
      }
    }
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

testSession();