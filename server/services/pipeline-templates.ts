import { type InsertEtapaModeloPipeline } from "@shared/schema";

export interface EtapaTemplate {
  nome: string;
  descricao: string;
  tipo: 'inicial' | 'intermediaria' | 'decisao' | 'final' | 'pos_contrato';
  cor: string;
  obrigatoria: boolean;
  podeReprovar: boolean;
  sla?: number;
  acoesAutomaticas?: any[];
  camposObrigatorios?: string[];
  responsaveis?: string[];
}

export class PipelineTemplatesService {
  /**
   * Retorna todas as etapas padrão sugeridas
   */
  static getEtapasPadraoSugeridas(): EtapaTemplate[] {
    return [
      {
        nome: "Triagem de Currículos",
        descricao: "Filtro automático de candidatos via IA (match)",
        tipo: "inicial",
        cor: "#10B981", // verde
        obrigatoria: true,
        podeReprovar: false,
        sla: 3,
        acoesAutomaticas: ["match_automatico"],
        camposObrigatorios: ["observacao"],
        responsaveis: []
      },
      {
        nome: "Entrevista com o Candidato",
        descricao: "Pode acionar agendamento automático",
        tipo: "intermediaria",
        cor: "#F59E0B", // amarelo
        obrigatoria: true,
        podeReprovar: false,
        sla: 7,
        acoesAutomaticas: ["agendamento_automatico"],
        camposObrigatorios: ["observacao", "score"],
        responsaveis: []
      },
      {
        nome: "Resultado da Entrevista – Aprovado",
        descricao: "Gatilho para solicitação documental - Envia notificação",
        tipo: "decisao",
        cor: "#3B82F6", // azul
        obrigatoria: true,
        podeReprovar: false,
        sla: 2,
        acoesAutomaticas: ["solicitar_documentos", "enviar_notificacao"],
        camposObrigatorios: ["observacao", "score"],
        responsaveis: []
      },
      {
        nome: "Resultado da Entrevista – Reprovado",
        descricao: "Requer motivo de reprovação - Histórico mantido",
        tipo: "final",
        cor: "#EF4444", // vermelho
        obrigatoria: false,
        podeReprovar: true,
        sla: 1,
        acoesAutomaticas: ["registrar_reprovacao"],
        camposObrigatorios: ["observacao", "motivo_reprovacao"],
        responsaveis: []
      },
      {
        nome: "Recebimento da Documentação Admissional",
        descricao: "Tarefa gerada - Candidato pode anexar docs pelo portal",
        tipo: "intermediaria",
        cor: "#8B5CF6", // roxo
        obrigatoria: true,
        podeReprovar: false,
        sla: 5,
        acoesAutomaticas: ["gerar_tarefa_documentos"],
        camposObrigatorios: ["checklist_documentos"],
        responsaveis: []
      },
      {
        nome: "Realização de Exames Médicos",
        descricao: "Aguardando confirmação - Item de verificação",
        tipo: "intermediaria",
        cor: "#06B6D4", // ciano
        obrigatoria: true,
        podeReprovar: false,
        sla: 7,
        acoesAutomaticas: ["agendar_exames"],
        camposObrigatorios: ["status_exames"],
        responsaveis: []
      },
      {
        nome: "Contratado",
        descricao: "Encaminha para admissão digital",
        tipo: "final",
        cor: "#059669", // verde escuro
        obrigatoria: true,
        podeReprovar: false,
        sla: 1,
        acoesAutomaticas: ["encaminhar_admissao", "marcar_vaga_preenchida"],
        camposObrigatorios: ["data_admissao"],
        responsaveis: []
      },
      {
        nome: "Integração e Ambientação",
        descricao: "Campo de observações livres",
        tipo: "pos_contrato",
        cor: "#F97316", // laranja
        obrigatoria: false,
        podeReprovar: false,
        sla: 30,
        acoesAutomaticas: ["agendar_integracao"],
        camposObrigatorios: ["observacao"],
        responsaveis: []
      },
      {
        nome: "Período de Experiência – Fase 1",
        descricao: "Ativo por 45 dias",
        tipo: "pos_contrato",
        cor: "#DC2626", // vermelho escuro
        obrigatoria: false,
        podeReprovar: false,
        sla: 45,
        acoesAutomaticas: ["monitorar_experiencia"],
        camposObrigatorios: ["avaliacao_performance"],
        responsaveis: []
      },
      {
        nome: "Prorrogação do Contrato de Experiência",
        descricao: "Checklist - Sistema pode sugerir prorrogação",
        tipo: "pos_contrato",
        cor: "#7C3AED", // violeta
        obrigatoria: false,
        podeReprovar: false,
        sla: 5,
        acoesAutomaticas: ["sugerir_prorrogacao"],
        camposObrigatorios: ["decisao_prorrogacao"],
        responsaveis: []
      },
      {
        nome: "Efetivação – Após 90 dias",
        descricao: "Finaliza contrato de experiência",
        tipo: "pos_contrato",
        cor: "#047857", // verde esmeralda
        obrigatoria: false,
        podeReprovar: false,
        sla: 90,
        acoesAutomaticas: ["finalizar_experiencia"],
        camposObrigatorios: ["avaliacao_final"],
        responsaveis: []
      },
      {
        nome: "Avaliação de Desempenho – 6 meses",
        descricao: "Lembrete automático - Integra com módulo de desempenho",
        tipo: "pos_contrato",
        cor: "#1E40AF", // azul escuro
        obrigatoria: false,
        podeReprovar: false,
        sla: 180,
        acoesAutomaticas: ["agendar_avaliacao", "integrar_desempenho"],
        camposObrigatorios: ["avaliacao_desempenho"],
        responsaveis: []
      }
    ];
  }

