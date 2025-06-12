import { pgTable, text, serial, uuid, timestamp, varchar, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const empresas = pgTable("empresas", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: varchar("nome", { length: 255 }).notNull(),
  cnpj: varchar("cnpj", { length: 18 }).notNull().unique(),
  dataCreacao: timestamp("data_criacao").defaultNow().notNull(),
});

export const departamentos = pgTable("departamentos", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: varchar("nome", { length: 255 }).notNull(),
  empresaId: uuid("empresa_id").notNull().references(() => empresas.id),
});

export const usuarios = pgTable("usuarios", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  perfil: varchar("perfil", { length: 50 }).notNull(), // admin, recrutador, gestor, candidato
  empresaId: uuid("empresa_id").notNull().references(() => empresas.id),
  departamentoId: uuid("departamento_id").references(() => departamentos.id),
  ativo: serial("ativo").notNull(),
  dataCriacao: timestamp("data_criacao").defaultNow().notNull(),
});

export const vagas = pgTable("vagas", {
  id: uuid("id").primaryKey().defaultRandom(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  descricao: text("descricao").notNull(),
  requisitos: text("requisitos").notNull(),
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
  etapa: varchar("etapa", { length: 50 }).notNull().default("recebido"), // recebido, em_triagem, entrevista_agendada, avaliacao, aprovado, reprovado
  nota: text("nota"),
  comentarios: text("comentarios"),
  dataMovimentacao: timestamp("data_movimentacao").defaultNow().notNull(),
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

export const vagasRelations = relations(vagas, ({ one }) => ({
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
}));

// Insert schemas
export const insertEmpresaSchema = createInsertSchema(empresas).omit({
  id: true,
  dataCreacao: true,
});

export const insertDepartamentoSchema = createInsertSchema(departamentos).omit({
  id: true,
});

export const insertUsuarioSchema = createInsertSchema(usuarios).omit({
  id: true,
  dataCriacao: true,
  ativo: true,
}).extend({
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  perfil: z.enum(["admin", "recrutador", "gestor", "candidato"]),
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
export type LoginData = z.infer<typeof loginSchema>;

// Legacy compatibility for auth blueprint
export const users = usuarios;
export type User = Usuario;
export type InsertUser = InsertUsuario;
export const insertUserSchema = insertUsuarioSchema.pick({
  email: true,
  password: true,
});
