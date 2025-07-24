// Teste simples para verificar o endpoint de etapas
const fetch = require('node-fetch');

async function testEtapasEndpoint() {
  try {
    console.log('🧪 Testando endpoint de etapas...');
    
    // Primeiro, vamos buscar as empresas
    const empresasResponse = await fetch('http://localhost:3000/api/empresas');
    const empresas = await empresasResponse.json();
    
    if (empresas.length === 0) {
      console.log('❌ Nenhuma empresa encontrada');
      return;
    }
    
    const primeiraEmpresa = empresas[0];
    console.log(`📋 Testando com empresa: ${primeiraEmpresa.nome} (ID: ${primeiraEmpresa.id})`);
    
    // Agora vamos testar o endpoint de etapas
    const etapasResponse = await fetch(`http://localhost:3000/api/empresas/${primeiraEmpresa.id}/etapas-pipeline`);
    
    if (!etapasResponse.ok) {
      console.log(`❌ Erro no endpoint: ${etapasResponse.status} ${etapasResponse.statusText}`);
      return;
    }
    
    const etapas = await etapasResponse.json();
    console.log(`✅ Endpoint funcionando! Encontradas ${etapas.length} etapas:`);
    
    etapas.forEach((etapa, index) => {
      console.log(`  ${index + 1}. ${etapa.nome} (${etapa.id})`);
    });
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testEtapasEndpoint(); 