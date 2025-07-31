import { db } from './db';
import { whatsappSessoes } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function cleanWhatsAppData() {
  console.log('🧹 Limpando dados mockados do WhatsApp...');

  try {
    // Remover todas as sessões existentes
    await db.delete(whatsappSessoes);
    console.log('✅ Sessões WhatsApp removidas');

    console.log('🎉 Limpeza concluída!');
    console.log('📝 Agora você pode criar sessões reais no dashboard.');
  } catch (error) {
    console.error('❌ Erro ao limpar dados:', error);
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanWhatsAppData()
    .then(() => {
      console.log('✅ Script concluído');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro no script:', error);
      process.exit(1);
    });
}
export { cleanWhatsAppData };
