import { type InsertChecklistEtapa } from "@shared/schema";

export interface ChecklistTemplate {
  nome: string;
  descricao: string;
  tipo: 'documento' | 'exame' | 'tarefa' | 'validacao';
  obrigatorio: boolean;
  validacaoAutomatica: boolean;
  criteriosValidacao?: any;
}

export class ChecklistTemplatesService {
  /**
   * Retorna templates de checklist para etapa de documentação
   */
  static getTemplatesDocumentacao(): ChecklistTemplate[] {
    return [
      {
        nome: "RG (Frente e Verso)",
        descricao: "Documento de identidade válido",
        tipo: "documento",
        obrigatorio: true,
        validacaoAutomatica: false,
        criteriosValidacao: {
          formato: ["jpg", "jpeg", "png", "pdf"],
          tamanhoMaximo: "5MB"
        }
      },
      {
        nome: "CPF",
        descricao: "Cadastro de Pessoa Física",
        tipo: "documento",
        obrigatorio: true,
        validacaoAutomatica: true,
        criteriosValidacao: {
          formato: ["jpg", "jpeg", "png", "pdf"],
          tamanhoMaximo: "5MB",
          validarCPF: true
        }
      },
      {
        nome: "Título de Eleitor",
        descricao: "Título de eleitor válido",
        tipo: "documento",
        obrigatorio: true,
        validacaoAutomatica: false,
        criteriosValidacao: {
          formato: ["jpg", "jpeg", "png", "pdf"],
          tamanhoMaximo: "5MB"
        }
      },
      {
        nome: "Certidão de Nascimento",
        descricao: "Certidão de nascimento atualizada",
        tipo: "documento",
        obrigatorio: true,
        validacaoAutomatica: false,
        criteriosValidacao: {
          formato: ["jpg", "jpeg", "png", "pdf"],
          tamanhoMaximo: "5MB"
        }
      },
      {
        nome: "Comprovante de Residência",
        descricao: "Comprovante de endereço recente (últimos 3 meses)",
        tipo: "documento",
        obrigatorio: true,
        validacaoAutomatica: false,
        criteriosValidacao: {
          formato: ["jpg", "jpeg", "png", "pdf"],
          tamanhoMaximo: "5MB"
        }
      },
      {
        nome: "PIS/PASEP",
        descricao: "Número do PIS/PASEP",
        tipo: "documento",
        obrigatorio: true,
        validacaoAutomatica: true,
        criteriosValidacao: {
          formato: ["jpg", "jpeg", "png", "pdf"],
          tamanhoMaximo: "5MB",
          validarPIS: true
        }
      },
      {
        nome: "CNH (se aplicável)",
        descricao: "Carteira Nacional de Habilitação",
        tipo: "documento",
        obrigatorio: false,
        validacaoAutomatica: false,
        criteriosValidacao: {
          formato: ["jpg", "jpeg", "png", "pdf"],
          tamanhoMaximo: "5MB"
        }
      }
    ];
  }

  /**
   * Retorna templates de checklist para exames médicos
   */
  static getTemplatesExamesMedicos(): ChecklistTemplate[] {
    return [
      {
        nome: "Exame Admissional",
        descricao: "Exame médico de admissão",
        tipo: "exame",
        obrigatorio: true,
        validacaoAutomatica: false,
        criteriosValidacao: {
          prazoValidade: "90 dias",
          statusAceitos: ["apto", "apto_com_restricoes"]
        }
      },
      {
        nome: "Exame Toxicológico",
        descricao: "Exame toxicológico de larga janela",
        tipo: "exame",
        obrigatorio: true,
        validacaoAutomatica: false,
        criteriosValidacao: {
          prazoValidade: "90 dias",
          statusAceitos: ["negativo"]
        }
      },
      {
        nome: "Exame Psicotécnico",
        descricao: "Avaliação psicológica para função",
        tipo: "exame",
        obrigatorio: false,
        validacaoAutomatica: false,
        criteriosValidacao: {
          prazoValidade: "180 dias",
          statusAceitos: ["apto", "apto_com_restricoes"]
        }
      },
      {
        nome: "Exame de Audiometria",
        descricao: "Teste de audição",
        tipo: "exame",
        obrigatorio: false,
        validacaoAutomatica: false,
        criteriosValidacao: {
          prazoValidade: "365 dias",
          statusAceitos: ["normal", "leve", "moderado"]
        }
      }
    ];
  }

