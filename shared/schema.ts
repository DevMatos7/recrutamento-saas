import { pgTable, text, serial, uuid, timestamp, varchar, decimal, boolean, uniqueIndex, json, date, integer, jsonb, smallint, char } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const empresas = pgTable("empresas", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: varchar("nome", { length: 255 }).notNull(),
  cnpj: varchar("cnpj", { length: 18 }).unique(),
  email: varchar("email", { length: 255 }),
  telefone: varchar("telefone", { length: 50 }),
  site: varchar("site", { length: 500 }),
  status: varchar("status", { length: 20 }).notNull().default("ativa"), // ativa, inativa
  dataCreacao: timestamp("data_criacao").defaultNow().notNull(),
  dataAtualizacao: timestamp("data_atualizacao").defaultNow().notNull(),
});

export const departamentos = pgTable("departamentos", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: varchar("nome", { length: 255 }).notNull(),
  empresaId: uuid("empresa_id").notNull().references(() => empresas.id),
  dataCriacao: timestamp("data_criacao").defaultNow().notNull(),
  dataAtualizacao: timestamp("data_atualizacao").defaultNow().notNull(),
});

export const usuarios = pgTable("usuarios", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  password: text("password").notNull(),
  perfil: varchar("perfil", { length: 50 }).notNull(), // admin, recrutador, gestor, candidato
  empresaId: uuid("empresa_id").notNull().references(() => empresas.id),
  departamentoId: uuid("departamento_id").references(() => departamentos.id),
  ativo: integer("ativo").notNull().default(1),
  dataCriacao: timestamp("data_criacao").defaultNow().notNull(),
  dataAtualizacao: timestamp("data_atualizacao").defaultNow(),
});

export const vagas = pgTable("vagas", {
  id: uuid("id").primaryKey().defaultRandom(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  descricao: text("descricao").notNull(),
  requisitos: text("requisitos"),
  local: varchar("local", { length: 255 }).notNull(),
  salario: varchar("salario", { length: 100 }), // Optional salary range
  beneficios: text("beneficios"),
  tipoContratacao: varchar("tipo_contratacao", { length: 50 }).notNull(), // CLT, PJ, Estágio, Temporário, Freelancer
  status: varchar("status", { length: 50 }).notNull().default("aberta"), // aberta, em_triagem, entrevistas, encerrada, cancelada, preenchida
  visivel: boolean("visivel").notNull().default(true),
  quantidade: integer("quantidade").notNull().default(1),
  dataAbertura: timestamp("data_abertura").defaultNow().notNull(),
  dataFechamento: timestamp("data_fechamento"),
  empresaId: uuid("empresa_id").notNull().references(() => empresas.id),
  departamentoId: uuid("departamento_id").notNull().references(() => departamentos.id),
  gestorId: uuid("gestor_id").notNull().references(() => usuarios.id),
  dataCriacao: timestamp("data_criacao").defaultNow().notNull(),
  dataAtualizacao: timestamp("data_atualizacao").defaultNow().notNull(),
});

export const candidatos = pgTable("candidatos", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  telefone: varchar("telefone", { length: 50 }).notNull(),
  password: text("password"), // For candidate portal login
  
  // Informações pessoais
  cpf: varchar("cpf", { length: 14 }),
  dataNascimento: date("data_nascimento"),
  endereco: varchar("endereco", { length: 500 }),
  cidade: varchar("cidade", { length: 100 }),
  estado: varchar("estado", { length: 2 }),
  cep: varchar("cep", { length: 10 }),
  
  // Informações profissionais
  cargo: varchar("cargo", { length: 255 }),
  resumoProfissional: text("resumo_profissional"),
  experienciaProfissional: json("experiencia_profissional"), // Array de experiências
  educacao: json("educacao"), // Array de formações
  habilidades: json("habilidades"), // Array de habilidades/competências
  idiomas: json("idiomas"), // Array de idiomas
  certificacoes: json("certificacoes"), // Array de certificações
  
  // Links e arquivos
  curriculoUrl: varchar("curriculo_url", { length: 500 }),
  linkedin: varchar("linkedin", { length: 255 }),
  portfolio: varchar("portfolio", { length: 255 }),
  
  // Preferências profissionais
  pretensoSalarial: varchar("pretensao_salarial", { length: 50 }),
  disponibilidade: varchar("disponibilidade", { length: 50 }), // imediata, 30_dias, etc
  modalidadeTrabalho: varchar("modalidade_trabalho", { length: 50 }), // presencial, remoto, hibrido
  
  status: varchar("status", { length: 20 }).notNull().default("ativo"), // ativo, inativo
  origem: varchar("origem", { length: 20 }).notNull().default("manual"), // manual, portal_externo, importado
  statusEtico: varchar("status_etico", { length: 20 }).default("pendente"), // aprovado, reprovado, pendente
  motivoReprovacaoEtica: text("motivo_reprovacao_etica"),
  empresaId: uuid("empresa_id").notNull().references(() => empresas.id),
  dataCriacao: timestamp("data_criacao").defaultNow().notNull(),
  dataAtualizacao: timestamp("data_atualizacao").defaultNow().notNull(),
});

export const vagaCandidatos = pgTable("vaga_candidatos", {
  id: uuid("id").primaryKey().defaultRandom(),
  vagaId: uuid("vaga_id").notNull().references(() => vagas.id),
  candidatoId: uuid("candidato_id").notNull().references(() => candidatos.id),
  etapa: varchar("etapa", { length: 50 }).notNull().default("recebido"), // recebido, triagem, entrevista, avaliacao, aprovado, reprovado, contratado
  nota: decimal("nota", { precision: 3, scale: 1 }), // 0.0 a 10.0
  comentarios: text("comentarios"),
  dataMovimentacao: timestamp("data_movimentacao").defaultNow().notNull(),
  dataInscricao: timestamp("data_inscricao").defaultNow().notNull(),
  responsavelId: uuid("responsavel_id").references(() => usuarios.id),
}, (table) => ({
  uniqueVagaCandidato: uniqueIndex("unique_vaga_candidato").on(table.vagaId, table.candidatoId),
}));

// Testes DISC e Técnicos
export const testes = pgTable("testes", {
  id: uuid("id").primaryKey().defaultRandom(),
  tipo: varchar("tipo", { length: 20 }).notNull(), // 'DISC' ou 'tecnico'
  titulo: varchar("titulo", { length: 255 }).notNull(),
  descricao: text("descricao"),
  questoes: json("questoes").notNull(), // Array de questões com alternativas
  ativo: boolean("ativo").notNull().default(true),
  dataCriacao: timestamp("data_criacao").defaultNow().notNull(),
  dataAtualizacao: timestamp("data_atualizacao").defaultNow().notNull(),
});

