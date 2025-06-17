import { eq, and } from "drizzle-orm";
import { db } from "../db.js";
import { testes, testesResultados, candidatos, vagas, usuarios } from "../../shared/schema.js";
import type { InsertTeste, InsertTesteResultado, Teste, TesteResultado, Usuario } from "../../shared/schema.js";

export class TesteServiceError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "TesteServiceError";
  }
}

export interface PerfilDISC {
  perfil: "D" | "I" | "S" | "C";
  nome: string;
  descricao: string;
  pontuacao: { D: number; I: number; S: number; C: number };
}

/**
 * Service for managing DISC and Technical Tests
 */
export class TesteService {
  
  /**
   * Validates if user has permission to manage tests
   */
  private static validateUserPermissions(usuario: Usuario, action: 'create' | 'assign' | 'view'): void {
    if (action === 'create' && !['admin'].includes(usuario.perfil)) {
      throw new TesteServiceError("Apenas administradores podem criar testes", "PERMISSION_DENIED");
    }
    
    if (action === 'assign' && !['admin', 'recrutador'].includes(usuario.perfil)) {
      throw new TesteServiceError("Apenas administradores e recrutadores podem atribuir testes", "PERMISSION_DENIED");
    }
    
    if (action === 'view' && !['admin', 'recrutador', 'gestor'].includes(usuario.perfil)) {
      throw new TesteServiceError("Sem permissão para visualizar testes", "PERMISSION_DENIED");
    }
  }

  /**
   * Validates if test type is supported
   */
  private static validateTipoTeste(tipo: string): asserts tipo is 'DISC' | 'tecnico' {
    if (!['DISC', 'tecnico'].includes(tipo)) {
      throw new TesteServiceError("Tipo de teste inválido. Use 'DISC' ou 'tecnico'", "INVALID_TEST_TYPE");
    }
  }

  /**
   * Check if candidate exists
   */
  private static async validateCandidatoExiste(candidatoId: string): Promise<void> {
    const candidato = await db.query.candidatos.findFirst({
      where: eq(candidatos.id, candidatoId)
    });
    
    if (!candidato) {
      throw new TesteServiceError("Candidato não encontrado", "CANDIDATE_NOT_FOUND");
    }
  }

  /**
   * Check if job exists and is active
   */
  private static async validateVagaAtiva(vagaId: string): Promise<void> {
    const vaga = await db.query.vagas.findFirst({
      where: eq(vagas.id, vagaId)
    });
    
    if (!vaga) {
      throw new TesteServiceError("Vaga não encontrada", "JOB_NOT_FOUND");
    }
    
    if (vaga.status === 'encerrada' || vaga.status === 'cancelada') {
      throw new TesteServiceError("Não é possível atribuir testes para vagas encerradas ou canceladas", "JOB_INACTIVE");
    }
  }

  /**
   * Check if test already assigned to candidate for this job
   */
  private static async validateTesteNaoAtribuido(testeId: string, candidatoId: string, vagaId: string): Promise<void> {
    const existingResult = await db.query.testesResultados.findFirst({
      where: and(
        eq(testesResultados.testeId, testeId),
        eq(testesResultados.candidatoId, candidatoId),
        eq(testesResultados.vagaId, vagaId)
      )
    });
    
    if (existingResult) {
      throw new TesteServiceError("Este teste já foi atribuído ao candidato para esta vaga", "TEST_ALREADY_ASSIGNED");
    }
  }

