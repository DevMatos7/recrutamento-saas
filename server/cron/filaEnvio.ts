import cron from 'node-cron';
import { db } from '../db';
import { filaEnvio, mensagensWhatsapp } from '@shared/schema';
import { eq, and, lte } from 'drizzle-orm';
import { whatsappService } from '../whatsapp/service';

export class FilaEnvioService {
  private cronJob: cron.ScheduledTask | null = null;

  constructor() {
    this.inicializarAgendamento();
  }

  // Inicializar agendamento para processar fila a cada 10 minutos
  private inicializarAgendamento() {
    this.cronJob = cron.schedule('*/10 * * * *', async () => {
      console.log('🕒 Processando fila de envio...');
      await this.processarFila();
    }, {
      scheduled: false,
      timezone: 'America/Sao_Paulo'
    });

    // Iniciar o agendamento
    this.cronJob.start();
    console.log('✅ Agendamento de fila de envio iniciado (a cada 10 minutos)');
  }

  // Processar fila de envio
  async processarFila(): Promise<void> {
    try {
      // Buscar mensagens pendentes que devem ser enviadas
      const mensagensPendentes = await db
        .select()
        .from(filaEnvio)
        .where(
          and(
            eq(filaEnvio.status, 'pendente'),
            lte(filaEnvio.dataAgendada, new Date())
          )
        );

      console.log(`📨 Encontradas ${mensagensPendentes.length} mensagens pendentes`);

      for (const mensagem of mensagensPendentes) {
        await this.processarMensagem(mensagem);
      }

    } catch (error) {
      console.error('❌ Erro ao processar fila de envio:', error);
    }
  }

  // Processar mensagem individual
  private async processarMensagem(mensagem: any): Promise<void> {
    try {
      // Verificar se ainda não excedeu o número máximo de tentativas
      if (mensagem.tentativas >= mensagem.maxTentativas) {
        await this.marcarComoErro(mensagem.id, 'Número máximo de tentativas excedido');
        return;
      }

      // Tentar enviar mensagem
      const resultado = await whatsappService.enviarMensagem({
        sessaoId: mensagem.sessaoId,
        candidatoId: mensagem.candidatoId,
        mensagem: mensagem.mensagem,
        evento: mensagem.evento
      });

      if (resultado.success) {
        // Marcar como processado com sucesso
        await this.marcarComoProcessado(mensagem.id);
        console.log(`✅ Mensagem ${mensagem.id} enviada com sucesso`);
      } else {
        // Incrementar tentativas e marcar como erro se necessário
        await this.incrementarTentativa(mensagem.id, resultado.error);
        console.log(`❌ Erro ao enviar mensagem ${mensagem.id}: ${resultado.error}`);
      }

    } catch (error) {
      console.error(`❌ Erro ao processar mensagem ${mensagem.id}:`, error);
      await this.incrementarTentativa(mensagem.id, error instanceof Error ? error.message : 'Erro desconhecido');
    }
  }

  // Marcar mensagem como processada
  private async marcarComoProcessado(mensagemId: string): Promise<void> {
    try {
      await db
        .update(filaEnvio)
        .set({
          status: 'processado',
          processadoEm: new Date()
        })
        .where(eq(filaEnvio.id, mensagemId));
    } catch (error) {
      console.error('Erro ao marcar mensagem como processada:', error);
    }
  }

  // Marcar mensagem como erro
  private async marcarComoErro(mensagemId: string, erro: string): Promise<void> {
    try {
      await db
        .update(filaEnvio)
        .set({
          status: 'erro',
          erro,
          processadoEm: new Date()
        })
        .where(eq(filaEnvio.id, mensagemId));
    } catch (error) {
      console.error('Erro ao marcar mensagem como erro:', error);
    }
  }

  // Incrementar tentativa
  private async incrementarTentativa(mensagemId: string, erro: string): Promise<void> {
    try {
      const [mensagem] = await db
        .select()
        .from(filaEnvio)
        .where(eq(filaEnvio.id, mensagemId));

      if (!mensagem) return;

      const novasTentativas = mensagem.tentativas + 1;
      const status = novasTentativas >= mensagem.maxTentativas ? 'erro' : 'pendente';

      await db
        .update(filaEnvio)
        .set({
          tentativas: novasTentativas,
          status,
          erro: status === 'erro' ? erro : mensagem.erro,
          ...(status === 'erro' && { processadoEm: new Date() })
        })
        .where(eq(filaEnvio.id, mensagemId));
    } catch (error) {
      console.error('Erro ao incrementar tentativa:', error);
    }
  }

