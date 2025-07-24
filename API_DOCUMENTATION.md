# GentePRO API Documentation

## Overview

The GentePRO API is a comprehensive RESTful API for human resources management, featuring candidate tracking, job management, interview scheduling, DISC assessments, AI-powered matching, and multi-company support.

**Base URL:** `http://localhost:5000/api`

## Table of Contents

1. [Authentication](#authentication)
2. [Company Management](#company-management)
3. [Department Management](#department-management)
4. [User Management](#user-management)
5. [Job Management](#job-management)
6. [Candidate Management](#candidate-management)
7. [Pipeline Management](#pipeline-management)
8. [Pipeline Stages Configuration](#pipeline-stages-configuration)
9. [Test Management](#test-management)
10. [DISC Assessment](#disc-assessment)
11. [Interview Management](#interview-management)
12. [Matching & AI Recommendations](#matching--ai-recommendations)
13. [Communication Management](#communication-management)
14. [Skills Management](#skills-management)
15. [Analytics & Reports](#analytics--reports)
16. [Candidate Portal](#candidate-portal-public-apis)
17. [File Upload](#file-upload)
18. [Error Handling](#error-responses)
19. [Rate Limiting](#rate-limiting)

## Authentication

All protected endpoints require authentication via session-based authentication.

### Login
```http
POST /api/login
Content-Type: application/json

{
  "email": "admin@gentepro.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "admin@gentepro.com",
    "perfil": "admin",
    "empresaId": "uuid"
  }
}
```

### Logout
```http
POST /api/logout
```

**Response:**
```json
{
  "message": "Logout successful"
}
```

### Get Current User
```http
GET /api/user
Authorization: Required
```

**Response:**
```json
{
  "id": "uuid",
  "nome": "Admin User",
  "email": "admin@gentepro.com",
  "perfil": "admin",
  "empresaId": "uuid",
  "departamentoId": "uuid"
}
```

## Company Management

### Get All Companies
```http
GET /api/empresas
Authorization: Required (any authenticated user)
```

**Response:**
```json
[
  {
    "id": "uuid",
    "nome": "Empresa Exemplo",
    "cnpj": "12.345.678/0001-90",
    "email": "contato@empresa.com",
    "telefone": "(11) 98765-4321",
    "site": "https://www.empresa.com",
    "status": "ativa",
    "dataCreacao": "2024-01-01T00:00:00Z",
    "dataAtualizacao": "2024-01-01T00:00:00Z"
  }
]
```

### Get Company by ID
```http
GET /api/empresas/{id}
Authorization: Required
```

### Create Company
```http
POST /api/empresas
Authorization: Required (admin only)
Content-Type: application/json

{
  "nome": "Nova Empresa",
  "cnpj": "12.345.678/0001-90",
  "email": "contato@novaempresa.com",
  "telefone": "(11) 98765-4321",
  "site": "https://www.novaempresa.com"
}
```

**Response:** Returns the created company object.

### Update Company
```http
PUT /api/empresas/{id}
Authorization: Required (admin only)
Content-Type: application/json

{
  "nome": "Empresa Atualizada",
  "status": "inativa"
}
```

### Delete Company
```http
DELETE /api/empresas/{id}
Authorization: Required (admin only)
```

**Note:** Company cannot be deleted if it has associated users, departments, jobs, or candidates.

## Department Management

### Get Departments
```http
GET /api/departamentos?empresaId={empresaId}
Authorization: Required
```

**Query Parameters:**
- `empresaId`: Filter departments by company ID

### Get Department by ID
```http
GET /api/departamentos/{id}
Authorization: Required
```

### Create Department
```http
POST /api/departamentos
Authorization: Required (admin only)
Content-Type: application/json

{
  "nome": "Novo Departamento",
  "empresaId": "uuid"
}
```

### Update Department
```http
PUT /api/departamentos/{id}
Authorization: Required (admin only)
Content-Type: application/json

{
  "nome": "Departamento Atualizado"
}
```

### Delete Department
```http
DELETE /api/departamentos/{id}
Authorization: Required (admin only)
```

## User Management

### Get Users
```http
GET /api/usuarios?empresaId={empresaId}
Authorization: Required
```

**Access Control:**
- Admin: Can see all users or filter by company
- Other profiles: Can only see users from their own company

### Get User by ID
```http
GET /api/usuarios/{id}
Authorization: Required
```

**Access Control:**
- Admin: Can see any user
- Others: Can see themselves or users from same company

### Create User
```http
POST /api/register-user
Authorization: Required (admin only)
Content-Type: application/json

{
  "nome": "João Silva",
  "email": "joao@empresa.com",
  "password": "senha123",
  "perfil": "recrutador",
  "empresaId": "uuid",
  "departamentoId": "uuid"
}
```

**User Profiles:**
- `admin`: Full system access
- `recrutador`: Job and candidate management
- `gestor`: Department view access
- `candidato`: Candidate portal access

### Update User
```http
PUT /api/usuarios/{id}
Authorization: Required (admin or self)
Content-Type: application/json

{
  "nome": "João Silva Atualizado",
  "email": "joao.novo@empresa.com"
}
```

**Note:** Only admins can change `perfil` and `empresaId` fields.

### Change User Role
```http
PATCH /api/usuarios/{id}/perfil
Authorization: Required (admin only)
Content-Type: application/json

{
  "perfil": "gestor"
}
```

### Change User Status
```http
PATCH /api/usuarios/{id}/status
Authorization: Required (admin only)
Content-Type: application/json

{
  "ativo": 1
}
```

**Values:**
- `1`: Active user
- `0`: Inactive user

### Delete User (Soft Delete)
```http
DELETE /api/usuarios/{id}
Authorization: Required (admin only)
```

## Job Management

### Get Jobs
```http
GET /api/vagas?empresaId={empresaId}&departamentoId={departamentoId}&status={status}
Authorization: Required
```

**Query Parameters:**
- `empresaId`: Filter by company
- `departamentoId`: Filter by department
- `status`: Filter by status (aberta, em_triagem, entrevistas, encerrada, cancelada)

### Get Job by ID
```http
GET /api/vagas/{id}
Authorization: Required
```

### Create Job
```http
POST /api/vagas
Authorization: Required (admin, recrutador)
Content-Type: application/json

{
  "titulo": "Desenvolvedor Full Stack",
  "descricao": "Vaga para desenvolvedor full stack com experiência em React e Node.js",
  "requisitos": "3+ anos de experiência, React, Node.js, TypeScript",
  "local": "São Paulo, SP",
  "salario": "R$ 8.000 - R$ 12.000",
  "beneficios": "Vale alimentação, plano de saúde, home office",
  "tipoContratacao": "CLT",
  "empresaId": "uuid",
  "departamentoId": "uuid",
  "gestorId": "uuid",
  "skillsIds": ["uuid1", "uuid2"]
}
```

**Contract Types:**
- `CLT`: Regular employment
- `PJ`: Independent contractor
- `Estágio`: Internship
- `Temporário`: Temporary
- `Freelancer`: Freelance

### Update Job
```http
PUT /api/vagas/{id}
Authorization: Required (admin, recrutador)
Content-Type: application/json

{
  "titulo": "Desenvolvedor Full Stack Sênior",
  "salario": "R$ 10.000 - R$ 15.000",
  "skillsIds": ["uuid1", "uuid2", "uuid3"]
}
```

### Close Job
```http
PATCH /api/vagas/{id}/encerrar
Authorization: Required (admin, recrutador)
```

### Delete Job
```http
DELETE /api/vagas/{id}
Authorization: Required (admin only)
```

### Get Job Audit Trail
```http
GET /api/vagas/{id}/auditoria
Authorization: Required (admin only)
```

## Candidate Management

### Get Candidates
```http
GET /api/candidatos?empresaId={empresaId}&status={status}&statusEtico={statusEtico}&origem={origem}&perfilDisc={perfilDisc}
Authorization: Required
```

**Query Parameters:**
- `status`: Filter by status (ativo, inativo)
- `statusEtico`: Filter by ethical status (aprovado, reprovado, pendente)
- `origem`: Filter by origin (manual, portal_candidato, importado)
- `perfilDisc`: Filter by DISC profile

### Get Candidate by ID
```http
GET /api/candidatos/{id}
Authorization: Required
```

### Create Candidate
```http
POST /api/candidatos
Authorization: Required (admin, recrutador)
Content-Type: application/json

{
  "nome": "Maria Silva",
  "email": "maria@email.com",
  "telefone": "(11) 99999-9999",
  "password": "senha123",
  "cpf": "123.456.789-00",
  "dataNascimento": "1990-01-01",
  "endereco": "Rua das Flores, 123",
  "cidade": "São Paulo",
  "estado": "SP",
  "cep": "01234-567",
  "cargo": "Desenvolvedora",
  "resumoProfissional": "Desenvolvedora com 5 anos de experiência",
  "experienciaProfissional": [
    {
      "empresa": "Tech Corp",
      "cargo": "Desenvolvedora Frontend",
      "dataInicio": "2020-01-01",
      "dataFim": "2024-01-01",
      "descricao": "Desenvolvimento de interfaces React",
      "atual": false
    }
  ],
  "educacao": [
    {
      "instituicao": "Universidade São Paulo",
      "curso": "Ciência da Computação",
      "nivel": "superior",
      "dataInicio": "2015-01-01",
      "dataConclusao": "2019-12-01",
      "status": "concluido"
    }
  ],
  "habilidades": ["React", "Node.js", "TypeScript"],
  "idiomas": [
    {
      "idioma": "Inglês",
      "nivel": "avancado"
    }
  ],
  "certificacoes": [
    {
      "nome": "AWS Certified Developer",
      "instituicao": "Amazon",
      "dataEmissao": "2023-01-01"
    }
  ],
  "linkedin": "https://linkedin.com/in/maria-silva",
  "portfolio": "https://maria-silva.dev",
  "pretensoSalarial": "R$ 10.000",
  "disponibilidade": "30_dias",
  "modalidadeTrabalho": "hibrido",
  "empresaId": "uuid",
  "skillsIds": ["uuid1", "uuid2"]
}
```

**Education Levels:**
- `superior`: Higher education
- `tecnico`: Technical
- `pos_graduacao`: Post-graduation
- `mestrado`: Master's degree
- `doutorado`: PhD

**Availability Options:**
- `imediata`: Immediate
- `15_dias`: 15 days
- `30_dias`: 30 days
- `60_dias`: 60 days
- `a_combinar`: To be arranged

**Work Mode:**
- `presencial`: On-site
- `remoto`: Remote
- `hibrido`: Hybrid
- `indiferente`: No preference

### Update Candidate
```http
PUT /api/candidatos/{id}
Authorization: Required (admin, recrutador)
Content-Type: application/json

{
  "telefone": "(11) 88888-8888",
  "cargo": "Desenvolvedora Sênior",
  "skillsIds": ["uuid1", "uuid2", "uuid3"]
}
```

### Update Ethical Status
```http
PUT /api/candidatos/{id}/status-etico
Authorization: Required (admin only)
Content-Type: application/json

{
  "statusEtico": "aprovado",
  "motivoReprovacaoEtica": null
}
```

**Ethical Status Values:**
- `aprovado`: Approved
- `reprovado`: Rejected
- `pendente`: Pending

### Delete Candidate
```http
DELETE /api/candidatos/{id}
Authorization: Required (admin only)
```

### Get Candidate History
```http
GET /api/candidatos/{id}/historico
Authorization: Required
```

## Pipeline Management

### Get Job Pipeline
```http
GET /api/vagas/{vagaId}/pipeline
Authorization: Required
```

**Response:**
```json
{
  "recebido": [
    {
      "id": "uuid",
      "candidato": {
        "id": "uuid",
        "nome": "João Silva",
        "email": "joao@email.com",
        "telefone": "(11) 99999-9999"
      },
      "etapa": "recebido",
      "nota": null,
      "comentarios": null,
      "dataMovimentacao": "2024-01-01T00:00:00Z",
      "dataInscricao": "2024-01-01T00:00:00Z",
      "responsavel": {
        "id": "uuid",
        "nome": "Recrutador"
      }
    }
  ],
  "triagem": [],
  "entrevista": [],
  "aprovado": []
}
```

### Get Job Candidates
```http
GET /api/vagas/{vagaId}/candidatos
Authorization: Required
```

### Move Candidate in Pipeline
```http
PATCH /api/vagas/{vagaId}/candidatos/{candidatoId}/mover
Authorization: Required (admin, recrutador)
Content-Type: application/json

{
  "etapa": "entrevista",
  "nota": 8.5,
  "comentarios": "Candidato promissor para a posição"
}
```

**Pipeline Stages:**
- `recebido`: Received
- `em_triagem`: Under screening
- `entrevista_agendada`: Interview scheduled
- `avaliacao`: Under evaluation
- `aprovado`: Approved
- `reprovado`: Rejected

### Add Candidate to Job
```http
POST /api/vagas/{vagaId}/candidatos
Authorization: Required (admin, recrutador)
Content-Type: application/json

{
  "candidatoId": "uuid",
  "etapa": "recebido",
  "nota": 7.0,
  "comentarios": "Candidato interessante"
}
```

### Remove Candidate from Job
```http
DELETE /api/vagas/{vagaId}/candidatos/{candidatoId}
Authorization: Required (admin, recrutador)
```

### Get Pipeline Statistics
```http
GET /api/vagas/{vagaId}/estatisticas
Authorization: Required
```

### Export Pipeline
```http
GET /api/vagas/{vagaId}/pipeline/export
Authorization: Required
```

**Response:** Excel file download with pipeline data.

## Pipeline Stages Configuration

Pipeline stages can be customized per job with colors, required fields, and responsible users.

### Get Job Stages
```http
GET /api/vagas/{vagaId}/etapas
Authorization: Required
```

**Response:**
```json
[
  {
    "id": "uuid",
    "nome": "Recebido",
    "ordem": 1,
    "cor": "#6b7280",
    "camposObrigatorios": [],
    "responsaveis": [],
    "vagaId": "uuid"
  },
  {
    "id": "uuid",
    "nome": "Triagem",
    "ordem": 2,
    "cor": "#3b82f6",
    "camposObrigatorios": ["nota", "comentarios"],
    "responsaveis": ["uuid1", "uuid2"],
    "vagaId": "uuid"
  }
]
```

### Save Job Stages
```http
POST /api/vagas/{vagaId}/etapas
Authorization: Required (admin, recrutador)
Content-Type: application/json

{
  "etapas": [
    {
      "nome": "Recebido",
      "ordem": 1,
      "cor": "#6b7280",
      "camposObrigatorios": [],
      "responsaveis": []
    },
    {
      "nome": "Triagem",
      "ordem": 2,
      "cor": "#3b82f6",
      "camposObrigatorios": ["nota"],
      "responsaveis": ["uuid1", "uuid2"]
    },
    {
      "nome": "Entrevista",
      "ordem": 3,
      "cor": "#10b981",
      "camposObrigatorios": ["comentarios"],
      "responsaveis": ["uuid3"]
    }
  ]
}
```

**Required Fields Options:**
- `nota`: Score/rating required
- `comentarios`: Comments required

### Update Stage
```http
PUT /api/etapas/{id}
Authorization: Required (admin, recrutador)
Content-Type: application/json

{
  "nome": "Triagem Técnica",
  "cor": "#8b5cf6",
  "camposObrigatorios": ["nota", "comentarios"],
  "responsaveis": ["uuid1"]
}
```

### Delete Stage
```http
DELETE /api/etapas/{id}
Authorization: Required (admin, recrutador)
```

### Reorder Stages
```http
PATCH /api/vagas/{vagaId}/etapas/reorder
Authorization: Required (admin, recrutador)
Content-Type: application/json

{
  "etapas": [
    {"id": "uuid1", "ordem": 1},
    {"id": "uuid2", "ordem": 2},
    {"id": "uuid3", "ordem": 3}
  ]
}
```

## Test Management

### Get Tests
```http
GET /api/testes
Authorization: Required
```

### Create Test
```http
POST /api/testes
Authorization: Required (admin only)
Content-Type: application/json

{
  "tipo": "tecnico",
  "titulo": "Teste de JavaScript",
  "descricao": "Avaliação técnica de JavaScript",
  "questoes": [
    {
      "enunciado": "Qual é a saída do console.log?",
      "alternativas": ["undefined", "null", "0", "error"],
      "respostaCorreta": 0
    }
  ]
}
```

**Test Types:**
- `DISC`: Personality assessment
- `tecnico`: Technical assessment

### Assign Test to Candidate
```http
POST /api/testes/aplicar
Authorization: Required (admin, recrutador)
Content-Type: application/json

{
  "testeId": "uuid",
  "candidatoId": "uuid",
  "vagaId": "uuid"
}
```

### Submit Test Responses
```http
POST /api/testes/responder
Content-Type: application/json

{
  "resultadoId": "uuid",
  "respostas": [0, 2, 1, 3]
}
```

### Get Candidate Tests
```http
GET /api/candidatos/{id}/testes
```

### Get Test Results for Job
```http
GET /api/vagas/{id}/resultados-testes
Authorization: Required
```

## DISC Assessment

### Get DISC Model
```http
GET /api/avaliacoes/disc/modelo
```

**Response:**
```json
{
  "blocos": {
    "B1": {
      "titulo": "Bloco 1",
      "questoes": [
        {
          "ordem": 1,
          "frase": "Sou assertivo e direto",
          "fator": "D"
        }
      ]
    }
  }
}
```

### Start DISC Assessment
```http
POST /api/avaliacoes/disc/iniciar
Content-Type: application/json

{
  "candidatoId": "uuid"
}
```

### Submit Block Responses
```http
POST /api/avaliacoes/disc/{id}/responder
Content-Type: application/json

{
  "bloco": "B1",
  "respostas": [4, 3, 2, 1]
}
```

### Finalize Assessment
```http
POST /api/avaliacoes/disc/{id}/finalizar
```

### Get Assessment Results
```http
GET /api/avaliacoes/disc/{id}/resultado
```

### Get Candidate DISC History
```http
GET /api/avaliacoes/disc/candidato/{candidatoId}
```

### Get Assessment Progress
```http
GET /api/avaliacoes/disc/{id}/progresso
```

### Send DISC Invitation
```http
POST /api/avaliacoes/disc/enviar-convite
Authorization: Required
Content-Type: application/json

{
  "candidatoId": "uuid",
  "tipo": "email"
}
```

**Invitation Types:**
- `email`: Send via email
- `whatsapp`: Send via WhatsApp

### Update DISC Block (Admin)
```http
POST /api/avaliacoes/disc/admin/update-block
Authorization: Required (admin only)
Content-Type: application/json

{
  "bloco": "B1",
  "titulo": "Bloco Atualizado",
  "questions": [
    {
      "ordem": 1,
      "frase": "Nova pergunta",
      "fator": "D"
    }
  ]
}
```

### Get All DISC Results
```http
GET /api/avaliacoes/disc/resultados-todos
Authorization: Required
```

## Interview Management

### Get Interviews
```http
GET /api/entrevistas?vagaId={vagaId}&candidatoId={candidatoId}&status={status}&dataInicio={date}&dataFim={date}
Authorization: Required
```

**Query Parameters:**
- `vagaId`: Filter by job
- `candidatoId`: Filter by candidate
- `entrevistadorId`: Filter by interviewer
- `status`: Filter by status (agendada, realizada, cancelada, faltou)
- `dataInicio`: Start date filter
- `dataFim`: End date filter

### Get Interview by ID
```http
GET /api/entrevistas/{id}
Authorization: Required
```

### Schedule Interview
```http
POST /api/entrevistas
Authorization: Required (admin, recrutador)
Content-Type: application/json

{
  "vagaId": "uuid",
  "candidatoId": "uuid",
  "entrevistadorId": "uuid",
  "dataHora": "2024-01-15T14:00:00Z",
  "local": "Sala de reuniões 1",
  "plataforma": "zoom",
  "linkEntrevista": "https://zoom.us/j/123456789",
  "observacoes": "Entrevista técnica"
}
```

**Platforms:**
- `zoom`: Zoom meeting
- `meet`: Google Meet
- `jitsi`: Jitsi Meet
- `presencial`: In-person

### Update Interview
```http
PUT /api/entrevistas/{id}
Authorization: Required (admin, recrutador, gestor)
Content-Type: application/json

{
  "dataHora": "2024-01-15T15:00:00Z",
  "local": "Sala de reuniões 2"
}
```

### Update Interview Status
```http
PATCH /api/entrevistas/{id}/status
Authorization: Required (admin, recrutador, gestor)
Content-Type: application/json

{
  "status": "realizada",
  "observacoes": "Entrevista concluída com sucesso"
}
```

### Record Interview Feedback
```http
PATCH /api/entrevistas/{id}/feedback
Authorization: Required
Content-Type: application/json

{
  "notas": 8.5,
  "comentarios": "Candidato demonstrou boa aptidão técnica"
}
```

### Reschedule Interview
```http
PATCH /api/entrevistas/{id}/reagendar
Authorization: Required
Content-Type: application/json

{
  "novaDataHora": "2024-01-16T14:00:00Z"
}
```

### Confirm Attendance
```http
PATCH /api/entrevistas/{id}/confirmar
```

### Generate Video Link
```http
POST /api/entrevistas/{id}/link-video
Authorization: Required
Content-Type: application/json

{
  "plataforma": "zoom"
}
```

### Get Available Time Slots
```http
GET /api/entrevistas/slots-livres?entrevistadorId={id}&candidatoId={id}&dataInicio={date}&dataFim={date}
Authorization: Required
```

### Get Upcoming Interviews for User
```http
GET /api/entrevistas/usuario/{id}/proximas
Authorization: Required
```

### Get Interview Statistics
```http
GET /api/entrevistas/estatisticas
Authorization: Required
```

### Delete Interview
```http
DELETE /api/entrevistas/{id}
Authorization: Required (admin, recrutador)
```

### Confirm Attendance via Token
```http
GET /api/entrevistas/{id}/confirmar-presenca?token={token}&tipo={tipo}
```

**Parameters:**
- `token`: Confirmation token
- `tipo`: Type of confirmation (candidato, entrevistador)

## Matching & AI Recommendations

### Get Job Matches
```http
GET /api/vagas/{vagaId}/matches?scoreMinimo={score}&localizacao={location}&nivelExperiencia={level}
Authorization: Required
```

**Query Parameters:**
- `scoreMinimo`: Minimum match score (default: 70)
- `localizacao`: Location filter
- `nivelExperiencia`: Experience level filter

**Response:**
```json
[
  {
    "candidato": {
      "id": "uuid",
      "nome": "João Silva",
      "email": "joao@email.com",
      "cargo": "Desenvolvedor",
      "localizacao": "São Paulo, SP"
    },
    "score": 85,
    "detalhes": {
      "competencias": 90,
      "experiencia": 80,
      "formacao": 75,
      "localizacao": 100,
      "salario": 85,
      "disc": 70
    }
  }
]
```

### Get Matching Statistics
```http
GET /api/vagas/{vagaId}/matches/estatisticas
Authorization: Required
```

### Get AI Recommendations
```http
GET /api/vagas/{vagaId}/ai-recommendations?limit={number}
Authorization: Required (admin only)
```

**Query Parameters:**
- `limit`: Number of recommendations (default: 5)

**Response:**
```json
[
  {
    "candidato": {
      "id": "uuid",
      "nome": "Maria Silva",
      "email": "maria@email.com"
    },
    "score": 88,
    "aiInsights": {
      "pontosFavoraveis": [
        "Experiência relevante em React",
        "Formação em Ciência da Computação"
      ],
      "pontosDeAtencao": [
        "Pouca experiência com Node.js"
      ],
      "recomendacao": "Candidata promissora com potencial de crescimento",
      "score": 88,
      "proximosPassos": [
        "Agendar entrevista técnica",
        "Verificar disponibilidade"
      ]
    },
    "reasoning": "Perfil técnico alinhado com os requisitos da vaga"
  }
]
```

### Get Candidate AI Insights
```http
GET /api/candidatos/{candidatoId}/ai-insights/{vagaId}
Authorization: Required (admin only)
```

### Submit Match Feedback
```http
POST /api/match-feedback
Authorization: Required
Content-Type: application/json

{
  "vagaId": "uuid",
  "candidatoId": "uuid",
  "feedback": "bom",
  "comentario": "Candidato alinhado com a vaga"
}
```

**Feedback Values:**
- `bom`: Good match
- `ruim`: Poor match

### Get Match Feedback
```http
GET /api/match-feedback?vagaId={vagaId}&candidatoId={candidatoId}
Authorization: Required
```

### Save Matching Configuration
```http
POST /api/vagas/{id}/matching-config
Authorization: Required
Content-Type: application/json

{
  "competenciasPeso": 40,
  "experienciaPeso": 20,
  "formacaoPeso": 15,
  "localizacaoPeso": 10,
  "salarioPeso": 10,
  "discPeso": 5,
  "scoreMinimo": 70
}
```

## Communication Management

### Get Communications
```http
GET /api/comunicacoes?candidato={id}&status={status}&tipo={type}&canal={channel}
Authorization: Required
```

**Query Parameters:**
- `candidato`: Filter by candidate ID
- `status`: Filter by status (pendente, enviado, erro)
- `tipo`: Filter by type (email, whatsapp)
- `canal`: Filter by channel (inscricao, pipeline, entrevista, teste, outros)

### Get Communication by ID
```http
GET /api/comunicacoes/{id}
Authorization: Required
```

### Send Communication
```http
POST /api/comunicacoes/enviar
Authorization: Required
Content-Type: application/json

{
  "candidatoId": "uuid",
  "tipo": "email",
  "canal": "inscricao",
  "assunto": "Candidatura Recebida",
  "mensagem": "Olá {{nome}}, sua candidatura foi recebida com sucesso!",
  "dataAgendada": "2024-01-15T10:00:00Z",
  "variables": {
    "nome": "João Silva",
    "vaga": "Desenvolvedor Full Stack",
    "empresa": "Tech Corp"
  }
}
```

**Communication Types:**
- `email`: Email message
- `whatsapp`: WhatsApp message

**Communication Channels:**
- `inscricao`: Application confirmation
- `pipeline`: Pipeline movement
- `entrevista`: Interview scheduling
- `teste`: Test assignment
- `outros`: Other communications

**Template Variables:**
- `{{nome}}`: Candidate name
- `{{vaga}}`: Job title
- `{{empresa}}`: Company name
- `{{data_entrevista}}`: Interview date
- `{{link_teste}}`: Test link

### Get Communication Templates
```http
GET /api/comunicacoes/templates
Authorization: Required
```

**Response:**
```json
{
  "inscricao": {
    "whatsapp": "Olá {{nome}}! Sua candidatura para a vaga {{vaga}} foi recebida com sucesso.",
    "email": {
      "assunto": "Candidatura recebida - {{vaga}}",
      "mensagem": "Olá {{nome}},\n\nSua candidatura foi recebida com sucesso.\n\nAtenciosamente,\nEquipe {{empresa}}"
    }
  },
  "pipeline": {
    "whatsapp": "Olá {{nome}}! Sua candidatura para {{vaga}} avançou para a próxima etapa.",
    "email": {
      "assunto": "Atualização do processo seletivo - {{vaga}}",
      "mensagem": "Olá {{nome}},\n\nSua candidatura avançou para a próxima etapa.\n\nAtenciosamente,\nEquipe {{empresa}}"
    }
  }
}
```

### Resend Communication
```http
PATCH /api/comunicacoes/{id}/reenviar
Authorization: Required
```

### Delete Communication
```http
DELETE /api/comunicacoes/{id}
Authorization: Required
```

## Skills Management

### Get Skills
```http
GET /api/skills?search={term}&limit={number}
Authorization: Required
```

**Query Parameters:**
- `search`: Search term for skill names
- `limit`: Maximum number of results (default: 50)

**Response:**
```json
[
  {
    "id": "uuid",
    "nome": "React",
    "categoria": "Frontend",
    "codigoExterno": "ESCO:123456"
  },
  {
    "id": "uuid",
    "nome": "Node.js",
    "categoria": "Backend",
    "codigoExterno": "CBO:987654"
  }
]
```

## Analytics & Reports

### Get Dashboard Data
```http
GET /api/analytics/dashboard
Authorization: Required (admin, recrutador)
```

**Response:**
```json
{
  "totalVagas": 25,
  "totalCandidatos": 150,
  "totalEntrevistas": 75,
  "candidatosAtivos": 120,
  "vagasAbertas": 18,
  "entrevistasHoje": 5,
  "taxaConversao": 35.5,
  "tempoMedioContratacao": 21,
  "origemCandidatos": {
    "portal_candidato": 60,
    "manual": 40,
    "importado": 50
  },
  "candidatosPorMes": [
    { "mes": "Jan", "total": 20 },
    { "mes": "Fev", "total": 35 }
  ]
}
```

### Get Job Analytics
```http
GET /api/analytics/vagas/{vagaId}
Authorization: Required (admin, recrutador, gestor)
```

### Get Department Analytics
```http
GET /api/analytics/departamentos/{departamentoId}
Authorization: Required (admin, recrutador, gestor)
```

### Get Test Analytics for Job
```http
GET /api/analytics/testes/{vagaId}
Authorization: Required (admin, recrutador, gestor)
```

### Get Origin Analytics
```http
GET /api/analytics/origens
Authorization: Required (admin, recrutador)
```

### Get Time Analytics
```http
GET /api/analytics/tempos
Authorization: Required (admin, recrutador)
```

### Get General Statistics
```http
GET /api/stats
Authorization: Required
```

## Candidate Portal (Public APIs)

### Register Candidate
```http
POST /api/candidate-portal/register
Content-Type: application/json

{
  "nome": "Maria Silva",
  "email": "maria@email.com",
  "telefone": "(11) 99999-9999",
  "password": "senha123",
  "empresaId": "uuid"
}
```

### Candidate Login
```http
POST /api/candidate-portal/login
Content-Type: application/json

{
  "email": "maria@email.com",
  "password": "senha123"
}
```

### Candidate Logout
```http
POST /api/candidate-portal/logout
```

### Get Open Jobs
```http
GET /api/candidate-portal/vagas?empresaId={id}
```

### Get Job Details
```http
GET /api/candidate-portal/vagas/{id}
```

### Apply to Job
```http
POST /api/candidate-portal/apply
Authorization: Required (candidate session)
Content-Type: application/json

{
  "vagaId": "uuid"
}
```

### Get Candidate Dashboard
```http
GET /api/candidate-portal/dashboard
Authorization: Required (candidate session)
```

**Response:**
```json
{
  "candidaturas": [
    {
      "id": "uuid",
      "vaga": {
        "titulo": "Desenvolvedor Full Stack",
        "empresa": "Tech Corp"
      },
      "etapa": "em_triagem",
      "dataInscricao": "2024-01-01T00:00:00Z",
      "dataMovimentacao": "2024-01-05T00:00:00Z"
    }
  ],
  "totalCandidaturas": 3,
  "candidaturasAbertas": 2,
  "entrevistasAgendadas": 1
}
```

### Get Candidate Profile
```http
GET /api/candidate-portal/profile
Authorization: Required (candidate session)
```

### Get Pending Tests
```http
GET /api/candidate-portal/tests
Authorization: Required (candidate session)
```

### Submit Test Response
```http
POST /api/candidate-portal/tests/{id}/submit
Authorization: Required (candidate session)
Content-Type: application/json

{
  "respostas": [0, 2, 1, 3]
}
```

### Get Scheduled Interviews
```http
GET /api/candidate-portal/interviews
Authorization: Required (candidate session)
```

### Get Candidate Notifications
```http
GET /api/candidate-portal/notifications
Authorization: Required (candidate session)
```

## Application Approval Workflow

### Get Pending Applications
```http
GET /api/candidaturas-pendentes
Authorization: Required (admin, recrutador)
```

### Approve Application
```http
POST /api/candidaturas/{id}/aprovar
Authorization: Required (admin, recrutador)
Content-Type: application/json

{
  "comentarios": "Candidato aprovado para próxima etapa"
}
```

### Reject Application
```http
POST /api/candidaturas/{id}/rejeitar
Authorization: Required (admin, recrutador)
Content-Type: application/json

{
  "comentarios": "Candidato não atende aos requisitos mínimos"
}
```

## File Upload

### Upload Resume
```http
POST /api/curriculos/upload
Authorization: Required
Content-Type: multipart/form-data

file: [PDF, DOCX, or TXT file]
```

**Supported Formats:**
- PDF (text-extractable, not scanned)
- DOCX (Microsoft Word)
- TXT (plain text)

**Response:**
```json
{
  "nome": "João Silva",
  "email": "joao@email.com",
  "telefone": "(11) 99999-9999",
  "cpf": "123.456.789-00",
  "dataNascimento": "01/01/1990",
  "formacao": "Bacharel em Ciência da Computação - USP",
  "experiencia": "5 anos como desenvolvedor full stack em empresas de tecnologia",
  "linkedin": "https://linkedin.com/in/joao-silva"
}
```

**Error Response:**
```json
{
  "nenhumDadoExtraido": true
}
```

## Configuration Management

### Get Credentials Configuration
```http
GET /api/config/credentials
Authorization: Required (admin only)
```

### Configure SMTP
```http
POST /api/config/smtp
Authorization: Required (admin only)
Content-Type: application/json

{
  "host": "smtp.gmail.com",
  "port": 587,
  "secure": false,
  "user": "your-email@gmail.com",
  "pass": "your-password"
}
```

### Configure WhatsApp
```http
POST /api/config/whatsapp
Authorization: Required (admin only)
Content-Type: application/json

{
  "apiUrl": "https://api.whatsapp.com/send",
  "apiToken": "your-api-token"
}
```

### Test SMTP Configuration
```http
POST /api/config/test-smtp
Authorization: Required (admin only)
```

### Test WhatsApp Configuration
```http
POST /api/config/test-whatsapp
Authorization: Required (admin only)
```

## Error Responses

All API endpoints return standardized error responses:

```json
{
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": {},
  "field": "fieldName"
}
```

### Common Error Codes

#### Authentication Errors
- `AUTHENTICATION_REQUIRED`: User not logged in
- `INVALID_CREDENTIALS`: Wrong email/password
- `ACCOUNT_INACTIVE`: User account disabled

#### Authorization Errors
- `PERMISSION_DENIED`: Insufficient privileges
- `ACCESS_DENIED`: Role-based access denied
- `ADMIN_REQUIRED`: Admin access required

#### Validation Errors
- `VALIDATION_ERROR`: Input validation failed
- `INVALID_DATA`: Data format incorrect
- `MISSING_FIELD`: Required field missing
- `INVALID_EMAIL`: Email format invalid
- `INVALID_UUID`: UUID format invalid

#### Business Logic Errors
- `CANDIDATE_NOT_FOUND`: Candidate doesn't exist
- `JOB_NOT_FOUND`: Job doesn't exist
- `ALREADY_APPLIED`: Candidate already applied
- `INVALID_STAGE`: Pipeline stage invalid
- `TEST_ALREADY_TAKEN`: Test already completed

#### System Errors
- `INTERNAL_ERROR`: Server error
- `DATABASE_ERROR`: Database operation failed
- `EXTERNAL_API_ERROR`: Third-party service error

### Common HTTP Status Codes
- `200`: Success
- `201`: Created
- `204`: No Content (successful deletion)
- `400`: Bad Request (validation error)
- `401`: Unauthorized (not authenticated)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (duplicate resource)
- `422`: Unprocessable Entity (business logic error)
- `429`: Too Many Requests (rate limited)
- `500`: Internal Server Error

## Rate Limiting

The API implements rate limiting to prevent abuse:

### Rate Limit Types

#### General API Limits
```
Limit: 100 requests per 15 minutes per IP
Applies to: All /api/* endpoints
```

#### Authentication Limits
```
Limit: 5 requests per 15 minutes per IP
Applies to: /api/login, /api/register
Resets on: Successful authentication
```

#### Candidate Portal Limits
```
Limit: 10 requests per minute per IP
Applies to: /api/candidate-portal/*
```

### Rate Limit Headers

All responses include rate limiting headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
X-RateLimit-Used: 5
```

### Rate Limit Exceeded Response

```json
{
  "message": "Too many requests from this IP, please try again later",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 900
}
```

## Pagination

List endpoints support pagination via query parameters:

### Pagination Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sort`: Sort field
- `order`: Sort order (asc, desc)

### Example Request
```http
GET /api/candidatos?page=2&limit=50&sort=nome&order=asc
```

### Pagination Response
```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 50,
    "total": 245,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": true,
    "nextPage": 3,
    "prevPage": 1
  }
}
```

## WebSocket Events

The application supports real-time updates via WebSocket connections:

### Connection
```javascript
const ws = new WebSocket('ws://localhost:5000');
```

### Event Types

#### Pipeline Updates
```json
{
  "type": "pipeline:update",
  "data": {
    "vagaId": "uuid",
    "candidatoId": "uuid",
    "etapaAnterior": "triagem",
    "etapaNova": "entrevista",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

#### Interview Notifications
```json
{
  "type": "interview:scheduled",
  "data": {
    "entrevistaId": "uuid",
    "candidatoId": "uuid",
    "dataHora": "2024-01-15T14:00:00Z"
  }
}
```

#### Test Assignments
```json
{
  "type": "test:assigned",
  "data": {
    "testeId": "uuid",
    "candidatoId": "uuid",
    "prazoLimite": "2024-01-20T23:59:59Z"
  }
}
```

## SDK Examples

### JavaScript/TypeScript Client

```typescript
class GentePROClient {
  private baseURL: string;
  private sessionCookie: string;

  constructor(baseURL: string = 'http://localhost:5000') {
    this.baseURL = baseURL;
  }

  async login(email: string, password: string) {
    const response = await fetch(`${this.baseURL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });
    return response.json();
  }

  async getCandidatos(filters: any = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${this.baseURL}/api/candidatos?${params}`, {
      credentials: 'include'
    });
    return response.json();
  }

  async createVaga(vagaData: any) {
    const response = await fetch(`${this.baseURL}/api/vagas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vagaData),
      credentials: 'include'
    });
    return response.json();
  }

  async moveCandidateInPipeline(vagaId: string, candidatoId: string, etapa: string, nota?: number, comentarios?: string) {
    const response = await fetch(`${this.baseURL}/api/vagas/${vagaId}/candidatos/${candidatoId}/mover`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ etapa, nota, comentarios }),
      credentials: 'include'
    });
    return response.json();
  }
}

// Usage
const client = new GentePROClient();
await client.login('admin@gentepro.com', 'admin123');
const candidatos = await client.getCandidatos({ status: 'ativo' });
```

### Python Client

```python
import requests
from typing import Optional, Dict, Any

class GentePROClient:
    def __init__(self, base_url: str = "http://localhost:5000"):
        self.base_url = base_url
        self.session = requests.Session()

    def login(self, email: str, password: str) -> Dict[str, Any]:
        response = self.session.post(
            f"{self.base_url}/api/login",
            json={"email": email, "password": password}
        )
        return response.json()

    def get_candidatos(self, **filters) -> Dict[str, Any]:
        response = self.session.get(
            f"{self.base_url}/api/candidatos",
            params=filters
        )
        return response.json()

    def create_vaga(self, vaga_data: Dict[str, Any]) -> Dict[str, Any]:
        response = self.session.post(
            f"{self.base_url}/api/vagas",
            json=vaga_data
        )
        return response.json()

    def move_candidate(self, vaga_id: str, candidato_id: str, etapa: str, 
                      nota: Optional[float] = None, comentarios: Optional[str] = None) -> Dict[str, Any]:
        data = {"etapa": etapa}
        if nota is not None:
            data["nota"] = nota
        if comentarios:
            data["comentarios"] = comentarios
            
        response = self.session.patch(
            f"{self.base_url}/api/vagas/{vaga_id}/candidatos/{candidato_id}/mover",
            json=data
        )
        return response.json()

# Usage
client = GentePROClient()
client.login("admin@gentepro.com", "admin123")
candidatos = client.get_candidatos(status="ativo")
```

## Integration Examples

### Webhooks Integration

```typescript
// Express webhook handler
app.post('/webhook/gentepro', (req, res) => {
  const { type, data } = req.body;
  
  switch (type) {
    case 'candidate:applied':
      // Handle new application
      console.log(`New application from ${data.candidato.nome} for ${data.vaga.titulo}`);
      break;
      
    case 'pipeline:moved':
      // Handle pipeline movement
      console.log(`Candidate moved to ${data.etapaNova}`);
      break;
      
    case 'interview:scheduled':
      // Handle interview scheduling
      console.log(`Interview scheduled for ${data.dataHora}`);
      break;
  }
  
  res.status(200).json({ received: true });
});
```

### External ATS Integration

```typescript
// Sync candidates from external ATS
async function syncFromExternalATS() {
  const externalCandidates = await fetchFromExternalATS();
  
  for (const candidate of externalCandidates) {
    const candidateData = {
      nome: candidate.name,
      email: candidate.email,
      telefone: candidate.phone,
      empresaId: 'your-company-id',
      origem: 'importado'
    };
    
    await fetch('/api/candidatos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candidateData)
    });
  }
}
```

### HRIS Integration

```typescript
// Sync with HRIS for organizational data
async function syncOrganizationalData() {
  // Sync departments
  const departments = await fetchDepartmentsFromHRIS();
  for (const dept of departments) {
    await fetch('/api/departamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: dept.name,
        empresaId: dept.companyId
      })
    });
  }
  
  // Sync users
  const users = await fetchUsersFromHRIS();
  for (const user of users) {
    await fetch('/api/register-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: user.name,
        email: user.email,
        perfil: user.role,
        empresaId: user.companyId,
        departamentoId: user.departmentId
      })
    });
  }
}
```

This completes the comprehensive API documentation for the GentePRO system, covering all endpoints, authentication, error handling, rate limiting, and integration examples.
