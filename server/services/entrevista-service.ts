import { eq, and, gte, desc, ne, lte } from "drizzle-orm";
import { db } from "../db.js";
import { entrevistas, candidatos, vagas, usuarios } from "../../shared/schema.js";
import type { InsertEntrevista, Entrevista, Usuario } from "../../shared/schema.js";
import { randomBytes } from "crypto";
import { CommunicationService } from "./communication-service";

const communicationService = new CommunicationService();

export class EntrevistaServiceError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "EntrevistaServiceError";
  }
}

/**
 * Service for managing interview scheduling and management
 */
export class EntrevistaService {
  
  /**
   * Validates if user has permission to manage interviews
   */
  private static validateUserPermissions(usuario: Usuario, action: 'create' | 'edit' | 'view'): void {
    if (action === 'create' && !['admin', 'recrutador'].includes(usuario.perfil)) {
      throw new EntrevistaServiceError("Apenas administradores e recrutadores podem agendar entrevistas", "PERMISSION_DENIED");
    }
    
    if (action === 'edit' && !['admin', 'recrutador', 'gestor'].includes(usuario.perfil)) {
      throw new EntrevistaServiceError("Apenas administradores, recrutadores e gestores podem editar entrevistas", "PERMISSION_DENIED");
    }
    
    if (action === 'view' && !['admin', 'recrutador', 'gestor'].includes(usuario.perfil)) {
      throw new EntrevistaServiceError("Sem permissão para visualizar entrevistas", "PERMISSION_DENIED");
    }
  }

  /**
   * Validates if interview status is valid
   */
  private static validateStatus(status: string): asserts status is 'agendada' | 'realizada' | 'cancelada' | 'faltou' {
    if (!['agendada', 'realizada', 'cancelada', 'faltou'].includes(status)) {
      throw new EntrevistaServiceError("Status inválido. Use: agendada, realizada, cancelada, faltou", "INVALID_STATUS");
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
      throw new EntrevistaServiceError("Candidato não encontrado", "CANDIDATE_NOT_FOUND");
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
      throw new EntrevistaServiceError("Vaga não encontrada", "JOB_NOT_FOUND");
    }
    
    if (vaga.status === 'encerrada' || vaga.status === 'cancelada') {
      throw new EntrevistaServiceError("Não é possível agendar entrevistas para vagas encerradas ou canceladas", "JOB_INACTIVE");
    }
  }

  /**
   * Check if interviewer exists and has permission
   */
  private static async validateEntrevistador(entrevistadorId: string): Promise<void> {
    const entrevistador = await db.query.usuarios.findFirst({
      where: eq(usuarios.id, entrevistadorId)
    });
    
    if (!entrevistador) {
      throw new EntrevistaServiceError("Entrevistador não encontrado", "INTERVIEWER_NOT_FOUND");
    }
    
    if (!['admin', 'recrutador', 'gestor'].includes(entrevistador.perfil)) {
      throw new EntrevistaServiceError("Apenas administradores, recrutadores e gestores podem realizar entrevistas", "INVALID_INTERVIEWER");
    }
  }

  /**
   * Check if candidate already has an active interview for this job
   */
  private static async validateEntrevistaUnica(vagaId: string, candidatoId: string, entrevistaId?: string): Promise<void> {
    const whereConditions = [
      eq(entrevistas.vagaId, vagaId),
      eq(entrevistas.candidatoId, candidatoId),
      eq(entrevistas.status, 'agendada')
    ];

    // If updating, exclude current interview from check
    if (entrevistaId) {
      whereConditions.push(ne(entrevistas.id, entrevistaId));
    }

    const existingInterview = await db.query.entrevistas.findFirst({
      where: and(...whereConditions)
    });
    
    if (existingInterview) {
      throw new EntrevistaServiceError("Este candidato já possui uma entrevista agendada para esta vaga", "INTERVIEW_ALREADY_EXISTS");
    }
  }

  /**
   * Validate interview date is in the future
   */
  private static validateDataFutura(dataHora: Date): void {
    const now = new Date();
    if (dataHora <= now) {
      throw new EntrevistaServiceError("A data/hora da entrevista deve ser futura", "INVALID_DATE");
    }
  }