export const testesResultados = pgTable("testes_resultados", {
  id: uuid("id").primaryKey().defaultRandom(),
  testeId: uuid("teste_id").notNull().references(() => testes.id),
  candidatoId: uuid("candidato_id").notNull().references(() => candidatos.id),
  vagaId: uuid("vaga_id").notNull().references(() => vagas.id),
  respostas: json("respostas"), // Array de respostas do candidato
  resultado: text("resultado"), // Ex: "Perfil D - Executor" para DISC
  pontuacao: decimal("pontuacao", { precision: 5, scale: 2 }), // Para testes técnicos
  status: varchar("status", { length: 20 }).notNull().default("pendente"), // pendente, respondido, corrigido
  dataEnvio: timestamp("data_envio").defaultNow().notNull(),
  dataResposta: timestamp("data_resposta"),
}, (table) => ({
  uniqueTesteCandidate: uniqueIndex("unique_teste_candidato").on(table.testeId, table.candidatoId, table.vagaId),
}));

// Entrevistas
export const entrevistas = pgTable("entrevistas", {
  id: uuid("id").primaryKey().defaultRandom(),
  vagaId: uuid("vaga_id").notNull().references(() => vagas.id),
  candidatoId: uuid("candidato_id").notNull().references(() => candidatos.id),
  entrevistadorId: uuid("entrevistador_id").notNull().references(() => usuarios.id),
  dataHora: timestamp("data_hora").notNull(),
  local: varchar("local", { length: 255 }),
  status: varchar("status", { length: 20 }).notNull().default("agendada"), // agendada, realizada, cancelada, faltou
  plataforma: varchar("plataforma", { length: 20 }), // zoom, meet, jitsi, presencial
  linkEntrevista: varchar("link_entrevista", { length: 500 }),
  confirmado: boolean("confirmado").default(false),
  confirmadoCandidato: boolean("confirmado_candidato").default(false),
  confirmadoEntrevistador: boolean("confirmado_entrevistador").default(false),
  tokenConfirmacaoCandidato: varchar("token_confirmacao_candidato", { length: 100 }),
  tokenConfirmacaoEntrevistador: varchar("token_confirmacao_entrevistador", { length: 100 }),
  dataConfirmacaoCandidato: timestamp("data_confirmacao_candidato"),
  dataConfirmacaoEntrevistador: timestamp("data_confirmacao_entrevistador"),
  avaliacaoPosterior: jsonb("avaliacao_posterior"), // { notas, comentarios, avaliadorId, data }
  observacoes: text("observacoes"),
  dataCriacao: timestamp("data_criacao").defaultNow().notNull(),
  dataAtualizacao: timestamp("data_atualizacao").defaultNow().notNull(),
}, (table) => ({
  uniqueEntrevistaAtiva: uniqueIndex("unique_entrevista_ativa")
    .on(table.vagaId, table.candidatoId),
}));

// Tabelas para o sistema de avaliação DISC
export const avaliacoes = pgTable("avaliacoes", {
  id: serial("id").primaryKey(),
  candidatoId: uuid("candidato_id").references(() => candidatos.id),
  tipo: varchar("tipo", { length: 10 }).default("DISC"),
  dataInicio: timestamp("data_inicio").defaultNow(),
  dataFim: timestamp("data_fim"),
  resultadoJson: jsonb("resultado_json"),
  status: varchar("status", { length: 20 }).default("em_andamento"),
});

export const questoesDisc = pgTable("questoes_disc", {
  id: serial("id").primaryKey(),
  bloco: varchar("bloco", { length: 2 }),
  ordem: smallint("ordem"),
  frase: text("frase"),
  fator: char("fator", { length: 1 }), // D, I, S, C
});

export const respostasDisc = pgTable("respostas_disc", {
  id: serial("id").primaryKey(),
  avaliacaoId: integer("avaliacao_id").references(() => avaliacoes.id),
  bloco: varchar("bloco", { length: 2 }),
  respostas: jsonb("respostas"), // exemplo: [4,2,3,1]
});

// Comunicações
export const comunicacoes = pgTable("comunicacoes", {
  id: uuid("id").primaryKey().defaultRandom(),
  candidatoId: uuid("candidato_id").notNull().references(() => candidatos.id, { onDelete: "cascade" }),
  tipo: varchar("tipo", { length: 20 }).notNull(), // whatsapp, email
  canal: varchar("canal", { length: 20 }).notNull(), // inscricao, pipeline, entrevista, teste, outros
  assunto: varchar("assunto", { length: 255 }),
  mensagem: text("mensagem").notNull(),
  statusEnvio: varchar("status_envio", { length: 20 }).notNull().default("pendente"), // pendente, enviado, erro
  dataAgendada: timestamp("data_agendada"),
  dataEnvio: timestamp("data_envio"),
  erro: text("erro"),
  enviadoPor: uuid("enviado_por").references(() => usuarios.id),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizado_em").defaultNow().notNull(),
});

// Tabela de Skills Padronizadas
export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: varchar("nome", { length: 255 }).notNull(),
  categoria: varchar("categoria", { length: 100 }),
  codigoExterno: varchar("codigo_externo", { length: 100 }), // ESCO/CBO
});

// Relacionamento Candidato <-> Skills
export const candidatoSkills = pgTable("candidato_skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  candidatoId: uuid("candidato_id").notNull().references(() => candidatos.id),
  skillId: uuid("skill_id").notNull().references(() => skills.id),
});

// Relacionamento Vaga <-> Skills
export const vagaSkills = pgTable("vaga_skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  vagaId: uuid("vaga_id").notNull().references(() => vagas.id),
  skillId: uuid("skill_id").notNull().references(() => skills.id),
});

// Relations
export const empresasRelations = relations(empresas, ({ many }) => ({
  departamentos: many(departamentos),
  usuarios: many(usuarios),
  vagas: many(vagas),
  candidatos: many(candidatos),
}));

export const departamentosRelations = relations(departamentos, ({ one, many }) => ({
  empresa: one(empresas, {
    fields: [departamentos.empresaId],
    references: [empresas.id],
  }),
  usuarios: many(usuarios),
  vagas: many(vagas),
}));

export const usuariosRelations = relations(usuarios, ({ one, many }) => ({
  empresa: one(empresas, {
    fields: [usuarios.empresaId],
    references: [empresas.id],
  }),
  departamento: one(departamentos, {
    fields: [usuarios.departamentoId],
    references: [departamentos.id],
  }),
  vagasGestor: many(vagas),
}));

export const vagasRelations = relations(vagas, ({ one, many }) => ({
  empresa: one(empresas, {
    fields: [vagas.empresaId],
    references: [empresas.id],
  }),
  departamento: one(departamentos, {
    fields: [vagas.departamentoId],
    references: [departamentos.id],
  }),
  gestor: one(usuarios, {
    fields: [vagas.gestorId],
    references: [usuarios.id],
  }),
  vagaCandidatos: many(vagaCandidatos),
}));

export const candidatosRelations = relations(candidatos, ({ one, many }) => ({
  empresa: one(empresas, {
    fields: [candidatos.empresaId],
    references: [empresas.id],
  }),
  vagaCandidatos: many(vagaCandidatos),
}));