  // Adicionar mensagem à fila
  async adicionarMensagem(data: {
    candidatoId: string;
    sessaoId: string;
    evento: string;
    mensagem: string;
    dataAgendada: Date;
  }): Promise<{ success: boolean; error?: string; mensagemId?: string }> {
    try {
      const [novaMensagem] = await db
        .insert(filaEnvio)
        .values({
          candidatoId: data.candidatoId,
          sessaoId: data.sessaoId,
          evento: data.evento,
          mensagem: data.mensagem,
          dataAgendada: data.dataAgendada,
          status: 'pendente',
          tentativas: 0,
          maxTentativas: 3
        })
        .returning();

      console.log(`📝 Mensagem ${novaMensagem.id} adicionada à fila para ${data.dataAgendada}`);

      return { 
        success: true, 
        mensagemId: novaMensagem.id 
      };

    } catch (error) {
      console.error('Erro ao adicionar mensagem à fila:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  // Reprocessar mensagens com erro
  async reprocessarMensagensComErro(): Promise<{ success: boolean; reprocessadas: number; error?: string }> {
    try {
      // Buscar mensagens com erro
      const mensagensComErro = await db
        .select()
        .from(filaEnvio)
        .where(eq(filaEnvio.status, 'erro'));

      console.log(`🔄 Reprocessando ${mensagensComErro.length} mensagens com erro`);

      let reprocessadas = 0;

      for (const mensagem of mensagensComErro) {
        // Resetar tentativas e status
        await db
          .update(filaEnvio)
          .set({
            status: 'pendente',
            tentativas: 0,
            erro: null,
            processadoEm: null
          })
          .where(eq(filaEnvio.id, mensagem.id));

        reprocessadas++;
      }

      return { 
        success: true, 
        reprocessadas 
      };

    } catch (error) {
      console.error('Erro ao reprocessar mensagens:', error);
      return { 
        success: false, 
        reprocessadas: 0,
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  // Obter estatísticas da fila
  async obterEstatisticas(): Promise<any> {
    try {
      const todas = await db.select().from(filaEnvio);
      const pendentes = todas.filter(m => m.status === 'pendente');
      const processadas = todas.filter(m => m.status === 'processado');
      const comErro = todas.filter(m => m.status === 'erro');

      return {
        total: todas.length,
        pendentes: pendentes.length,
        processadas: processadas.length,
        comErro: comErro.length,
        taxaSucesso: todas.length > 0 ? (processadas.length / todas.length) * 100 : 0
      };

    } catch (error) {
      console.error('Erro ao obter estatísticas da fila:', error);
      return {
        total: 0,
        pendentes: 0,
        processadas: 0,
        comErro: 0,
        taxaSucesso: 0
      };
    }
  }

  // Limpar mensagens antigas (mais de 30 dias)
  async limparMensagensAntigas(): Promise<{ success: boolean; removidas: number; error?: string }> {
    try {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - 30);

      const mensagensAntigas = await db
        .select()
        .from(filaEnvio)
        .where(
          and(
            lte(filaEnvio.criadoEm, dataLimite),
            eq(filaEnvio.status, 'processado')
          )
        );

      let removidas = 0;

      for (const mensagem of mensagensAntigas) {
        await db
          .delete(filaEnvio)
          .where(eq(filaEnvio.id, mensagem.id));
        removidas++;
      }

      console.log(`🧹 Removidas ${removidas} mensagens antigas da fila`);

      return { 
        success: true, 
        removidas 
      };

    } catch (error) {
      console.error('Erro ao limpar mensagens antigas:', error);
      return { 
        success: false, 
        removidas: 0,
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  // Parar o agendamento
  parar(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('⏹️ Agendamento de fila de envio parado');
    }
  }

  // Reiniciar o agendamento
  reiniciar(): void {
    this.parar();
    this.inicializarAgendamento();
  }

  // Verificar se está rodando
  estaRodando(): boolean {
    return this.cronJob?.running || false;
  }
}

export const filaEnvioService = new FilaEnvioService();