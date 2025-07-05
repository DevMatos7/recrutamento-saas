import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { vagas, candidatos, usuarios } from "./schema";

// Tabela de aprovações de candidaturas
export const candidaturaAprovacoes = pgTable("candidatura_aprovacoes", {
  id: uuid("id").primaryKey().defaultRandom(),
  vagaId: uuid("vaga_id").notNull().references(() => vagas.id),
  candidatoId: uuid("candidato_id").notNull().references(() => candidatos.id),
  statusAprovacao: varchar("status_aprovacao", { length: 20 }).notNull().default("pendente"), // pendente, aprovado, rejeitado
  comentariosAprovacao: text("comentarios_aprovacao"),
  aprovadoPorId: uuid("aprovado_por_id").references(() => usuarios.id),
  dataAprovacao: timestamp("data_aprovacao"),
  dataSolicitacao: timestamp("data_solicitacao").defaultNow().notNull(),
});

export type SelectCandidaturaAprovacao = typeof candidaturaAprovacoes.$inferSelect;
export type InsertCandidaturaAprovacao = typeof candidaturaAprovacoes.$inferInsert;