  /**
   * Retorna templates de checklist para tarefas administrativas
   */
  static getTemplatesTarefasAdministrativas(): ChecklistTemplate[] {
    return [
      {
        nome: "Assinatura do Contrato",
        descricao: "Contrato de trabalho assinado",
        tipo: "tarefa",
        obrigatorio: true,
        validacaoAutomatica: false
      },
      {
        nome: "Cadastro no Sistema",
        descricao: "Cadastro realizado no sistema da empresa",
        tipo: "tarefa",
        obrigatorio: true,
        validacaoAutomatica: false
      },
      {
        nome: "Configuração de Acesso",
        descricao: "Acesso ao sistema configurado",
        tipo: "tarefa",
        obrigatorio: true,
        validacaoAutomatica: false
      },
      {
        nome: "Entrega de Uniforme",
        descricao: "Uniforme entregue ao funcionário",
        tipo: "tarefa",
        obrigatorio: false,
        validacaoAutomatica: false
      },
      {
        nome: "Apresentação à Equipe",
        descricao: "Apresentação realizada à equipe",
        tipo: "tarefa",
        obrigatorio: false,
        validacaoAutomatica: false
      }
    ];
  }

  /**
   * Retorna templates de checklist para validações específicas
   */
  static getTemplatesValidacoes(): ChecklistTemplate[] {
    return [
      {
        nome: "Verificação de Antecedentes",
        descricao: "Verificação de antecedentes criminais",
        tipo: "validacao",
        obrigatorio: true,
        validacaoAutomatica: true,
        criteriosValidacao: {
          statusAceitos: ["sem_antecedentes", "nao_aplicavel"]
        }
      },
      {
        nome: "Verificação de Referências",
        descricao: "Contato com referências profissionais",
        tipo: "validacao",
        obrigatorio: true,
        validacaoAutomatica: false
      },
      {
        nome: "Verificação de Escolaridade",
        descricao: "Validação de documentos escolares",
        tipo: "validacao",
        obrigatorio: true,
        validacaoAutomatica: false
      }
    ];
  }

  /**
   * Retorna todos os templates por categoria
   */
  static getAllTemplates(): Record<string, ChecklistTemplate[]> {
    return {
      documentacao: this.getTemplatesDocumentacao(),
      exames: this.getTemplatesExamesMedicos(),
      tarefas: this.getTemplatesTarefasAdministrativas(),
      validacoes: this.getTemplatesValidacoes()
    };
  }

  /**
   * Converte template para formato de inserção no banco
   */
  static templateParaInsertChecklist(template: ChecklistTemplate, etapaId: string, ordem: number): Omit<InsertChecklistEtapa, 'id'> {
    return {
      etapaId,
      nome: template.nome,
      descricao: template.descricao,
      tipo: template.tipo,
      obrigatorio: template.obrigatorio,
      ordem,
      validacaoAutomatica: template.validacaoAutomatica,
      criteriosValidacao: template.criteriosValidacao
    };
  }

  /**
   * Cria checklists padrão para uma etapa
   */
  static async criarChecklistsPadraoParaEtapa(etapaId: string, tipoEtapa: string): Promise<any[]> {
    const { storage } = await import("../storage");
    
    let templates: ChecklistTemplate[] = [];
    
    switch (tipoEtapa.toLowerCase()) {
      case 'documentação admissional':
      case 'recebimento da documentação admissional':
        templates = this.getTemplatesDocumentacao();
        break;
      case 'exames médicos':
      case 'realização de exames médicos':
        templates = this.getTemplatesExamesMedicos();
        break;
      case 'integração':
      case 'integração e ambientação':
        templates = this.getTemplatesTarefasAdministrativas();
        break;
      case 'validação':
        templates = this.getTemplatesValidacoes();
        break;
      default:
        return [];
    }

    const checklists = [];
    for (let i = 0; i < templates.length; i++) {
      const checklistData = this.templateParaInsertChecklist(templates[i], etapaId, i + 1);
      const checklist = await storage.createChecklistEtapa(checklistData);
      checklists.push(checklist);
    }

    return checklists;
  }
} 