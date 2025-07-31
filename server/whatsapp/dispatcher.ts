import { db } from '../db';
import { 
  vagaCandidatos, 
  candidatos, 
  vagas, 
  entrevistas,
  pipelineEtapas,
  usuarios,
  empresas
} from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { whatsappService } from './service';

export class WhatsAppDispatcher {
  
  // Executar ação baseada no tipo de ação
  async executarAcao(acao: string, candidatoId: string): Promise<{ success: boolean; error?: string }> {
    try {
      switch (acao) {
        case 'confirmar_entrevista':
          return await this.confirmarEntrevista(candidatoId);
        
        case 'remarcar_entrevista':
          return await this.remarcarEntrevista(candidatoId);
        
        case 'falar_com_rh':
          return await this.falarComRH(candidatoId);
        
        case 'solicitar_documentos':
          return await this.solicitarDocumentos(candidatoId);
        
        case 'enviar_link_vaga':
          return await this.enviarLinkVaga(candidatoId);
        
        case 'aprovar_candidato':
          return await this.aprovarCandidato(candidatoId);
        
        case 'reprovar_candidato':
          return await this.reprovarCandidato(candidatoId);
        
        case 'mover_proxima_etapa':
          return await this.moverProximaEtapa(candidatoId);
        
        case 'agendar_entrevista':
          return await this.agendarEntrevista(candidatoId);
        
        default:
          return { success: false, error: `Ação não reconhecida: ${acao}` };
      }
    } catch (error) {
      console.error('Erro ao executar ação:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  // Confirmar entrevista
  private async confirmarEntrevista(candidatoId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Buscar entrevista pendente do candidato
      const [entrevista] = await db
        .select()
        .from(entrevistas)
        .where(
          and(
            eq(entrevistas.candidatoId, candidatoId),
            eq(entrevistas.status, 'agendada')
          )
        )
        .orderBy(entrevistas.dataHora);

      if (!entrevista) {
        return { success: false, error: 'Nenhuma entrevista agendada encontrada' };
      }

      // Buscar dados da vaga
      const [vaga] = await db
        .select()
        .from(vagas)
        .where(eq(vagas.id, entrevista.vagaId));

      // Buscar dados do candidato
      const [candidato] = await db
        .select()
        .from(candidatos)
        .where(eq(candidatos.id, candidatoId));

      // Enviar confirmação
      const mensagem = `Olá ${candidato.nome}! 

Sua confirmação de entrevista para a vaga "${vaga.titulo}" foi registrada com sucesso.

📅 Data: ${new Date(entrevista.dataHora).toLocaleDateString('pt-BR')}
🕐 Horário: ${new Date(entrevista.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
📍 Local: ${entrevista.local || 'A ser definido'}

Em caso de dúvidas, entre em contato conosco.

Obrigado!`;

      // Enviar mensagem (assumindo que temos uma sessão padrão)
      // Implementar lógica para determinar qual sessão usar
      const sessaoId = await this.obterSessaoPadrao(candidato.empresaId);
      
      if (sessaoId) {
        await whatsappService.enviarMensagem({
          sessaoId,
          candidatoId,
          mensagem,
          evento: 'entrevista_confirmada'
        });
      }

      // Atualizar status da entrevista
      await db
        .update(entrevistas)
        .set({ 
          status: 'confirmada',
          dataAtualizacao: new Date()
        })
        .where(eq(entrevistas.id, entrevista.id));

      return { success: true };

    } catch (error) {
      console.error('Erro ao confirmar entrevista:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  // Remarcar entrevista
  private async remarcarEntrevista(candidatoId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Buscar candidato
      const [candidato] = await db
        .select()
        .from(candidatos)
        .where(eq(candidatos.id, candidatoId));

      // Enviar mensagem solicitando nova data
      const mensagem = `Olá ${candidato.nome}!

Entendemos que você precisa remarcar sua entrevista. 

Por favor, informe sua disponibilidade para os próximos dias:
- Segunda a sexta: 9h às 18h
- Sábado: 9h às 12h

Responda com sua preferência de data e horário, e entraremos em contato para confirmar.

Obrigado!`;

      const sessaoId = await this.obterSessaoPadrao(candidato.empresaId);
      
      if (sessaoId) {
        await whatsappService.enviarMensagem({
          sessaoId,
          candidatoId,
          mensagem,
          evento: 'solicitacao_remarcacao'
        });
      }

      return { success: true };

    } catch (error) {
      console.error('Erro ao solicitar remarcação:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  // Falar com RH
  private async falarComRH(candidatoId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Buscar candidato e empresa
      const [candidato] = await db
        .select()
        .from(candidatos)
        .where(eq(candidatos.id, candidatoId));

      const [empresa] = await db
        .select()
        .from(empresas)
        .where(eq(empresas.id, candidato.empresaId));

      // Buscar recrutador responsável
      const [recrutador] = await db
        .select()
        .from(usuarios)
        .where(
          and(
            eq(usuarios.empresaId, candidato.empresaId),
            eq(usuarios.perfil, 'recrutador'),
            eq(usuarios.ativo, 1)
          )
        );

      // Enviar mensagem de confirmação
      const mensagem = `Olá ${candidato.nome}!

Sua solicitação para falar com o RH foi registrada.

Em breve um recrutador da ${empresa.nome} entrará em contato com você.

Obrigado pela paciência!`;

      const sessaoId = await this.obterSessaoPadrao(candidato.empresaId);
      
      if (sessaoId) {
        await whatsappService.enviarMensagem({
          sessaoId,
          candidatoId,
          mensagem,
          evento: 'solicitacao_rh'
        });
      }

      // Notificar recrutador (implementar conforme necessário)
      if (recrutador) {
        console.log(`Notificar recrutador ${recrutador.nome} sobre solicitação do candidato ${candidato.nome}`);
      }

      return { success: true };

    } catch (error) {
      console.error('Erro ao processar solicitação de RH:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  // Solicitar documentos
  private async solicitarDocumentos(candidatoId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Buscar candidato
      const [candidato] = await db
        .select()
        .from(candidatos)
        .where(eq(candidatos.id, candidatoId));

      const mensagem = `Olá ${candidato.nome}!

Para dar continuidade ao seu processo seletivo, precisamos dos seguintes documentos:

📋 Documentos necessários:
• RG e CPF
• Comprovante de residência
• Certificado de reservista (se aplicável)
• Comprovante de escolaridade
• Certificações profissionais (se houver)

Por favor, envie os documentos em formato PDF ou imagem.

Em caso de dúvidas, entre em contato conosco.

Obrigado!`;

      const sessaoId = await this.obterSessaoPadrao(candidato.empresaId);
      
      if (sessaoId) {
        await whatsappService.enviarMensagem({
          sessaoId,
          candidatoId,
          mensagem,
          evento: 'solicitacao_documentos'
        });
      }

      return { success: true };

    } catch (error) {
      console.error('Erro ao solicitar documentos:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  // Enviar link da vaga
  private async enviarLinkVaga(candidatoId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Buscar vaga do candidato
      const vagaCandidatosResult = await db
        .select()
        .from(vagaCandidatos)
        .where(eq(vagaCandidatos.candidatoId, candidatoId));
      
      const vagaCandidato = vagaCandidatosResult[0];

      if (!vagaCandidato) {
        return { success: false, error: 'Candidato não está inscrito em nenhuma vaga' };
      }

      const [vaga] = await db
        .select()
        .from(vagas)
        .where(eq(vagas.id, vagaCandidato.vagaId));

      const [candidato] = await db
        .select()
        .from(candidatos)
        .where(eq(candidatos.id, candidatoId));

      const linkVaga = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/vagas/${vaga.id}`;

      const mensagem = `Olá ${candidato.nome}!

Aqui está o link da vaga "${vaga.titulo}":

🔗 ${linkVaga}

Acesse para ver mais detalhes sobre a vaga e acompanhar seu processo seletivo.

Obrigado!`;

      const sessaoId = await this.obterSessaoPadrao(candidato.empresaId);
      
      if (sessaoId) {
        await whatsappService.enviarMensagem({
          sessaoId,
          candidatoId,
          mensagem,
          evento: 'link_vaga'
        });
      }

      return { success: true };

    } catch (error) {
      console.error('Erro ao enviar link da vaga:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  // Aprovar candidato
  private async aprovarCandidato(candidatoId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Buscar candidato
      const [candidato] = await db
        .select()
        .from(candidatos)
        .where(eq(candidatos.id, candidatoId));

      const mensagem = `Parabéns ${candidato.nome}! 🎉

Temos uma ótima notícia: você foi APROVADO no processo seletivo!

Em breve nossa equipe entrará em contato para discutir os próximos passos e detalhes da contratação.

Obrigado por fazer parte do nosso processo seletivo!`;

      const sessaoId = await this.obterSessaoPadrao(candidato.empresaId);
      
      if (sessaoId) {
        await whatsappService.enviarMensagem({
          sessaoId,
          candidatoId,
          mensagem,
          evento: 'candidato_aprovado'
        });
      }

      return { success: true };

    } catch (error) {
      console.error('Erro ao aprovar candidato:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  // Reprovar candidato
  private async reprovarCandidato(candidatoId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Buscar candidato
      const [candidato] = await db
        .select()
        .from(candidatos)
        .where(eq(candidatos.id, candidatoId));

      const mensagem = `Olá ${candidato.nome},

Agradecemos sua participação no nosso processo seletivo.

Infelizmente, não poderemos dar continuidade com sua candidatura neste momento.

Mantenha seu currículo atualizado, pois novas oportunidades podem surgir.

Desejamos sucesso em sua carreira profissional!

Obrigado!`;

      const sessaoId = await this.obterSessaoPadrao(candidato.empresaId);
      
      if (sessaoId) {
        await whatsappService.enviarMensagem({
          sessaoId,
          candidatoId,
          mensagem,
          evento: 'candidato_reprovado'
        });
      }

      return { success: true };

    } catch (error) {
      console.error('Erro ao reprovar candidato:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  // Mover para próxima etapa
  private async moverProximaEtapa(candidatoId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Buscar etapa atual do candidato
      const vagaCandidatosResult = await db
        .select()
        .from(vagaCandidatos)
        .where(eq(vagaCandidatos.candidatoId, candidatoId));
      
      const vagaCandidato = vagaCandidatosResult[0];

      if (!vagaCandidato) {
        return { success: false, error: 'Candidato não está inscrito em nenhuma vaga' };
      }

      // Buscar etapas do pipeline
      const etapas = await db
        .select()
        .from(pipelineEtapas)
        .where(eq(pipelineEtapas.vagaId, vagaCandidato.vagaId))
        .orderBy(pipelineEtapas.ordem);

      // Encontrar próxima etapa
      const etapaAtual = etapas.find(e => e.id === vagaCandidato.etapa);
      const proximaEtapa = etapas.find(e => e.ordem === (etapaAtual?.ordem || 0) + 1);

      if (!proximaEtapa) {
        return { success: false, error: 'Não há próxima etapa disponível' };
      }

      // Atualizar etapa do candidato
      await db
        .update(vagaCandidatos)
        .set({ 
          etapa: proximaEtapa.nome,
          dataMovimentacao: new Date()
        })
        .where(eq(vagaCandidatos.id, vagaCandidato.id));

      // Buscar candidato
      const [candidato] = await db
        .select()
        .from(candidatos)
        .where(eq(candidatos.id, candidatoId));

      const mensagem = `Olá ${candidato.nome}!

Excelente notícia: você avançou para a próxima etapa do processo seletivo!

🎯 Nova etapa: ${proximaEtapa.nome}

Em breve você receberá mais informações sobre esta etapa.

Parabéns e boa sorte!`;

      const sessaoId = await this.obterSessaoPadrao(candidato.empresaId);
      
      if (sessaoId) {
        await whatsappService.enviarMensagem({
          sessaoId,
          candidatoId,
          mensagem,
          evento: 'mudanca_etapa'
        });
      }

      return { success: true };

    } catch (error) {
      console.error('Erro ao mover para próxima etapa:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  // Agendar entrevista
  private async agendarEntrevista(candidatoId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Buscar candidato
      const [candidato] = await db
        .select()
        .from(candidatos)
        .where(eq(candidatos.id, candidatoId));

      const mensagem = `Olá ${candidato.nome}!

Gostaríamos de agendar uma entrevista com você.

Por favor, informe sua disponibilidade para os próximos dias:
- Segunda a sexta: 9h às 18h
- Sábado: 9h às 12h

Responda com sua preferência de data e horário, e entraremos em contato para confirmar.

Obrigado!`;

      const sessaoId = await this.obterSessaoPadrao(candidato.empresaId);
      
      if (sessaoId) {
        await whatsappService.enviarMensagem({
          sessaoId,
          candidatoId,
          mensagem,
          evento: 'solicitacao_agendamento'
        });
      }

      return { success: true };

    } catch (error) {
      console.error('Erro ao solicitar agendamento:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  // Obter sessão padrão da empresa
  private async obterSessaoPadrao(empresaId: string): Promise<string | null> {
    try {
      // Buscar primeira sessão ativa da empresa
      const { whatsappSessoes } = await import('@shared/schema');
      const sessoes = await db
        .select()
        .from(whatsappSessoes)
        .where(
          and(
            eq(whatsappSessoes.empresaId, empresaId),
            eq(whatsappSessoes.status, 'conectado')
          )
        );
      
      const sessao = sessoes[0];
      return sessao?.id || null;
    } catch (error) {
      console.error('Erro ao obter sessão padrão:', error);
      return null;
    }
  }
}