  /**
   * Check if interview can be edited (not realized or cancelled)
   */
  private static validatePodeEditar(entrevista: Entrevista): void {
    if (entrevista.status === 'realizada') {
      throw new EntrevistaServiceError("Não é possível editar entrevistas já realizadas", "CANNOT_EDIT_COMPLETED");
    }
    
    if (entrevista.status === 'cancelada') {
      throw new EntrevistaServiceError("Não é possível editar entrevistas canceladas", "CANNOT_EDIT_CANCELLED");
    }
  }

  /**
   * Create new interview
   */
  static async agendarEntrevista(entrevista: InsertEntrevista, usuarioLogado: Usuario): Promise<Entrevista> {
    this.validateUserPermissions(usuarioLogado, 'create');
    
    // Validate all entities exist and are valid
    await this.validateCandidatoExiste(entrevista.candidatoId);
    await this.validateVagaAtiva(entrevista.vagaId);
    await this.validateEntrevistador(entrevista.entrevistadorId);
    
    // Validate business rules
    this.validateDataFutura(entrevista.dataHora);
    await this.validateEntrevistaUnica(entrevista.vagaId, entrevista.candidatoId);
    
    // Gerar tokens de confirmação
    const tokenConfirmacaoCandidato = randomBytes(16).toString('hex');
    const tokenConfirmacaoEntrevistador = randomBytes(16).toString('hex');
    
    const [novaEntrevista] = await db.insert(entrevistas)
      .values({
        ...entrevista,
        dataCriacao: new Date(),
        dataAtualizacao: new Date(),
        tokenConfirmacaoCandidato,
        tokenConfirmacaoEntrevistador
      })
      .returning();
    
    // Enviar e-mail/WhatsApp para candidato e entrevistador
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const linkCandidato = `${frontendUrl}/confirmar-presenca?id=${novaEntrevista.id}&token=${tokenConfirmacaoCandidato}&tipo=candidato`;
    const linkEntrevistador = `${frontendUrl}/confirmar-presenca?id=${novaEntrevista.id}&token=${tokenConfirmacaoEntrevistador}&tipo=entrevistador`;
    // Buscar dados completos
    const candidato = await db.query.candidatos.findFirst({ where: eq(candidatos.id, novaEntrevista.candidatoId) });
    const entrevistador = await db.query.usuarios.findFirst({ where: eq(usuarios.id, novaEntrevista.entrevistadorId) });
    const vaga = await db.query.vagas.findFirst({ where: eq(vagas.id, novaEntrevista.vagaId) });
    const dataEntrevista = new Date(novaEntrevista.dataHora).toLocaleString('pt-BR');
    // Mensagem padrão
    const mensagemCandidato = `Olá ${candidato?.nome},\n\nSua entrevista para a vaga "${vaga?.titulo}" está agendada para ${dataEntrevista}.\n\nPor favor, confirme sua presença clicando no link: ${linkCandidato}`;
    const mensagemEntrevistador = `Olá ${entrevistador?.nome},\n\nVocê está agendado para entrevistar o candidato "${candidato?.nome}" na vaga "${vaga?.titulo}" em ${dataEntrevista}.\n\nPor favor, confirme sua presença clicando no link: ${linkEntrevistador}`;
    // E-mail para candidato
    if (candidato?.email) {
      await communicationService.enviarComunicacao('email', candidato, mensagemCandidato, `Entrevista agendada - ${vaga?.titulo}`);
    }
    // WhatsApp para candidato (se implementado)
    // await communicationService.enviarComunicacao('whatsapp', candidato, mensagemCandidato);
    // E-mail para entrevistador
    if (entrevistador?.email) {
      await communicationService.enviarComunicacao('email', entrevistador, mensagemEntrevistador, `Entrevista agendada - ${vaga?.titulo}`);
    }
    // WhatsApp para entrevistador (se implementado)
    // await communicationService.enviarComunicacao('whatsapp', entrevistador, mensagemEntrevistador);
    // Registrar evento na timeline
    if (novaEntrevista && candidato && vaga && entrevistador) {
      const { TimelineService } = await import('./timeline-service');
      await TimelineService.criarEvento({
        candidatoId: candidato.id,
        tipoEvento: 'entrevista_agendada',
        descricao: `Entrevista agendada para a vaga "${vaga.titulo}" em ${dataEntrevista} via ${novaEntrevista.plataforma || novaEntrevista.local || '-'} com ${entrevistador.nome}.`,
        usuarioResponsavelId: usuarioLogado.id,
        dataEvento: new Date(),
        origem: 'entrevista',
        visivelParaCandidato: true
      });
    }
    return novaEntrevista;
  }

