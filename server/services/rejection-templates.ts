import { type InsertMotivoReprovacao } from "@shared/schema";

export interface MotivoReprovacaoTemplate {
  nome: string;
  descricao: string;
  categoria: 'geral' | 'tecnico' | 'comportamental' | 'documental' | 'outros';
  obrigatorio: boolean;
  ordem: number;
}

export class RejectionTemplatesService {
  /**
   * Retorna templates de motivos gerais de reprovação
   */
  static getTemplatesGerais(): MotivoReprovacaoTemplate[] {
    return [
      {
        nome: "Perfil não adequado",
        descricao: "Candidato não atende ao perfil da vaga",
        categoria: "geral",
        obrigatorio: true,
        ordem: 1
      },
      {
        nome: "Experiência insuficiente",
        descricao: "Experiência profissional abaixo do requerido",
        categoria: "geral",
        obrigatorio: true,
        ordem: 2
      },
      {
        nome: "Formação acadêmica inadequada",
        descricao: "Formação não atende aos requisitos da vaga",
        categoria: "geral",
        obrigatorio: true,
        ordem: 3
      },
      {
        nome: "Expectativa salarial incompatível",
        descricao: "Expectativa salarial acima do budget da empresa",
        categoria: "geral",
        obrigatorio: false,
        ordem: 4
      },
      {
        nome: "Disponibilidade incompatível",
        descricao: "Disponibilidade não atende às necessidades da empresa",
        categoria: "geral",
        obrigatorio: false,
        ordem: 5
      }
    ];
  }

  /**
   * Retorna templates de motivos técnicos de reprovação
   */
  static getTemplatesTecnicos(): MotivoReprovacaoTemplate[] {
    return [
      {
        nome: "Conhecimento técnico insuficiente",
        descricao: "Conhecimentos técnicos abaixo do esperado",
        categoria: "tecnico",
        obrigatorio: true,
        ordem: 6
      },
      {
        nome: "Falha em teste técnico",
        descricao: "Não obteve pontuação mínima no teste técnico",
        categoria: "tecnico",
        obrigatorio: true,
        ordem: 7
      },
      {
        nome: "Linguagens/frameworks não dominados",
        descricao: "Não possui domínio das tecnologias requeridas",
        categoria: "tecnico",
        obrigatorio: true,
        ordem: 8
      },
      {
        nome: "Portfolio inadequado",
        descricao: "Portfolio não demonstra competências necessárias",
        categoria: "tecnico",
        obrigatorio: false,
        ordem: 9
      },
      {
        nome: "Falha em desafio técnico",
        descricao: "Não conseguiu completar o desafio técnico proposto",
        categoria: "tecnico",
        obrigatorio: true,
        ordem: 10
      }
    ];
  }

  /**
   * Retorna templates de motivos comportamentais de reprovação
   */
  static getTemplatesComportamentais(): MotivoReprovacaoTemplate[] {
    return [
      {
        nome: "Falha em dinâmica de grupo",
        descricao: "Não demonstrou competências comportamentais necessárias",
        categoria: "comportamental",
        obrigatorio: true,
        ordem: 11
      },
      {
        nome: "Comunicação inadequada",
        descricao: "Habilidades de comunicação abaixo do esperado",
        categoria: "comportamental",
        obrigatorio: true,
        ordem: 12
      },
      {
        nome: "Falta de alinhamento cultural",
        descricao: "Não se alinha com a cultura da empresa",
        categoria: "comportamental",
        obrigatorio: true,
        ordem: 13
      },
      {
        nome: "Proatividade insuficiente",
        descricao: "Não demonstrou proatividade durante o processo",
        categoria: "comportamental",
        obrigatorio: false,
        ordem: 14
      },
      {
        nome: "Falta de interesse",
        descricao: "Demonstrou pouco interesse pela oportunidade",
        categoria: "comportamental",
        obrigatorio: false,
        ordem: 15
      }
    ];
  }

