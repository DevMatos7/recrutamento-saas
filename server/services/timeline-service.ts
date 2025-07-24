import { db } from '../db';
import { eventosTimeline, InsertEventoTimeline } from '@shared/schema';
import { eq, and, ilike, inArray, sql, desc } from 'drizzle-orm';

export class TimelineService {
  // Listar eventos da timeline de um candidato, com filtros básicos
  static async listarEventos({
    candidatoId,
    tipoEvento,
    dataInicio,
    dataFim,
    usuarioResponsavelId,
    palavraChave,
    visivelParaCandidato
  }: {
    candidatoId: string,
    tipoEvento?: string,
    dataInicio?: Date,
    dataFim?: Date,
    usuarioResponsavelId?: string,
    palavraChave?: string,
    visivelParaCandidato?: boolean
  }) {
    const where = [eq(eventosTimeline.candidatoId, candidatoId)];
    if (tipoEvento) where.push(eq(eventosTimeline.tipoEvento, tipoEvento));
    if (usuarioResponsavelId) where.push(eq(eventosTimeline.usuarioResponsavelId, usuarioResponsavelId));
    if (visivelParaCandidato !== undefined) where.push(eq(eventosTimeline.visivelParaCandidato, visivelParaCandidato));
    if (dataInicio) where.push(sql`${eventosTimeline.dataEvento} >= ${dataInicio}`);
    if (dataFim) where.push(sql`${eventosTimeline.dataEvento} <= ${dataFim}`);
    if (palavraChave) where.push(ilike(eventosTimeline.descricao, `%${palavraChave}%`));
    return db.select().from(eventosTimeline)
      .where(and(...where))
      .orderBy(desc(eventosTimeline.dataEvento));
  }

  // Criar novo evento na timeline
  static async criarEvento(data: InsertEventoTimeline) {
    const [evento] = await db.insert(eventosTimeline).values(data).returning();
    return evento;
  }
} 