import { type InsertAutomatizacaoEtapa } from "@shared/schema";

export interface AutomatizacaoTemplate {
  nome: string;
  descricao: string;
  tipo: 'movimento' | 'notificacao' | 'webhook' | 'acao_personalizada';
  condicoes: any[];
  acoes: any[];
  webhookUrl?: string;
  webhookHeaders?: any;
  webhookMethod?: string;
  delayExecucao?: number;
  maxTentativas?: number;
}

export class AutomationTemplatesService {
  /**
   * Retorna templates de automatização para etapa de triagem
   */
  static getTemplatesTriagem(): AutomatizacaoTemplate[] {
    return [
      {
        nome: "Mover para Entrevista após Score Alto",
        descricao: "Move automaticamente candidatos com score acima de 80 para etapa de entrevista",
        tipo: "movimento",
        condicoes: [
          {
            campo: "score",
            operador: ">=",
            valor: 80,
            tipo: "numero"
          }
        ],
        acoes: [
          {
            tipo: "mover_etapa",
            etapaDestino: "Entrevista com o Candidato",
            observacao: "Score alto - movido automaticamente"
          }
        ],
        delayExecucao: 5, // 5 minutos após avaliação
        maxTentativas: 3
      },
      {
        nome: "Notificar Recrutador sobre Candidato Promissor",
        descricao: "Envia notificação para recrutador sobre candidatos com perfil promissor",
        tipo: "notificacao",
        condicoes: [
          {
            campo: "score",
            operador: ">=",
            valor: 90,
            tipo: "numero"
          }
        ],
        acoes: [
          {
            tipo: "enviar_notificacao",
            destinatario: "recrutador",
            template: "candidato_promissor",
            dados: ["nome", "score", "perfil"]
          }
        ],
        delayExecucao: 2
      }
    ];
  }

  /**
   * Retorna templates de automatização para etapa de entrevista
   */
  static getTemplatesEntrevista(): AutomatizacaoTemplate[] {
    return [
      {
        nome: "Mover para Aprovação após Entrevista Positiva",
        descricao: "Move candidato para etapa de aprovação quando entrevista é marcada como positiva",
        tipo: "movimento",
        condicoes: [
          {
            campo: "resultado_entrevista",
            operador: "==",
            valor: "aprovado",
            tipo: "string"
          }
        ],
        acoes: [
          {
            tipo: "mover_etapa",
            etapaDestino: "Resultado da Entrevista – Aprovado",
            observacao: "Entrevista aprovada - movido automaticamente"
          },
          {
            tipo: "enviar_notificacao",
            destinatario: "candidato",
            template: "entrevista_aprovada"
          }
        ],
        delayExecucao: 1
      },
      {
        nome: "Agendar Exames após Aprovação",
        descricao: "Dispara webhook para agendar exames médicos após aprovação",
        tipo: "webhook",
        condicoes: [
          {
            campo: "etapa_atual",
            operador: "==",
            valor: "Resultado da Entrevista – Aprovado",
            tipo: "string"
          }
        ],
        acoes: [
          {
            tipo: "executar_webhook",
            url: "https://api.exames.com/agendar",
            method: "POST",
            dados: ["candidato_id", "vaga_id", "tipo_exames"]
          }
        ],
        webhookUrl: "https://api.exames.com/agendar",
        webhookMethod: "POST",
        webhookHeaders: {
          "Content-Type": "application/json",
          "Authorization": "Bearer ${API_KEY}"
        },
        delayExecucao: 10
      }
    ];
  }

  /**
   * Retorna templates de automatização para etapa de documentação
   */
  static getTemplatesDocumentacao(): AutomatizacaoTemplate[] {
    return [
      {
        nome: "Mover para Próxima Etapa após Documentos Completos",
        descricao: "Move candidato automaticamente quando todos os documentos obrigatórios são aprovados",
        tipo: "movimento",
        condicoes: [
          {
            campo: "checklist_completo",
            operador: "==",
            valor: true,
            tipo: "boolean"
          }
        ],
        acoes: [
          {
            tipo: "mover_etapa",
            etapaDestino: "próxima_etapa",
            observacao: "Documentação completa - movido automaticamente"
          }
        ],
        delayExecucao: 0
      },
      {
        nome: "Notificar Candidato sobre Documentos Pendentes",
        descricao: "Envia lembretes para candidatos com documentos pendentes",
        tipo: "notificacao",
        condicoes: [
          {
            campo: "dias_na_etapa",
            operador: ">=",
            valor: 3,
            tipo: "numero"
          },
          {
            campo: "documentos_pendentes",
            operador: ">",
            valor: 0,
            tipo: "numero"
          }
        ],
        acoes: [
          {
            tipo: "enviar_notificacao",
            destinatario: "candidato",
            template: "documentos_pendentes",
            dados: ["documentos_faltantes", "prazo_limite"]
          }
        ],
        delayExecucao: 1440 // 24 horas
      }
    ];
  }

