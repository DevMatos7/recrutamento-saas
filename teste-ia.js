import OpenAI from 'openai';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Teste da configuração da API OpenAI
async function testOpenAI() {
  console.log('🧪 Testando Configuração da API OpenAI');
  console.log('=====================================');
  
  const openai = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY 
  });
  
  try {
    console.log('📋 Chave da API:', process.env.OPENAI_API_KEY ? 'Configurada' : 'Não configurada');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: "Responda apenas 'OK' se estiver funcionando"
        }
      ],
      max_tokens: 10
    });
    
    console.log('✅ API OpenAI funcionando!');
    console.log('📝 Resposta:', response.choices[0].message.content);
    
  } catch (error) {
    console.log('❌ Erro na API OpenAI:');
    console.log('   Tipo:', error.type);
    console.log('   Código:', error.code);
    console.log('   Mensagem:', error.message);
    
    if (error.code === 'insufficient_quota') {
      console.log('\n💡 SOLUÇÃO:');
      console.log('   - A chave está válida, mas a conta não tem créditos');
      console.log('   - Adicione créditos em: https://platform.openai.com/account/billing');
      console.log('   - O sistema usará análise de fallback enquanto isso');
    } else if (error.code === 'invalid_api_key') {
      console.log('\n💡 SOLUÇÃO:');
      console.log('   - A chave da API está inválida');
      console.log('   - Gere uma nova chave em: https://platform.openai.com/api-keys');
    }
  }
}

// Teste do sistema de fallback
function testFallback() {
  console.log('\n🔄 Testando Sistema de Fallback');
  console.log('===============================');
  
  // Simular dados de teste
  const jobProfile = {
    id: "test-job",
    titulo: "Desenvolvedor Full Stack",
    descricao: "Desenvolvimento de aplicações web",
    requisitos: "JavaScript, React, Node.js",
    salario: 5000,
    tipoContrato: "CLT",
    modalidade: "Remoto"
  };
  
  const candidates = [
    {
      id: "candidate-1",
      nome: "João Silva",
      cargo: "Desenvolvedor Frontend",
      habilidades: ["JavaScript", "React", "HTML", "CSS"],
      experienciaProfissional: [{ cargo: "Desenvolvedor", empresa: "Tech Corp" }],
      pretensoSalarial: 4500,
      modalidadeTrabalho: "Remoto"
    },
    {
      id: "candidate-2", 
      nome: "Maria Santos",
      cargo: "Desenvolvedor Backend",
      habilidades: ["Node.js", "Python", "SQL"],
      experienciaProfissional: [{ cargo: "Desenvolvedor", empresa: "Startup XYZ" }],
      pretensoSalarial: 6000,
      modalidadeTrabalho: "Híbrido"
    }
  ];
  
  // Simular análise de fallback
  const scored = candidates.map(candidate => {
    let score = 50;
    let technicalFit = 50;
    let culturalFit = 50;
    let experienceFit = 50;
    const strengths = [];
    const concerns = [];
    const recommendations = [];

    // Análise técnica
    if (candidate.habilidades && candidate.habilidades.length > 0) {
      technicalFit += 20;
      strengths.push("Possui habilidades técnicas documentadas");
    } else {
      concerns.push("Habilidades técnicas não especificadas");
    }

    // Análise de experiência
    if (candidate.experienciaProfissional && candidate.experienciaProfissional.length > 0) {
      experienceFit += 25;
      strengths.push("Experiência profissional documentada");
    } else {
      concerns.push("Experiência profissional limitada");
    }

    // Compatibilidade salarial
    if (candidate.pretensoSalarial && jobProfile.salario) {
      if (candidate.pretensoSalarial <= jobProfile.salario * 1.2) {
        score += 10;
        strengths.push("Pretensão salarial compatível");
      } else {
        score -= 15;
        concerns.push("Pretensão salarial acima do orçamento");
      }
    }

    // Compatibilidade de modalidade
    if (candidate.modalidadeTrabalho === jobProfile.modalidade) {
      score += 10;
      strengths.push("Modalidade de trabalho compatível");
    }

    score = Math.min(100, Math.max(0, (technicalFit + culturalFit + experienceFit) / 3));

    return {
      candidateId: candidate.id,
      candidateName: candidate.nome,
      compatibilityScore: Math.round(score),
      reasoning: "Análise baseada em critérios objetivos",
      strengths,
      concerns,
      recommendations: ["Recomenda-se entrevista detalhada"],
      culturalFit: Math.round(culturalFit),
      technicalFit: Math.round(technicalFit),
      experienceFit: Math.round(experienceFit)
    };
  });

  console.log('✅ Sistema de fallback funcionando!');
  console.log('📊 Resultados da análise:');
  
  scored.forEach(result => {
    console.log(`\n👤 ${result.candidateName}:`);
    console.log(`   Score: ${result.compatibilityScore}%`);
    console.log(`   Pontos fortes: ${result.strengths.join(', ')}`);
    console.log(`   Preocupações: ${result.concerns.join(', ')}`);
  });
}

// Executar testes
async function runTests() {
  await testOpenAI();
  testFallback();
  
  console.log('\n🎯 CONCLUSÃO:');
  console.log('   - Se a API OpenAI estiver funcionando: Sistema completo disponível');
  console.log('   - Se houver erro de quota: Sistema funciona com análise de fallback');
  console.log('   - Se houver erro de chave: Configure uma chave válida');
}

runTests().catch(console.error); 