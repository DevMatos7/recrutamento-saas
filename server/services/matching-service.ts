import { db } from "../db.js";
import { vagas, candidatos, vagaCandidatos, candidatoSkills, vagaSkills } from "../../shared/schema.js";
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
  ): Promise<CandidatoMatch & { explicacao: any }> {
    // Buscar skills por ID
    const [skillsCandidato, skillsVaga] = await Promise.all([
      db.select({ skillId: candidatoSkills.skillId }).from(candidatoSkills).where(eq(candidatoSkills.candidatoId, candidato.id)),
      db.select({ skillId: vagaSkills.skillId }).from(vagaSkills).where(eq(vagaSkills.vagaId, vaga.id)),
    ]);
    const idsCandidato = skillsCandidato.map(s => s.skillId);
    const idsVaga = skillsVaga.map(s => s.skillId);

    // Cálculo detalhado de cada critério
    const competencias = MatchingService.calcularMatchCompetenciasPorId(idsCandidato, idsVaga);
    const experiencia = this.calcularMatchExperiencia(candidato, vaga);
    const formacao = this.calcularMatchFormacao(candidato, vaga);
    const localizacao = this.calcularMatchLocalizacao(candidato, vaga);
    const salario = this.calcularMatchSalario(candidato, vaga);
    const disc = this.calcularMatchDisc(candidato, vaga);

    // Score ponderado
    const score = Math.round(
      (competencias * criteria.competenciasPeso) +
      (experiencia * criteria.experienciaPeso) +
      (formacao * criteria.formacaoPeso) +
      (localizacao * criteria.localizacaoPeso) +
      (salario * criteria.salarioPeso) +
      (disc * criteria.discPeso)
    );

    // Explicação detalhada
    const explicacao = {
      competencias: {
        score: competencias,
        justificativa: `Candidato possui ${idsCandidato.filter(id => idsVaga.includes(id)).length} de ${idsVaga.length} skills exigidas pela vaga.`
      },
      experiencia: {
        score: experiencia,
        justificativa: 'Score calculado considerando anos e nível de experiência em relação ao desejado pela vaga.'
      },
      formacao: {
        score: formacao,
        justificativa: 'Score calculado considerando nível e curso/área de formação em relação ao desejado pela vaga.'
      },
      localizacao: {
        score: localizacao,
        justificativa: 'Score baseado na proximidade geográfica e disponibilidade para mudança.'
      },
      salario: {
        score: salario,
        justificativa: 'Score baseado na compatibilidade entre pretensão salarial e faixa/benefícios da vaga.'
      },
      disc: {
        score: disc,
        justificativa: 'Score baseado na similaridade do perfil DISC com tolerância definida pela vaga.'
      },
      scoreFinal: score
    };

    return {
      candidato,
      score,
      detalhes: {
        competencias,
        experiencia,
        formacao,
        localizacao,
        salario,
        disc
      },
      explicacao
    };
  }

  // Novo cálculo de competências por ID
  private static calcularMatchCompetenciasPorId(idsCandidato: string[], idsVaga: string[]): number {
    if (!idsVaga.length) return 100;
    if (!idsCandidato.length) return 0; // Penaliza ausência de competências
    const encontrados = idsVaga.filter(id => idsCandidato.includes(id));
    return Math.round((encontrados.length / idsVaga.length) * 100);
  }

  // Novo cálculo de experiência considerando anos e área/cargo desejado
  private static calcularMatchExperiencia(candidato: any, vaga: any): number {
    // Vaga pode definir: nivelExperiencia, anosExperienciaDesejado, cargoDesejado
    const nivelVaga = vaga.nivelExperiencia || "junior";
    const anosDesejado = vaga.anosExperienciaDesejado || 0;
    const cargoDesejado = vaga.cargoDesejado?.toLowerCase() || null;

    // Experiências do candidato
    const experiencias = Array.isArray(candidato.experienciaProfissional) ? candidato.experienciaProfissional : [];
    let anosTotal = 0;
    let anosCargoDesejado = 0;
    const now = new Date();
    for (const exp of experiencias) {
      const inicio = exp.dataInicio ? new Date(exp.dataInicio) : null;
      const fim = exp.atual ? now : (exp.dataFim ? new Date(exp.dataFim) : now);
      if (inicio && fim && fim > inicio) {
        const anos = (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        anosTotal += anos;
        if (cargoDesejado && exp.cargo?.toLowerCase().includes(cargoDesejado)) {
          anosCargoDesejado += anos;
        }
      }
    }
    // Score por anos na área/cargo desejado
    let scoreAnos = 100;
    if (anosDesejado > 0) {
      scoreAnos = Math.min(100, Math.round((anosCargoDesejado / anosDesejado) * 100));
    }
    // Score por nível (mantém compatibilidade)
    const niveis: { [key: string]: number } = {
      "estagiario": 0,
      "junior": 1,
      "pleno": 2,
      "senior": 3,
      "especialista": 4
    };
    const nivelVagaNum = niveis[nivelVaga] || 1;
    const nivelCandidatoNum = niveis[candidato.nivelExperiencia || "junior"] || 1;
    let scoreNivel = 100;
    if (nivelCandidatoNum !== nivelVagaNum) {
      const diff = Math.abs(nivelCandidatoNum - nivelVagaNum);
      if (diff === 1) scoreNivel = 80;
      else if (diff === 2) scoreNivel = 60;
      else if (diff === 3) scoreNivel = 40;
      else scoreNivel = 20;
    }
    // Score final: média dos dois critérios
    return Math.round((scoreAnos + scoreNivel) / 2);
  }

  // Novo cálculo de formação considerando curso/área desejada
  private static calcularMatchFormacao(candidato: any, vaga: any): number {
    // Vaga pode definir: formacaoMinima, cursosDesejados (array de string)
    const formacaoVaga = vaga.formacaoMinima || "ensino_medio";
    const cursosDesejados = Array.isArray(vaga.cursosDesejados) ? vaga.cursosDesejados.map((cd: string) => cd.toLowerCase()) : [];
    // Formação do candidato
    const formacoes = Array.isArray(candidato.educacao) ? candidato.educacao : [];
    if (formacoes.length === 0) return 0; // Penaliza ausência de formação
    // Score por nível
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
    let melhorScore = 0;
    for (const form of formacoes) {
      const nivelCandidatoNum = niveis[form.nivel] || 2;
      let scoreNivel = 100;
      if (nivelCandidatoNum < nivelVagaNum) {
        const diff = nivelVagaNum - nivelCandidatoNum;
        scoreNivel = Math.max(0, 100 - (diff * 20));
      }
      // Score por curso/área
      let scoreCurso = 0;
      if (cursosDesejados.length > 0 && form.curso) {
        const cursoLower = form.curso.toLowerCase();
        if (cursosDesejados.some(cd => cursoLower.includes(cd))) {
          scoreCurso = 100;
        } else {
          scoreCurso = 60; // área correlata
        }
      } else {
        scoreCurso = 100; // Se vaga não exige curso específico
      }
      // Score final desta formação
      const scoreForm = Math.round((scoreNivel + scoreCurso) / 2);
      if (scoreForm > melhorScore) melhorScore = scoreForm;
    }
    return melhorScore;
  }

  // Novo cálculo de localização usando distância geográfica e disponibilidade para mudança
  private static calcularMatchLocalizacao(candidato: any, vaga: any): number {
    // Se não houver dados de localização, retorna 0
    if (!vaga.localizacaoLat || !vaga.localizacaoLng || !candidato.localizacaoLat || !candidato.localizacaoLng) {
      const localizacaoVaga = vaga.local?.toLowerCase() || "";
      const localizacaoCandidato = candidato.localizacao?.toLowerCase() || "";
      if (!localizacaoVaga || !localizacaoCandidato) return 0; // Penaliza ausência de localização
      if (localizacaoCandidato === localizacaoVaga) return 100;
      if (localizacaoCandidato.includes(localizacaoVaga) || localizacaoVaga.includes(localizacaoCandidato)) return 80;
      if (localizacaoVaga.includes("remoto") || localizacaoVaga.includes("home office")) return 90;
      return 40;
    }
    // Cálculo de distância (Haversine)
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371; // Raio da Terra em km
    const dLat = toRad(candidato.localizacaoLat - vaga.localizacaoLat);
    const dLng = toRad(candidato.localizacaoLng - vaga.localizacaoLng);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(vaga.localizacaoLat)) * Math.cos(toRad(candidato.localizacaoLat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distancia = R * c;
    // Score baseado na distância
    let score = 100;
    if (distancia <= 10) score = 100;
    else if (distancia <= 30) score = 90;
    else if (distancia <= 50) score = 80;
    else if (distancia <= 100) score = 70;
    else if (distancia <= 200) score = 60;
    else if (distancia <= 500) score = 50;
    else score = 30;
    // Bônus se o candidato aceita mudar de cidade/estado
    if (candidato.disponivelMudanca || candidato.disponibilidadeMudanca) {
      score = Math.max(score, 80);
    }
    // Se vaga for remota, score máximo
    if (vaga.local && (vaga.local.toLowerCase().includes("remoto") || vaga.local.toLowerCase().includes("home office"))) {
      score = 100;
    }
    return score;
  }

  // Novo cálculo de salário considerando faixa e benefícios
  private static calcularMatchSalario(candidato: any, vaga: any): number {
    // Faixa salarial da vaga
    let faixaMin = 0, faixaMax = 0;
    if (vaga.salario) {
      const match = vaga.salario.match(/(\d+)/g);
      if (match && match.length > 0) {
        faixaMin = parseInt(match[0]);
        if (match.length > 1) faixaMax = parseInt(match[1]);
        else faixaMax = faixaMin;
      }
    }
    const pretensao = candidato.pretensaoSalarial ? parseInt((candidato.pretensaoSalarial + '').replace(/\D/g, '')) : 0;
    if (!faixaMin || !pretensao) return 0; // Penaliza ausência de salário
    // Score baseado na faixa
    let score = 100;
    if (pretensao >= faixaMin && (faixaMax === 0 || pretensao <= faixaMax)) {
      score = 100;
    } else if (pretensao < faixaMin && pretensao >= faixaMin * 0.8) {
      score = 90;
    } else if (pretensao > faixaMax && pretensao <= faixaMax * 1.2) {
      score = 80;
    } else {
      score = 50;
    }
    // Bônus por benefícios (exemplo: se vaga tem plano de saúde ou VA/VR)
    if (vaga.beneficios) {
      const beneficios = vaga.beneficios.toLowerCase();
      if (beneficios.includes('plano de saúde') || beneficios.includes('vale alimentação') || beneficios.includes('vale refeição')) {
        score = Math.max(score, 90);
      }
    }
    return score;
  }

  // Novo cálculo DISC com tolerância e distância vetorial
  private static calcularMatchDisc(candidato: any, vaga: any): number {
    const discCandidato = candidato.resultadoDisc;
    const discIdealVaga = vaga.perfilDiscIdeal;
    const tolerancia = vaga.toleranciaDisc || { D: 20, I: 20, S: 20, C: 20 };
    if (!discCandidato || !discIdealVaga) return 0; // Penaliza ausência de DISC
    // Calcular distância vetorial considerando tolerância
    const fatores = ['D', 'I', 'S', 'C'];
    let soma = 0;
    for (const fator of fatores) {
      const valorCandidato = discCandidato[fator] || 0;
      const valorIdeal = discIdealVaga[fator] || 0;
      const tol = tolerancia[fator] || 20;
      const diff = Math.abs(valorCandidato - valorIdeal);
      // Score máximo se dentro da tolerância
      if (diff <= tol) {
        soma += 100;
      } else {
        // Score decresce linearmente até 0 quando diferença chega a 96 (máximo DISC)
        soma += Math.max(0, 100 - ((diff / 96) * 100));
      }
    }
    return Math.round(soma / fatores.length);
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