export const vagaCandidatosRelations = relations(vagaCandidatos, ({ one }) => ({
  vaga: one(vagas, {
    fields: [vagaCandidatos.vagaId],
    references: [vagas.id],
  }),
  candidato: one(candidatos, {
    fields: [vagaCandidatos.candidatoId],
    references: [candidatos.id],
  }),
  responsavel: one(usuarios, {
    fields: [vagaCandidatos.responsavelId],
    references: [usuarios.id],
  }),
}));

// Testes Relations
export const testesRelations = relations(testes, ({ many }) => ({
  resultados: many(testesResultados),
}));

export const testesResultadosRelations = relations(testesResultados, ({ one }) => ({
  teste: one(testes, {
    fields: [testesResultados.testeId],
    references: [testes.id],
  }),
  candidato: one(candidatos, {
    fields: [testesResultados.candidatoId],
    references: [candidatos.id],
  }),
  vaga: one(vagas, {
    fields: [testesResultados.vagaId],
    references: [vagas.id],
  }),
}));

// Entrevistas Relations
export const entrevistasRelations = relations(entrevistas, ({ one }) => ({
  vaga: one(vagas, {
    fields: [entrevistas.vagaId],
    references: [vagas.id],
  }),
  candidato: one(candidatos, {
    fields: [entrevistas.candidatoId],
    references: [candidatos.id],
  }),
  entrevistador: one(usuarios, {
    fields: [entrevistas.entrevistadorId],
    references: [usuarios.id],
  }),
}));

// Comunicações Relations
export const comunicacoesRelations = relations(comunicacoes, ({ one }) => ({
  candidato: one(candidatos, {
    fields: [comunicacoes.candidatoId],
    references: [candidatos.id],
  }),
  enviadoPor: one(usuarios, {
    fields: [comunicacoes.enviadoPor],
    references: [usuarios.id],
  }),
}));