  /**
   * List interviews with filters
   */
  static async listarEntrevistas(
    filtros: {
      vagaId?: string;
      candidatoId?: string;
      entrevistadorId?: string;
      status?: string;
      dataInicio?: Date;
      dataFim?: Date;
    },
    usuarioLogado: Usuario
  ): Promise<any[]> {
    this.validateUserPermissions(usuarioLogado, 'view');
    
    const whereConditions: any[] = [];
    
    if (filtros.vagaId) {
      whereConditions.push(eq(entrevistas.vagaId, filtros.vagaId));
    }
    
    if (filtros.candidatoId) {
      whereConditions.push(eq(entrevistas.candidatoId, filtros.candidatoId));
    }
    
    if (filtros.entrevistadorId) {
      whereConditions.push(eq(entrevistas.entrevistadorId, filtros.entrevistadorId));
    }
    
    if (filtros.status) {
      this.validateStatus(filtros.status);
      whereConditions.push(eq(entrevistas.status, filtros.status));
    }
    
    if (filtros.dataInicio) {
      whereConditions.push(gte(entrevistas.dataHora, filtros.dataInicio));
    }
    
    if (filtros.dataFim) {
      whereConditions.push(lte(entrevistas.dataHora, filtros.dataFim));
    }

    return await db.query.entrevistas.findMany({
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      with: {
        candidato: true,
        vaga: true,
        entrevistador: {
          columns: {
            id: true,
            nome: true,
            email: true,
            perfil: true
          }
        }
      },
      orderBy: [desc(entrevistas.dataHora)]
    });
  }

  /**
   * Get interview by ID
   */
  static async obterEntrevista(id: string, usuarioLogado: Usuario): Promise<any | null> {
    this.validateUserPermissions(usuarioLogado, 'view');
    
    const entrevista = await db.query.entrevistas.findFirst({
      where: eq(entrevistas.id, id),
      with: {
        candidato: true,
        vaga: true,
        entrevistador: {
          columns: {
            id: true,
            nome: true,
            email: true,
            perfil: true
          }
        }
      }
    });
    
    return entrevista || null;
  }

  /**
   * Update interview
   */
  static async atualizarEntrevista(
    id: string, 
    dadosAtualizacao: Partial<InsertEntrevista>, 
    usuarioLogado: Usuario
  ): Promise<Entrevista | null> {
    this.validateUserPermissions(usuarioLogado, 'edit');
    
    // Get current interview
    const entrevistaAtual = await db.query.entrevistas.findFirst({
      where: eq(entrevistas.id, id)
    });
    
    if (!entrevistaAtual) {
      throw new EntrevistaServiceError("Entrevista não encontrada", "INTERVIEW_NOT_FOUND");
    }
    
    // Check if can be edited
    this.validatePodeEditar(entrevistaAtual);
    
    // Validate updated data
    if (dadosAtualizacao.dataHora) {
      this.validateDataFutura(dadosAtualizacao.dataHora);
    }
    
    if (dadosAtualizacao.entrevistadorId) {
      await this.validateEntrevistador(dadosAtualizacao.entrevistadorId);
    }
    
    // If changing candidate or job, validate uniqueness
    if (dadosAtualizacao.candidatoId || dadosAtualizacao.vagaId) {
      const vagaId = dadosAtualizacao.vagaId || entrevistaAtual.vagaId;
      const candidatoId = dadosAtualizacao.candidatoId || entrevistaAtual.candidatoId;
      await this.validateEntrevistaUnica(vagaId, candidatoId, id);
    }
    
    const [entrevistaAtualizada] = await db.update(entrevistas)
      .set({
        ...dadosAtualizacao,
        dataAtualizacao: new Date()
      })
      .where(eq(entrevistas.id, id))
      .returning();
    
    // Registrar evento na timeline
    if (entrevistaAtualizada && entrevistaAtualizada.candidatoId) {
      const { TimelineService } = await import('./timeline-service');
      await TimelineService.criarEvento({
        candidatoId: entrevistaAtualizada.candidatoId,
        tipoEvento: 'entrevista_atualizada',
        descricao: `Entrevista atualizada. Novos dados: ${JSON.stringify(dadosAtualizacao)}`,
        usuarioResponsavelId: usuarioLogado.id,
        dataEvento: new Date(),
        origem: 'entrevista'
      });
    }
    return entrevistaAtualizada || null;
  }

