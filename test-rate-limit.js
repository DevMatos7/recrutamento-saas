import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

async function testRateLimit() {
  console.log('🧪 Testando Rate Limiting...\n');

  try {
    // Teste 1: Tentar fazer login múltiplas vezes rapidamente
    console.log('1. Testando rate limit no login...');
    
    for (let i = 1; i <= 7; i++) {
      try {
        const response = await axios.post(`${BASE_URL}/api/login`, {
          email: 'test@example.com',
          password: 'wrongpassword'
        });
        console.log(`   Tentativa ${i}: ✅ Sucesso (não deveria acontecer)`);
      } catch (error) {
        if (error.response?.status === 429) {
          console.log(`   Tentativa ${i}: 🚫 Rate limit atingido (esperado)`);
          break;
        } else {
          console.log(`   Tentativa ${i}: ❌ Erro ${error.response?.status} - ${error.response?.data?.message}`);
        }
      }
      
      // Pequena pausa entre tentativas
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Teste 2: Tentar registrar candidato múltiplas vezes
    console.log('\n2. Testando rate limit no registro de candidato...');
    
    for (let i = 1; i <= 5; i++) {
      try {
        const response = await axios.post(`${BASE_URL}/api/candidate-portal/register`, {
          nome: `Teste ${i}`,
          email: `teste${i}@example.com`,
          telefone: '(11) 99999-9999',
          password: 'password123',
          empresaId: '98f2fed8-b7fb-44ab-ac53-7a51f1c9e6ff'
        });
        console.log(`   Tentativa ${i}: ✅ Sucesso`);
      } catch (error) {
        if (error.response?.status === 429) {
          console.log(`   Tentativa ${i}: 🚫 Rate limit atingido (esperado)`);
          break;
        } else {
          console.log(`   Tentativa ${i}: ❌ Erro ${error.response?.status} - ${error.response?.data?.message}`);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Teste 3: Verificar se APIs normais ainda funcionam
    console.log('\n3. Testando se APIs normais ainda funcionam...');
    
    try {
      const response = await axios.get(`${BASE_URL}/api/empresas`);
      console.log('   ✅ API de empresas funcionando normalmente');
    } catch (error) {
      console.log(`   ❌ Erro na API de empresas: ${error.response?.status}`);
    }

    console.log('\n✅ Teste de rate limiting concluído!');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Executar o teste
testRateLimit(); 