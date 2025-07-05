import { apiLimiter, authLimiter, candidatePortalLimiter } from './server/middleware/rate-limit.middleware.ts';

console.log('🧪 Testando carregamento do middleware de rate limiting...\n');

console.log('✅ apiLimiter carregado:', typeof apiLimiter);
console.log('✅ authLimiter carregado:', typeof authLimiter);
console.log('✅ candidatePortalLimiter carregado:', typeof candidatePortalLimiter);

console.log('\n📋 Configurações:');
console.log('   apiLimiter windowMs:', apiLimiter.windowMs);
console.log('   apiLimiter max:', apiLimiter.max);
console.log('   authLimiter windowMs:', authLimiter.windowMs);
console.log('   authLimiter max:', authLimiter.max);

console.log('\n✅ Middleware carregado com sucesso!'); 