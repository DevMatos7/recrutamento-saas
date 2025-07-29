import { DatabaseStorage } from "./storage";
import { db } from "./db";
import { empresas, vagas, pipelineEtapas } from "@shared/schema";
import { eq, isNull } from "drizzle-orm";

const storage = new DatabaseStorage();

export async function migrarEmpresasEVagasExistentes() {
  console.log("🚀 Iniciando migração de empresas e vagas existentes...");
  
  try {
    // 1. Buscar todas as empresas
    const todasEmpresas = await db.select().from(empresas);
    console.log(`📊 Encontradas ${todasEmpresas.length} empresas para migrar`);

    // 2. Para cada empresa, verificar se já tem etapas padrão
    for (const empresa of todasEmpresas) {
      console.log(`\n🏢 Processando empresa: ${empresa.nome} (ID: ${empresa.id})`);
      
      // Verificar se a empresa já tem etapas padrão
      const etapasExistentes = await storage.getEtapasPipelineByEmpresa(empresa.id);
      
      if (etapasExistentes.length === 0) {
        console.log(`  ⚠️  Empresa não tem etapas padrão. Criando...`);
        await storage.criarEtapasPadraoParaEmpresa(empresa.id);
        console.log(`  ✅ Etapas padrão criadas para ${empresa.nome}`);
      } else {
        console.log(`  ✅ Empresa já tem ${etapasExistentes.length} etapas configuradas`);
      }
    }

    // 3. Buscar todas as vagas
    const todasVagas = await db.select().from(vagas);
    console.log(`\n📋 Encontradas ${todasVagas.length} vagas para verificar`);

    // 4. Para cada vaga, verificar se tem etapas do pipeline
    for (const vaga of todasVagas) {
      console.log(`\n💼 Processando vaga: ${vaga.titulo} (ID: ${vaga.id})`);
      
      // Verificar se a vaga já tem etapas do pipeline
      const etapasVaga = await db.select()
        .from(pipelineEtapas)
        .where(eq(pipelineEtapas.vagaId, vaga.id));
      
      if (etapasVaga.length === 0) {
        console.log(`  ⚠️  Vaga não tem etapas do pipeline. Criando...`);
        await storage.criarEtapasPadraoParaVaga(vaga.id, vaga.empresaId);
        console.log(`  ✅ Etapas do pipeline criadas para vaga: ${vaga.titulo}`);
      } else {
        console.log(`  ✅ Vaga já tem ${etapasVaga.length} etapas do pipeline`);
      }
    }

    console.log("\n🎉 Migração concluída com sucesso!");
    console.log(`📊 Resumo:`);
    console.log(`   - Empresas processadas: ${todasEmpresas.length}`);
    console.log(`   - Vagas processadas: ${todasVagas.length}`);
    
  } catch (error) {
    console.error("❌ Erro durante a migração:", error);
    throw error;
  }
}

// Função para verificar o status da migração
export async function verificarStatusMigracao() {
  console.log("🔍 Verificando status da migração...");
  
  try {
    const todasEmpresas = await db.select().from(empresas);
    const todasVagas = await db.select().from(vagas);
    
    let empresasComEtapas = 0;
    let vagasComEtapas = 0;
    
    // Verificar empresas com etapas
    for (const empresa of todasEmpresas) {
      const etapas = await storage.getEtapasPipelineByEmpresa(empresa.id);
      if (etapas.length > 0) empresasComEtapas++;
    }
    
    // Verificar vagas com etapas
    for (const vaga of todasVagas) {
      const etapas = await db.select()
        .from(pipelineEtapas)
        .where(eq(pipelineEtapas.vagaId, vaga.id));
      if (etapas.length > 0) vagasComEtapas++;
    }
    
    console.log(`📊 Status da Migração:`);
    console.log(`   - Total de empresas: ${todasEmpresas.length}`);
    console.log(`   - Empresas com etapas: ${empresasComEtapas}`);
    console.log(`   - Total de vagas: ${todasVagas.length}`);
    console.log(`   - Vagas com etapas: ${vagasComEtapas}`);
    
    const percentualEmpresas = ((empresasComEtapas / todasEmpresas.length) * 100).toFixed(1);
    const percentualVagas = ((vagasComEtapas / todasVagas.length) * 100).toFixed(1);
    
    console.log(`   - Percentual empresas migradas: ${percentualEmpresas}%`);
    console.log(`   - Percentual vagas migradas: ${percentualVagas}%`);
    
    return {
      totalEmpresas: todasEmpresas.length,
      empresasComEtapas,
      totalVagas: todasVagas.length,
      vagasComEtapas,
      percentualEmpresas: parseFloat(percentualEmpresas),
      percentualVagas: parseFloat(percentualVagas)
    };
    
  } catch (error) {
    console.error("❌ Erro ao verificar status:", error);
    throw error;
  }
}