  /**
   * Update interview status
   */
  static async atualizarStatus(
    id: string, 
    novoStatus: string, 
    observacoes?: string, 
    usuarioLogado?: Usuario
  ): Promise<Entrevista | null> {
    if (usuarioLogado) {
      this.validateUserPermissions(usuarioLogado, 'edit');
    }
    this.validateStatus(novoStatus);
    // Get current interview
    const entrevistaAtual = await db.query.entrevistas.findFirst({
      where: eq(entrevistas.id, id)
    });
    if (!entrevistaAtual) {
      throw new EntrevistaServiceError("Entrevista não encontrada", "INTERVIEW_NOT_FOUND");
    }
    const updateData: any = {
      status: novoStatus,
      dataAtualizacao: new Date()
    };
    if (observacoes !== undefined) {
      updateData.observacoes = observacoes;
    }
    const [entrevistaAtualizada] = await db.update(entrevistas)
      .set(updateData)
      .where(eq(entrevistas.id, id))
      .returning();
    // Registrar evento na timeline
    if (entrevistaAtualizada && entrevistaAtualizada.candidatoId) {
      const { TimelineService } = await import('./timeline-service');
      let tipoEvento = 'entrevista_status';
      let descricao = `Status da entrevista alterado para "${novoStatus}".`;
      if (novoStatus === 'realizada') {
        tipoEvento = 'entrevista_realizada';
        descricao = `Entrevista realizada em ${new Date(entrevistaAtualizada.dataHora).toLocaleString('pt-BR')}.`;
      } else if (novoStatus === 'cancelada') {
        tipoEvento = 'entrevista_cancelada';
        descricao = `Entrevista cancelada. Motivo: ${observacoes || '-'}`;
      } else if (novoStatus === 'faltou') {
        tipoEvento = 'entrevista_faltou';
        descricao = `Candidato faltou à entrevista em ${new Date(entrevistaAtualizada.dataHora).toLocaleString('pt-BR')}. Observações: ${observacoes || '-'}`;
      }
      await TimelineService.criarEvento({
        candidatoId: entrevistaAtualizada.candidatoId,
        tipoEvento,
        descricao,
        usuarioResponsavelId: usuarioLogado?.id,
        dataEvento: new Date(),
        origem: 'entrevista',
        visivelParaCandidato: true
      });
    }
    return entrevistaAtualizada || null;
  }

  /**
   * Delete interview (only if not completed)
   */
  static async removerEntrevista(id: string, usuarioLogado: Usuario): Promise<boolean> {
    this.validateUserPermissions(usuarioLogado, 'edit');
    
    // Get current interview
    const entrevistaAtual = await db.query.entrevistas.findFirst({
      where: eq(entrevistas.id, id)
    });
    
    if (!entrevistaAtual) {
      throw new EntrevistaServiceError("Entrevista não encontrada", "INTERVIEW_NOT_FOUND");
    }
    
    if (entrevistaAtual.status === 'realizada') {
      throw new EntrevistaServiceError("Não é possível remover entrevistas já realizadas", "CANNOT_DELETE_COMPLETED");
    }
    
    const result = await db.delete(entrevistas)
      .where(eq(entrevistas.id, id));
    
    return result.rowCount > 0;
  }

