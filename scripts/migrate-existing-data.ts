#!/usr/bin/env tsx

import { migrarEmpresasEVagasExistentes, verificarStatusMigracao } from "../server/migration-script";

async function main() {
  console.log("🚀 Script de Migração de Dados Existentes");
  console.log("==========================================\n");

  try {
    // Verificar status atual
    console.log("📊 Verificando status atual...");
    const status = await verificarStatusMigracao();
    
    console.log(`\n📈 Status Atual:`);
    console.log(`   - Empresas: ${status.empresasComEtapas}/${status.totalEmpresas} (${status.percentualEmpresas}%)`);
    console.log(`   - Vagas: ${status.vagasComEtapas}/${status.totalVagas} (${status.percentualVagas}%)`);

    if (status.percentualEmpresas === 100 && status.percentualVagas === 100) {
      console.log("\n✅ Todos os dados já estão migrados!");
      process.exit(0);
    }

    // Perguntar se deve executar a migração
    console.log("\n❓ Deseja executar a migração? (y/N)");
    
    // Para scripts automatizados, você pode comentar esta parte
    // e descomentar a linha abaixo para executar automaticamente
    // const shouldExecute = true;
    
    const shouldExecute = process.argv.includes("--auto") || process.argv.includes("-y");
    
    if (!shouldExecute) {
      console.log("❌ Migração cancelada pelo usuário.");
      process.exit(0);
    }

    console.log("\n🔄 Executando migração...");
    await migrarEmpresasEVagasExistentes();

    // Verificar status final
    console.log("\n📊 Verificando status final...");
    const statusFinal = await verificarStatusMigracao();
    
    console.log(`\n🎉 Migração Concluída!`);
    console.log(`   - Empresas: ${statusFinal.empresasComEtapas}/${statusFinal.totalEmpresas} (${statusFinal.percentualEmpresas}%)`);
    console.log(`   - Vagas: ${statusFinal.vagasComEtapas}/${statusFinal.totalVagas} (${statusFinal.percentualVagas}%)`);

    if (statusFinal.percentualEmpresas === 100 && statusFinal.percentualVagas === 100) {
      console.log("\n✅ Todos os dados foram migrados com sucesso!");
    } else {
      console.log("\n⚠️  Alguns dados ainda precisam ser migrados.");
    }

  } catch (error) {
    console.error("\n❌ Erro durante a migração:", error);
    process.exit(1);
  }
}

// Executar o script
main().catch((error) => {
  console.error("❌ Erro fatal:", error);
  process.exit(1);
}); 