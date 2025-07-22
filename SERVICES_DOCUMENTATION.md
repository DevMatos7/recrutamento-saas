# GentePRO Services Documentation

## Overview

This document provides comprehensive documentation for all backend services in the GentePRO application, including business logic, data access patterns, and integration examples.

## Table of Contents

1. [Authentication Services](#authentication-services)
2. [Core Business Services](#core-business-services)
3. [Communication Services](#communication-services)
4. [Assessment Services](#assessment-services)
5. [AI & Matching Services](#ai--matching-services)
6. [Data Storage Service](#data-storage-service)
7. [Middleware Services](#middleware-services)
8. [Utility Services](#utility-services)

## Authentication Services

### Auth Service
**Location:** `server/auth.ts`

Provides session-based authentication with Passport.js integration.

```typescript
import { setupAuth } from './auth';

// Setup in Express app
setupAuth(app);
```

**Features:**
- Passport.js local strategy
- Session management with PostgreSQL store
- Password hashing with scrypt
- Role-based access control
- Rate limiting for authentication

**Endpoints Configured:**
- `POST /api/register`: User registration
- `POST /api/login`: User authentication
- `POST /api/logout`: Session termination
- `GET /api/user`: Current user info

**Security Features:**
```typescript
// Password hashing
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Password verification
async function verifyPassword(password: string, hash: string) {
  const [hashedPassword, salt] = hash.split(".");
  const hashedInput = (await scryptAsync(password, salt, 64)) as Buffer;
  return hashedPassword === hashedInput.toString("hex");
}
```

### Middleware Services
**Location:** `server/middleware/`

#### Authentication Middleware
```typescript
// Require authentication
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

// Require specific role
function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated() || !roles.includes(req.user.perfil)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
}
```

#### Rate Limiting Middleware
**Location:** `server/middleware/rate-limit.middleware.ts`

```typescript
import rateLimit from 'express-rate-limit';

// General API rate limiting
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

// Authentication rate limiting
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Limit each IP to 5 requests per windowMs
  skipSuccessfulRequests: true
});

// Candidate portal rate limiting
export const candidatePortalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10 // Limit each IP to 10 requests per minute
});
```

## Core Business Services

### Candidate Portal Service
**Location:** `server/services/candidate-portal-service.ts`

Manages public-facing candidate operations and registration.

```typescript
import { CandidatePortalService } from './services/candidate-portal-service';

const candidatePortalService = new CandidatePortalService();
```

**Key Methods:**

#### Register Candidate
```typescript
async registerCandidate(data: {
  nome: string;
  email: string;
  telefone: string;
  password: string;
  empresaId: string;
}) {
  // Check for existing candidate
  const existingCandidate = await db
    .select()
    .from(candidatos)
    .where(eq(candidatos.email, data.email))
    .limit(1);

  if (existingCandidate.length > 0) {
    throw new Error('Email já cadastrado');
  }

  // Hash password and create candidate
  const hashedPassword = await bcrypt.hash(data.password, 10);
  
  return await db.insert(candidatos).values({
    ...data,
    password: hashedPassword,
    status: 'ativo',
    origem: 'portal_candidato'
  }).returning();
}
```

#### Login Candidate
```typescript
async loginCandidate(email: string, password: string) {
  const candidate = await db
    .select()
    .from(candidatos)
    .where(eq(candidatos.email, email))
    .limit(1);

  if (!candidate.length) {
    throw new Error('Credenciais inválidas');
  }

  const validPassword = await bcrypt.compare(password, candidate[0].password);
  if (!validPassword) {
    throw new Error('Credenciais inválidas');
  }

  if (candidate[0].status !== 'ativo') {
    throw new Error('Conta inativa');
  }

  return candidate[0];
}
```

#### Get Open Jobs
```typescript
async getOpenJobs(empresaId: string) {
  return await db
    .select({
      id: vagas.id,
      titulo: vagas.titulo,
      descricao: vagas.descricao,
      local: vagas.local,
      salario: vagas.salario,
      tipoContratacao: vagas.tipoContratacao,
      dataAbertura: vagas.dataAbertura
    })
    .from(vagas)
    .where(and(
      eq(vagas.empresaId, empresaId),
      eq(vagas.status, 'aberta')
    ))
    .orderBy(desc(vagas.dataAbertura));
}
```

#### Apply to Job
```typescript
async applyToJob(candidatoId: string, vagaId: string) {
  // Check if already applied
  const existingApplication = await db
    .select()
    .from(vagaCandidatos)
    .where(and(
      eq(vagaCandidatos.candidatoId, candidatoId),
      eq(vagaCandidatos.vagaId, vagaId)
    ))
    .limit(1);

  if (existingApplication.length > 0) {
    throw new Error('Você já se candidatou a esta vaga');
  }

  // Create application
  return await db.insert(vagaCandidatos).values({
    candidatoId,
    vagaId,
    etapa: 'recebido'
  }).returning();
}
```

### Pipeline Service
**Location:** `server/services/pipeline-service.ts`

Manages candidate movement through recruitment pipeline stages.

```typescript
import { PipelineService } from './services/pipeline-service';
```

**Key Methods:**

#### Move Candidate in Pipeline
```typescript
static async moverCandidatoPipeline(
  vagaId: string,
  candidatoId: string,
  novaEtapa: string,
  usuario: Usuario,
  nota?: number,
  comentarios?: string
) {
  // Validate permissions
  if (!['admin', 'recrutador'].includes(usuario.perfil)) {
    throw new PipelineServiceError('Acesso negado', 'PERMISSION_DENIED');
  }

  // Validate stage
  const etapasValidas = ['recebido', 'em_triagem', 'entrevista_agendada', 'avaliacao', 'aprovado', 'reprovado'];
  if (!etapasValidas.includes(novaEtapa)) {
    throw new PipelineServiceError('Etapa inválida', 'INVALID_STAGE');
  }

  // Get current application
  const vagaCandidato = await db.query.vagaCandidatos.findFirst({
    where: and(
      eq(vagaCandidatos.vagaId, vagaId),
      eq(vagaCandidatos.candidatoId, candidatoId)
    )
  });

  if (!vagaCandidato) {
    throw new PipelineServiceError('Candidato não inscrito nesta vaga', 'CANDIDATE_NOT_ENROLLED');
  }

  // Update stage
  const updated = await db
    .update(vagaCandidatos)
    .set({
      etapa: novaEtapa,
      nota,
      comentarios,
      dataMovimentacao: new Date(),
      responsavelId: usuario.id
    })
    .where(eq(vagaCandidatos.id, vagaCandidato.id))
    .returning();

  // Create audit trail
  await db.insert(pipelineAuditoria).values({
    vagaId,
    candidatoId,
    usuarioId: usuario.id,
    acao: 'mover_candidato',
    etapaAnterior: vagaCandidato.etapa,
    etapaNova: novaEtapa,
    nota: nota?.toString(),
    comentarios,
    dataMovimentacao: new Date()
  });

  return { vagaCandidato: updated[0] };
}
```

#### Get Pipeline Statistics
```typescript
static async obterEstatisticasPipeline(vagaId: string) {
  const estatisticas = await db
    .select({
      etapa: vagaCandidatos.etapa,
      total: count()
    })
    .from(vagaCandidatos)
    .where(eq(vagaCandidatos.vagaId, vagaId))
    .groupBy(vagaCandidatos.etapa);

  const totalCandidatos = estatisticas.reduce((sum, stat) => sum + stat.total, 0);

  return {
    totalCandidatos,
    porEtapa: estatisticas,
    taxaConversao: this.calcularTaxaConversao(estatisticas)
  };
}
```

### Solicitation Service
**Location:** `server/services/solicitacao-vaga-service.ts`

Manages job requisition workflow and approvals.

```typescript
import { SolicitacaoVagaService } from './services/solicitacao-vaga-service';
```

**Features:**
- Job requisition creation
- Approval workflow management
- Manager notifications
- Integration with ideal workforce planning

## Assessment Services

### Test Service
**Location:** `server/services/teste-service.ts`

Manages technical tests and assessments.

```typescript
import { TesteService } from './services/teste-service';
```

**Key Methods:**

#### Create Test
```typescript
static async criarTeste(testeData: InsertTeste, usuario: Usuario) {
  if (usuario.perfil !== 'admin') {
    throw new Error('Apenas administradores podem criar testes');
  }

  return await db.insert(testes).values({
    ...testeData,
    ativo: true
  }).returning();
}
```

#### Assign Test to Candidate
```typescript
static async atribuirTeste(
  testeId: string,
  candidatoId: string,
  vagaId: string,
  usuario: Usuario
) {
  if (!['admin', 'recrutador'].includes(usuario.perfil)) {
    throw new Error('Sem permissão para atribuir testes');
  }

  // Check if already assigned
  const existingResult = await db.query.testesResultados.findFirst({
    where: and(
      eq(testesResultados.testeId, testeId),
      eq(testesResultados.candidatoId, candidatoId),
      eq(testesResultados.vagaId, vagaId)
    )
  });

  if (existingResult) {
    throw new Error('Teste já foi atribuído a este candidato para esta vaga');
  }

  return await db.insert(testesResultados).values({
    testeId,
    candidatoId,
    vagaId,
    status: 'pendente'
  }).returning();
}
```

#### Submit Test Response
```typescript
static async responderTeste(resultadoId: string, respostas: number[]) {
  const resultado = await db.query.testesResultados.findFirst({
    where: eq(testesResultados.id, resultadoId),
    with: { teste: true }
  });

  if (!resultado) {
    throw new Error('Resultado de teste não encontrado');
  }

  if (resultado.status === 'respondido') {
    throw new Error('Teste já foi respondido');
  }

  // Calculate score for technical tests
  let pontuacao = null;
  if (resultado.teste.tipo === 'tecnico') {
    const questoes = resultado.teste.questoes as any[];
    let acertos = 0;
    
    questoes.forEach((questao, index) => {
      if (questao.respostaCorreta === respostas[index]) {
        acertos++;
      }
    });
    
    pontuacao = (acertos / questoes.length) * 10;
  }

  return await db
    .update(testesResultados)
    .set({
      respostas,
      pontuacao,
      status: 'respondido',
      dataResposta: new Date()
    })
    .where(eq(testesResultados.id, resultadoId))
    .returning();
}
```

### DISC Assessment Service
**Location:** `server/services/avaliacao-service.ts`

Manages DISC personality assessments.

```typescript
import { AvaliacaoService } from './services/avaliacao-service';
```

**Key Methods:**

#### Start DISC Assessment
```typescript
static async iniciarAvaliacao(candidatoId: string) {
  // Check for existing incomplete assessment
  const existingAssessment = await db.query.avaliacoes.findFirst({
    where: and(
      eq(avaliacoes.candidatoId, candidatoId),
      eq(avaliacoes.status, 'em_andamento')
    )
  });

  if (existingAssessment) {
    return existingAssessment;
  }

  return await db.insert(avaliacoes).values({
    candidatoId,
    tipo: 'DISC',
    status: 'em_andamento'
  }).returning();
}
```

#### Save Block Responses
```typescript
static async salvarRespostasBloco(
  avaliacaoId: number,
  bloco: string,
  respostas: number[]
) {
  // Validate responses
  if (!Array.isArray(respostas) || respostas.length !== 4) {
    throw new Error('Respostas devem ser um array com 4 elementos');
  }

  // Check if block already answered
  const existingResponse = await db.query.respostasDisc.findFirst({
    where: and(
      eq(respostasDisc.avaliacaoId, avaliacaoId),
      eq(respostasDisc.bloco, bloco)
    )
  });

  if (existingResponse) {
    // Update existing response
    return await db
      .update(respostasDisc)
      .set({ respostas })
      .where(eq(respostasDisc.id, existingResponse.id))
      .returning();
  } else {
    // Create new response
    return await db.insert(respostasDisc).values({
      avaliacaoId,
      bloco,
      respostas
    }).returning();
  }
}
```

#### Finalize Assessment
```typescript
static async finalizarAvaliacao(avaliacaoId: number) {
  // Get all responses
  const responses = await db.query.respostasDisc.findMany({
    where: eq(respostasDisc.avaliacaoId, avaliacaoId)
  });

  if (responses.length < 6) { // Assuming 6 blocks
    throw new Error('Avaliação incompleta. Complete todos os blocos antes de finalizar.');
  }

  // Calculate DISC scores
  const scores = this.calcularScoresDISC(responses);
  const perfil = this.determinarPerfilDISC(scores);

  // Update assessment
  return await db
    .update(avaliacoes)
    .set({
      resultadoJson: { scores, perfil },
      status: 'concluida',
      dataFim: new Date()
    })
    .where(eq(avaliacoes.id, avaliacaoId))
    .returning();
}
```

#### Calculate DISC Scores
```typescript
private static calcularScoresDISC(responses: any[]) {
  const scores = { D: 0, I: 0, S: 0, C: 0 };
  
  responses.forEach(response => {
    const respostas = response.respostas as number[];
    // Get questions for this block
    const questoes = await db.query.questoesDisc.findMany({
      where: eq(questoesDisc.bloco, response.bloco),
      orderBy: [questoesDisc.ordem]
    });
    
    questoes.forEach((questao, index) => {
      scores[questao.fator] += respostas[index];
    });
  });
  
  return scores;
}

private static determinarPerfilDISC(scores: any) {
  const maxScore = Math.max(scores.D, scores.I, scores.S, scores.C);
  const dominantFactor = Object.keys(scores).find(key => scores[key] === maxScore);
  
  const profiles = {
    D: 'Dominante - Orientado para resultados',
    I: 'Influente - Orientado para pessoas',
    S: 'Estável - Orientado para processos',
    C: 'Consciencioso - Orientado para qualidade'
  };
  
  return profiles[dominantFactor] || 'Perfil Misto';
}
```

### Interview Service
**Location:** `server/services/entrevista-service.ts`

Manages interview scheduling and execution.

```typescript
import { EntrevistaService } from './services/entrevista-service';
```

**Key Methods:**

#### Schedule Interview
```typescript
static async agendarEntrevista(entrevistaData: InsertEntrevista, usuario: Usuario) {
  this.validateUserPermissions(usuario, 'create');
  
  // Validate future date
  if (new Date(entrevistaData.dataHora) <= new Date()) {
    throw new EntrevistaServiceError('Data da entrevista deve ser futura', 'INVALID_DATE');
  }

  // Check for conflicts
  await this.validateNoConflicts(entrevistaData);

  // Generate confirmation tokens
  const candidateToken = randomBytes(32).toString('hex');
  const interviewerToken = randomBytes(32).toString('hex');

  const interview = await db.insert(entrevistas).values({
    ...entrevistaData,
    tokenConfirmacaoCandidato: candidateToken,
    tokenConfirmacaoEntrevistador: interviewerToken
  }).returning();

  // Send notifications
  await this.enviarNotificacoes(interview[0]);

  return interview[0];
}
```

#### Find Available Slots
```typescript
static async buscarSlotsLivres({
  entrevistadorId,
  candidatoId,
  dataInicio,
  dataFim
}: {
  entrevistadorId: string;
  candidatoId: string;
  dataInicio: Date;
  dataFim: Date;
}) {
  // Get existing interviews for interviewer and candidate
  const existingInterviews = await db
    .select()
    .from(entrevistas)
    .where(and(
      or(
        eq(entrevistas.entrevistadorId, entrevistadorId),
        eq(entrevistas.candidatoId, candidatoId)
      ),
      gte(entrevistas.dataHora, dataInicio),
      lte(entrevistas.dataHora, dataFim),
      ne(entrevistas.status, 'cancelada')
    ));

  // Generate available slots (business hours)
  const slots = [];
  const current = new Date(dataInicio);
  
  while (current <= dataFim) {
    if (this.isBusinessHour(current) && !this.hasConflict(current, existingInterviews)) {
      slots.push(new Date(current));
    }
    current.setMinutes(current.getMinutes() + 30); // 30-minute slots
  }
  
  return slots;
}
```

#### Record Feedback
```typescript
static async registrarFeedback(
  entrevistaId: string,
  avaliadorId: string,
  notas: number,
  comentarios: string
) {
  const interview = await this.obterEntrevista(entrevistaId);
  
  if (!interview) {
    throw new EntrevistaServiceError('Entrevista não encontrada', 'NOT_FOUND');
  }

  const feedback = {
    notas,
    comentarios,
    avaliadorId,
    data: new Date()
  };

  return await db
    .update(entrevistas)
    .set({
      avaliacaoPosterior: feedback,
      status: 'realizada'
    })
    .where(eq(entrevistas.id, entrevistaId))
    .returning();
}
```

## AI & Matching Services

### Matching Service
**Location:** `server/services/matching-service.ts`

Provides intelligent candidate-job matching algorithms.

```typescript
import { MatchingService } from './services/matching-service';
```

**Key Methods:**

#### Calculate Job Matches
```typescript
static async calcularMatchesParaVaga(
  vagaId: string,
  scoreMinimo: number = 70,
  criteria: MatchCriteria = this.DEFAULT_CRITERIA
): Promise<CandidatoMatch[]> {
  const vaga = await db.query.vagas.findFirst({
    where: eq(vagas.id, vagaId)
  });

  if (!vaga) {
    throw new Error("Vaga não encontrada");
  }

  const candidatosAtivos = await db
    .select()
    .from(candidatos)
    .where(eq(candidatos.status, "ativo"));

  const matches: CandidatoMatch[] = [];

  for (const candidato of candidatosAtivos) {
    const match = await this.calcularMatchCandidato(candidato, vaga, criteria);
    if (match.score >= scoreMinimo) {
      matches.push(match);
    }
  }

  return matches.sort((a, b) => b.score - a.score);
}
```

#### Calculate Individual Match
```typescript
private static async calcularMatchCandidato(
  candidato: any,
  vaga: any,
  criteria: MatchCriteria
): Promise<CandidatoMatch> {
  const scores = {
    competencias: await this.calcularScoreCompetencias(candidato, vaga),
    experiencia: this.calcularScoreExperiencia(candidato, vaga),
    formacao: this.calcularScoreFormacao(candidato, vaga),
    localizacao: this.calcularScoreLocalizacao(candidato, vaga),
    salario: this.calcularScoreSalario(candidato, vaga),
    disc: await this.calcularScoreDISC(candidato, vaga)
  };

  const finalScore = (
    scores.competencias * criteria.competenciasPeso +
    scores.experiencia * criteria.experienciaPeso +
    scores.formacao * criteria.formacaoPeso +
    scores.localizacao * criteria.localizacaoPeso +
    scores.salario * criteria.salarioPeso +
    scores.disc * criteria.discPeso
  ) * 100;

  return {
    candidato,
    score: Math.round(finalScore),
    detalhes: scores
  };
}
```

#### Calculate Skills Score
```typescript
private static async calcularScoreCompetencias(candidato: any, vaga: any): Promise<number> {
  // Get candidate skills
  const candidateSkills = await db
    .select({ skillId: candidatoSkills.skillId })
    .from(candidatoSkills)
    .where(eq(candidatoSkills.candidatoId, candidato.id));

  // Get job required skills
  const jobSkills = await db
    .select({ skillId: vagaSkills.skillId })
    .from(vagaSkills)
    .where(eq(vagaSkills.vagaId, vaga.id));

  if (jobSkills.length === 0) return 0.5; // No requirements = neutral score

  const candidateSkillIds = candidateSkills.map(s => s.skillId);
  const jobSkillIds = jobSkills.map(s => s.skillId);
  
  const matchingSkills = candidateSkillIds.filter(id => jobSkillIds.includes(id));
  const matchPercentage = matchingSkills.length / jobSkillIds.length;

  return Math.min(matchPercentage * 1.2, 1); // Boost but cap at 100%
}
```

### AI Recommendation Service
**Location:** `server/services/ai-recommendation-service.ts`

Provides OpenAI-powered candidate recommendations and insights.

```typescript
import { AIRecommendationService } from './services/ai-recommendation-service';
```

**Key Methods:**

#### Get AI Recommendations
```typescript
static async getAIRecommendations(vagaId: string, limit: number = 5) {
  const vaga = await db.query.vagas.findFirst({
    where: eq(vagas.id, vagaId),
    with: {
      empresa: true,
      departamento: true
    }
  });

  if (!vaga) {
    throw new Error('Vaga não encontrada');
  }

  // Get top candidates from matching service
  const matches = await MatchingService.calcularMatchesParaVaga(vagaId, 60);
  const topCandidates = matches.slice(0, limit * 2); // Get more for AI filtering

  // Prepare data for OpenAI
  const jobDescription = `
    Título: ${vaga.titulo}
    Descrição: ${vaga.descricao}
    Requisitos: ${vaga.requisitos}
    Local: ${vaga.local}
    Tipo: ${vaga.tipoContratacao}
  `;

  const recommendations = [];

  for (const match of topCandidates.slice(0, limit)) {
    const insights = await this.getCandidateInsights(match.candidato.id, vagaId);
    recommendations.push({
      candidato: match.candidato,
      score: match.score,
      aiInsights: insights,
      reasoning: insights.reasoning
    });
  }

  return recommendations;
}
```

#### Get Candidate Insights
```typescript
static async getCandidateInsights(candidatoId: string, vagaId: string) {
  const candidato = await db.query.candidatos.findFirst({
    where: eq(candidatos.id, candidatoId)
  });

  const vaga = await db.query.vagas.findFirst({
    where: eq(vagas.id, vagaId)
  });

  if (!candidato || !vaga) {
    throw new Error('Candidato ou vaga não encontrados');
  }

  const prompt = `
    Analise o candidato para a vaga abaixo:

    VAGA:
    Título: ${vaga.titulo}
    Descrição: ${vaga.descricao}
    Requisitos: ${vaga.requisitos}

    CANDIDATO:
    Nome: ${candidato.nome}
    Cargo: ${candidato.cargo || 'Não informado'}
    Experiência: ${JSON.stringify(candidato.experienciaProfissional || [])}
    Educação: ${JSON.stringify(candidato.educacao || [])}
    Habilidades: ${JSON.stringify(candidato.habilidades || [])}

    Forneça uma análise em JSON com:
    1. pontosFavoraveis: array de pontos positivos
    2. pontosDeAtencao: array de pontos que precisam atenção
    3. recomendacao: string com recomendação final
    4. score: número de 0-100 representando adequação
    5. proximosPassos: array de próximos passos sugeridos
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3
    });

    const response = completion.choices[0].message.content;
    return JSON.parse(response);
  } catch (error) {
    console.error('Erro na API da OpenAI:', error);
    return {
      pontosFavoraveis: ['Análise indisponível'],
      pontosDeAtencao: ['Erro na análise AI'],
      recomendacao: 'Revisar manualmente',
      score: 50,
      proximosPassos: ['Análise manual necessária']
    };
  }
}
```

## Communication Services

### Communication Service
**Location:** `server/services/communication-service.ts`

Manages email and WhatsApp communications with candidates.

```typescript
import { CommunicationService } from './services/communication-service';

const communicationService = new CommunicationService();
```

**Key Methods:**

#### Send Email
```typescript
async enviarEmail(
  destinatario: string,
  assunto: string,
  mensagem: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (process.env.SENDGRID_API_KEY) {
      // SendGrid implementation
      const msg = {
        to: destinatario,
        from: process.env.FROM_EMAIL || 'noreply@gentepro.com',
        subject: assunto,
        html: mensagem
      };

      await sgMail.send(msg);
      return { success: true };
    } else {
      // SMTP implementation
      const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      await transporter.sendMail({
        from: process.env.FROM_EMAIL,
        to: destinatario,
        subject: assunto,
        html: mensagem
      });

      return { success: true };
    }
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return { success: false, error: error.message };
  }
}
```

#### Send WhatsApp
```typescript
async enviarWhatsApp(
  numero: string,
  mensagem: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.WHATSAPP_API_URL || !process.env.WHATSAPP_API_TOKEN) {
      return { success: false, error: 'WhatsApp não configurado' };
    }

    const response = await fetch(process.env.WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        number: numero,
        message: mensagem
      })
    });

    if (response.ok) {
      return { success: true };
    } else {
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    console.error('Erro ao enviar WhatsApp:', error);
    return { success: false, error: error.message };
  }
}
```

#### Send and Store Communication
```typescript
async enviarEArmazenar({
  candidatoId,
  tipo,
  canal,
  assunto,
  mensagem,
  enviadoPor,
  dataAgendada,
  variables = {}
}: {
  candidatoId: string;
  tipo: 'email' | 'whatsapp';
  canal: string;
  assunto?: string;
  mensagem: string;
  enviadoPor?: string;
  dataAgendada?: Date;
  variables?: Record<string, string>;
}) {
  // Get candidate
  const candidato = await storage.getCandidato(candidatoId);
  if (!candidato) {
    return { success: false, error: 'Candidato não encontrado' };
  }

  // Process template variables
  let processedMessage = mensagem;
  let processedSubject = assunto;

  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    processedMessage = processedMessage.replace(new RegExp(placeholder, 'g'), value);
    if (processedSubject) {
      processedSubject = processedSubject.replace(new RegExp(placeholder, 'g'), value);
    }
  });

  // Store communication record
  const comunicacao = await storage.createComunicacao({
    candidatoId,
    tipo,
    canal,
    assunto: processedSubject,
    mensagem: processedMessage,
    statusEnvio: 'pendente',
    dataAgendada,
    enviadoPor
  });

  // Send immediately if not scheduled
  if (!dataAgendada || dataAgendada <= new Date()) {
    const result = await this.enviarComunicacao(
      tipo,
      candidato,
      processedMessage,
      processedSubject
    );

    await storage.updateComunicacao(comunicacao.id, {
      statusEnvio: result.success ? 'enviado' : 'erro',
      erro: result.error,
      dataEnvio: result.success ? new Date() : undefined
    });

    return { success: result.success, error: result.error, comunicacao };
  }

  return { success: true, comunicacao };
}
```

### Analytics Service
**Location:** `server/services/analytics-service.ts`

Provides comprehensive analytics and reporting functionality.

```typescript
import { AnalyticsService } from './services/analytics-service';
```

**Features:**
- Dashboard KPIs
- Department analytics
- Job performance metrics
- Test result analysis
- Conversion funnel tracking
- Time-to-hire calculations

## Data Storage Service

### Storage Service
**Location:** `server/storage.ts`

Centralized data access layer with optimized queries and caching.

```typescript
import { storage } from './storage';
```

**Key Features:**

#### Company Operations
```typescript
async getAllEmpresas() {
  return await db.select().from(empresas).orderBy(empresas.nome);
}