  /**
   * Calculate DISC profile based on responses
   */
  private static calcularPerfilDISC(respostas: number[], questoes: any[]): PerfilDISC {
    // DISC scoring logic - simplified version
    const pontuacao = { D: 0, I: 0, S: 0, C: 0 };
    
    // Each question maps to DISC dimensions
    const mapeamentoDISC = [
      ['D', 'I', 'S', 'C'], // Question 1 alternatives map to D, I, S, C
      ['C', 'D', 'I', 'S'], // Question 2 alternatives map to C, D, I, S  
      ['S', 'C', 'D', 'I'], // Question 3 alternatives map to S, C, D, I
      ['I', 'S', 'C', 'D'], // Question 4 alternatives map to I, S, C, D
    ];
    
    respostas.forEach((resposta, index) => {
      if (index < mapeamentoDISC.length && resposta < mapeamentoDISC[index].length) {
        const dimensao = mapeamentoDISC[index][resposta] as keyof typeof pontuacao;
        pontuacao[dimensao]++;
      }
    });
    
    // Determine dominant profile
    const perfilDominante = Object.entries(pontuacao).reduce((a, b) => 
      pontuacao[a[0] as keyof typeof pontuacao] > pontuacao[b[0] as keyof typeof pontuacao] ? a : b
    )[0] as "D" | "I" | "S" | "C";
    
    const perfilDescricoes = {
      D: { nome: "Dominante", descricao: "Direto, decidido, orientado para resultados" },
      I: { nome: "Influente", descricao: "Comunicativo, otimista, orientado para pessoas" },
      S: { nome: "Estável", descricao: "Paciente, leal, orientado para relacionamentos" },
      C: { nome: "Consciente", descricao: "Analítico, preciso, orientado para qualidade" }
    };
    
    return {
      perfil: perfilDominante,
      nome: perfilDescricoes[perfilDominante].nome,
      descricao: perfilDescricoes[perfilDominante].descricao,
      pontuacao
    };
  }

  /**
   * Calculate technical test score
   */
  private static calcularPontuacaoTecnica(respostas: number[], questoes: any[]): number {
    let acertos = 0;
    
    respostas.forEach((resposta, index) => {
      if (questoes[index]?.respostaCorreta === resposta) {
        acertos++;
      }
    });
    
    return (acertos / questoes.length) * 100;
  }

  /**
   * Create a new test (DISC or Technical)
   */
  static async criarTeste(teste: InsertTeste, usuarioLogado: Usuario): Promise<Teste> {
    this.validateUserPermissions(usuarioLogado, 'create');
    this.validateTipoTeste(teste.tipo);
    
    const [novoTeste] = await db.insert(testes)
      .values({
        ...teste,
        dataCriacao: new Date(),
        dataAtualizacao: new Date()
      })
      .returning();
    
    return novoTeste;
  }

  /**
   * List all active tests
   */
  static async listarTestes(usuarioLogado: Usuario): Promise<Teste[]> {
    this.validateUserPermissions(usuarioLogado, 'view');
    
    return await db.query.testes.findMany({
      where: eq(testes.ativo, true),
      orderBy: (testes, { desc }) => [desc(testes.dataCriacao)]
    });
  }

  /**
   * Get test by ID
   */
  static async obterTeste(id: string, usuarioLogado: Usuario): Promise<Teste | null> {
    this.validateUserPermissions(usuarioLogado, 'view');
    
    const teste = await db.query.testes.findFirst({
      where: and(eq(testes.id, id), eq(testes.ativo, true))
    });
    
    return teste || null;
  }

  /**
   * Update test
   */
  static async atualizarTeste(id: string, dadosAtualizacao: Partial<InsertTeste>, usuarioLogado: Usuario): Promise<Teste | null> {
    this.validateUserPermissions(usuarioLogado, 'create');
    
    const [testeAtualizado] = await db.update(testes)
      .set({
        ...dadosAtualizacao,
        dataAtualizacao: new Date()
      })
      .where(eq(testes.id, id))
      .returning();
    
    return testeAtualizado || null;
  }

  /**
   * Deactivate test (soft delete)
   */
  static async desativarTeste(id: string, usuarioLogado: Usuario): Promise<boolean> {
    this.validateUserPermissions(usuarioLogado, 'create');
    
    const [testeDesativado] = await db.update(testes)
      .set({ ativo: false, dataAtualizacao: new Date() })
      .where(eq(testes.id, id))
      .returning();
    
    return !!testeDesativado;
  }