  /**
   * Retorna templates de motivos documentais de reprovação
   */
  static getTemplatesDocumentais(): MotivoReprovacaoTemplate[] {
    return [
      {
        nome: "Documentação incompleta",
        descricao: "Documentos obrigatórios não foram entregues",
        categoria: "documental",
        obrigatorio: true,
        ordem: 16
      },
      {
        nome: "Documentos vencidos",
        descricao: "Documentos apresentados estão vencidos",
        categoria: "documental",
        obrigatorio: true,
        ordem: 17
      },
      {
        nome: "Problemas com antecedentes",
        descricao: "Verificação de antecedentes com problemas",
        categoria: "documental",
        obrigatorio: true,
        ordem: 18
      },
      {
        nome: "Referências negativas",
        descricao: "Referências profissionais não foram favoráveis",
        categoria: "documental",
        obrigatorio: true,
        ordem: 19
      },
      {
        nome: "Documentos falsificados",
        descricao: "Documentos apresentados são falsificados",
        categoria: "documental",
        obrigatorio: true,
        ordem: 20
      }
    ];
  }

  /**
   * Retorna templates de outros motivos de reprovação
   */
  static getTemplatesOutros(): MotivoReprovacaoTemplate[] {
    return [
      {
        nome: "Exame médico não aprovado",
        descricao: "Exame médico de admissão não foi aprovado",
        categoria: "outros",
        obrigatorio: true,
        ordem: 21
      },
      {
        nome: "Exame toxicológico positivo",
        descricao: "Exame toxicológico apresentou resultado positivo",
        categoria: "outros",
        obrigatorio: true,
        ordem: 22
      },
      {
        nome: "Exame psicotécnico não aprovado",
        descricao: "Exame psicotécnico não foi aprovado",
        categoria: "outros",
        obrigatorio: true,
        ordem: 23
      },
      {
        nome: "Desistência do candidato",
        descricao: "Candidato desistiu do processo seletivo",
        categoria: "outros",
        obrigatorio: false,
        ordem: 24
      },
      {
        nome: "Vaga cancelada",
        descricao: "Vaga foi cancelada pela empresa",
        categoria: "outros",
        obrigatorio: false,
        ordem: 25
      }
    ];
  }

  /**
   * Retorna todos os templates por categoria
   */
  static getAllTemplates(): Record<string, MotivoReprovacaoTemplate[]> {
    return {
      geral: this.getTemplatesGerais(),
      tecnico: this.getTemplatesTecnicos(),
      comportamental: this.getTemplatesComportamentais(),
      documental: this.getTemplatesDocumentais(),
      outros: this.getTemplatesOutros()
    };
  }

  /**
   * Converte template para formato de inserção no banco
   */
  static templateParaInsertMotivo(template: MotivoReprovacaoTemplate, empresaId: string): Omit<InsertMotivoReprovacao, 'id'> {
    return {
      empresaId,
      nome: template.nome,
      descricao: template.descricao,
      categoria: template.categoria,
      ativo: true,
      obrigatorio: template.obrigatorio,
      ordem: template.ordem
    };
  }

  /**
   * Cria motivos padrão para uma empresa
   */
  static async criarMotivosPadraoParaEmpresa(empresaId: string): Promise<any[]> {
    const { storage } = await import("../storage");
    
    const todosTemplates = this.getAllTemplates();
    const motivos = [];

    for (const [categoria, templates] of Object.entries(todosTemplates)) {
      for (const template of templates) {
        const motivoData = this.templateParaInsertMotivo(template, empresaId);
        const motivo = await storage.createMotivoReprovacao(motivoData);
        motivos.push(motivo);
      }
    }

    return motivos;
  }

  /**
   * Cria motivos por categoria para uma empresa
   */
  static async criarMotivosPorCategoria(empresaId: string, categoria: string): Promise<any[]> {
    const { storage } = await import("../storage");
    
    let templates: MotivoReprovacaoTemplate[] = [];
    
    switch (categoria.toLowerCase()) {
      case 'geral':
        templates = this.getTemplatesGerais();
        break;
      case 'tecnico':
        templates = this.getTemplatesTecnicos();
        break;
      case 'comportamental':
        templates = this.getTemplatesComportamentais();
        break;
      case 'documental':
        templates = this.getTemplatesDocumentais();
        break;
      case 'outros':
        templates = this.getTemplatesOutros();
        break;
      default:
        return [];
    }

    const motivos = [];
    for (const template of templates) {
      const motivoData = this.templateParaInsertMotivo(template, empresaId);
      const motivo = await storage.createMotivoReprovacao(motivoData);
      motivos.push(motivo);
    }

    return motivos;
  }
} 