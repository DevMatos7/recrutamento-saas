const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testModelosPipeline() {
  try {
    console.log('🔍 Testando criação de modelos de pipeline...\n');

    // 1. Buscar empresas disponíveis
    console.log('1. Buscando empresas...');
    const empresasResponse = await axios.get(`${API_BASE}/empresas`);
    const empresas = empresasResponse.data;
    
    if (empresas.length === 0) {
      console.log('❌ Nenhuma empresa encontrada. Crie uma empresa primeiro.');
      return;
    }
    
    const empresaId = empresas[0].id;
    console.log(`✅ Empresa selecionada: ${empresas[0].nome} (${empresaId})\n`);

    // 2. Verificar modelos existentes
    console.log('2. Verificando modelos existentes...');
    const modelosResponse = await axios.get(`${API_BASE}/empresas/${empresaId}/modelos-pipeline`);
    const modelosExistentes = modelosResponse.data;
    console.log(`📊 Modelos existentes: ${modelosExistentes.length}`);
    
    modelosExistentes.forEach(modelo => {
      console.log(`   - ${modelo.nome} (${modelo.ativo ? 'Ativo' : 'Inativo'}) - Padrão: ${modelo.padrao}`);
    });
    console.log('');

    // 3. Criar modelo a partir de template
    console.log('3. Criando modelo a partir de template...');
    const novoModelo = {
      nome: 'Pipeline Teste CLT',
      tipoVaga: 'clt'
    };
    
    const createResponse = await axios.post(`${API_BASE}/empresas/${empresaId}/modelos-pipeline/template`, novoModelo);
    const modeloCriado = createResponse.data;
    console.log(`✅ Modelo criado: ${modeloCriado.modelo.nome}`);
    console.log(`   ID: ${modeloCriado.modelo.id}`);
    console.log(`   Ativo: ${modeloCriado.modelo.ativo}`);
    console.log(`   Padrão: ${modeloCriado.modelo.padrao}`);
    console.log(`   Etapas criadas: ${modeloCriado.etapas.length}`);
    console.log('');

    // 4. Verificar se o modelo aparece na lista
    console.log('4. Verificando se o modelo aparece na lista...');
    const modelosAtualizadosResponse = await axios.get(`${API_BASE}/empresas/${empresaId}/modelos-pipeline`);
    const modelosAtualizados = modelosAtualizadosResponse.data;
    console.log(`📊 Total de modelos: ${modelosAtualizados.length}`);
    
    const modeloEncontrado = modelosAtualizados.find(m => m.id === modeloCriado.modelo.id);
    if (modeloEncontrado) {
      console.log(`✅ Modelo encontrado na lista: ${modeloEncontrado.nome}`);
      console.log(`   Status: ${modeloEncontrado.ativo ? 'Ativo' : 'Inativo'}`);
      console.log(`   Data Criação: ${modeloEncontrado.dataCriacao}`);
    } else {
      console.log('❌ Modelo não encontrado na lista!');
    }
    console.log('');

    // 5. Definir como padrão
    console.log('5. Definindo como padrão...');
    await axios.patch(`${API_BASE}/modelos-pipeline/${modeloCriado.modelo.id}/padrao`);
    console.log('✅ Modelo definido como padrão');
    console.log('');

    // 6. Verificar etapas do modelo
    console.log('6. Verificando etapas do modelo...');
    const etapasResponse = await axios.get(`${API_BASE}/modelos-pipeline/${modeloCriado.modelo.id}/etapas`);
    const etapas = etapasResponse.data;
    console.log(`📋 Etapas do modelo (${etapas.length}):`);
    etapas.forEach(etapa => {
      console.log(`   ${etapa.ordem}. ${etapa.nome} (${etapa.tipo})`);
    });
    console.log('');

    // 7. Verificar etapas por empresa
    console.log('7. Verificando etapas por empresa...');
    const etapasEmpresaResponse = await axios.get(`${API_BASE}/empresas/${empresaId}/etapas-pipeline`);
    const etapasEmpresa = etapasEmpresaResponse.data;
    console.log(`📋 Etapas da empresa (${etapasEmpresa.length}):`);
    etapasEmpresa.forEach(etapa => {
      console.log(`   ${etapa.ordem}. ${etapa.nome}`);
    });

    console.log('\n🎉 Teste concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Dica: Faça login primeiro ou verifique se o servidor está rodando.');
    }
  }
}

// Executar o teste
testModelosPipeline(); 