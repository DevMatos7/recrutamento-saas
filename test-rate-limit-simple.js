import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

async function testRateLimitSimple() {
  console.log('🧪 Testando Rate Limiting Simples...\n');

  try {
    // Teste: Fazer muitas requisições para a API
    console.log('Fazendo 150 requisições para /api/empresas (limite: 100 por 15min)...');
    
    let successCount = 0;
    let rateLimitCount = 0;
    let errorCount = 0;
    
    for (let i = 1; i <= 150; i++) {
      try {
        const response = await axios.get(`${BASE_URL}/api/empresas`);
        successCount++;
        if (i % 20 === 0) {
          console.log(`   ${i} requisições feitas...`);
        }
      } catch (error) {
        if (error.response?.status === 429) {
          rateLimitCount++;
          console.log(`   🚫 Rate limit atingido na requisição ${i}`);
          break;
        } else {
          errorCount++;
          console.log(`   ❌ Erro ${error.response?.status} na requisição ${i}`);
        }
      }
      
      // Pequena pausa entre requisições
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    console.log('\n📊 Resultados:');
    console.log(`   ✅ Requisições bem-sucedidas: ${successCount}`);
    console.log(`   🚫 Rate limits atingidos: ${rateLimitCount}`);
    console.log(`   ❌ Outros erros: ${errorCount}`);

    if (rateLimitCount > 0) {
      console.log('\n✅ Rate limiting está funcionando!');
    } else {
      console.log('\n⚠️  Rate limiting pode não estar funcionando corretamente.');
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Executar o teste
testRateLimitSimple(); 