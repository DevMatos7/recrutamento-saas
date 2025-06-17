import { db } from "../db";
import { 
  candidatos, 
  vagas, 
  vagaCandidatos, 
  entrevistas, 
  testesResultados, 
  comunicacoes,
  departamentos,
  empresas 
} from "../../shared/schema";
import { eq, and, desc, count, isNull } from "drizzle-orm";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";

export class CandidatePortalService {
  
  // Registrar novo candidato
  async registerCandidate(data: {
    nome: string;
    email: string;
    telefone: string;
    password: string;
    empresaId: string;
  }) {
    try {
      // Verificar se já existe candidato com esse email
      const existingCandidate = await db
        .select()
        .from(candidatos)
        .where(eq(candidatos.email, data.email))
        .limit(1);

      if (existingCandidate.length > 0) {
        throw new Error('Email já cadastrado');
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Criar candidato
      const newCandidate = await db
        .insert(candidatos)
        .values({
          nome: data.nome,
          email: data.email,
          telefone: data.telefone,
          password: hashedPassword,
          empresaId: data.empresaId,
          status: 'ativo',
          origem: 'portal'
        })
        .returning();

      return newCandidate[0];
    } catch (error) {
      console.error('Erro ao registrar candidato:', error);
      throw error;
    }
  }

  // Login do candidato
  async loginCandidate(email: string, password: string) {
    try {
      const candidate = await db
        .select()
        .from(candidatos)
        .where(eq(candidatos.email, email))
        .limit(1);

      if (!candidate.length) {
        throw new Error('Credenciais inválidas');
      }

      const isValidPassword = await bcrypt.compare(password, candidate[0].password);
      if (!isValidPassword) {
        throw new Error('Credenciais inválidas');
      }

      if (candidate[0].status !== 'ativo') {
        throw new Error('Conta inativa');
      }

      return candidate[0];
    } catch (error) {
      console.error('Erro no login do candidato:', error);
      throw error;
    }
  }

  // Listar vagas abertas para candidatura
  async getOpenJobs(empresaId?: string) {
    try {
      let query = db
        .select({
          id: vagas.id,
          titulo: vagas.titulo,
          descricao: vagas.descricao,
          requisitos: vagas.requisitos,
          local: vagas.local,
          salario: vagas.salario,
          beneficios: vagas.beneficios,
          tipoContratacao: vagas.tipoContratacao,
          dataAbertura: vagas.dataAbertura,
          empresa: empresas.nome,
          departamento: departamentos.nome
        })
        .from(vagas)
        .innerJoin(empresas, eq(vagas.empresaId, empresas.id))
        .innerJoin(departamentos, eq(vagas.departamentoId, departamentos.id))
        .where(eq(vagas.status, 'aberta'));

      if (empresaId) {
        query = query.where(eq(vagas.empresaId, empresaId));
      }

      const jobs = await query.orderBy(desc(vagas.dataAbertura));
      return jobs;
    } catch (error) {
      console.error('Erro ao buscar vagas abertas:', error);
      throw error;
    }
  }

  // Obter detalhes de uma vaga específica
  async getJobDetails(jobId: string) {
    try {
      const job = await db
        .select({
          id: vagas.id,
          titulo: vagas.titulo,
          descricao: vagas.descricao,
          requisitos: vagas.requisitos,
          local: vagas.local,
          salario: vagas.salario,
          beneficios: vagas.beneficios,
          tipoContratacao: vagas.tipoContratacao,
          dataAbertura: vagas.dataAbertura,
          empresa: empresas.nome,
          departamento: departamentos.nome,
          empresaId: vagas.empresaId
        })
        .from(vagas)
        .innerJoin(empresas, eq(vagas.empresaId, empresas.id))
        .innerJoin(departamentos, eq(vagas.departamentoId, departamentos.id))
        .where(and(eq(vagas.id, jobId), eq(vagas.status, 'aberta')))
        .limit(1);

      if (!job.length) {
        throw new Error('Vaga não encontrada ou não está aberta');
      }

      return job[0];
    } catch (error) {
      console.error('Erro ao buscar detalhes da vaga:', error);
      throw error;
    }
  }

  // Candidatar-se a uma vaga
  async applyToJob(candidateId: string, jobId: string) {
    try {
      // Verificar se a vaga está aberta
      const job = await db
        .select()
        .from(vagas)
        .where(and(eq(vagas.id, jobId), eq(vagas.status, 'aberta')))
        .limit(1);

      if (!job.length) {
        throw new Error('Vaga não encontrada ou não está aberta');
      }

      // Verificar se já se candidatou
      const existingApplication = await db
        .select()
        .from(vagaCandidatos)
        .where(and(
          eq(vagaCandidatos.candidatoId, candidateId),
          eq(vagaCandidatos.vagaId, jobId)
        ))
        .limit(1);

      if (existingApplication.length > 0) {
        throw new Error('Você já se candidatou a esta vaga');
      }

      // Criar candidatura
      const application = await db
        .insert(vagaCandidatos)
        .values({
          candidatoId,
          vagaId: jobId,
          etapa: 'recebido'
        })
        .returning();

      return application[0];
    } catch (error) {
      console.error('Erro ao se candidatar:', error);
      throw error;
    }
  }

  // Obter candidaturas do candidato
  async getCandidateApplications(candidateId: string) {
    try {
      const applications = await db
        .select({
          id: vagaCandidatos.id,
          etapa: vagaCandidatos.etapa,
          nota: vagaCandidatos.nota,
          comentarios: vagaCandidatos.comentarios,
          dataInscricao: vagaCandidatos.dataInscricao,
          dataMovimentacao: vagaCandidatos.dataMovimentacao,
          vaga: {
            id: vagas.id,
            titulo: vagas.titulo,
            local: vagas.local,
            empresa: empresas.nome,
            departamento: departamentos.nome
          }
        })
        .from(vagaCandidatos)
        .innerJoin(vagas, eq(vagaCandidatos.vagaId, vagas.id))
        .innerJoin(empresas, eq(vagas.empresaId, empresas.id))
        .innerJoin(departamentos, eq(vagas.departamentoId, departamentos.id))
        .where(eq(vagaCandidatos.candidatoId, candidateId))
        .orderBy(desc(vagaCandidatos.dataInscricao));

      return applications;
    } catch (error) {
      console.error('Erro ao buscar candidaturas:', error);
      throw error;
    }
  }

  // Obter testes pendentes do candidato
  async getPendingTests(candidateId: string) {
    try {
      const pendingTests = await db
        .select({
          id: testesResultados.id,
          testeId: testesResultados.testeId,
          vagaId: testesResultados.vagaId,
          status: testesResultados.status,
          dataEnvio: testesResultados.dataEnvio,
          vaga: {
            titulo: vagas.titulo,
            empresa: empresas.nome
          }
        })
        .from(testesResultados)
        .innerJoin(vagas, eq(testesResultados.vagaId, vagas.id))
        .innerJoin(empresas, eq(vagas.empresaId, empresas.id))
        .where(and(
          eq(testesResultados.candidatoId, candidateId),
          eq(testesResultados.status, 'pendente')
        ))
        .orderBy(desc(testesResultados.dataEnvio));

      return pendingTests;
    } catch (error) {
      console.error('Erro ao buscar testes pendentes:', error);
      throw error;
    }
  }

  // Responder teste
  async submitTestResponse(candidateId: string, testResultId: string, respostas: any) {
    try {
      // Verificar se o teste pertence ao candidato e está pendente
      const testResult = await db
        .select()
        .from(testesResultados)
        .where(and(
          eq(testesResultados.id, testResultId),
          eq(testesResultados.candidatoId, candidateId),
          eq(testesResultados.status, 'pendente')
        ))
        .limit(1);

      if (!testResult.length) {
        throw new Error('Teste não encontrado ou já respondido');
      }

      // Atualizar com as respostas
      const updatedTest = await db
        .update(testesResultados)
        .set({
          respostas,
          status: 'respondido',
          dataResposta: new Date()
        })
        .where(eq(testesResultados.id, testResultId))
        .returning();

      return updatedTest[0];
    } catch (error) {
      console.error('Erro ao enviar respostas do teste:', error);
      throw error;
    }
  }

  // Obter entrevistas agendadas do candidato
  async getScheduledInterviews(candidateId: string) {
    try {
      const interviews = await db
        .select({
          id: entrevistas.id,
          dataHora: entrevistas.dataHora,
          local: entrevistas.local,
          status: entrevistas.status,
          observacoes: entrevistas.observacoes,
          vaga: {
            titulo: vagas.titulo,
            empresa: empresas.nome
          }
        })
        .from(entrevistas)
        .innerJoin(vagas, eq(entrevistas.vagaId, vagas.id))
        .innerJoin(empresas, eq(vagas.empresaId, empresas.id))
        .where(eq(entrevistas.candidatoId, candidateId))
        .orderBy(desc(entrevistas.dataHora));

      return interviews;
    } catch (error) {
      console.error('Erro ao buscar entrevistas:', error);
      throw error;
    }
  }

  // Obter notificações/comunicações do candidato
  async getCandidateNotifications(candidateId: string) {
    try {
      const notifications = await db
        .select({
          id: comunicacoes.id,
          tipo: comunicacoes.tipo,
          canal: comunicacoes.canal,
          assunto: comunicacoes.assunto,
          mensagem: comunicacoes.mensagem,
          statusEnvio: comunicacoes.statusEnvio,
          dataEnvio: comunicacoes.dataEnvio,
          dataAgendada: comunicacoes.dataAgendada
        })
        .from(comunicacoes)
        .where(eq(comunicacoes.candidatoId, candidateId))
        .orderBy(desc(comunicacoes.dataEnvio));

      return notifications;
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      throw error;
    }
  }

  // Obter dashboard do candidato
  async getCandidateDashboard(candidateId: string) {
    try {
      // Contar candidaturas por status
      const applicationStats = await db
        .select({
          etapa: vagaCandidatos.etapa,
          total: count()
        })
        .from(vagaCandidatos)
        .where(eq(vagaCandidatos.candidatoId, candidateId))
        .groupBy(vagaCandidatos.etapa);

      // Testes pendentes
      const pendingTestsCount = await db
        .select({ total: count() })
        .from(testesResultados)
        .where(and(
          eq(testesResultados.candidatoId, candidateId),
          eq(testesResultados.status, 'pendente')
        ));

      // Entrevistas agendadas
      const upcomingInterviews = await db
        .select({ total: count() })
        .from(entrevistas)
        .where(and(
          eq(entrevistas.candidatoId, candidateId),
          eq(entrevistas.status, 'agendada')
        ));

      // Mensagens não lidas (últimas 30 dias)
      const recentNotifications = await db
        .select({ total: count() })
        .from(comunicacoes)
        .where(and(
          eq(comunicacoes.candidatoId, candidateId),
          eq(comunicacoes.statusEnvio, 'enviado')
        ));

      return {
        candidaturas: applicationStats,
        testesPendentes: pendingTestsCount[0]?.total || 0,
        entrevistasAgendadas: upcomingInterviews[0]?.total || 0,
        notificacoes: recentNotifications[0]?.total || 0
      };
    } catch (error) {
      console.error('Erro ao buscar dashboard:', error);
      throw error;
    }
  }
}

export const candidatePortalService = new CandidatePortalService();