async createEmpresa(empresaData: InsertEmpresa) {
  const [empresa] = await db.insert(empresas).values(empresaData).returning();
  return empresa;
}

async updateEmpresa(id: string, data: Partial<InsertEmpresa>) {
  const [empresa] = await db
    .update(empresas)
    .set({ ...data, dataAtualizacao: new Date() })
    .where(eq(empresas.id, id))
    .returning();
  return empresa;
}
```

#### User Operations
```typescript
async getUserByUsername(email: string) {
  const [user] = await db
    .select()
    .from(usuarios)
    .where(and(eq(usuarios.email, email), eq(usuarios.ativo, 1)))
    .limit(1);
  return user;
}

async createUser(userData: InsertUsuario) {
  const [user] = await db.insert(usuarios).values(userData).returning();
  return user;
}
```

#### Job Operations
```typescript
async getVagasByEmpresa(empresaId: string) {
  return await db
    .select()
    .from(vagas)
    .where(eq(vagas.empresaId, empresaId))
    .orderBy(desc(vagas.dataCriacao));
}

async getPipelineByVaga(vagaId: string) {
  const candidatos = await db
    .select({
      id: vagaCandidatos.id,
      etapa: vagaCandidatos.etapa,
      nota: vagaCandidatos.nota,
      comentarios: vagaCandidatos.comentarios,
      dataMovimentacao: vagaCandidatos.dataMovimentacao,
      dataInscricao: vagaCandidatos.dataInscricao,
      candidato: {
        id: candidatos.id,
        nome: candidatos.nome,
        email: candidatos.email,
        telefone: candidatos.telefone,
        cargo: candidatos.cargo
      },
      responsavel: {
        id: usuarios.id,
        nome: usuarios.nome
      }
    })
    .from(vagaCandidatos)
    .leftJoin(candidatos, eq(vagaCandidatos.candidatoId, candidatos.id))
    .leftJoin(usuarios, eq(vagaCandidatos.responsavelId, usuarios.id))
    .where(eq(vagaCandidatos.vagaId, vagaId))
    .orderBy(desc(vagaCandidatos.dataMovimentacao));

  // Group by stage
  const pipeline = candidatos.reduce((acc, candidato) => {
    const etapa = candidato.etapa || 'recebido';
    if (!acc[etapa]) acc[etapa] = [];
    acc[etapa].push(candidato);
    return acc;
  }, {} as Record<string, any[]>);

  return pipeline;
}
```

#### Analytics Operations
```typescript
async getDashboardGeral(empresaId: string) {
  const [vagas, candidatos, entrevistas] = await Promise.all([
    db.select({ count: count() }).from(vagas).where(eq(vagas.empresaId, empresaId)),
    db.select({ count: count() }).from(candidatos).where(eq(candidatos.empresaId, empresaId)),
    db.select({ count: count() }).from(entrevistas)
      .leftJoin(vagas, eq(entrevistas.vagaId, vagas.id))
      .where(eq(vagas.empresaId, empresaId))
  ]);

  return {
    totalVagas: vagas[0].count,
    totalCandidatos: candidatos[0].count,
    totalEntrevistas: entrevistas[0].count,
    // Additional KPIs...
  };
}
```

## Utility Services

### File Processing
**Location:** Various utilities in `server/routes.ts`

Handles resume parsing and data extraction:

```typescript
// PDF processing
if (req.file.mimetype === 'application/pdf') {
  const pdfParse = (await import('pdf-parse')).default;
  const dataBuffer = fs.readFileSync(req.file.path);
  const data = await pdfParse(dataBuffer);
  text = data.text;
}