  /**
   * Retorna templates específicos por tipo de vaga
   */
  static getTemplatesPorTipoVaga(tipoVaga: string): EtapaTemplate[] {
    const todasEtapas = this.getEtapasPadraoSugeridas();
    
    switch (tipoVaga.toLowerCase()) {
      case 'estágio':
        return todasEtapas.filter(etapa => 
          ['Triagem de Currículos', 'Entrevista com o Candidato', 'Resultado da Entrevista – Aprovado', 'Contratado'].includes(etapa.nome)
        );
      
      case 'freelancer':
      case 'pj':
        return todasEtapas.filter(etapa => 
          !['Realização de Exames Médicos', 'Período de Experiência – Fase 1', 'Prorrogação do Contrato de Experiência', 'Efetivação – Após 90 dias'].includes(etapa.nome)
        );
      
      case 'clt':
      default:
        return todasEtapas;
    }
  }

  /**
   * Converte template para formato de inserção no banco
   */
  static templateParaInsertEtapa(template: EtapaTemplate, ordem: number): Omit<InsertEtapaModeloPipeline, 'modeloId'> {
    return {
      nome: template.nome,
      descricao: template.descricao,
      ordem,
      tipo: template.tipo,
      cor: template.cor,
      obrigatoria: template.obrigatoria,
      podeReprovar: template.podeReprovar,
      sla: template.sla,
      acoesAutomaticas: template.acoesAutomaticas,
      camposObrigatorios: template.camposObrigatorios,
      responsaveis: template.responsaveis
    };
  }

  /**
   * Cria modelo padrão completo para uma empresa
   */
  static async criarModeloPadraoCompleto(empresaId: string, nome: string, tipoVaga?: string): Promise<{
    modelo: any;
    etapas: any[];
  }> {
    const { storage } = await import("../storage");
    
    // Criar modelo
    const modelo = await storage.createModeloPipeline({
      nome,
      descricao: `Modelo padrão ${tipoVaga ? `para ${tipoVaga}` : ''}`,
      empresaId,
      padrao: true,
      ativo: true
    });

    // Selecionar etapas baseadas no tipo de vaga
    const templates = tipoVaga 
      ? this.getTemplatesPorTipoVaga(tipoVaga)
      : this.getEtapasPadraoSugeridas();

    // Criar etapas
    const etapas = [];
    for (let i = 0; i < templates.length; i++) {
      const etapaData = this.templateParaInsertEtapa(templates[i], i + 1);
      const etapa = await storage.createEtapaModeloPipeline({
        ...etapaData,
        modeloId: modelo.id
      });
      etapas.push(etapa);
    }

    return { modelo, etapas };
  }
} 