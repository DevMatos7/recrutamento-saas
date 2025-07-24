const https = require('https');
const http = require('http');

const API_BASE = 'http://localhost:5000/api';

function makeRequest(method, url, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonBody });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testSimple() {
  try {
    console.log('🔍 Teste simples de modelos de pipeline...\n');

    // 1. Buscar empresas
    console.log('1. Buscando empresas...');
    const empresasRes = await makeRequest('GET', `${API_BASE}/empresas`);
    console.log(`Status: ${empresasRes.status}`);
    
    if (empresasRes.status === 200 && empresasRes.data.length > 0) {
      const empresaId = empresasRes.data[0].id;
      console.log(`✅ Empresa: ${empresasRes.data[0].nome} (${empresaId})\n`);

      // 2. Verificar modelos existentes
      console.log('2. Verificando modelos existentes...');
      const modelosRes = await makeRequest('GET', `${API_BASE}/empresas/${empresaId}/modelos-pipeline`);
      console.log(`Status: ${modelosRes.status}`);
      console.log(`Modelos: ${modelosRes.data.length}`);
      
      if (modelosRes.data.length > 0) {
        console.log('📋 Modelos encontrados:');
        modelosRes.data.forEach(modelo => {
          console.log(`   - ${modelo.nome} (Ativo: ${modelo.ativo}, Padrão: ${modelo.padrao})`);
        });
      }
      console.log('');

      // 3. Criar modelo de teste
      console.log('3. Criando modelo de teste...');
      const novoModelo = {
        nome: 'Pipeline Teste ' + Date.now(),
        tipoVaga: 'clt'
      };
      
      const createRes = await makeRequest('POST', `${API_BASE}/empresas/${empresaId}/modelos-pipeline/template`, novoModelo);
      console.log(`Status: ${createRes.status}`);
      
      if (createRes.status === 201) {
        console.log('✅ Modelo criado com sucesso!');
        console.log(`   Nome: ${createRes.data.modelo.nome}`);
        console.log(`   Ativo: ${createRes.data.modelo.ativo}`);
        console.log(`   Etapas: ${createRes.data.etapas.length}`);
        console.log('');

        // 4. Verificar se aparece na lista
        console.log('4. Verificando se aparece na lista...');
        const modelosAtualizadosRes = await makeRequest('GET', `${API_BASE}/empresas/${empresaId}/modelos-pipeline`);
        console.log(`Status: ${modelosAtualizadosRes.status}`);
        console.log(`Total de modelos: ${modelosAtualizadosRes.data.length}`);
        
        const modeloEncontrado = modelosAtualizadosRes.data.find(m => m.nome === novoModelo.nome);
        if (modeloEncontrado) {
          console.log('✅ Modelo encontrado na lista!');
          console.log(`   Status: ${modeloEncontrado.ativo ? 'Ativo' : 'Inativo'}`);
          console.log(`   Data: ${modeloEncontrado.dataCriacao}`);
        } else {
          console.log('❌ Modelo NÃO encontrado na lista!');
          console.log('Modelos na lista:');
          modelosAtualizadosRes.data.forEach(m => {
            console.log(`   - ${m.nome} (${m.ativo ? 'Ativo' : 'Inativo'})`);
          });
        }
      } else {
        console.log('❌ Erro ao criar modelo:', createRes.data);
      }
    } else {
      console.log('❌ Nenhuma empresa encontrada ou erro na requisição');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testSimple(); 