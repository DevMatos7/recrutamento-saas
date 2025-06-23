import { db } from "../db.js";
import { vagas, candidatos, vagaCandidatos } from "../../shared/schema.js";
import { eq, and, sql, gte, lte, or, isNull } from "drizzle-orm";

export interface MatchCriteria {
  competenciasPeso: number;  // 40%
  experienciaPeso: number;   // 20%
  formacaoPeso: number;      // 10%
  localizacaoPeso: number;   // 10%
  salarioPeso: number;       // 10%
  discPeso: number;          // 10%
}

export interface CandidatoMatch {
  candidato: any;
  score: number;
  detalhes: {
    competencias: number;
    experiencia: number;
    formacao: number;
    localizacao: number;
    salario: number;
    disc: number;
  };
}

export class MatchingService {
  private static readonly DEFAULT_CRITERIA: MatchCriteria = {
    competenciasPeso: 0.4,
    experienciaPeso: 0.2,
    formacaoPeso: 0.1,
    localizacaoPeso: 0.1,
    salarioPeso: 0.1,
    discPeso: 0.1
  };

  static async calcularMatchesParaVaga(
    vagaId: string, 
    scoreMinimo: number = 70,
    criteria: MatchCriteria = this.DEFAULT_CRITERIA
  ): Promise<CandidatoMatch[]> {
    try {
      // Buscar dados da vaga
      const vaga = await db
        .select()
        .from(vagas)
        .where(eq(vagas.id, vagaId))
        .limit(1);

      if (!vaga.length) {
        throw new Error("Vaga não encontrada");
      }

      const vagaData = vaga[0];

      // Buscar candidatos ativos
      const candidatosAtivos = await db
        .select()
        .from(candidatos)
        .where(eq(candidatos.status, "ativo"));

      // Calcular matches
      const matches: CandidatoMatch[] = [];

      for (const candidato of candidatosAtivos) {
        const match = await this.calcularMatchCandidato(candidato, vagaData, criteria);
        
        if (match.score >= scoreMinimo) {
          matches.push(match);
        }
      }

      // Ordenar por score decrescente
      matches.sort((a, b) => b.score - a.score);

      // Log para auditoria
      console.log(`Match calculado para vaga ${vagaId}: ${matches.length} candidatos acima de ${scoreMinimo}%`);

      return matches;
    } catch (error) {
      console.error("Erro ao calcular matches:", error);
      throw error;
    }
  }

  private static async calcularMatchCandidato(
    candidato: any, 
    vaga: any, 
    criteria: MatchCriteria
  ): Promise<CandidatoMatch> {
    const detalhes = {
      competencias: this.calcularMatchCompetencias(candidato, vaga),
      experiencia: this.calcularMatchExperiencia(candidato, vaga),
      formacao: this.calcularMatchFormacao(candidato, vaga),
      localizacao: this.calcularMatchLocalizacao(candidato, vaga),
      salario: this.calcularMatchSalario(candidato, vaga),
      disc: this.calcularMatchDisc(candidato, vaga)
    };

    // Calcular score ponderado
    const score = Math.round(
      (detalhes.competencias * criteria.competenciasPeso) +
      (detalhes.experiencia * criteria.experienciaPeso) +
      (detalhes.formacao * criteria.formacaoPeso) +
      (detalhes.localizacao * criteria.localizacaoPeso) +
      (detalhes.salario * criteria.salarioPeso) +
      (detalhes.disc * criteria.discPeso)
    );

    return {
      candidato,
      score,
      detalhes
    };
  }

  private static calcularMatchCompetencias(candidato: any, vaga: any): number {
    const competenciasVaga = vaga.competencias || [];
    const competenciasCandidato = candidato.competencias || [];

    if (competenciasVaga.length === 0) return 100; // Se vaga não tem competências definidas

    const competenciasEncontradas = competenciasVaga.filter((comp: string) =>
      competenciasCandidato.some((candidatoComp: string) =>
        candidatoComp.toLowerCase().includes(comp.toLowerCase()) ||
        comp.toLowerCase().includes(candidatoComp.toLowerCase())
      )
    );

    return Math.round((competenciasEncontradas.length / competenciasVaga.length) * 100);
  }

  private static calcularMatchExperiencia(candidato: any, vaga: any): number {
    const nivelVaga = vaga.nivelExperiencia || "junior";
    const nivelCandidato = candidato.nivelExperiencia || "junior";

    const niveis: { [key: string]: number } = {
      "estagiario": 0,
      "junior": 1,
      "pleno": 2,
      "senior": 3,
      "especialista": 4
    };

    const nivelVagaNum = niveis[nivelVaga] || 1;
    const nivelCandidatoNum = niveis[nivelCandidato] || 1;

    // Match perfeito = 100%, diferença de 1 nível = 80%, etc.
    if (nivelCandidatoNum === nivelVagaNum) return 100;
    if (Math.abs(nivelCandidatoNum - nivelVagaNum) === 1) return 80;
    if (Math.abs(nivelCandidatoNum - nivelVagaNum) === 2) return 60;
    if (Math.abs(nivelCandidatoNum - nivelVagaNum) === 3) return 40;
    return 20;
  }