// Insert schemas
export const insertEmpresaSchema = createInsertSchema(empresas).omit({
  id: true,
  dataCreacao: true,
  dataAtualizacao: true,
}).extend({
  status: z.enum(["ativa", "inativa"]).default("ativa"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  site: z.string().url("URL inválida").optional().or(z.literal("")),
});

export const insertDepartamentoSchema = createInsertSchema(departamentos).omit({
  id: true,
});

export const insertUsuarioSchema = createInsertSchema(usuarios).omit({
  id: true,
  dataCriacao: true,
  dataAtualizacao: true,
  ativo: true,
}).extend({
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  perfil: z.enum(["admin", "recrutador", "gestor", "candidato"]),
  email: z.string().email("Email inválido"),
});

export const insertVagaSchema = createInsertSchema(vagas).omit({
  id: true,
  dataCriacao: true,
  dataAtualizacao: true,
}).extend({
  tipoContratacao: z.enum(["CLT", "PJ", "Estágio", "Temporário", "Freelancer"]),
  status: z.enum(["aberta", "em_triagem", "entrevistas", "encerrada", "cancelada"]).default("aberta"),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

// Types
export type Empresa = typeof empresas.$inferSelect;
export type InsertEmpresa = z.infer<typeof insertEmpresaSchema>;
export type Departamento = typeof departamentos.$inferSelect;
export type InsertDepartamento = z.infer<typeof insertDepartamentoSchema>;
export type Usuario = typeof usuarios.$inferSelect;
export type InsertUsuario = z.infer<typeof insertUsuarioSchema>;
export type Vaga = typeof vagas.$inferSelect;
export type InsertVaga = z.infer<typeof insertVagaSchema>;

export const insertCandidatoSchema = createInsertSchema(candidatos).omit({
  id: true,
  dataCriacao: true,
  dataAtualizacao: true,
}).extend({
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  email: z.string().email("Email inválido"),
  telefone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  
  // Campos opcionais de currículo
  cpf: z.string().optional(),
  dataNascimento: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().max(2).optional(),
  cep: z.string().optional(),
  
  cargo: z.string().optional(),
  resumoProfissional: z.string().optional(),
  experienciaProfissional: z.array(z.object({
    empresa: z.string(),
    cargo: z.string(),
    dataInicio: z.string(),
    dataFim: z.string().optional(),
    descricao: z.string().optional(),
    atual: z.boolean().optional()
  })).optional(),
  educacao: z.array(z.object({
    instituicao: z.string(),
    curso: z.string(),
    nivel: z.string(), // superior, tecnico, pos_graduacao, mestrado, doutorado
    dataInicio: z.string().optional(),
    dataConclusao: z.string().optional(),
    status: z.string().optional() // concluido, cursando, trancado
  })).optional(),
  habilidades: z.array(z.string()).optional(),
  idiomas: z.array(z.object({
    idioma: z.string(),
    nivel: z.string() // basico, intermediario, avancado, fluente, nativo
  })).optional(),
  certificacoes: z.array(z.object({
    nome: z.string(),
    instituicao: z.string(),
    dataEmissao: z.string().optional(),
    dataVencimento: z.string().optional()
  })).optional(),
  
  linkedin: z.string().url().optional().or(z.literal("")),
  portfolio: z.string().url().optional().or(z.literal("")),
  
  pretensoSalarial: z.string().optional(),
  disponibilidade: z.enum(["imediata", "15_dias", "30_dias", "60_dias", "a_combinar"]).optional(),
  modalidadeTrabalho: z.enum(["presencial", "remoto", "hibrido", "indiferente"]).optional(),
  
  status: z.enum(["ativo", "inativo"]).default("ativo"),
  origem: z.enum(["manual", "portal_candidato", "importado"]).default("portal_candidato"),
});

export const insertVagaCandidatoSchema = createInsertSchema(vagaCandidatos).omit({
  id: true,
  dataMovimentacao: true,
}).extend({
  etapa: z.enum(["recebido", "em_triagem", "entrevista_agendada", "avaliacao", "aprovado", "reprovado"]).default("recebido"),
});

export type Candidato = typeof candidatos.$inferSelect;
export type InsertCandidato = z.infer<typeof insertCandidatoSchema>;
export type VagaCandidato = typeof vagaCandidatos.$inferSelect;
export type InsertVagaCandidato = z.infer<typeof insertVagaCandidatoSchema>;
export type LoginData = z.infer<typeof loginSchema>;

// Testes schemas
export const insertTesteSchema = createInsertSchema(testes).omit({
  id: true,
  dataCriacao: true,
  dataAtualizacao: true,
}).extend({
  tipo: z.enum(["DISC", "tecnico"]),
  questoes: z.array(z.object({
    enunciado: z.string(),
    alternativas: z.array(z.string()).min(2),
    respostaCorreta: z.number().optional(), // Para testes técnicos
  })),
});

export const insertTesteResultadoSchema = createInsertSchema(testesResultados).omit({
  id: true,
  dataEnvio: true,
  dataResposta: true,
}).extend({
  status: z.enum(["pendente", "respondido", "corrigido"]).default("pendente"),
  respostas: z.array(z.number()).optional(), // Índices das alternativas escolhidas
});

export type Teste = typeof testes.$inferSelect;
export type InsertTeste = z.infer<typeof insertTesteSchema>;
export type TesteResultado = typeof testesResultados.$inferSelect;
export type InsertTesteResultado = z.infer<typeof insertTesteResultadoSchema>;

// Entrevistas schemas
export const insertEntrevistaSchema = createInsertSchema(entrevistas).omit({
  id: true,
  dataCriacao: true,
  dataAtualizacao: true,
}).extend({
  dataHora: z.preprocess(
    (arg) => (typeof arg === 'string' || arg instanceof Date) ? new Date(arg) : arg,
    z.date()
  ),
});

export type Entrevista = typeof entrevistas.$inferSelect;
export type InsertEntrevista = z.infer<typeof insertEntrevistaSchema>;

// Comunicações schemas
export const insertComunicacaoSchema = createInsertSchema(comunicacoes).omit({
  id: true,
  criadoEm: true,
  atualizadoEm: true,
}).extend({
  tipo: z.enum(["whatsapp", "email"]),
  canal: z.enum(["inscricao", "pipeline", "entrevista", "teste", "outros"]),
  statusEnvio: z.enum(["pendente", "enviado", "erro"]).default("pendente"),
  dataAgendada: z.string().transform((str) => str ? new Date(str) : undefined).optional(),
});

export type Comunicacao = typeof comunicacoes.$inferSelect;
export type InsertComunicacao = z.infer<typeof insertComunicacaoSchema>;

// Tipos para avaliações DISC
export type Avaliacao = typeof avaliacoes.$inferSelect;
export const insertAvaliacaoSchema = createInsertSchema(avaliacoes);
export type InsertAvaliacao = z.infer<typeof insertAvaliacaoSchema>;

export type QuestaoDisc = typeof questoesDisc.$inferSelect;
export const insertQuestaoDiscSchema = createInsertSchema(questoesDisc);
export type InsertQuestaoDisc = z.infer<typeof insertQuestaoDiscSchema>;

export type RespostaDisc = typeof respostasDisc.$inferSelect;
export const insertRespostaDiscSchema = createInsertSchema(respostasDisc);
export type InsertRespostaDisc = z.infer<typeof insertRespostaDiscSchema>;

// Legacy compatibility for auth blueprint
export const users = usuarios;
export type User = Usuario;
export type InsertUser = InsertUsuario;
export const insertUserSchema = insertUsuarioSchema.pick({
  email: true,
  password: true,
});

export const vagaAuditoria = pgTable('vaga_auditoria', {
  id: uuid('id').primaryKey().defaultRandom(),
  vagaId: uuid('vaga_id').notNull().references(() => vagas.id),
  usuarioId: uuid('usuario_id').notNull().references(() => usuarios.id),
  acao: varchar('acao', { length: 32 }).notNull(),
  data: timestamp('data').notNull().defaultNow(),
  detalhes: text('detalhes'),
});

export const pipelineEtapas = pgTable("pipeline_etapas", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: varchar("nome", { length: 100 }).notNull(),
  ordem: integer("ordem").notNull(),
  cor: varchar("cor", { length: 10 }).default("#df7826"),
  empresaId: uuid("empresa_id").references(() => empresas.id),
  vagaId: uuid("vaga_id").references(() => vagas.id),
  camposObrigatorios: jsonb("campos_obrigatorios").default([]),
  responsaveis: jsonb("responsaveis").default([]), // NOVO: array de UUIDs de usuários
});

export const insertPipelineEtapaSchema = createInsertSchema(pipelineEtapas).omit({
  id: true,
});

export type PipelineEtapa = typeof pipelineEtapas.$inferSelect;
export type InsertPipelineEtapa = z.infer<typeof insertPipelineEtapaSchema>;

export const pipelineAuditoria = pgTable('pipeline_auditoria', {
  id: uuid('id').primaryKey().defaultRandom(),
  vagaId: uuid('vaga_id').notNull().references(() => vagas.id),
  candidatoId: uuid('candidato_id').notNull().references(() => candidatos.id),
  usuarioId: uuid('usuario_id').notNull().references(() => usuarios.id),
  acao: varchar('acao', { length: 32 }).notNull(),
  etapaAnterior: varchar('etapa_anterior', { length: 50 }),
  etapaNova: varchar('etapa_nova', { length: 50 }),
  nota: varchar('nota', { length: 10 }),
  comentarios: text('comentarios'),
  dataMovimentacao: timestamp('data_movimentacao').defaultNow().notNull(),
  ip: varchar('ip', { length: 64 }),
  detalhes: jsonb('detalhes'),
});

export const matchFeedback = pgTable("match_feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  vagaId: uuid("vaga_id").notNull().references(() => vagas.id),
  candidatoId: uuid("candidato_id").notNull().references(() => candidatos.id),
  usuarioId: uuid("usuario_id").notNull().references(() => usuarios.id),
  feedback: varchar("feedback", { length: 10 }).notNull(), // 'bom' ou 'ruim'
  comentario: text("comentario"),
  data: timestamp("data").defaultNow().notNull(),
});

export const vagaMatchingConfig = pgTable("vaga_matching_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  vagaId: uuid("vaga_id").notNull().references(() => vagas.id),
  competenciasPeso: integer("competencias_peso").notNull(),
  experienciaPeso: integer("experiencia_peso").notNull(),
  formacaoPeso: integer("formacao_peso").notNull(),
  localizacaoPeso: integer("localizacao_peso").notNull(),
  salarioPeso: integer("salario_peso").notNull(),
  discPeso: integer("disc_peso").notNull(),
  scoreMinimo: integer("score_minimo").notNull(),
  data: timestamp("data").defaultNow().notNull(),
});

export const perfisVaga = pgTable("perfis_vaga", {
  id: uuid("id").primaryKey().defaultRandom(),
  nomePerfil: varchar("nome_perfil", { length: 255 }).notNull(),
  tituloVaga: varchar("titulo_vaga", { length: 255 }).notNull(),
  descricaoFuncao: text("descricao_funcao").notNull(),
  requisitosObrigatorios: text("requisitos_obrigatorios"),
  requisitosDesejaveis: text("requisitos_desejaveis"),
  competenciasTecnicas: jsonb("competencias_tecnicas").default([]), // array de strings/ids
  competenciasComportamentais: jsonb("competencias_comportamentais").default([]), // array de strings/ids
  beneficios: text("beneficios"),
  tipoContratacao: varchar("tipo_contratacao", { length: 50 }).notNull(), // CLT, PJ, etc
  faixaSalarial: varchar("faixa_salarial", { length: 100 }),
  empresaId: uuid("empresa_id").notNull().references(() => empresas.id),
  departamentoId: uuid("departamento_id").notNull().references(() => departamentos.id),
  localAtuacao: varchar("local_atuacao", { length: 255 }),
  modeloTrabalho: varchar("modelo_trabalho", { length: 50 }), // presencial, remoto, híbrido
  observacoesInternas: text("observacoes_internas"),
  dataCriacao: timestamp("data_criacao").defaultNow().notNull(),
  dataAtualizacao: timestamp("data_atualizacao").defaultNow().notNull(),
});