  /**
   * Retorna templates de automatização para etapa de exames
   */
  static getTemplatesExames(): AutomatizacaoTemplate[] {
    return [
      {
        nome: "Mover para Contratado após Exames Aprovados",
        descricao: "Move candidato para etapa de contratado quando todos os exames são aprovados",
        tipo: "movimento",
        condicoes: [
          {
            campo: "exames_aprovados",
            operador: "==",
            valor: true,
            tipo: "boolean"
          }
        ],
        acoes: [
          {
            tipo: "mover_etapa",
            etapaDestino: "Contratado",
            observacao: "Exames aprovados - movido automaticamente"
          },
          {
            tipo: "enviar_notificacao",
            destinatario: "candidato",
            template: "exames_aprovados"
          }
        ],
        delayExecucao: 0
      },
      {
        nome: "Integrar com Sistema de RH",
        descricao: "Dispara integração com sistema de RH após aprovação dos exames",
        tipo: "webhook",
        condicoes: [
          {
            campo: "etapa_atual",
            operador: "==",
            valor: "Contratado",
            tipo: "string"
          }
        ],
        acoes: [
          {
            tipo: "executar_webhook",
            url: "https://api.rh.com/admissao",
            method: "POST",
            dados: ["candidato_id", "vaga_id", "data_admissao", "dados_completos"]
          }
        ],
        webhookUrl: "https://api.rh.com/admissao",
        webhookMethod: "POST",
        webhookHeaders: {
          "Content-Type": "application/json",
          "X-API-Key": "${RH_API_KEY}"
        },
        delayExecucao: 5
      }
    ];
  }

  /**
   * Retorna templates de automatização para etapa de integração
   */
  static getTemplatesIntegracao(): AutomatizacaoTemplate[] {
    return [
      {
        nome: "Agendar Integração Automática",
        descricao: "Agenda automaticamente a integração do novo funcionário",
        tipo: "webhook",
        condicoes: [
          {
            campo: "etapa_atual",
            operador: "==",
            valor: "Integração e Ambientação",
            tipo: "string"
          }
        ],
        acoes: [
          {
            tipo: "executar_webhook",
            url: "https://api.calendario.com/agendar",
            method: "POST",
            dados: ["funcionario_id", "data_inicio", "duracao_integracao"]
          }
        ],
        webhookUrl: "https://api.calendario.com/agendar",
        webhookMethod: "POST",
        delayExecucao: 30 // 30 minutos
      },
      {
        nome: "Notificar Equipe sobre Novo Funcionário",
        descricao: "Envia notificação para a equipe sobre o novo funcionário",
        tipo: "notificacao",
        condicoes: [
          {
            campo: "etapa_atual",
            operador: "==",
            valor: "Integração e Ambientação",
            tipo: "string"
          }
        ],
        acoes: [
          {
            tipo: "enviar_notificacao",
            destinatario: "equipe",
            template: "novo_funcionario",
            dados: ["nome", "cargo", "departamento", "data_inicio"]
          }
        ],
        delayExecucao: 60 // 1 hora
      }
    ];
  }

  /**
   * Retorna todos os templates por categoria
   */
  static getAllTemplates(): Record<string, AutomatizacaoTemplate[]> {
    return {
      triagem: this.getTemplatesTriagem(),
      entrevista: this.getTemplatesEntrevista(),
      documentacao: this.getTemplatesDocumentacao(),
      exames: this.getTemplatesExames(),
      integracao: this.getTemplatesIntegracao()
    };
  }

  /**
   * Converte template para formato de inserção no banco
   */
  static templateParaInsertAutomatizacao(template: AutomatizacaoTemplate, etapaId: string): Omit<InsertAutomatizacaoEtapa, 'id'> {
    return {
      etapaId,
      nome: template.nome,
      descricao: template.descricao,
      tipo: template.tipo,
      ativo: true,
      condicoes: template.condicoes,
      acoes: template.acoes,
      webhookUrl: template.webhookUrl,
      webhookHeaders: template.webhookHeaders,
      webhookMethod: template.webhookMethod,
      delayExecucao: template.delayExecucao,
      maxTentativas: template.maxTentativas || 3
    };
  }

  /**
   * Cria automatizações padrão para uma etapa
   */
  static async criarAutomatizacoesPadraoParaEtapa(etapaId: string, tipoEtapa: string): Promise<any[]> {
    const { storage } = await import("../storage");
    
    let templates: AutomatizacaoTemplate[] = [];
    
    switch (tipoEtapa.toLowerCase()) {
      case 'triagem':
      case 'triagem de currículos':
        templates = this.getTemplatesTriagem();
        break;
      case 'entrevista':
      case 'entrevista com o candidato':
        templates = this.getTemplatesEntrevista();
        break;
      case 'documentação':
      case 'recebimento da documentação admissional':
        templates = this.getTemplatesDocumentacao();
        break;
      case 'exames':
      case 'realização de exames médicos':
        templates = this.getTemplatesExames();
        break;
      case 'integração':
      case 'integração e ambientação':
        templates = this.getTemplatesIntegracao();
        break;
      default:
        return [];
    }

    const automatizacoes = [];
    for (const template of templates) {
      const automatizacaoData = this.templateParaInsertAutomatizacao(template, etapaId);
      const automatizacao = await storage.createAutomatizacaoEtapa(automatizacaoData);
      automatizacoes.push(automatizacao);
    }

    return automatizacoes;
  }
} 