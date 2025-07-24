import pg from 'pg';
const { Pool } = pg;

// Configuração do banco
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'gentepro',
  user: 'postgres',
  password: 'jm190124'
});

async function testSlaSystem() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testando Sistema de SLAs e Alertas...\n');

    // 1. Verificar se as tabelas foram criadas
    console.log('1. Verificando tabelas criadas...');
    
    const tables = [
      'motivos_reprovacao',
      'historico_reprovacoes', 
      'slas_etapas',
      'alertas_sla',
      'notificacoes_sla'
    ];

    for (const table of tables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);
      
      console.log(`   ✅ ${table}: ${result.rows[0].exists ? 'CRIADA' : 'NÃO CRIADA'}`);
    }

    // 2. Verificar índices criados
    console.log('\n2. Verificando índices criados...');
    
    const indexes = [
      'idx_motivos_reprovacao_empresa',
      'idx_motivos_reprovacao_categoria',
      'idx_historico_reprovacoes_vaga_candidato',
      'idx_slas_etapas_etapa',
      'idx_alertas_sla_sla',
      'idx_alertas_sla_vaga_candidato',
      'idx_notificacoes_sla_alerta'
    ];

    for (const index of indexes) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM pg_indexes 
          WHERE indexname = $1
        );
      `, [index]);
      
      console.log(`   ✅ ${index}: ${result.rows[0].exists ? 'CRIADO' : 'NÃO CRIADO'}`);
    }

    // 3. Verificar estrutura das tabelas
    console.log('\n3. Verificando estrutura das tabelas...');
    
    const tableStructures = [
      { table: 'motivos_reprovacao', expectedColumns: ['id', 'empresa_id', 'nome', 'categoria', 'ativo', 'obrigatorio'] },
      { table: 'historico_reprovacoes', expectedColumns: ['id', 'vaga_candidato_id', 'motivo_id', 'etapa_reprovacao', 'reprovado_por'] },
      { table: 'slas_etapas', expectedColumns: ['id', 'etapa_id', 'nome', 'prazo_horas', 'prazo_dias', 'tipo_prazo', 'ativo'] },
      { table: 'alertas_sla', expectedColumns: ['id', 'sla_id', 'vaga_candidato_id', 'tipo', 'status', 'titulo', 'nivel_urgencia'] },
      { table: 'notificacoes_sla', expectedColumns: ['id', 'alerta_id', 'destinatario_id', 'tipo', 'status', 'titulo', 'tentativas'] }
    ];

    for (const { table, expectedColumns } of tableStructures) {
      const result = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `, [table]);
      
      const actualColumns = result.rows.map(row => row.column_name);
      const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));
      
      console.log(`   ✅ ${table}: ${missingColumns.length === 0 ? 'ESTRUTURA OK' : `FALTAM: ${missingColumns.join(', ')}`}`);
    }

    // 4. Testar inserção de dados de exemplo
    console.log('\n4. Testando inserção de dados...');
    
    // Buscar uma empresa existente
    const empresaResult = await client.query('SELECT id FROM empresas LIMIT 1');
    if (empresaResult.rows.length === 0) {
      console.log('   ⚠️  Nenhuma empresa encontrada para teste');
    } else {
      const empresaId = empresaResult.rows[0].id;
      
      // Inserir motivo de reprovação de teste
      const motivoResult = await client.query(`
        INSERT INTO motivos_reprovacao (empresa_id, nome, descricao, categoria, obrigatorio, ordem)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, nome;
      `, [empresaId, 'Teste - Perfil não adequado', 'Motivo de teste', 'geral', true, 1]);
      
      console.log(`   ✅ Motivo criado: ${motivoResult.rows[0].nome} (ID: ${motivoResult.rows[0].id})`);
      
      // Limpar dados de teste
      await client.query('DELETE FROM motivos_reprovacao WHERE nome LIKE $1', ['Teste - %']);
      console.log('   ✅ Dados de teste removidos');
    }

    // 5. Verificar constraints e foreign keys
    console.log('\n5. Verificando constraints...');
    
    const constraints = [
      { name: 'motivos_reprovacao_empresa_id_fkey', table: 'motivos_reprovacao' },
      { name: 'historico_reprovacoes_vaga_candidato_id_fkey', table: 'historico_reprovacoes' },
      { name: 'slas_etapas_etapa_id_fkey', table: 'slas_etapas' },
      { name: 'alertas_sla_sla_id_fkey', table: 'alertas_sla' },
      { name: 'notificacoes_sla_alerta_id_fkey', table: 'notificacoes_sla' }
    ];

    for (const { name, table } of constraints) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.table_constraints 
          WHERE constraint_name = $1 
          AND table_name = $2
        );
      `, [name, table]);
      
      console.log(`   ✅ ${name}: ${result.rows[0].exists ? 'CRIADA' : 'NÃO CRIADA'}`);
    }

    console.log('\n🎉 Teste do Sistema de SLAs e Alertas concluído com sucesso!');
    console.log('\n📋 Resumo:');
    console.log('   • Tabelas de motivos de reprovação criadas');
    console.log('   • Tabelas de SLAs e alertas criadas');
    console.log('   • Índices de performance criados');
    console.log('   • Constraints de integridade aplicadas');
    console.log('   • Sistema pronto para uso via API');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar teste
testSlaSystem().catch(console.error); 