// Função para migração seletiva (apenas empresas/vagas específicas)
export async function migrarEmpresaEspecifica(empresaId: string) {
  console.log(`🏢 Migrando empresa específica: ${empresaId}`);
  
  try {
    // Verificar se empresa existe
    const empresa = await db.select().from(empresas).where(eq(empresas.id, empresaId)).limit(1);
    if (empresa.length === 0) {
      throw new Error(`Empresa com ID ${empresaId} não encontrada`);
    }
    
    // Criar etapas padrão para a empresa
    await storage.criarEtapasPadraoParaEmpresa(empresaId);
    console.log(`✅ Etapas padrão criadas para empresa: ${empresa[0].nome}`);
    
    // Buscar vagas da empresa
    const vagasEmpresa = await db.select().from(vagas).where(eq(vagas.empresaId, empresaId));
    console.log(`📋 Encontradas ${vagasEmpresa.length} vagas para a empresa`);
    
    // Criar etapas para cada vaga
    for (const vaga of vagasEmpresa) {
      const etapasVaga = await db.select()
        .from(pipelineEtapas)
        .where(eq(pipelineEtapas.vagaId, vaga.id));
      
      if (etapasVaga.length === 0) {
        await storage.criarEtapasPadraoParaVaga(vaga.id, empresaId);
        console.log(`  ✅ Etapas criadas para vaga: ${vaga.titulo}`);
      } else {
        console.log(`  ✅ Vaga ${vaga.titulo} já tem etapas`);
      }
    }
    
    console.log(`🎉 Migração da empresa ${empresa[0].nome} concluída!`);
    
  } catch (error) {
    console.error("❌ Erro na migração da empresa:", error);
    throw error;
  }
}

// Função para migração seletiva de vagas
export async function migrarVagaEspecifica(vagaId: string) {
  console.log(`💼 Migrando vaga específica: ${vagaId}`);
  
  try {
    // Verificar se vaga existe
    const vaga = await db.select().from(vagas).where(eq(vagas.id, vagaId)).limit(1);
    if (vaga.length === 0) {
      throw new Error(`Vaga com ID ${vagaId} não encontrada`);
    }
    
    // Verificar se já tem etapas
    const etapasVaga = await db.select()
      .from(pipelineEtapas)
      .where(eq(pipelineEtapas.vagaId, vagaId));
    
    if (etapasVaga.length === 0) {
      await storage.criarEtapasPadraoParaVaga(vagaId, vaga[0].empresaId);
      console.log(`✅ Etapas criadas para vaga: ${vaga[0].titulo}`);
    } else {
      console.log(`✅ Vaga ${vaga[0].titulo} já tem ${etapasVaga.length} etapas`);
    }
    
    console.log(`🎉 Migração da vaga ${vaga[0].titulo} concluída!`);
    
  } catch (error) {
    console.error("❌ Erro na migração da vaga:", error);
    throw error;
  }
} 