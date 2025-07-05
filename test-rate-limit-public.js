import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

async function testRateLimitPublic() {
  console.log('🧪 Testando Rate Limiting em Rotas Públicas...\n');

  try {
    // Teste: Fazer muitas requisições para a API pública de vagas
    console.log('Fazendo 150 requisições para /api/candidate-portal/vagas (limite: 100 por 15min)...');
    
    let successCount = 0;
    let rateLimitCount = 0;
    let errorCount = 0;
    
    for (let i = 1; i <= 150; i++) {
      try {
        const response = await axios.get(`${BASE_URL}/api/candidate-portal/vagas`);
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
          console.log(`   ❌ Erro ${error.response?.status} na requisição ${i}: ${error.response?.data?.message || error.message}`);
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
    } else if (successCount >= 100) {
      console.log('\n⚠️  Rate limiting pode não estar funcionando - mais de 100 requisições foram aceitas.');
    } else {
      console.log('\n✅ Rate limiting está funcionando (menos de 100 requisições aceitas).');
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Executar o teste
testRateLimitPublic(); 