export const insertPerfilVagaSchema = createInsertSchema(perfisVaga).omit({
  id: true,
  dataCriacao: true,
  dataAtualizacao: true,
});

export const updatePerfilVagaSchema = insertPerfilVagaSchema.partial();

export const selectPerfilVagaSchema = createInsertSchema(perfisVaga);

export const jornadas = pgTable("jornadas", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  horarios: jsonb("horarios").notNull(), // Ex: [{ label: "Entrada", hora: "07:00" }, ...]
  totalHoras: decimal("total_horas", { precision: 4, scale: 2 }).notNull(),
  empresaId: uuid("empresa_id").notNull().references(() => empresas.id),
  dataCriacao: timestamp("data_criacao").defaultNow().notNull(),
  dataAtualizacao: timestamp("data_atualizacao").defaultNow().notNull(),
});

export const insertJornadaSchema = createInsertSchema(jornadas, {
  horarios: z.array(z.object({ label: z.string(), hora: z.string() })),
  totalHoras: z.string().or(z.number()),
});
export const updateJornadaSchema = insertJornadaSchema.partial();

// =====================
// Quadro Ideal
// =====================
export const quadrosIdeais = pgTable("quadro_ideal", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresaId: uuid("empresa_id").notNull().references(() => empresas.id),
  departamentoId: uuid("departamento_id").notNull().references(() => departamentos.id),
  cargo: varchar("cargo", { length: 100 }).notNull(),
  quantidadeIdeal: integer("quantidade_ideal").notNull(),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizado_em").defaultNow(),
});

export const quadrosReais = pgTable("quadro_real", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresaId: uuid("empresa_id").notNull().references(() => empresas.id),
  departamentoId: uuid("departamento_id").notNull().references(() => departamentos.id),
  cargo: varchar("cargo", { length: 100 }).notNull(),
  quantidadeAtual: integer("quantidade_atual").notNull(),
  atualizadoEm: timestamp("atualizado_em").defaultNow(),
});

export const solicitacoesVaga = pgTable("solicitacoes_vaga", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresaId: uuid("empresa_id").notNull().references(() => empresas.id),
  departamentoId: uuid("departamento_id").notNull().references(() => departamentos.id),
  cargo: varchar("cargo", { length: 100 }).notNull(),
  quantidadeSolicitada: integer("quantidade_solicitada").notNull(),
  motivo: text("motivo"),
  status: varchar("status", { length: 20 }).notNull().default("pendente"), // pendente, aprovada, reprovada
  criadoPor: uuid("criado_por").notNull().references(() => usuarios.id),
  aprovadoPor: uuid("aprovado_por").references(() => usuarios.id),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizado_em").defaultNow(),
});

export const historicoQuadroIdeal = pgTable("historico_quadro_ideal", {
  id: uuid("id").primaryKey().defaultRandom(),
  quadroIdealId: uuid("quadro_ideal_id").notNull().references(() => quadrosIdeais.id),
  usuarioId: uuid("usuario_id").notNull().references(() => usuarios.id),
  campoAlterado: varchar("campo_alterado", { length: 50 }),
  valorAnterior: text("valor_anterior"),
  valorNovo: text("valor_novo"),
  dataAlteracao: timestamp("data_alteracao").defaultNow().notNull(),
});

// Schemas de inserção
export const insertQuadroIdealSchema = createInsertSchema(quadrosIdeais).omit({ id: true });
export const insertQuadroRealSchema = createInsertSchema(quadrosReais).omit({ id: true });
export const insertSolicitacaoVagaSchema = createInsertSchema(solicitacoesVaga).omit({ id: true });
export const insertHistoricoQuadroIdealSchema = createInsertSchema(historicoQuadroIdeal).omit({ id: true });

// Tipos
export type QuadroIdeal = typeof quadrosIdeais.$inferSelect;
export type InsertQuadroIdeal = typeof quadrosIdeais.$inferInsert;
export type QuadroReal = typeof quadrosReais.$inferSelect;
export type InsertQuadroReal = typeof quadrosReais.$inferInsert;
export type SolicitacaoVaga = typeof solicitacoesVaga.$inferSelect;
export type InsertSolicitacaoVaga = typeof solicitacoesVaga.$inferInsert;
export type HistoricoQuadroIdeal = typeof historicoQuadroIdeal.$inferSelect;
export type InsertHistoricoQuadroIdeal = typeof historicoQuadroIdeal.$inferInsert;

export const historicoSolicitacaoVaga = pgTable('historico_solicitacao_vaga', {
  id: uuid('id').primaryKey().defaultRandom(),
  solicitacaoId: uuid('solicitacao_id').notNull().references(() => solicitacoesVaga.id, { onDelete: 'cascade' }),
  usuarioId: uuid('usuario_id').notNull().references(() => usuarios.id),
  acao: varchar('acao', { length: 32 }).notNull(),
  motivo: text('motivo'),
  data: timestamp('data').notNull().defaultNow(),
});

export type HistoricoSolicitacaoVaga = typeof historicoSolicitacaoVaga.$inferSelect;
export type InsertHistoricoSolicitacaoVaga = typeof historicoSolicitacaoVaga.$inferInsert;

// === Timeline do Candidato ===
export const eventosTimeline = pgTable("eventos_timeline", {
  id: uuid("id").primaryKey().defaultRandom(),
  candidatoId: uuid("candidato_id").notNull().references(() => candidatos.id),
  dataEvento: timestamp("data_evento").defaultNow().notNull(),
  tipoEvento: varchar("tipo_evento", { length: 30 }).notNull(), // Enum: cadastro, movimentacao, entrevista, teste, observacao, reaproveitamento, mensagem
  descricao: text("descricao").notNull(),
  usuarioResponsavelId: uuid("usuario_responsavel_id").notNull().references(() => usuarios.id),
  visivelParaCandidato: boolean("visivel_para_candidato").default(false),
  observacaoInterna: text("observacao_interna"),
  tipoObservacao: varchar("tipo_observacao", { length: 10 }), // Enum: alerta, positiva, neutra
  tags: text("tags").array(),
  anexos: text("anexos").array(), // URLs dos arquivos
  origem: varchar("origem", { length: 20 }), // Enum: manual, sistema, ia
  origemExterna: text("origem_externa"),
  mencoes: uuid("mencoes").array(), // IDs de usuários mencionados
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizado_em").defaultNow().notNull(),
}, (table) => ({
  idxCandidato: uniqueIndex("idx_eventos_timeline_candidato").on(table.candidatoId, table.dataEvento, table.tipoEvento),
}));

export const insertEventoTimelineSchema = createInsertSchema(eventosTimeline).omit({
  id: true,
  criadoEm: true,
  atualizadoEm: true,
}).extend({
  dataEvento: z.preprocess(
    (val) => typeof val === 'string' ? new Date(val) : val,
    z.date()
  )
});

