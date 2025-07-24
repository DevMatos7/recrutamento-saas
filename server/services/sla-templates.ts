import { type InsertSlaEtapa } from "@shared/schema";

export interface SlaTemplate {
  nome: string;
  descricao: string;
  prazoHoras: number;
  prazoDias: number;
  tipoPrazo: 'horas' | 'dias' | 'semanas';
  alertaAntes: number;
  alertaApos: number;
  acoesAutomaticas: any[];
  notificacoes: any;
}

export class SlaTemplatesService {
  /**
   * Retorna templates de SLA para etapa de triagem
   */
  static getTemplatesTriagem(): SlaTemplate[] {
    return [
      {
        nome: "SLA Triagem Rápida",
        descricao: "Prazo para análise inicial de currículos (urgente)",
        prazoHoras: 4,
        prazoDias: 0,
        tipoPrazo: "horas",
        alertaAntes: 1,
        alertaApos: 1,
        acoesAutomaticas: [
          {
            tipo: "notificar_recrutador",
            mensagem: "Currículo aguardando análise há mais de 4 horas"
          },
          {
            tipo: "escalar_gestor",
            condicao: "apos_vencimento"
          }
        ],
        notificacoes: {
          email: true,
          push: true,
          destinatarios: ["recrutador", "gestor"]
        }
      },
      {
        nome: "SLA Triagem Padrão",
        descricao: "Prazo para análise inicial de currículos (padrão)",
        prazoHoras: 0,
        prazoDias: 2,
        tipoPrazo: "dias",
        alertaAntes: 4,
        alertaApos: 1,
        acoesAutomaticas: [
          {
            tipo: "notificar_recrutador",
            mensagem: "Currículo aguardando análise há mais de 2 dias"
          }
        ],
        notificacoes: {
          email: true,
          push: true,
          destinatarios: ["recrutador"]
        }
      }
    ];
  }

  /**
   * Retorna templates de SLA para etapa de entrevista
   */
  static getTemplatesEntrevista(): SlaTemplate[] {
    return [
      {
        nome: "SLA Agendamento Entrevista",
        descricao: "Prazo para agendamento da entrevista após aprovação na triagem",
        prazoHoras: 0,
        prazoDias: 3,
        tipoPrazo: "dias",
        alertaAntes: 6,
        alertaApos: 2,
        acoesAutomaticas: [
          {
            tipo: "notificar_candidato",
            mensagem: "Aguardamos seu retorno para agendamento da entrevista"
          },
          {
            tipo: "notificar_recrutador",
            mensagem: "Candidato aprovado aguardando agendamento de entrevista"
          }
        ],
        notificacoes: {
          email: true,
          push: true,
          sms: true,
          destinatarios: ["candidato", "recrutador"]
        }
      },
      {
        nome: "SLA Realização Entrevista",
        descricao: "Prazo para realização da entrevista após agendamento",
        prazoHoras: 0,
        prazoDias: 5,
        tipoPrazo: "dias",
        alertaAntes: 8,
        alertaApos: 2,
        acoesAutomaticas: [
          {
            tipo: "notificar_candidato",
            mensagem: "Lembrete: sua entrevista está agendada"
          },
          {
            tipo: "notificar_recrutador",
            mensagem: "Entrevista agendada para hoje"
          }
        ],
        notificacoes: {
          email: true,
          push: true,
          sms: true,
          destinatarios: ["candidato", "recrutador", "gestor"]
        }
      }
    ];
  }

  /**
   * Retorna templates de SLA para etapa de documentação
   */
  static getTemplatesDocumentacao(): SlaTemplate[] {
    return [
      {
        nome: "SLA Entrega Documentos",
        descricao: "Prazo para entrega de documentos pelo candidato",
        prazoHoras: 0,
        prazoDias: 3,
        tipoPrazo: "dias",
        alertaAntes: 6,
        alertaApos: 1,
        acoesAutomaticas: [
          {
            tipo: "notificar_candidato",
            mensagem: "Documentos pendentes para entrega"
          },
          {
            tipo: "notificar_rh",
            mensagem: "Candidato com documentos pendentes"
          }
        ],
        notificacoes: {
          email: true,
          push: true,
          destinatarios: ["candidato", "rh"]
        }
      },
      {
        nome: "SLA Validação Documentos",
        descricao: "Prazo para validação de documentos pelo RH",
        prazoHoras: 0,
        prazoDias: 2,
        tipoPrazo: "dias",
        alertaAntes: 4,
        alertaApos: 1,
        acoesAutomaticas: [
          {
            tipo: "notificar_rh",
            mensagem: "Documentos aguardando validação"
          },
          {
            tipo: "escalar_gestor",
            condicao: "apos_vencimento"
          }
        ],
        notificacoes: {
          email: true,
          push: true,
          destinatarios: ["rh", "gestor"]
        }
      }
    ];
  }