  /**
   * Assign test to candidate for specific job
   */
  static async atribuirTeste(
    testeId: string,
    candidatoId: string,
    vagaId: string,
    usuarioLogado: Usuario
  ): Promise<TesteResultado> {
    this.validateUserPermissions(usuarioLogado, 'assign');
    
    // Validate entities exist and are active
    await this.validateCandidatoExiste(candidatoId);
    await this.validateVagaAtiva(vagaId);
    await this.validateTesteNaoAtribuido(testeId, candidatoId, vagaId);
    
    // Check if test exists
    const teste = await this.obterTeste(testeId, usuarioLogado);
    if (!teste) {
      throw new TesteServiceError("Teste não encontrado", "TEST_NOT_FOUND");
    }
    
    const [novoResultado] = await db.insert(testesResultados)
      .values({
        testeId,
        candidatoId,
        vagaId,
        status: 'pendente',
        dataEnvio: new Date()
      })
      .returning();
    
    return novoResultado;
  }

  /**
   * Submit test responses (candidate answers)
   */
  static async responderTeste(
    resultadoId: string,
    respostas: number[],
    usuarioLogado?: Usuario
  ): Promise<TesteResultado> {
    // Find test result
    const resultado = await db.query.testesResultados.findFirst({
      where: eq(testesResultados.id, resultadoId),
      with: {
        teste: true
      }
    });
    
    if (!resultado) {
      throw new TesteServiceError("Resultado de teste não encontrado", "TEST_RESULT_NOT_FOUND");
    }
    
    if (resultado.status !== 'pendente') {
      throw new TesteServiceError("Este teste já foi respondido", "TEST_ALREADY_ANSWERED");
    }
    
    // Calculate result based on test type
    let resultadoTexto = '';
    let pontuacao: number | null = null;
    
    if (resultado.teste.tipo === 'DISC') {
      const perfilDISC = this.calcularPerfilDISC(respostas, resultado.teste.questoes as any[]);
      resultadoTexto = `Perfil ${perfilDISC.perfil} - ${perfilDISC.nome}: ${perfilDISC.descricao}`;
    } else if (resultado.teste.tipo === 'tecnico') {
      pontuacao = this.calcularPontuacaoTecnica(respostas, resultado.teste.questoes as any[]);
      resultadoTexto = `Pontuação: ${pontuacao.toFixed(1)}%`;
    }
    
    // Update test result
    const [resultadoAtualizado] = await db.update(testesResultados)
      .set({
        respostas,
        resultado: resultadoTexto,
        pontuacao: pontuacao?.toString(),
        status: 'respondido',
        dataResposta: new Date()
      })
      .where(eq(testesResultados.id, resultadoId))
      .returning();
    
    return resultadoAtualizado;
  }

  /**
   * Get candidate test history across all jobs
   */
  static async obterHistoricoTestes(candidatoId: string, usuarioLogado: Usuario): Promise<any[]> {
    this.validateUserPermissions(usuarioLogado, 'view');
    
    return await db.query.testesResultados.findMany({
      where: eq(testesResultados.candidatoId, candidatoId),
      with: {
        teste: true,
        vaga: true
      },
      orderBy: (testesResultados, { desc }) => [desc(testesResultados.dataEnvio)]
    });
  }

  /**
   * Get test results for specific job
   */
  static async obterResultadosPorVaga(vagaId: string, usuarioLogado: Usuario): Promise<any[]> {
    this.validateUserPermissions(usuarioLogado, 'view');
    
    return await db.query.testesResultados.findMany({
      where: eq(testesResultados.vagaId, vagaId),
      with: {
        teste: true,
        candidato: true
      },
      orderBy: (testesResultados, { desc }) => [desc(testesResultados.dataEnvio)]
    });
  }

  /**
   * Get tests assigned to candidate
   */
  static async obterTestesCandidato(candidatoId: string): Promise<any[]> {
    return await db.query.testesResultados.findMany({
      where: and(
        eq(testesResultados.candidatoId, candidatoId),
        eq(testesResultados.status, 'pendente')
      ),
      with: {
        teste: true,
        vaga: true
      },
      orderBy: (testesResultados, { desc }) => [desc(testesResultados.dataEnvio)]
    });
  }
}