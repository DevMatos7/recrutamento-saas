import { db } from '../db';
import { skills, candidatoSkills, vagaSkills } from '@shared/schema';

async function main() {
  await db.delete(candidatoSkills);
  await db.delete(vagaSkills);
  await db.delete(skills);
  console.log('Skills, candidato_skills e vaga_skills deletados');
}

main().then(() => process.exit(0)); 