  /**
   * Retorna templates de SLA para etapa de exames
   */
  static getTemplatesExames(): SlaTemplate[] {
    return [
      {
        nome: "SLA Agendamento Exames",
        descricao: "Prazo para agendamento de exames médicos",
        prazoHoras: 0,
        prazoDias: 5,
        tipoPrazo: "dias",
        alertaAntes: 8,
        alertaApos: 2,
        acoesAutomaticas: [
          {
            tipo: "notificar_candidato",
            mensagem: "Exames médicos pendentes de agendamento"
          },
          {
            tipo: "notificar_medico_trabalho",
            mensagem: "Candidato aguardando agendamento de exames"
          }
        ],
        notificacoes: {
          email: true,
          push: true,
          destinatarios: ["candidato", "medico_trabalho"]
        }
      },
      {
        nome: "SLA Aprovação Exames",
        descricao: "Prazo para aprovação de exames médicos",
        prazoHoras: 0,
        prazoDias: 7,
        tipoPrazo: "dias",
        alertaAntes: 12,
        alertaApos: 2,
        acoesAutomaticas: [
          {
            tipo: "notificar_medico_trabalho",
            mensagem: "Exames aguardando aprovação"
          },
          {
            tipo: "notificar_rh",
            mensagem: "Exames médicos pendentes de aprovação"
          }
        ],
        notificacoes: {
          email: true,
          push: true,
          destinatarios: ["medico_trabalho", "rh"]
        }
      }
    ];
  }

  /**
   * Retorna templates de SLA para etapa de integração
   */
  static getTemplatesIntegracao(): SlaTemplate[] {
    return [
      {
        nome: "SLA Agendamento Integração",
        descricao: "Prazo para agendamento da integração do novo funcionário",
        prazoHoras: 0,
        prazoDias: 1,
        tipoPrazo: "dias",
        alertaAntes: 2,
        alertaApos: 1,
        acoesAutomaticas: [
          {
            tipo: "notificar_equipe",
            mensagem: "Novo funcionário aguardando agendamento de integração"
          },
          {
            tipo: "agendar_integracao",
            automatico: true
          }
        ],
        notificacoes: {
          email: true,
          push: true,
          destinatarios: ["equipe", "gestor"]
        }
      },
      {
        nome: "SLA Preparação Integração",
        descricao: "Prazo para preparação da integração pela equipe",
        prazoHoras: 0,
        prazoDias: 2,
        tipoPrazo: "dias",
        alertaAntes: 4,
        alertaApos: 1,
        acoesAutomaticas: [
          {
            tipo: "notificar_equipe",
            mensagem: "Integração agendada - preparar ambiente e documentação"
          },
          {
            tipo: "notificar_rh",
            mensagem: "Integração agendada - preparar documentação"
          }
        ],
        notificacoes: {
          email: true,
          push: true,
          destinatarios: ["equipe", "rh", "gestor"]
        }
      }
    ];
  }

  /**
   * Retorna todos os templates por categoria
   */
  static getAllTemplates(): Record<string, SlaTemplate[]> {
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
  static templateParaInsertSla(template: SlaTemplate, etapaId: string): Omit<InsertSlaEtapa, 'id'> {
    return {
      etapaId,
      nome: template.nome,
      descricao: template.descricao,
      prazoHoras: template.prazoHoras,
      prazoDias: template.prazoDias,
      tipoPrazo: template.tipoPrazo,
      ativo: true,
      alertaAntes: template.alertaAntes,
      alertaApos: template.alertaApos,
      acoesAutomaticas: template.acoesAutomaticas,
      notificacoes: template.notificacoes
    };
  }

  /**
   * Cria SLAs padrão para uma etapa
   */
  static async criarSlasPadraoParaEtapa(etapaId: string, tipoEtapa: string): Promise<any[]> {
    const { storage } = await import("../storage");
    
    let templates: SlaTemplate[] = [];
    
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

    const slas = [];
    for (const template of templates) {
      const slaData = this.templateParaInsertSla(template, etapaId);
      const sla = await storage.createSlaEtapa(slaData);
      slas.push(sla);
    }

    return slas;
  }

  /**
   * Cria SLAs por categoria para uma etapa
   */
  static async criarSlasPorCategoria(etapaId: string, categoria: string): Promise<any[]> {
    const { storage } = await import("../storage");
    
    let templates: SlaTemplate[] = [];
    
    switch (categoria.toLowerCase()) {
      case 'triagem':
        templates = this.getTemplatesTriagem();
        break;
      case 'entrevista':
        templates = this.getTemplatesEntrevista();
        break;
      case 'documentacao':
        templates = this.getTemplatesDocumentacao();
        break;
      case 'exames':
        templates = this.getTemplatesExames();
        break;
      case 'integracao':
        templates = this.getTemplatesIntegracao();
        break;
      default:
        return [];
    }

    const slas = [];
    for (const template of templates) {
      const slaData = this.templateParaInsertSla(template, etapaId);
      const sla = await storage.createSlaEtapa(slaData);
      slas.push(sla);
    }

    return slas;
  }
} 