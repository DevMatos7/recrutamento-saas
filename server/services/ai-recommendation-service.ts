import OpenAI from "openai";
import { db } from "../db";
import { candidatos, vagas, vagaCandidatos } from "../../shared/schema";
import { eq, and, notInArray } from "drizzle-orm";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface CandidateProfile {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cargo?: string;
  resumoProfissional?: string;
  experienciaProfissional?: any[];
  educacao?: any[];
  habilidades?: string[];
  idiomas?: any[];
  certificacoes?: any[];
  pretensoSalarial?: number;
  disponibilidade?: string;
  modalidadeTrabalho?: string;
  discProfile?: {
    dominante: number;
    influente: number;
    estavel: number;
    consciente: number;
    perfil: string;
  };
}

interface JobProfile {
  id: string;
  titulo: string;
  descricao: string;
  requisitos: string;
  beneficios?: string;
  salario?: number;
  tipoContrato: string;
  modalidade: string;
  experienciaMinima?: number;
  competenciasDesejadas?: string[];
  competenciasObrigatorias?: string[];
  discDesejado?: string;
}

interface AIRecommendation {
  candidateId: string;
  candidateName: string;
  compatibilityScore: number;
  reasoning: string;
  strengths: string[];
  concerns: string[];
  recommendations: string[];
  culturalFit: number;
  technicalFit: number;
  experienceFit: number;
}

export class AIRecommendationService {
  
  static async getAIRecommendations(jobId: string, limit: number = 5): Promise<AIRecommendation[]> {
    try {
      // Get job details
      const [job] = await db
        .select()
        .from(vagas)
        .where(eq(vagas.id, jobId))
        .limit(1);

      if (!job) {
        throw new Error('Vaga não encontrada');
      }

      // Get candidates who haven't applied to this job
      const appliedCandidates = await db
        .select({ candidatoId: vagaCandidatos.candidatoId })
        .from(vagaCandidatos)
        .where(eq(vagaCandidatos.vagaId, jobId));

      const appliedCandidateIds = appliedCandidates.map(c => c.candidatoId);

      // Get available candidates
      const candidates = await db
        .select()
        .from(candidatos)
        .where(appliedCandidateIds.length > 0 ? notInArray(candidatos.id, appliedCandidateIds) : undefined);

      if (candidates.length === 0) {
        return [];
      }

      // Prepare job profile for AI analysis
      const jobProfile: JobProfile = {
        id: job.id,
        titulo: job.titulo,
        descricao: job.descricao,
        requisitos: job.requisitos || '',
        beneficios: job.beneficios || '',
        salario: job.salario ? parseInt(job.salario) : undefined,
        tipoContrato: job.tipoContratacao,
        modalidade: job.local,
        experienciaMinima: 0,
        competenciasDesejadas: [],
        competenciasObrigatorias: [],
        discDesejado: ''
      };

      // Prepare candidate profiles for AI analysis
      const candidateProfiles: CandidateProfile[] = candidates.map(candidate => ({
        id: candidate.id,
        nome: candidate.nome,
        email: candidate.email,
        telefone: candidate.telefone,
        cargo: candidate.cargo || '',
        resumoProfissional: candidate.resumoProfissional || '',
        experienciaProfissional: Array.isArray(candidate.experienciaProfissional) ? candidate.experienciaProfissional : [],
        educacao: Array.isArray(candidate.educacao) ? candidate.educacao : [],
        habilidades: Array.isArray(candidate.habilidades) ? candidate.habilidades : [],
        idiomas: Array.isArray(candidate.idiomas) ? candidate.idiomas : [],
        certificacoes: Array.isArray(candidate.certificacoes) ? candidate.certificacoes : [],
        pretensoSalarial: candidate.pretensoSalarial ? parseInt(candidate.pretensoSalarial) : undefined,
        disponibilidade: candidate.disponibilidade || '',
        modalidadeTrabalho: candidate.modalidadeTrabalho || ''
      }));

      // Get AI recommendations
      const recommendations = await this.analyzeWithAI(jobProfile, candidateProfiles, limit);
      
      return recommendations;

    } catch (error) {
      console.error('Erro ao gerar recomendações AI:', error);
      throw error;
    }
  }