export type EventoTimeline = typeof eventosTimeline.$inferSelect;
export type InsertEventoTimeline = z.infer<typeof insertEventoTimelineSchema>;

// Relações
export const eventosTimelineRelations = relations(eventosTimeline, ({ one }) => ({
  candidato: one(candidatos, {
    fields: [eventosTimeline.candidatoId],
    references: [candidatos.id],
  }),
  usuarioResponsavel: one(usuarios, {
    fields: [eventosTimeline.usuarioResponsavelId],
    references: [usuarios.id],
  }),
}));

// Modelos de Pipeline Padrão por Empresa
export const modelosPipeline = pgTable("modelos_pipeline", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  empresaId: uuid("empresa_id").notNull().references(() => empresas.id),
  ativo: boolean("ativo").notNull().default(true),
  padrao: boolean("padrao").notNull().default(false), // se é o modelo padrão da empresa
  dataCriacao: timestamp("data_criacao").defaultNow().notNull(),
  dataAtualizacao: timestamp("data_atualizacao").defaultNow().notNull(),
});

// Etapas dos Modelos de Pipeline
export const etapasModeloPipeline = pgTable("etapas_modelo_pipeline", {
  id: uuid("id").primaryKey().defaultRandom(),
  modeloId: uuid("modelo_id").notNull().references(() => modelosPipeline.id, { onDelete: "cascade" }),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  ordem: integer("ordem").notNull(),
  tipo: varchar("tipo", { length: 50 }).notNull().default("intermediaria"), // inicial, intermediaria, decisao, final, pos_contrato
  cor: varchar("cor", { length: 7 }).default("#3B82F6"), // hex color
  obrigatoria: boolean("obrigatoria").notNull().default(true),
  podeReprovar: boolean("pode_reprovar").notNull().default(false),
  sla: integer("sla"), // dias para completar a etapa
  acoesAutomaticas: json("acoes_automaticas"), // array de ações automáticas
  camposObrigatorios: json("campos_obrigatorios"), // array de campos obrigatórios
  responsaveis: json("responsaveis"), // array de IDs de usuários responsáveis
  dataCriacao: timestamp("data_criacao").defaultNow().notNull(),
  dataAtualizacao: timestamp("data_atualizacao").defaultNow().notNull(),
});

// Schemas para Modelos de Pipeline
export const insertModeloPipelineSchema = createInsertSchema(modelosPipeline).omit({
  id: true,
  dataCriacao: true,
  dataAtualizacao: true,
});

export const updateModeloPipelineSchema = insertModeloPipelineSchema.partial();

export const insertEtapaModeloPipelineSchema = createInsertSchema(etapasModeloPipeline).omit({
  id: true,
  dataCriacao: true,
  dataAtualizacao: true,
});

export const updateEtapaModeloPipelineSchema = insertEtapaModeloPipelineSchema.partial();

// Tipos para Modelos de Pipeline
export type ModeloPipeline = typeof modelosPipeline.$inferSelect;
export type InsertModeloPipeline = z.infer<typeof insertModeloPipelineSchema>;
export type EtapaModeloPipeline = typeof etapasModeloPipeline.$inferSelect;
export type InsertEtapaModeloPipeline = z.infer<typeof insertEtapaModeloPipelineSchema>;

// Relações para Modelos de Pipeline
export const modelosPipelineRelations = relations(modelosPipeline, ({ one, many }) => ({
  empresa: one(empresas, {
    fields: [modelosPipeline.empresaId],
    references: [empresas.id],
  }),
  etapas: many(etapasModeloPipeline),
}));

export const etapasModeloPipelineRelations = relations(etapasModeloPipeline, ({ one }) => ({
  modelo: one(modelosPipeline, {
    fields: [etapasModeloPipeline.modeloId],
    references: [modelosPipeline.id],
  }),
}));

// Checklists de Etapas do Pipeline
export const checklistsEtapas = pgTable("checklists_etapas", {
  id: uuid("id").primaryKey().defaultRandom(),
  etapaId: uuid("etapa_id").notNull().references(() => etapasModeloPipeline.id, { onDelete: "cascade" }),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  tipo: varchar("tipo", { length: 50 }).notNull().default("documento"), // documento, exame, tarefa, validacao
  obrigatorio: boolean("obrigatorio").notNull().default(true),
  ordem: integer("ordem").notNull(),
  validacaoAutomatica: boolean("validacao_automatica").notNull().default(false),
  criteriosValidacao: json("criterios_validacao"), // critérios para validação automática
  dataCriacao: timestamp("data_criacao").defaultNow().notNull(),
  dataAtualizacao: timestamp("data_atualizacao").defaultNow().notNull(),
});

// Itens de Checklist por Candidato
export const itensChecklistCandidato = pgTable("itens_checklist_candidato", {
  id: uuid("id").primaryKey().defaultRandom(),
  checklistId: uuid("checklist_id").notNull().references(() => checklistsEtapas.id, { onDelete: "cascade" }),
  vagaCandidatoId: uuid("vaga_candidato_id").notNull().references(() => vagaCandidatos.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 50 }).notNull().default("pendente"), // pendente, em_andamento, aprovado, reprovado
  observacoes: text("observacoes"),
  anexos: json("anexos"), // array de URLs de arquivos
  validadoPor: uuid("validado_por").references(() => usuarios.id),
  dataValidacao: timestamp("data_validacao"),
  dataConclusao: timestamp("data_conclusao"),
  dataCriacao: timestamp("data_criacao").defaultNow().notNull(),
  dataAtualizacao: timestamp("data_atualizacao").defaultNow().notNull(),
});

// Schemas para Checklists
export const insertChecklistEtapaSchema = createInsertSchema(checklistsEtapas).omit({
  id: true,
  dataCriacao: true,
  dataAtualizacao: true,
});

export const updateChecklistEtapaSchema = insertChecklistEtapaSchema.partial();

export const insertItemChecklistCandidatoSchema = createInsertSchema(itensChecklistCandidato).omit({
  id: true,
  dataCriacao: true,
  dataAtualizacao: true,
});

export const updateItemChecklistCandidatoSchema = insertItemChecklistCandidatoSchema.partial();

// Tipos para Checklists
export type ChecklistEtapa = typeof checklistsEtapas.$inferSelect;
export type InsertChecklistEtapa = z.infer<typeof insertChecklistEtapaSchema>;
export type ItemChecklistCandidato = typeof itensChecklistCandidato.$inferSelect;
export type InsertItemChecklistCandidato = z.infer<typeof insertItemChecklistCandidatoSchema>;

// Relações para Checklists
export const checklistsEtapasRelations = relations(checklistsEtapas, ({ one, many }) => ({
  etapa: one(etapasModeloPipeline, {
    fields: [checklistsEtapas.etapaId],
    references: [etapasModeloPipeline.id],
  }),
  itensCandidato: many(itensChecklistCandidato),
}));

