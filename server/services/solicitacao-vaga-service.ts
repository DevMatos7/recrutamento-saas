import { db } from '../db';
import {
  solicitacoesVaga,
  insertSolicitacaoVagaSchema,
  historicoSolicitacaoVaga,
  InsertSolicitacaoVaga,
  InsertHistoricoSolicitacaoVaga,
  perfisVaga,
  vagas,
  quadrosIdeais,
  quadrosReais,
} from '../../shared/schema';
import { eq } from 'drizzle-orm';

export class SolicitacaoVagaService {
  static async criarSolicitacao(data: InsertSolicitacaoVaga, usuarioId: string) {
    // Validação: se tipo = reposicao, colaborador desligado obrigatório (campo motivo)
    if (data.motivo === 'reposicao' && !data.motivo) {
      throw new Error('Nome do colaborador desligado é obrigatório para reposição.');
    }
    // Validação de quadro ideal
    const quadroIdeal = await db.query.quadrosIdeais.findFirst({
      where: eq(quadrosIdeais.departamentoId, data.departamentoId),
    });
    const quadroReal = await db.query.quadrosReais.findFirst({
      where: eq(quadrosReais.departamentoId, data.departamentoId),
    });
    if (quadroIdeal && quadroReal) {
      const totalAposSolicitacao = quadroReal.quantidadeAtual + data.quantidadeSolicitada;
      if (totalAposSolicitacao > quadroIdeal.quantidadeIdeal) {
        // Pode lançar erro, aviso ou apenas registrar no histórico
        // Aqui apenas lança aviso (frontend pode exibir)
        // throw new Error('Solicitação excede o quadro ideal do setor.');
        // Ou adicionar campo "excedente: true" na resposta
      }
    }
    const solicitacao = await db.insert(solicitacoesVaga).values({
      ...data,
      status: 'pendente',
      criadoPor: usuarioId,
    }).returning();
    await db.insert(historicoSolicitacaoVaga).values({
      solicitacaoId: solicitacao[0].id,
      usuarioId,
      acao: 'criou',
      motivo: data.motivo,
    });
    return solicitacao[0];
  }

  static async listarSolicitacoes(filtro: any = {}) {
    return db.select().from(solicitacoesVaga).where(filtro);
  }

  static async detalharSolicitacao(id: string) {
    return db.query.solicitacoesVaga.findFirst({
      where: eq(solicitacoesVaga.id, id),
    });
  }

  static async editarSolicitacao(id: string, data: Partial<InsertSolicitacaoVaga>, usuarioId: string) {
    await db.update(solicitacoesVaga).set({ ...data }).where(eq(solicitacoesVaga.id, id));
    await db.insert(historicoSolicitacaoVaga).values({
      solicitacaoId: id,
      usuarioId,
      acao: 'editou',
      motivo: data.motivo,
    });
    return this.detalharSolicitacao(id);
  }

  static async criarVagaApartirSolicitacao(solicitacao: any) {
    // Preencher campos obrigatórios da vaga
    const vaga = await db.insert(vagas).values({
      titulo: solicitacao.cargo,
      descricao: solicitacao.motivo || 'Vaga criada a partir de solicitação',
      requisitos: '', // Pode ser ajustado depois
      local: 'A definir', // Pode ser ajustado depois
      tipoContratacao: 'CLT', // Ajustar conforme necessário
      status: 'aberta',
      empresaId: solicitacao.empresaId,
      departamentoId: solicitacao.departamentoId,
      gestorId: solicitacao.criadoPor,
    }).returning();
    return vaga[0];
  }

  static async aprovarSolicitacao(id: string, usuarioId: string) {
    await db.update(solicitacoesVaga).set({ status: 'aprovada', aprovadoPor: usuarioId }).where(eq(solicitacoesVaga.id, id));
    await db.insert(historicoSolicitacaoVaga).values({
      solicitacaoId: id,
      usuarioId,
      acao: 'aprovou',
    });
    // Criar vaga automaticamente
    const solicitacao = await this.detalharSolicitacao(id);
    if (solicitacao) {
      await this.criarVagaApartirSolicitacao(solicitacao);
    }
    return this.detalharSolicitacao(id);
  }

  static async rejeitarSolicitacao(id: string, usuarioId: string, motivo: string) {
    await db.update(solicitacoesVaga).set({ status: 'reprovada' }).where(eq(solicitacoesVaga.id, id));
    await db.insert(historicoSolicitacaoVaga).values({
      solicitacaoId: id,
      usuarioId,
      acao: 'reprovou',
      motivo,
    });
    return this.detalharSolicitacao(id);
  }

  static async listarHistorico(id: string) {
    return db.select().from(historicoSolicitacaoVaga).where(eq(historicoSolicitacaoVaga.solicitacaoId, id));
  }
} 