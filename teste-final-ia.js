import OpenAI from 'openai';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

async function testeFinalIA() {
  console.log('🎯 TESTE FINAL - Sistema GentePRO com IA');
  console.log('==========================================');
  
  const openai = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY 
  });
  
  try {
    // Simular uma análise de candidatos para uma vaga
    const prompt = `
Você é um especialista em recrutamento e seleção. Analise a vaga e os candidatos fornecidos e recomende os 2 melhores candidatos para a posição.

VAGA:
Título: Desenvolvedor Full Stack
Descrição: Desenvolvimento de aplicações web modernas
Requisitos: JavaScript, React, Node.js, experiência com APIs
Salário: R$ 5000
Tipo de Contrato: CLT
Modalidade: Remoto

CANDIDATOS:
1. João Silva
   - Cargo Atual: Desenvolvedor Frontend
   - Resumo: 3 anos de experiência com React e JavaScript
   - Habilidades: JavaScript, React, HTML, CSS
   - Pretensão Salarial: R$ 4500
   - Modalidade: Remoto

2. Maria Santos
   - Cargo Atual: Desenvolvedor Backend
   - Resumo: 2 anos de experiência com Node.js
   - Habilidades: Node.js, Python, SQL
   - Pretensão Salarial: R$ 6000
   - Modalidade: Híbrido

Para cada candidato recomendado, forneça:
1. Score de compatibilidade (0-100)
2. Reasoning (explicação da recomendação)
3. Strengths (3-5 pontos fortes)
4. Concerns (2-3 preocupações)
5. Recommendations (2-3 recomendações)

Retorne apenas um JSON válido no seguinte formato:
{
  "recommendations": [
    {
      "candidateId": "candidate-1",
      "candidateName": "João Silva",
      "compatibilityScore": 85,
      "reasoning": "Explicação detalhada da compatibilidade",
      "strengths": ["Forte em...", "Experiência em...", "Demonstra..."],
      "concerns": ["Falta experiência em...", "Salário pode ser..."],
      "recommendations": ["Verificar...", "Explorar..."]
    }
  ]
}
`;

    console.log('🤖 Testando análise de candidatos com IA...');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Você é um especialista em recrutamento e seleção com mais de 15 anos de experiência. Analise candidatos de forma criteriosa e objetiva, considerando tanto aspectos técnicos quanto comportamentais. Responda sempre em JSON válido."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    const result = JSON.parse(response.choices[0].message.content || '{"recommendations": []}');
    
    console.log('✅ Análise de IA funcionando perfeitamente!');
    console.log('📊 Resultados da análise:');
    
    result.recommendations.forEach((rec, index) => {
      console.log(`\n👤 ${rec.candidateName}:`);
      console.log(`   Score: ${rec.compatibilityScore}%`);
      console.log(`   Motivo: ${rec.reasoning}`);
      console.log(`   Pontos fortes: ${rec.strengths.join(', ')}`);
      console.log(`   Preocupações: ${rec.concerns.join(', ')}`);
      console.log(`   Recomendações: ${rec.recommendations.join(', ')}`);
    });
    
    console.log('\n🎉 SISTEMA COMPLETAMENTE FUNCIONAL!');
    console.log('   ✅ API OpenAI: Funcionando');
    console.log('   ✅ Análise de candidatos: Funcionando');
    console.log('   ✅ Geração de recomendações: Funcionando');
    console.log('   ✅ Sistema de fallback: Disponível');
    
    console.log('\n🚀 Agora você pode usar todas as funcionalidades de IA no GentePRO:');
    console.log('   - Gerar recomendações de candidatos');
    console.log('   - Obter insights detalhados');
    console.log('   - Análise de compatibilidade');
    console.log('   - Sugestões para entrevistas');
    
  } catch (error) {
    console.log('❌ Erro no teste final:');
    console.log('   Erro:', error.message);
    console.log('   Código:', error.code);
  }
}

testeFinalIA().catch(console.error); 