export const itensChecklistCandidatoRelations = relations(itensChecklistCandidato, ({ one }) => ({
  checklist: one(checklistsEtapas, {
    fields: [itensChecklistCandidato.checklistId],
    references: [checklistsEtapas.id],
  }),
  vagaCandidato: one(vagaCandidatos, {
    fields: [itensChecklistCandidato.vagaCandidatoId],
    references: [vagaCandidatos.id],
  }),
  validadoPor: one(usuarios, {
    fields: [itensChecklistCandidato.validadoPor],
    references: [usuarios.id],
  }),
}));

// Automatizações de Etapas do Pipeline
export const automatizacoesEtapas = pgTable("automatizacoes_etapas", {
  id: uuid("id").primaryKey().defaultRandom(),
  etapaId: uuid("etapa_id").notNull().references(() => etapasModeloPipeline.id, { onDelete: "cascade" }),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  tipo: varchar("tipo", { length: 50 }).notNull().default("movimento"), // movimento, notificacao, webhook, acao_personalizada
  ativo: boolean("ativo").notNull().default(true),
  condicoes: json("condicoes"), // array de condições que devem ser atendidas
  acoes: json("acoes"), // array de ações a serem executadas
  webhookUrl: varchar("webhook_url", { length: 500 }),
  webhookHeaders: json("webhook_headers"),
  webhookMethod: varchar("webhook_method", { length: 10 }).default("POST"),
  delayExecucao: integer("delay_execucao"), // delay em minutos antes da execução
  maxTentativas: integer("max_tentativas").default(3),
  tentativasAtuais: integer("tentativas_atuais").default(0),
  ultimaExecucao: timestamp("ultima_execucao"),
  proximaExecucao: timestamp("proxima_execucao"),
  dataCriacao: timestamp("data_criacao").defaultNow().notNull(),
  dataAtualizacao: timestamp("data_atualizacao").defaultNow().notNull(),
});

// Log de Execução de Automatizações
export const logsAutomatizacoes = pgTable("logs_automatizacoes", {
  id: uuid("id").primaryKey().defaultRandom(),
  automatizacaoId: uuid("automatizacao_id").notNull().references(() => automatizacoesEtapas.id, { onDelete: "cascade" }),
  vagaCandidatoId: uuid("vaga_candidato_id").notNull().references(() => vagaCandidatos.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 50 }).notNull().default("pendente"), // pendente, executando, sucesso, erro, cancelado
  dadosEntrada: json("dados_entrada"), // dados que foram usados na execução
  resultado: json("resultado"), // resultado da execução
  erro: text("erro"), // mensagem de erro se houver
  tentativa: integer("tentativa").notNull().default(1),
  dataExecucao: timestamp("data_execucao").defaultNow().notNull(),
  dataCriacao: timestamp("data_criacao").defaultNow().notNull(),
});

// Schemas para Automatizações
export const insertAutomatizacaoEtapaSchema = createInsertSchema(automatizacoesEtapas).omit({
  id: true,
  tentativasAtuais: true,
  ultimaExecucao: true,
  proximaExecucao: true,
  dataCriacao: true,
  dataAtualizacao: true,
});

export const updateAutomatizacaoEtapaSchema = insertAutomatizacaoEtapaSchema.partial();

export const insertLogAutomatizacaoSchema = createInsertSchema(logsAutomatizacoes).omit({
  id: true,
  dataCriacao: true,
});

// Tipos para Automatizações
export type AutomatizacaoEtapa = typeof automatizacoesEtapas.$inferSelect;
export type InsertAutomatizacaoEtapa = z.infer<typeof insertAutomatizacaoEtapaSchema>;
export type LogAutomatizacao = typeof logsAutomatizacoes.$inferSelect;
export type InsertLogAutomatizacao = z.infer<typeof insertLogAutomatizacaoSchema>;

// Relações para Automatizações
export const automatizacoesEtapasRelations = relations(automatizacoesEtapas, ({ one, many }) => ({
  etapa: one(etapasModeloPipeline, {
    fields: [automatizacoesEtapas.etapaId],
    references: [etapasModeloPipeline.id],
  }),
  logs: many(logsAutomatizacoes),
}));

export const logsAutomatizacoesRelations = relations(logsAutomatizacoes, ({ one }) => ({
  automatizacao: one(automatizacoesEtapas, {
    fields: [logsAutomatizacoes.automatizacaoId],
    references: [automatizacoesEtapas.id],
  }),
  vagaCandidato: one(vagaCandidatos, {
    fields: [logsAutomatizacoes.vagaCandidatoId],
    references: [vagaCandidatos.id],
  }),
}));

// Motivos de Reprovação Padrão
export const motivosReprovacao = pgTable("motivos_reprovacao", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresaId: uuid("empresa_id").notNull().references(() => empresas.id),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  categoria: varchar("categoria", { length: 100 }).notNull().default("geral"), // geral, tecnico, comportamental, documental, outros
  ativo: boolean("ativo").notNull().default(true),
  obrigatorio: boolean("obrigatorio").notNull().default(false), // se é obrigatório selecionar
  ordem: integer("ordem").notNull().default(0),
  dataCriacao: timestamp("data_criacao").defaultNow().notNull(),
  dataAtualizacao: timestamp("data_atualizacao").defaultNow().notNull(),
});

// Histórico de Reprovações
export const historicoReprovacoes = pgTable("historico_reprovacoes", {
  id: uuid("id").primaryKey().defaultRandom(),
  vagaCandidatoId: uuid("vaga_candidato_id").notNull().references(() => vagaCandidatos.id, { onDelete: "cascade" }),
  motivoId: uuid("motivo_id").references(() => motivosReprovacao.id),
  motivoCustomizado: text("motivo_customizado"), // para motivos não padronizados
  observacoes: text("observacoes"),
  etapaReprovacao: varchar("etapa_reprovacao", { length: 100 }).notNull(),
  reprovadoPor: uuid("reprovado_por").notNull().references(() => usuarios.id),
  dataReprovacao: timestamp("data_reprovacao").defaultNow().notNull(),
  dadosAdicionais: json("dados_adicionais"), // dados extras da reprovação
  dataCriacao: timestamp("data_criacao").defaultNow().notNull(),
});

// Schemas para Motivos de Reprovação
export const insertMotivoReprovacaoSchema = createInsertSchema(motivosReprovacao).omit({
  id: true,
  dataCriacao: true,
  dataAtualizacao: true,
});

export const updateMotivoReprovacaoSchema = insertMotivoReprovacaoSchema.partial();

export const insertHistoricoReprovacaoSchema = createInsertSchema(historicoReprovacoes).omit({
  id: true,
  dataCriacao: true,
});

// Tipos para Motivos de Reprovação
export type MotivoReprovacao = typeof motivosReprovacao.$inferSelect;
export type InsertMotivoReprovacao = z.infer<typeof insertMotivoReprovacaoSchema>;
export type HistoricoReprovacao = typeof historicoReprovacoes.$inferSelect;
export type InsertHistoricoReprovacao = z.infer<typeof insertHistoricoReprovacaoSchema>;

