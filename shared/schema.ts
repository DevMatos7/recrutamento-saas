import { pgTable, text, serial, uuid, timestamp, varchar, decimal, boolean, uniqueIndex, json } from "drizzle-orm/pg-core";
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
});

export const usuarios = pgTable("usuarios", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  password: text("password").notNull(),
  perfil: varchar("perfil", { length: 50 }).notNull(), // admin, recrutador, gestor, candidato
  empresaId: uuid("empresa_id").notNull().references(() => empresas.id),
  departamentoId: uuid("departamento_id").references(() => departamentos.id),
  ativo: serial("ativo").notNull(),
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
  status: varchar("status", { length: 50 }).notNull().default("aberta"), // aberta, em_triagem, entrevistas, encerrada, cancelada
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
  curriculoUrl: varchar("curriculo_url", { length: 500 }),
  linkedin: varchar("linkedin", { length: 255 }),
  status: varchar("status", { length: 20 }).notNull().default("ativo"), // ativo, inativo
  origem: varchar("origem", { length: 20 }).notNull().default("manual"), // manual, portal_externo, importado
  empresaId: uuid("empresa_id").notNull().references(() => empresas.id),
  dataCriacao: timestamp("data_criacao").defaultNow().notNull(),
  dataAtualizacao: timestamp("data_atualizacao").defaultNow().notNull(),
});

export const vagaCandidatos = pgTable("vaga_candidatos", {
  id: uuid("id").primaryKey().defaultRandom(),
  vagaId: uuid("vaga_id").notNull().references(() => vagas.id),
  candidatoId: uuid("candidato_id").notNull().references(() => candidatos.id),
  etapa: varchar("etapa", { length: 50 }).notNull().default("recebido"), // recebido, triagem, entrevista, avaliacao, aprovado, reprovado
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
  observacoes: text("observacoes"),
  dataCriacao: timestamp("data_criacao").defaultNow().notNull(),
  dataAtualizacao: timestamp("data_atualizacao").defaultNow().notNull(),
}, (table) => ({
  uniqueEntrevistaAtiva: uniqueIndex("unique_entrevista_ativa")
    .on(table.vagaId, table.candidatoId),
}));

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
  status: z.enum(["ativo", "inativo"]).default("ativo"),
  origem: z.enum(["manual", "portal_externo", "importado"]).default("manual"),
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
  status: z.enum(["agendada", "realizada", "cancelada", "faltou"]).default("agendada"),
  dataHora: z.string().transform((str) => new Date(str)),
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

// Legacy compatibility for auth blueprint
export const users = usuarios;
export type User = Usuario;
export type InsertUser = InsertUsuario;
export const insertUserSchema = insertUsuarioSchema.pick({
  email: true,
  password: true,
});
