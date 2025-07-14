import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../db';
import { skills } from '@shared/schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function importExtendedSkills() {
  console.log('🚀 Iniciando importação de competências estendidas...');
  
  // Ler arquivos CSV
  const listaPath = path.resolve(__dirname, '../../attached_assets/lista.csv');
  const canonicosPath = path.resolve(__dirname, '../../attached_assets/lista_canonicos.csv');
  
  const listaContent = fs.readFileSync(listaPath, 'utf-8');
  const canonicosContent = fs.readFileSync(canonicosPath, 'utf-8');
  
  // Processar arquivo de canônicos primeiro (prioridade)
  const canonicos = new Map<string, string>();
  const canonicosLines = canonicosContent.split(/\r?\n/);
  
  console.log('📖 Processando ocupações canônicas...');
  for (let i = 1; i < canonicosLines.length; i++) { // pula header
    const line = canonicosLines[i].trim();
    if (!line) continue;
    
    const [codigo, termo] = line.split(',');
    if (!codigo || !termo) continue;
    
    canonicos.set(codigo.trim(), termo.trim());
  }
  
  console.log(`✅ ${canonicos.size} ocupações canônicas processadas`);
  
  // Processar arquivo completo
  const listaLines = listaContent.split(/\r?\n/);
  const skillsToImport = new Map<string, { nome: string; codigo: string; tipo: string }>();
  
  console.log('📖 Processando lista completa...');
  for (let i = 1; i < listaLines.length; i++) { // pula header
    const line = listaLines[i].trim();
    if (!line) continue;
    
    const [codigo, termo, tipo] = line.split(',');
    if (!codigo || !termo) continue;
    
    const codigoClean = codigo.trim();
    const termoClean = termo.trim();
    const tipoClean = tipo?.trim() || 'Ocupação';
    
    // Priorizar ocupações canônicas
    if (canonicos.has(codigoClean)) {
      skillsToImport.set(codigoClean, {
        nome: canonicos.get(codigoClean)!,
        codigo: codigoClean,
        tipo: 'Ocupação'
      });
    } else if (tipoClean === 'Ocupação') {
      // Se não é canônico mas é ocupação, usar o termo original
      skillsToImport.set(codigoClean, {
        nome: termoClean,
        codigo: codigoClean,
        tipo: tipoClean
      });
    }
  }
  
  console.log(`✅ ${skillsToImport.size} competências únicas identificadas`);
  
  // Verificar competências já existentes
  const existingSkills = await db.select().from(skills);
  const existingCodes = new Set(existingSkills.map(s => s.codigoExterno?.replace('CBO:', '') || ''));
  
  console.log(`📊 ${existingSkills.length} competências já existem no banco`);
  
  // Filtrar apenas as novas
  const newSkills = Array.from(skillsToImport.values()).filter(skill => 
    !existingCodes.has(skill.codigo)
  );
  
  console.log(`🆕 ${newSkills.length} novas competências para importar`);
  
  if (newSkills.length === 0) {
    console.log('✅ Nenhuma nova competência para importar!');
    return;
  }
  
  // Importar novas competências
  let importedCount = 0;
  let errorCount = 0;
  
  for (const skill of newSkills) {
    try {
      await db.insert(skills).values({
        nome: skill.nome,
        codigoExterno: `CBO:${skill.codigo}`,
        categoria: skill.tipo === 'Ocupação' ? 'CBO' : 'CBO-Sinônimo'
      }).onConflictDoNothing();
      
      importedCount++;
      
      if (importedCount % 100 === 0) {
        console.log(`📦 Importadas ${importedCount} competências...`);
      }
    } catch (error) {
      console.error(`❌ Erro ao importar "${skill.nome}":`, error);
      errorCount++;
    }
  }
  
  console.log('\n🎉 Importação concluída!');
  console.log(`✅ ${importedCount} competências importadas com sucesso`);
  if (errorCount > 0) {
    console.log(`❌ ${errorCount} erros durante a importação`);
  }
  
  // Estatísticas finais
  const totalSkills = await db.select().from(skills);
  console.log(`📊 Total de competências no banco: ${totalSkills.length}`);
  
  // Categorias
  const categorias = await db.select({ categoria: skills.categoria }).from(skills);
  const categoriaCount = categorias.reduce((acc, item) => {
    acc[item.categoria || 'Sem categoria'] = (acc[item.categoria || 'Sem categoria'] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('\n📈 Distribuição por categoria:');
  Object.entries(categoriaCount).forEach(([categoria, count]) => {
    console.log(`  ${categoria}: ${count}`);
  });
}

importExtendedSkills().catch(console.error); 