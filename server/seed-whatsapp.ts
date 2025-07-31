import { db } from './db';
import {
  whatsappSessoes,
  templatesMensagem,
  respostasRapidas,
  configuracoesHorario,
  intencoesChatbot,
  empresas
} from '@shared/schema';

async function seedWhatsApp() {
  console.log('🌱 Iniciando seed do módulo WhatsApp...');

  try {
    // Verificar se já existe dados do WhatsApp
    const sessoesExistentes = await db.select().from(whatsappSessoes);
    if (sessoesExistentes.length > 0) {
      console.log('📱 Dados do WhatsApp já existem, pulando seed...');
      return;
    }

    // Buscar primeira empresa para usar como referência
    const [empresa] = await db.select().from(empresas);
    
    if (!empresa) {
      console.log('❌ Nenhuma empresa encontrada. Execute o seed principal primeiro.');
      return;
    }

    // 1. Criar sessão WhatsApp de exemplo
    console.log('📱 Criando sessão WhatsApp...');
    const [sessao] = await db.insert(whatsappSessoes).values({
      empresaId: empresa.id,
      nome: 'Sessão Principal',
      numero: '', // Campo vazio para ser preenchido pelo usuário
      status: 'desconectado'
    }).returning();

    console.log(`✅ Sessão criada: ${sessao.nome}`);

    // 2. Criar templates de mensagem
    console.log('📝 Criando templates de mensagem...');
    const templates = [
      {
        empresaId: empresa.id,
        titulo: 'Triagem Aprovada',
        evento: 'triagem_aprovada',
        corpo: 'Olá {{nome}}! Sua candidatura para a vaga {{vaga}} foi aprovada na triagem inicial. Em breve entraremos em contato para as próximas etapas do processo seletivo. Parabéns!'
      },
      {
        empresaId: empresa.id,
        titulo: 'Entrevista Agendada',
        evento: 'entrevista_agendada',
        corpo: 'Olá {{nome}}! Sua entrevista para a vaga {{vaga}} foi agendada para {{data}} às {{hora}} no {{local}}. Por favor, confirme sua presença respondendo esta mensagem.'
      },
      {
        empresaId: empresa.id,
        titulo: 'Solicitação de Documentos',
        evento: 'solicitacao_documentos',
        corpo: 'Olá {{nome}}! Para dar continuidade ao seu processo seletivo, precisamos dos seguintes documentos: RG, CPF, comprovante de residência e certificado de reservista (se aplicável). Por favor, envie os documentos em formato PDF ou imagem.'
      },
      {
        empresaId: empresa.id,
        titulo: 'Candidato Aprovado',
        evento: 'candidato_aprovado',
        corpo: 'Parabéns {{nome}}! 🎉 Você foi APROVADO no processo seletivo para a vaga {{vaga}}! Em breve nossa equipe entrará em contato para discutir os próximos passos e detalhes da contratação. Obrigado por fazer parte do nosso processo seletivo!'
      },
      {
        empresaId: empresa.id,
        titulo: 'Candidato Reprovado',
        evento: 'candidato_reprovado',
        corpo: 'Olá {{nome}}, agradecemos sua participação no nosso processo seletivo para a vaga {{vaga}}. Infelizmente, não poderemos dar continuidade com sua candidatura neste momento. Mantenha seu currículo atualizado, pois novas oportunidades podem surgir. Desejamos sucesso em sua carreira profissional!'
      },
      {
        empresaId: empresa.id,
        titulo: 'Link da Vaga',
        evento: 'link_vaga',
        corpo: 'Olá {{nome}}! Aqui está o link da vaga {{vaga}}: {{link}}. Acesse para ver mais detalhes sobre a vaga e acompanhar seu processo seletivo. Obrigado!'
      }
    ];

    for (const template of templates) {
      await db.insert(templatesMensagem).values(template);
    }

    console.log(`✅ ${templates.length} templates criados`);

    // 3. Criar respostas rápidas
    console.log('⚡ Criando respostas rápidas...');
    const respostas = [
      {
        empresaId: empresa.id,
        evento: 'entrevista_agendada',
        opcao: '1',
        texto: 'Confirmar entrevista',
        acao: 'confirmar_entrevista'
      },
      {
        empresaId: empresa.id,
        evento: 'entrevista_agendada',
        opcao: '2',
        texto: 'Remarcar entrevista',
        acao: 'remarcar_entrevista'
      },
      {
        empresaId: empresa.id,
        evento: 'entrevista_agendada',
        opcao: '3',
        texto: 'Falar com RH',
        acao: 'falar_com_rh'
      },
      {
        empresaId: empresa.id,
        evento: 'solicitacao_documentos',
        opcao: '1',
        texto: 'Enviar documentos',
        acao: 'solicitar_documentos'
      },
      {
        empresaId: empresa.id,
        evento: 'solicitacao_documentos',
        opcao: '2',
        texto: 'Falar com RH',
        acao: 'falar_com_rh'
      },
      {
        empresaId: empresa.id,
        evento: 'link_vaga',
        opcao: '1',
        texto: 'Ver detalhes da vaga',
        acao: 'enviar_link_vaga'
      },
      {
        empresaId: empresa.id,
        evento: 'link_vaga',
        opcao: '2',
        texto: 'Falar com RH',
        acao: 'falar_com_rh'
      }
    ];

    for (const resposta of respostas) {
      await db.insert(respostasRapidas).values(resposta);
    }

    console.log(`✅ ${respostas.length} respostas rápidas criadas`);

    // 4. Criar configurações de horário
    console.log('🕒 Criando configurações de horário...');
    const configuracoes = [
      {
        empresaId: empresa.id,
        evento: 'triagem_aprovada',
        horaInicio: '08:00',
        horaFim: '18:00',
        diasSemana: [1, 2, 3, 4, 5] // Segunda a sexta
      },
      {
        empresaId: empresa.id,
        evento: 'entrevista_agendada',
        horaInicio: '09:00',
        horaFim: '17:00',
        diasSemana: [1, 2, 3, 4, 5]
      },
      {
        empresaId: empresa.id,
        evento: 'solicitacao_documentos',
        horaInicio: '08:00',
        horaFim: '18:00',
        diasSemana: [1, 2, 3, 4, 5]
      },
      {
        empresaId: empresa.id,
        evento: 'candidato_aprovado',
        horaInicio: '09:00',
        horaFim: '17:00',
        diasSemana: [1, 2, 3, 4, 5]
      },
      {
        empresaId: empresa.id,
        evento: 'candidato_reprovado',
        horaInicio: '09:00',
        horaFim: '17:00',
        diasSemana: [1, 2, 3, 4, 5]
      }
    ];

    for (const config of configuracoes) {
      await db.insert(configuracoesHorario).values(config);
    }

    console.log(`✅ ${configuracoes.length} configurações de horário criadas`);

    // 5. Criar intenções do chatbot
    console.log('🤖 Criando intenções do chatbot...');
    const intencoes = [
      {
        empresaId: empresa.id,
        nome: 'confirmar_entrevista',
        descricao: 'Candidato confirma presença em entrevista',
        palavrasChave: ['confirmo', 'confirmar', 'sim', 'ok', 'certo', 'beleza', 'blz', 'confirmado'],
        acao: 'confirmar_entrevista'
      },
      {
        empresaId: empresa.id,
        nome: 'remarcar_entrevista',
        descricao: 'Candidato quer remarcar ou adiar entrevista',
        palavrasChave: ['remarcar', 'adiar', 'mudar', 'trocar', 'outro dia', 'outra data', 'não posso', 'não consigo'],
        acao: 'remarcar_entrevista'
      },
      {
        empresaId: empresa.id,
        nome: 'solicitar_documentos',
        descricao: 'Candidato pergunta sobre documentos',
        palavrasChave: ['documento', 'documentos', 'rg', 'cpf', 'comprovante', 'certificado', 'diploma'],
        acao: 'solicitar_documentos'
      },
      {
        empresaId: empresa.id,
        nome: 'falar_com_rh',
        descricao: 'Candidato quer falar com alguém do RH',
        palavrasChave: ['falar', 'conversar', 'contato', 'telefone', 'email', 'atendimento', 'ajuda'],
        acao: 'falar_com_rh'
      },
      {
        empresaId: empresa.id,
        nome: 'enviar_link_vaga',
        descricao: 'Candidato pede link da vaga',
        palavrasChave: ['link', 'vaga', 'descrição', 'detalhes', 'mais informações'],
        acao: 'enviar_link_vaga'
      },
      {
        empresaId: empresa.id,
        nome: 'agendar_entrevista',
        descricao: 'Candidato quer agendar entrevista',
        palavrasChave: ['agendar', 'marcar', 'entrevista', 'reunião', 'encontro'],
        acao: 'agendar_entrevista'
      },
      {
        empresaId: empresa.id,
        nome: 'duvida_processo',
        descricao: 'Candidato tem dúvidas sobre o processo',
        palavrasChave: ['dúvida', 'duvida', 'como', 'quando', 'onde', 'o que', 'qual'],
        acao: 'falar_com_rh'
      },
      {
        empresaId: empresa.id,
        nome: 'desistir_processo',
        descricao: 'Candidato quer desistir do processo',
        palavrasChave: ['desistir', 'cancelar', 'não quero', 'não vou', 'desculpe'],
        acao: 'falar_com_rh'
      },
      {
        empresaId: empresa.id,
        nome: 'agradecer',
        descricao: 'Candidato agradece',
        palavrasChave: ['obrigado', 'obrigada', 'valeu', 'agradeço', 'thanks'],
        acao: 'falar_com_rh'
      },
      {
        empresaId: empresa.id,
        nome: 'saudacao',
        descricao: 'Candidato faz saudação',
        palavrasChave: ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'hi', 'hello'],
        acao: 'falar_com_rh'
      }
    ];

    for (const intencao of intencoes) {
      await db.insert(intencoesChatbot).values(intencao);
    }

    console.log(`✅ ${intencoes.length} intenções do chatbot criadas`);

    console.log('🎉 Seed do módulo WhatsApp concluído com sucesso!');
    console.log('');
    console.log('📋 Resumo do que foi criado:');
    console.log(`   • 1 sessão WhatsApp: ${sessao.nome}`);
    console.log(`   • ${templates.length} templates de mensagem`);
    console.log(`   • ${respostas.length} respostas rápidas`);
    console.log(`   • ${configuracoes.length} configurações de horário`);
    console.log(`   • ${intencoes.length} intenções do chatbot`);
    console.log('');
    console.log('🚀 Para começar a usar:');
    console.log('   1. Conecte a sessão WhatsApp via QR Code');
    console.log('   2. Configure os templates conforme necessário');
    console.log('   3. Teste o envio de mensagens');
    console.log('   4. Monitore as estatísticas no dashboard');

  } catch (error) {
    console.error('❌ Erro durante o seed do WhatsApp:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  seedWhatsApp()
    .then(() => {
      console.log('✅ Seed concluído');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro no seed:', error);
      process.exit(1);
    });
}

export { seedWhatsApp };