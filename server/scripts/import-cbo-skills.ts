import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../db';
import { skills } from '@shared/schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function importSkillsFromLista() {
  const csvPath = path.resolve(__dirname, '../../attached_assets/lista.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split(/\r?\n/);
  let count = 0;
  const seen = new Set();
  for (let i = 1; i < lines.length; i++) { // pula o header
    const line = lines[i].trim();
    if (!line) continue;
    const [codigo, nome, tipo] = line.split(',');
    if (!codigo || !nome) continue;
    const key = `${codigo.trim()}|${nome.trim()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    try {
      await db.insert(skills).values({
        nome: nome.trim(),
        codigoExterno: `CBO:${codigo.trim()}`,
        categoria: tipo?.trim() || 'Ocupação',
      }).onConflictDoNothing();
      count++;
    } catch (e) {
      console.error('Erro ao inserir skill:', nome, e);
    }
  }
  console.log(`Importação concluída. Total de skills importadas: ${count}`);
}

importSkillsFromLista(); 