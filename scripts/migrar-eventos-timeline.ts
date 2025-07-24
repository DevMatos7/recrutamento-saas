import { db } from '../server/db';
import { eventosTimeline } from '../shared/schema';

// 1. Migração de movimentações de pipeline
async function migrarMovimentacoesPipeline() {
  const movimentacoes = await db.query.vagaCandidatos.findMany();
  for (const mov of movimentacoes) {
    await db.insert(eventosTimeline).values({
      candidatoId: mov.candidatoId,
      dataEvento: mov.dataMovimentacao || mov.dataInscricao,
      tipoEvento: 'movimentacao',
      descricao: `Movimentação de pipeline: etapa ${mov.etapa}`,
      usuarioResponsavelId: mov.responsavelId || '00000000-0000-0000-0000-000000000000',
      visivelParaCandidato: false,
      origem: 'migracao',
    }).onConflictDoNothing();
  }
}

// 2. Migração de entrevistas
async function migrarEntrevistas() {
  const entrevistas = await db.query.entrevistas.findMany();
  for (const ent of entrevistas) {
    await db.insert(eventosTimeline).values({
      candidatoId: ent.candidatoId,
      dataEvento: ent.dataHora,
      tipoEvento: 'entrevista',
      descricao: `Entrevista agendada (${ent.status})`,
      usuarioResponsavelId: ent.entrevistadorId,
      visivelParaCandidato: false,
      origem: 'migracao',
    }).onConflictDoNothing();
  }
}

// 3. Migração de testes
async function migrarTestes() {
  const testes = await db.query.testesResultados.findMany();
  for (const teste of testes) {
    await db.insert(eventosTimeline).values({
      candidatoId: teste.candidatoId,
      dataEvento: teste.dataEnvio,
      tipoEvento: 'teste',
      descricao: `Teste atribuído (${teste.status})`,
      usuarioResponsavelId: '00000000-0000-0000-0000-000000000000',
      visivelParaCandidato: false,
      origem: 'migracao',
    }).onConflictDoNothing();
  }
}

// 4. Migração de comunicações
async function migrarComunicacoes() {
  const comunicacoes = await db.query.comunicacoes.findMany();
  for (const comm of comunicacoes) {
    await db.insert(eventosTimeline).values({
      candidatoId: comm.candidatoId,
      dataEvento: comm.dataEnvio || comm.dataAgendada,
      tipoEvento: 'mensagem',
      descricao: `Comunicação enviada (${comm.tipo} - ${comm.canal})`,
      usuarioResponsavelId: comm.enviadoPor || '00000000-0000-0000-0000-000000000000',
      visivelParaCandidato: false,
      origem: 'migracao',
    }).onConflictDoNothing();
  }
}

async function main() {
  await migrarMovimentacoesPipeline();
  await migrarEntrevistas();
  await migrarTestes();
  await migrarComunicacoes();
  console.log('Migração concluída!');
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 