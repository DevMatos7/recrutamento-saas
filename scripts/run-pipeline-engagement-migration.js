#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const { Pool } = pg;

// Obter __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Iniciando migração das tabelas de engajamento no pipeline...');
    
    // Ler o arquivo de migração
    const migrationPath = path.join(__dirname, '../migrations/004_pipeline_engagement_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Executando script de migração...');
    
    // Executar a migração
    await client.query('BEGIN');
    
    // Executar o SQL completo de uma vez
    console.log('Executando script SQL completo...');
    await client.query(migrationSQL);
    
    await client.query('COMMIT');
    
    console.log('✅ Migração concluída com sucesso!');
    console.log('');
    console.log('📊 Tabelas criadas:');
    console.log('  - logs_movimentacao_pipeline');
    console.log('  - metricas_engajamento');
    console.log('  - candidatos_parados');
    console.log('');
    console.log('🔧 Funcionalidades adicionadas:');
    console.log('  - Logs automáticos de movimentação');
    console.log('  - Cálculo de candidatos parados');
    console.log('  - Métricas de engajamento');
    console.log('  - Triggers automáticos');
    console.log('  - Views para consultas otimizadas');
    console.log('');
    console.log('🎯 Próximos passos:');
    console.log('  1. Reiniciar o servidor para carregar as novas rotas');
    console.log('  2. Acessar /pipeline-engagement para ver o dashboard');
    console.log('  3. Configurar SLAs por etapa se necessário');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro durante a migração:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Verificar se DATABASE_URL está definida
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL não está definida no ambiente');
  console.log('Por favor, defina a variável DATABASE_URL antes de executar a migração');
  process.exit(1);
}

// Executar migração
runMigration().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
}); 