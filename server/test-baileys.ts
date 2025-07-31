import { makeWASocket } from 'baileys';

console.log('Testando importação do Baileys...');
console.log('makeWASocket:', typeof makeWASocket);

if (typeof makeWASocket === 'function') {
  console.log('✅ makeWASocket é uma função!');
} else {
  console.log('❌ makeWASocket não é uma função');
}