// Relações para Motivos de Reprovação
export const motivosReprovacaoRelations = relations(motivosReprovacao, ({ one, many }) => ({
  empresa: one(empresas, {
    fields: [motivosReprovacao.empresaId],
    references: [empresas.id],
  }),
  historicoReprovacoes: many(historicoReprovacoes),
}));

export const historicoReprovacoesRelations = relations(historicoReprovacoes, ({ one }) => ({
  vagaCandidato: one(vagaCandidatos, {
    fields: [historicoReprovacoes.vagaCandidatoId],
    references: [vagaCandidatos.id],
  }),
  motivo: one(motivosReprovacao, {
    fields: [historicoReprovacoes.motivoId],
    references: [motivosReprovacao.id],
  }),
  reprovadoPor: one(usuarios, {
    fields: [historicoReprovacoes.reprovadoPor],
    references: [usuarios.id],
  }),
}));

// SLAs de Etapas do Pipeline
export const slasEtapas = pgTable("slas_etapas", {
  id: uuid("id").primaryKey().defaultRandom(),
  etapaId: uuid("etapa_id").notNull().references(() => etapasModeloPipeline.id, { onDelete: "cascade" }),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  prazoHoras: integer("prazo_horas").notNull().default(24), // prazo em horas
  prazoDias: integer("prazo_dias").notNull().default(1), // prazo em dias
  tipoPrazo: varchar("tipo_prazo", { length: 20 }).notNull().default("dias"), // horas, dias, semanas
  ativo: boolean("ativo").notNull().default(true),
  alertaAntes: integer("alerta_antes").notNull().default(2), // alerta X horas/dias antes
  alertaApos: integer("alerta_apos").notNull().default(1), // alerta X horas/dias após vencimento
  acoesAutomaticas: json("acoes_automaticas"), // ações a serem executadas quando SLA é violado
  notificacoes: json("notificacoes"), // configuração de notificações
  dataCriacao: timestamp("data_criacao").defaultNow().notNull(),
  dataAtualizacao: timestamp("data_atualizacao").defaultNow().notNull(),
});

// Alertas de SLA
export const alertasSla = pgTable("alertas_sla", {
  id: uuid("id").primaryKey().defaultRandom(),
  slaId: uuid("sla_id").notNull().references(() => slasEtapas.id, { onDelete: "cascade" }),
  vagaCandidatoId: uuid("vaga_candidato_id").notNull().references(() => vagaCandidatos.id, { onDelete: "cascade" }),
  tipo: varchar("tipo", { length: 50 }).notNull().default("vencimento"), // vencimento, atraso, proximo_vencimento
  status: varchar("status", { length: 50 }).notNull().default("pendente"), // pendente, enviado, lido, resolvido
  titulo: varchar("titulo", { length: 255 }).notNull(),
  mensagem: text("mensagem"),
  nivelUrgencia: varchar("nivel_urgencia", { length: 20 }).notNull().default("medio"), // baixo, medio, alto, critico
  dataVencimento: timestamp("data_vencimento").notNull(),
  dataCriacao: timestamp("data_criacao").defaultNow().notNull(),
  dataEnvio: timestamp("data_envio"),
  dataLeitura: timestamp("data_leitura"),
  dataResolucao: timestamp("data_resolucao"),
  resolvidoPor: uuid("resolvido_por").references(() => usuarios.id),
  dadosAdicionais: json("dados_adicionais"), // dados extras do alerta
});

// Notificações de SLA
export const notificacoesSla = pgTable("notificacoes_sla", {
  id: uuid("id").primaryKey().defaultRandom(),
  alertaId: uuid("alerta_id").notNull().references(() => alertasSla.id, { onDelete: "cascade" }),
  destinatarioId: uuid("destinatario_id").notNull().references(() => usuarios.id),
  tipo: varchar("tipo", { length: 50 }).notNull().default("email"), // email, push, sms, webhook
  status: varchar("status", { length: 50 }).notNull().default("pendente"), // pendente, enviado, entregue, falhou
  titulo: varchar("titulo", { length: 255 }).notNull(),
  conteudo: text("conteudo"),
  dadosEnvio: json("dados_envio"), // dados da tentativa de envio
  tentativas: integer("tentativas").notNull().default(0),
  maxTentativas: integer("max_tentativas").notNull().default(3),
  proximaTentativa: timestamp("proxima_tentativa"),
  dataEnvio: timestamp("data_envio"),
  dataEntrega: timestamp("data_entrega"),
  erro: text("erro"), // mensagem de erro se houver
  dataCriacao: timestamp("data_criacao").defaultNow().notNull(),
});

// Schemas para SLAs
export const insertSlaEtapaSchema = createInsertSchema(slasEtapas).omit({
  id: true,
  dataCriacao: true,
  dataAtualizacao: true,
});

export const updateSlaEtapaSchema = insertSlaEtapaSchema.partial();

export const insertAlertaSlaSchema = createInsertSchema(alertasSla).omit({
  id: true,
  dataCriacao: true,
});

export const insertNotificacaoSlaSchema = createInsertSchema(notificacoesSla).omit({
  id: true,
  dataCriacao: true,
});

// Tipos para SLAs
export type SlaEtapa = typeof slasEtapas.$inferSelect;
export type InsertSlaEtapa = z.infer<typeof insertSlaEtapaSchema>;
export type AlertaSla = typeof alertasSla.$inferSelect;
export type InsertAlertaSla = z.infer<typeof insertAlertaSlaSchema>;
export type NotificacaoSla = typeof notificacoesSla.$inferSelect;
export type InsertNotificacaoSla = z.infer<typeof insertNotificacaoSlaSchema>;

// Relações para SLAs
export const slasEtapasRelations = relations(slasEtapas, ({ one, many }) => ({
  etapa: one(etapasModeloPipeline, {
    fields: [slasEtapas.etapaId],
    references: [etapasModeloPipeline.id],
  }),
  alertas: many(alertasSla),
}));

export const alertasSlaRelations = relations(alertasSla, ({ one, many }) => ({
  sla: one(slasEtapas, {
    fields: [alertasSla.slaId],
    references: [slasEtapas.id],
  }),
  vagaCandidato: one(vagaCandidatos, {
    fields: [alertasSla.vagaCandidatoId],
    references: [vagaCandidatos.id],
  }),
  resolvidoPor: one(usuarios, {
    fields: [alertasSla.resolvidoPor],
    references: [usuarios.id],
  }),
  notificacoes: many(notificacoesSla),
}));

export const notificacoesSlaRelations = relations(notificacoesSla, ({ one }) => ({
  alerta: one(alertasSla, {
    fields: [notificacoesSla.alertaId],
    references: [alertasSla.id],
  }),
  destinatario: one(usuarios, {
    fields: [notificacoesSla.destinatarioId],
    references: [usuarios.id],
  }),
}));