  /**
   * Get upcoming interviews for a user
   */
  static async obterProximasEntrevistas(entrevistadorId: string, usuarioLogado: Usuario): Promise<any[]> {
    this.validateUserPermissions(usuarioLogado, 'view');
    
    const agora = new Date();
    
    return await db.query.entrevistas.findMany({
      where: and(
        eq(entrevistas.entrevistadorId, entrevistadorId),
        eq(entrevistas.status, 'agendada'),
        gte(entrevistas.dataHora, agora)
      ),
      with: {
        candidato: true,
        vaga: {
          columns: {
            id: true,
            titulo: true,
            status: true
          }
        }
      },
      orderBy: [entrevistas.dataHora]
    });
  }

  /**
   * Get interview statistics
   */
  static async obterEstatisticas(usuarioLogado: Usuario): Promise<{
    total: number;
    agendadas: number;
    realizadas: number;
    canceladas: number;
    faltaram: number;
  }> {
    this.validateUserPermissions(usuarioLogado, 'view');
    
    const todasEntrevistas = await db.query.entrevistas.findMany({
      columns: {
        status: true
      }
    });
    
    const stats = {
      total: todasEntrevistas.length,
      agendadas: 0,
      realizadas: 0,
      canceladas: 0,
      faltaram: 0
    };
    
    todasEntrevistas.forEach(entrevista => {
      switch (entrevista.status) {
        case 'agendada':
          stats.agendadas++;
          break;
        case 'realizada':
          stats.realizadas++;
          break;
        case 'cancelada':
          stats.canceladas++;
          break;
        case 'faltou':
          stats.faltaram++;
          break;
      }
    });
    
    return stats;
  }

  /**
   * Buscar slots livres para agendamento inteligente
   */
  static async buscarSlotsLivres({ entrevistadorId, candidatoId, dataInicio, dataFim }: {
    entrevistadorId: string;
    candidatoId: string;
    dataInicio: Date;
    dataFim: Date;
  }): Promise<{ inicio: Date; fim: Date }[]> {
    // Buscar entrevistas do recrutador e candidato no período
    const entrevistasRecrutador = await db.query.entrevistas.findMany({
      where: and(
        eq(entrevistas.entrevistadorId, entrevistadorId),
        gte(entrevistas.dataHora, dataInicio),
        lte(entrevistas.dataHora, dataFim),
        eq(entrevistas.status, 'agendada')
      )
    });
    const entrevistasCandidato = await db.query.entrevistas.findMany({
      where: and(
        eq(entrevistas.candidatoId, candidatoId),
        gte(entrevistas.dataHora, dataInicio),
        lte(entrevistas.dataHora, dataFim),
        eq(entrevistas.status, 'agendada')
      )
    });
    // Exemplo: slots de 1h das 8h às 18h
    const slots: { inicio: Date; fim: Date }[] = [];
    for (let dia = new Date(dataInicio); dia <= dataFim; dia.setDate(dia.getDate() + 1)) {
      for (let hora = 8; hora < 18; hora++) {
        const inicio = new Date(dia);
        inicio.setHours(hora, 0, 0, 0);
        const fim = new Date(inicio);
        fim.setHours(hora + 1);
        // Verifica conflito
        const conflito = [...entrevistasRecrutador, ...entrevistasCandidato].some(e => {
          const eInicio = new Date(e.dataHora);
          const eFim = new Date(eInicio);
          eFim.setHours(eInicio.getHours() + 1);
          return (inicio < eFim && fim > eInicio);
        });
        if (!conflito) {
          slots.push({ inicio: new Date(inicio), fim: new Date(fim) });
        }
      }
    }
    return slots;
  }