  private static async analyzeWithAI(job: JobProfile, candidates: CandidateProfile[], limit: number): Promise<AIRecommendation[]> {
    try {
      const prompt = `
Você é um especialista em recrutamento e seleção. Analise a vaga e os candidatos fornecidos e recomende os ${limit} melhores candidatos para a posição.

VAGA:
Título: ${job.titulo}
Descrição: ${job.descricao}
Requisitos: ${job.requisitos}
Salário: ${job.salario ? `R$ ${job.salario}` : 'Não informado'}
Tipo de Contrato: ${job.tipoContrato}
Modalidade: ${job.modalidade}
Experiência Mínima: ${job.experienciaMinima ? `${job.experienciaMinima} anos` : 'Não especificada'}
Competências Obrigatórias: ${job.competenciasObrigatorias?.join(', ') || 'Não especificadas'}
Competências Desejadas: ${job.competenciasDesejadas?.join(', ') || 'Não especificadas'}
Perfil DISC Desejado: ${job.discDesejado || 'Não especificado'}

CANDIDATOS:
${candidates.map((candidate, index) => `
${index + 1}. ${candidate.nome}
   - Cargo Atual: ${candidate.cargo || 'Não informado'}
   - Resumo: ${candidate.resumoProfissional || 'Não informado'}
   - Experiência: ${candidate.experienciaProfissional?.length || 0} posições anteriores
   - Educação: ${candidate.educacao?.length || 0} formações
   - Habilidades: ${candidate.habilidades?.join(', ') || 'Não informadas'}
   - Idiomas: ${candidate.idiomas?.length || 0} idiomas
   - Pretensão Salarial: ${candidate.pretensoSalarial ? `R$ ${candidate.pretensoSalarial}` : 'Não informada'}
   - Disponibilidade: ${candidate.disponibilidade || 'Não informada'}
   - Modalidade: ${candidate.modalidadeTrabalho || 'Não informada'}
`).join('')}

Para cada candidato recomendado, forneça:
1. Score de compatibilidade (0-100)
2. Reasoning (explicação da recomendação)
3. Strengths (3-5 pontos fortes)
4. Concerns (2-3 preocupações ou pontos de atenção)
5. Recommendations (2-3 recomendações para o processo seletivo)
6. Cultural fit score (0-100)
7. Technical fit score (0-100)
8. Experience fit score (0-100)

Retorne apenas um JSON válido no seguinte formato:
{
  "recommendations": [
    {
      "candidateId": "id_do_candidato",
      "candidateName": "nome_do_candidato",
      "compatibilityScore": 85,
      "reasoning": "Explicação detalhada da compatibilidade",
      "strengths": ["Forte em...", "Experiência em...", "Demonstra..."],
      "concerns": ["Falta experiência em...", "Salário pode ser..."],
      "recommendations": ["Verificar...", "Explorar..."],
      "culturalFit": 90,
      "technicalFit": 80,
      "experienceFit": 85
    }
  ]
}
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
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
      
      return result.recommendations || [];

    } catch (error) {
      console.error('Erro na análise AI:', error);
      
      // Fallback: Use rule-based analysis when AI is unavailable
      return this.fallbackAnalysis(job, candidates, limit);
    }
  }

  private static fallbackAnalysis(job: JobProfile, candidates: CandidateProfile[], limit: number): AIRecommendation[] {
    console.log('Usando análise de fallback - AI indisponível');
    
    const scored = candidates.map(candidate => {
      let score = 50; // Base score
      let technicalFit = 50;
      let culturalFit = 50;
      let experienceFit = 50;
      const strengths: string[] = [];
      const concerns: string[] = [];
      const recommendations: string[] = [];

      // Technical compatibility
      if (candidate.habilidades && candidate.habilidades.length > 0) {
        technicalFit += 20;
        strengths.push("Possui habilidades técnicas documentadas");
      } else {
        concerns.push("Habilidades técnicas não especificadas");
      }

      // Experience analysis
      if (candidate.experienciaProfissional && candidate.experienciaProfissional.length > 0) {
        experienceFit += 25;
        strengths.push("Experiência profissional documentada");
      } else {
        concerns.push("Experiência profissional limitada");
      }

      // DISC profile analysis
      if (candidate.discProfile) {
        culturalFit += 20;
        strengths.push(`Perfil DISC avaliado: ${candidate.discProfile.perfil}`);
      } else {
        concerns.push("Perfil comportamental não avaliado");
        culturalFit -= 10;
      }

      // Salary compatibility
      if (candidate.pretensoSalarial && job.salario) {
        const jobSalary = parseFloat(job.salario.toString().replace(/[^\d]/g, ''));
        const candidateSalary = candidate.pretensoSalarial;
        
        if (candidateSalary <= jobSalary * 1.2) {
          score += 10;
          strengths.push("Pretensão salarial compatível");
        } else {
          score -= 15;
          concerns.push("Pretensão salarial acima do orçamento");
        }
      }

      // Work modality compatibility  
      if (candidate.modalidadeTrabalho === job.modalidade) {
        score += 10;
        strengths.push("Modalidade de trabalho compatível");
      }

      // Generate recommendations
      if (concerns.length > 0) {
        recommendations.push("Recomenda-se entrevista detalhada para esclarecer pontos de atenção");
      }
      if (candidate.discProfile) {
        recommendations.push("Considerar fit cultural baseado no perfil DISC");
      } else {
        recommendations.push("Aplicar teste DISC antes da contratação");
      }

      // Final score calculation
      score = Math.min(100, Math.max(0, (technicalFit + culturalFit + experienceFit) / 3));

      return {
        candidateId: candidate.id,
        candidateName: candidate.nome,
        compatibilityScore: Math.round(score),
        reasoning: `Análise baseada em critérios objetivos: experiência profissional, habilidades técnicas, perfil comportamental e compatibilidade salarial. Score calculado automaticamente.`,
        strengths,
        concerns,
        recommendations,
        culturalFit: Math.round(culturalFit),
        technicalFit: Math.round(technicalFit),
        experienceFit: Math.round(experienceFit)
      };
    });

    // Sort by compatibility score and return top candidates
    return scored
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
      .slice(0, limit);
  }

  static async getCandidateInsights(candidateId: string, jobId: string): Promise<any> {
    try {
      // Get candidate details
      const [candidate] = await db
        .select()
        .from(candidatos)
        .where(eq(candidatos.id, candidateId))
        .limit(1);

      if (!candidate) {
        throw new Error('Candidato não encontrado');
      }

      // Get job details
      const [job] = await db
        .select()
        .from(vagas)
        .where(eq(vagas.id, jobId))
        .limit(1);

      if (!job) {
        throw new Error('Vaga não encontrada');
      }

      const prompt = `
Analise em detalhes a compatibilidade entre este candidato e a vaga:

CANDIDATO:
Nome: ${candidate.nome}
Cargo: ${candidate.cargo || 'Não informado'}
Resumo: ${candidate.resumoProfissional || 'Não informado'}
Experiência: ${JSON.stringify(candidate.experienciaProfissional || [])}
Educação: ${JSON.stringify(candidate.educacao || [])}
Habilidades: ${candidate.habilidades?.join(', ') || 'Não informadas'}
Pretensão: ${candidate.pretensoSalarial ? `R$ ${candidate.pretensoSalarial}` : 'Não informada'}

VAGA:
Título: ${job.titulo}
Descrição: ${job.descricao}
Requisitos: ${job.requisitos}
Salário: ${job.salario ? `R$ ${job.salario}` : 'Não informado'}

Forneça uma análise detalhada em JSON com:
- Compatibilidade geral (0-100)
- Análise de habilidades técnicas
- Análise de experiência
- Análise salarial
- Pontos fortes específicos
- Áreas de desenvolvimento
- Recomendações para entrevista
- Probabilidade de sucesso na posição

Formato JSON:
{
  "overallCompatibility": 85,
  "technicalAnalysis": "...",
  "experienceAnalysis": "...",
  "salaryAnalysis": "...",
  "strengths": ["..."],
  "developmentAreas": ["..."],
  "interviewRecommendations": ["..."],
  "successProbability": 80
}
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "Você é um consultor especializado em análise de candidatos. Forneça insights profundos e acionáveis."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2
      });