  private static calcularMatchFormacao(candidato: any, vaga: any): number {
    const formacaoVaga = vaga.formacaoMinima || "ensino_medio";
    const formacaoCandidato = candidato.formacaoNivel || "ensino_medio";

    const niveis: { [key: string]: number } = {
      "ensino_fundamental": 1,
      "ensino_medio": 2,
      "tecnico": 3,
      "superior": 4,
      "pos_graduacao": 5,
      "mestrado": 6,
      "doutorado": 7
    };

    const nivelVagaNum = niveis[formacaoVaga] || 2;
    const nivelCandidatoNum = niveis[formacaoCandidato] || 2;

    // Candidato tem formação igual ou superior
    if (nivelCandidatoNum >= nivelVagaNum) return 100;
    
    // Candidato tem formação inferior
    const diferenca = nivelVagaNum - nivelCandidatoNum;
    return Math.max(0, 100 - (diferenca * 20));
  }

  private static calcularMatchLocalizacao(candidato: any, vaga: any): number {
    const localizacaoVaga = vaga.localizacao?.toLowerCase() || "";
    const localizacaoCandidato = candidato.localizacao?.toLowerCase() || "";

    if (!localizacaoVaga || !localizacaoCandidato) return 50; // Neutro se não informado

    // Match exato
    if (localizacaoCandidato === localizacaoVaga) return 100;

    // Match parcial (mesmo estado/cidade)
    if (localizacaoCandidato.includes(localizacaoVaga) || 
        localizacaoVaga.includes(localizacaoCandidato)) return 80;

    // Trabalho remoto
    if (localizacaoVaga.includes("remoto") || 
        localizacaoVaga.includes("home office")) return 90;

    return 30; // Localizações diferentes
  }

  private static calcularMatchSalario(candidato: any, vaga: any): number {
    const pretensaoCandidato = candidato.pretensaoSalarial || 0;
    const salarioMaxVaga = vaga.salarioMax || 0;
    const salarioMinVaga = vaga.salarioMin || 0;

    if (pretensaoCandidato === 0 || salarioMaxVaga === 0) return 50; // Neutro se não informado

    // Candidato pede mais que o máximo oferecido - eliminar
    if (pretensaoCandidato > salarioMaxVaga) return 0;

    // Candidato pede dentro da faixa
    if (pretensaoCandidato >= salarioMinVaga && pretensaoCandidato <= salarioMaxVaga) return 100;

    // Candidato pede menos que o mínimo (ótimo para empresa)
    if (pretensaoCandidato < salarioMinVaga) return 95;

    return 0;
  }

  private static calcularMatchDisc(candidato: any, vaga: any): number {
    const discCandidato = candidato.resultadoDisc;
    const discIdealVaga = vaga.perfilDiscIdeal;

    if (!discCandidato || !discIdealVaga) return 50; // Neutro se não informado

    // Calcular similaridade entre perfis DISC
    const fatores = ['D', 'I', 'S', 'C'];
    let somaDisferencas = 0;
    let fatoresComparados = 0;

    for (const fator of fatores) {
      const valorCandidato = discCandidato[fator] || 0;
      const valorIdeal = discIdealVaga[fator] || 0;

      if (valorIdeal > 0) { // Só comparar se a vaga tem preferência definida
        const diferenca = Math.abs(valorCandidato - valorIdeal);
        somaDisferencas += diferenca;
        fatoresComparados++;
      }
    }

    if (fatoresComparados === 0) return 50;

    // Normalizar diferença (máxima diferença possível = 96 pontos por fator)
    const diferencaMedia = somaDisferencas / fatoresComparados;
    const similarity = Math.max(0, 100 - ((diferencaMedia / 96) * 100));

    return Math.round(similarity);
  }

  static async obterEstatisticasMatching(vagaId: string): Promise<any> {
    try {
      const matches = await this.calcularMatchesParaVaga(vagaId, 0); // Pegar todos os matches

      const estatisticas = {
        totalCandidatos: matches.length,
        matchesAcimaDe70: matches.filter(m => m.score >= 70).length,
        matchesAcimaDe80: matches.filter(m => m.score >= 80).length,
        matchesAcimaDe90: matches.filter(m => m.score >= 90).length,
        scoreMaximo: matches.length > 0 ? Math.max(...matches.map(m => m.score)) : 0,
        scoreMedio: matches.length > 0 ? 
          Math.round(matches.reduce((sum, m) => sum + m.score, 0) / matches.length) : 0,
        distribuicaoScores: {
          '90-100': matches.filter(m => m.score >= 90).length,
          '80-89': matches.filter(m => m.score >= 80 && m.score < 90).length,
          '70-79': matches.filter(m => m.score >= 70 && m.score < 80).length,
          '60-69': matches.filter(m => m.score >= 60 && m.score < 70).length,
          '0-59': matches.filter(m => m.score < 60).length,
        }
      };

      return estatisticas;
    } catch (error) {
      console.error("Erro ao obter estatísticas:", error);
      throw error;
    }
  }
}