// DOCX processing
else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
  const data = await mammoth.extractRawText({ path: req.file.path });
  text = data.value;
}
```

**Data Extraction Patterns:**
```typescript
// Email extraction
const emailMatch = text.match(/E-?mail[:\s]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);

// Phone extraction
const telMatch = text.match(/(\+\d{1,3}[\s-]?)?(\(?\d{2,3}\)?[\s-]?)?\d{4,5}[\s-]?\d{4}/g);

// CPF extraction
const cpfMatch = text.match(/CPF[:\s.]*([0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2})/i);

// Experience extraction
const expMatch = text.match(/(EXPERI[ÊE]NCIA(S)?( PROFISSIONAIS)?)[\s\S]*?(?=\n[A-Z][A-ZÇÃÕÉÍÓÚÂÊÎÔÛÀÈÌÒÙÜ\s]{4,}|$)/i);
```

### Cron Jobs
**Location:** `server/index.ts`

Automated tasks for system maintenance:

```typescript
import cron from "node-cron";

// Send scheduled communications every minute
cron.schedule('* * * * *', async () => {
  try {
    const pendingCommunications = await storage.getPendingCommunications();
    const communicationService = new CommunicationService();
    
    for (const comm of pendingCommunications) {
      if (new Date(comm.dataAgendada) <= new Date()) {
        const candidato = await storage.getCandidato(comm.candidatoId);
        if (candidato) {
          const result = await communicationService.enviarComunicacao(
            comm.tipo,
            candidato,
            comm.mensagem,
            comm.assunto
          );
          
          await storage.updateComunicacao(comm.id, {
            statusEnvio: result.success ? 'enviado' : 'erro',
            erro: result.error,
            dataEnvio: result.success ? new Date() : undefined
          });
        }
      }
    }
  } catch (error) {
    console.error('Erro no envio de comunicações agendadas:', error);
  }
});