      return JSON.parse(response.choices[0].message.content || '{}');

    } catch (error) {
      console.error('Erro ao gerar insights do candidato:', error);
      
      // Fallback: Generate basic insights when AI is unavailable
      return this.generateFallbackInsights(candidate, job);
    }
  }

  private static generateFallbackInsights(candidate: any, job: any): any {
    console.log('Gerando insights de fallback - AI indisponível');
    
    const insights = {
      overallCompatibility: 60,
      technicalAnalysis: "Análise técnica baseada em dados objetivos disponíveis no perfil do candidato.",
      experienceAnalysis: "Avaliação da experiência profissional com base no histórico documentado.",
      salaryAnalysis: "Análise da compatibilidade salarial considerando pretensão e orçamento da vaga.",
      strengths: [] as string[],
      developmentAreas: [] as string[],
      interviewRecommendations: [] as string[],
      successProbability: 60
    };

    // Technical analysis
    if (candidate.habilidades && candidate.habilidades.length > 0) {
      insights.strengths.push("Habilidades técnicas documentadas");
      insights.overallCompatibility += 10;
    } else {
      insights.developmentAreas.push("Documentar habilidades técnicas específicas");
    }

    // Experience analysis
    if (candidate.experienciaProfissional && candidate.experienciaProfissional.length > 0) {
      insights.strengths.push("Experiência profissional comprovada");
      insights.overallCompatibility += 15;
    } else {
      insights.developmentAreas.push("Experiência profissional limitada");
    }

    // Education analysis
    if (candidate.educacao && candidate.educacao.length > 0) {
      insights.strengths.push("Formação educacional adequada");
      insights.overallCompatibility += 5;
    }

    // DISC profile analysis
    if (candidate.discProfile) {
      insights.strengths.push(`Perfil comportamental avaliado: ${candidate.discProfile.perfil}`);
      insights.overallCompatibility += 10;
    } else {
      insights.developmentAreas.push("Realizar avaliação comportamental DISC");
      insights.interviewRecommendations.push("Aplicar teste DISC antes da decisão final");
    }

    // Salary compatibility
    if (candidate.pretensoSalarial && job.salario) {
      const jobSalary = parseFloat(job.salario.toString().replace(/[^\d]/g, ''));
      const candidateSalary = candidate.pretensoSalarial;
      
      if (candidateSalary <= jobSalary) {
        insights.strengths.push("Pretensão salarial dentro do orçamento");
        insights.salaryAnalysis = "Pretensão salarial compatível com o orçamento da vaga.";
      } else {
        insights.developmentAreas.push("Negociar expectativas salariais");
        insights.salaryAnalysis = "Pretensão salarial acima do orçamento - requer negociação.";
      }
    }

    // Generate interview recommendations
    insights.interviewRecommendations.push("Explorar motivações e objetivos de carreira");
    insights.interviewRecommendations.push("Validar experiências práticas relevantes");
    insights.interviewRecommendations.push("Avaliar fit cultural com a equipe");

    // Adjust overall compatibility
    insights.overallCompatibility = Math.min(100, Math.max(30, insights.overallCompatibility));
    insights.successProbability = insights.overallCompatibility;

    return insights;
  }
}