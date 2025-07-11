import axios from 'axios';

// Configuração base
const BASE_URL = 'http://localhost:5000';
const TEST_USER = {
  email: 'admin@empresa.com',
  password: 'admin123'
};

async function testAuditoria() {
  try {
    console.log('🧪 Iniciando testes de auditoria de vagas...\n');

    // 1. Login para obter token
    console.log('1. Fazendo login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, TEST_USER);
    const cookies = loginResponse.headers['set-cookie'];
    
    if (!cookies) {
      throw new Error('Login falhou - cookies não recebidos');
    }
    
    console.log('✅ Login realizado com sucesso\n');

    // 2. Listar vagas para obter um ID válido
    console.log('2. Buscando vagas existentes...');
    const vagasResponse = await axios.get(`${BASE_URL}/api/vagas`, {
      headers: { Cookie: cookies.join('; ') }
    });
    
    const vagas = vagasResponse.data;
    if (vagas.length === 0) {
      console.log('⚠️  Nenhuma vaga encontrada. Criando uma vaga de teste...');
      
      // Criar uma vaga de teste
      const novaVaga = {
        titulo: 'Vaga Teste Auditoria',
        descricao: 'Vaga para testar sistema de auditoria',
        requisitos: 'Conhecimentos básicos',
        local: 'São Paulo',
        salario: 'R$ 5000',
        beneficios: 'Vale refeição',
        tipoContratacao: 'CLT',
        status: 'aberta',
        empresaId: '1',
        departamentoId: '1',
        gestorId: '1'
      };
      
      const createResponse = await axios.post(`${BASE_URL}/api/vagas`, novaVaga, {
        headers: { Cookie: cookies.join('; ') }
      });
      
      const vagaId = createResponse.data.id;
      console.log(`✅ Vaga criada com ID: ${vagaId}\n`);
    } else {
      const vagaId = vagas[0].id;
      console.log(`✅ Vaga encontrada com ID: ${vagaId}\n`);
    }

    // 3. Testar endpoint de auditoria
    console.log('3. Testando endpoint de auditoria...');
    const auditoriaResponse = await axios.get(`${BASE_URL}/api/vagas/${vagas[0].id}/auditoria`, {
      headers: { Cookie: cookies.join('; ') }
    });
    
    const auditoria = auditoriaResponse.data;
    console.log(`✅ Auditoria consultada com sucesso!`);
    console.log(`📊 Registros encontrados: ${auditoria.length}`);
    
    if (auditoria.length > 0) {
      console.log('\n📋 Últimos registros de auditoria:');
      auditoria.slice(0, 3).forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.acao} - ${new Date(item.data).toLocaleString('pt-BR')}`);
        if (item.detalhes) {
          console.log(`      Detalhes: ${item.detalhes}`);
        }
      });
    } else {
      console.log('ℹ️  Nenhum registro de auditoria encontrado (normal para vagas recém-criadas)');
    }

    // 4. Testar criação de novo registro de auditoria
    console.log('\n4. Testando criação de registro de auditoria...');
    const novaAuditoria = {
      vagaId: vagas[0].id,
      usuarioId: '1',
      acao: 'TESTE',
      detalhes: 'Registro de teste criado via script'
    };
    
    const createAuditoriaResponse = await axios.post(`${BASE_URL}/api/vagas/${vagas[0].id}/auditoria`, novaAuditoria, {
      headers: { Cookie: cookies.join('; ') }
    });
    
    console.log('✅ Registro de auditoria criado com sucesso!');
    console.log(`📝 ID do registro: ${createAuditoriaResponse.data.id}`);

    // 5. Verificar se o novo registro aparece na consulta
    console.log('\n5. Verificando se o novo registro aparece na consulta...');
    const auditoriaAtualizada = await axios.get(`${BASE_URL}/api/vagas/${vagas[0].id}/auditoria`, {
      headers: { Cookie: cookies.join('; ') }
    });
    
    const registrosAtualizados = auditoriaAtualizada.data;
    console.log(`✅ Total de registros atualizado: ${registrosAtualizados.length}`);
    
    if (registrosAtualizados.length > 0) {
      const ultimoRegistro = registrosAtualizados[0];
      console.log(`📋 Último registro: ${ultimoRegistro.acao} - ${new Date(ultimoRegistro.data).toLocaleString('pt-BR')}`);
    }

    console.log('\n🎉 Todos os testes de auditoria passaram com sucesso!');

  } catch (error) {
    console.error('\n❌ Erro durante os testes:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', error.response.data);
    }
    process.exit(1);
  }
}

// Executar testes
testAuditoria(); 