// Send interview reminders daily at 9 AM
cron.schedule('0 9 * * *', async () => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const upcomingInterviews = await EntrevistaService.getInterviewsByDate(tomorrow);
    const communicationService = new CommunicationService();
    
    for (const interview of upcomingInterviews) {
      // Send reminder to candidate
      await communicationService.enviarComunicacao(
        'email',
        interview.candidato,
        `Lembrete: Você tem uma entrevista agendada para amanhã às ${interview.dataHora}`,
        'Lembrete de Entrevista'
      );
      
      // Send reminder to interviewer
      await communicationService.enviarComunicacao(
        'email',
        interview.entrevistador,
        `Lembrete: Você tem uma entrevista agendada para amanhã às ${interview.dataHora} com ${interview.candidato.nome}`,
        'Lembrete de Entrevista'
      );
    }
  } catch (error) {
    console.error('Erro no envio de lembretes de entrevista:', error);
  }
});
```

## Error Handling

### Custom Error Classes
```typescript
// Pipeline Service Errors
export class PipelineServiceError extends Error {
  constructor(message: string, public code: string, public field?: string, public details?: any) {
    super(message);
    this.name = "PipelineServiceError";
  }
}

// Interview Service Errors
export class EntrevistaServiceError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "EntrevistaServiceError";
  }
}
```

### Error Response Patterns
```typescript
// Standardized error responses
if (error instanceof PipelineServiceError) {
  const statusMap: Record<string, number> = {
    'PERMISSION_DENIED': 403,
    'INVALID_STAGE': 400,
    'CANDIDATE_NOT_ENROLLED': 404,
    'JOB_NOT_FOUND': 404,
    'UPDATE_FAILED': 500
  };
  
  const status = statusMap[error.code] || 400;
  return res.status(status).json({
    message: error.message,
    code: error.code,
    field: error.field || undefined,
    details: error.details || undefined
  });
}
```

## Performance Optimization

### Database Query Optimization
```typescript
// Use select with specific fields
const candidatos = await db
  .select({
    id: candidatos.id,
    nome: candidatos.nome,
    email: candidatos.email
  })
  .from(candidatos)
  .where(eq(candidatos.status, 'ativo'));