  /**
   * Reagendar entrevista (marca como remarcado e salva histórico)
   */
  static async reagendarEntrevista(
    id: string,
    novaDataHora: Date,
    usuarioLogado: Usuario
  ): Promise<Entrevista | null> {
    this.validateUserPermissions(usuarioLogado, 'edit');
    const entrevista = await db.query.entrevistas.findFirst({ where: eq(entrevistas.id, id) });
    if (!entrevista) throw new EntrevistaServiceError("Entrevista não encontrada", "INTERVIEW_NOT_FOUND");
    this.validatePodeEditar(entrevista);
    this.validateDataFutura(novaDataHora);
    // Marcar como remarcado e atualizar data
    const [atualizada] = await db.update(entrevistas)
      .set({
        dataHora: novaDataHora,
        remarcado: true,
        dataAtualizacao: new Date()
      })
      .where(eq(entrevistas.id, id))
      .returning();
    // Registrar evento na timeline
    if (atualizada && atualizada.candidatoId) {
      // Buscar dados completos
      const candidato = await db.query.candidatos.findFirst({ where: eq(candidatos.id, atualizada.candidatoId) });
      const entrevistador = await db.query.usuarios.findFirst({ where: eq(usuarios.id, atualizada.entrevistadorId) });
      const vaga = await db.query.vagas.findFirst({ where: eq(vagas.id, atualizada.vagaId) });
      const dataEntrevista = new Date(atualizada.dataHora).toLocaleString('pt-BR');
      const { TimelineService } = await import('./timeline-service');
      await TimelineService.criarEvento({
        candidatoId: atualizada.candidatoId,
        tipoEvento: 'entrevista_remarcada',
        descricao: `Entrevista remarcada para a vaga "${vaga?.titulo}" em ${dataEntrevista} via ${atualizada.plataforma || atualizada.local || '-'} com ${entrevistador?.nome}.`,
        usuarioResponsavelId: usuarioLogado.id,
        dataEvento: new Date(),
        origem: 'entrevista',
        visivelParaCandidato: true
      });
    }
    return atualizada || null;
  }

  /**
   * Confirmar presença na entrevista
   */
  static async confirmarPresenca(id: string): Promise<Entrevista | null> {
    const [atualizada] = await db.update(entrevistas)
      .set({ confirmado: true, dataAtualizacao: new Date() })
      .where(eq(entrevistas.id, id))
      .returning();
    return atualizada || null;
  }

  /**
   * Registrar feedback pós-entrevista
   */
  static async registrarFeedback(
    id: string,
    avaliadorId: string,
    notas: number,
    comentarios: string
  ): Promise<Entrevista | null> {
    // Feedback obrigatório antes de liberar próxima etapa
    const feedback = {
      avaliadorId,
      notas,
      comentarios,
      data: new Date()
    };
    const [atualizada] = await db.update(entrevistas)
      .set({ avaliacaoPosterior: feedback, dataAtualizacao: new Date() })
      .where(eq(entrevistas.id, id))
      .returning();
    return atualizada || null;
  }

  /**
   * Gerar link de vídeo para entrevista (stub)
   */
  static async gerarLinkVideo(id: string, plataforma: string): Promise<string> {
    // Aqui seria feita a integração real com Zoom/Meet/Jitsi
    // Por enquanto, retorna um link fake
    const link = `https://video.${plataforma}.com/room/${id}`;
    await db.update(entrevistas)
      .set({ linkEntrevista: link, plataforma, dataAtualizacao: new Date() })
      .where(eq(entrevistas.id, id));
    return link;
  }

  /**
   * Integração futura: Google Calendar
   * - Ao agendar, editar ou cancelar entrevista, sincronizar evento no Google Calendar do recrutador
   * - Usar OAuth2 e API do Google
   */
  // static async sincronizarGoogleCalendar(entrevista: Entrevista, acao: 'criar' | 'editar' | 'cancelar') {
  //   // Implementação futura
  // }

  /**
   * Integração futura: Notificações (WhatsApp/Email)
   * - Ao agendar, reagendar ou cancelar, enviar notificação para candidato e recrutador
   * - Usar Twilio, Z-API ou serviço de email
   */
  // static async enviarNotificacao(entrevista: Entrevista, tipo: 'agendamento' | 'reagendamento' | 'cancelamento') {
  //   // Implementação futura
  // }
}