// Use joins instead of separate queries
const vagasComDepartamentos = await db
  .select({
    vaga: vagas,
    departamento: departamentos,
    empresa: empresas
  })
  .from(vagas)
  .leftJoin(departamentos, eq(vagas.departamentoId, departamentos.id))
  .leftJoin(empresas, eq(vagas.empresaId, empresas.id));
```

### Caching Strategies
```typescript
// Cache frequently accessed data
const cache = new Map();

async function getCachedEmpresas() {
  const key = 'empresas:all';
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const empresas = await storage.getAllEmpresas();
  cache.set(key, empresas);
  
  // Expire after 5 minutes
  setTimeout(() => cache.delete(key), 5 * 60 * 1000);
  
  return empresas;
}
```

### Batch Operations
```typescript
// Process multiple operations in batches
async function processApplicationsInBatch(applications: any[], batchSize = 10) {
  for (let i = 0; i < applications.length; i += batchSize) {
    const batch = applications.slice(i, i + batchSize);
    await Promise.all(batch.map(app => processApplication(app)));
  }
}
```

## Testing

### Service Testing Patterns
```typescript
// Mock database for testing
const mockDb = {
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
};

// Test service methods
describe('CandidatePortalService', () => {
  it('should register candidate successfully', async () => {
    mockDb.insert.mockResolvedValue([{ id: 'test-id', email: 'test@example.com' }]);
    
    const result = await CandidatePortalService.registerCandidate({
      nome: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      empresaId: 'company-id'
    });
    
    expect(result.email).toBe('test@example.com');
    expect(mockDb.insert).toHaveBeenCalled();
  });
});
```

## Security Considerations

### Input Validation
```typescript
// Always validate inputs with Zod schemas
const createUserSchema = z.object({
  nome: z.string().min(1).max(255),
  email: z.string().email(),
  password: z.string().min(6),
  perfil: z.enum(['admin', 'recrutador', 'gestor', 'candidato'])
});

// Use in routes
app.post('/api/users', (req, res) => {
  const validatedData = createUserSchema.parse(req.body);
  // Process validated data
});
```

### SQL Injection Prevention
```typescript
// Always use parameterized queries with Drizzle
const users = await db
  .select()
  .from(usuarios)
  .where(eq(usuarios.email, userEmail)); // Safe parameterized query

// Never use string concatenation
// const query = `SELECT * FROM usuarios WHERE email = '${userEmail}'`; // DANGEROUS!
```

### Permission Checks
```typescript
// Always verify permissions before operations
function requirePermission(requiredRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !requiredRoles.includes(req.user.perfil)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
}
```
