#!/bin/bash

echo "🔧 Configuração da Chave da API OpenAI"
echo "========================================"
echo ""
echo "O erro que você está enfrentando é devido a uma chave da API OpenAI inválida."
echo ""
echo "Para resolver este problema:"
echo ""
echo "1. Acesse: https://platform.openai.com/api-keys"
echo "2. Faça login na sua conta OpenAI"
echo "3. Clique em 'Create new secret key'"
echo "4. Copie a chave gerada (começa com 'sk-')"
echo "5. Execute o comando abaixo substituindo 'SUA_CHAVE_AQUI' pela chave real:"
echo ""
echo "sed -i 's/OPENAI_API_KEY=.*/OPENAI_API_KEY=SUA_CHAVE_AQUI/' .env"
echo ""
echo "Exemplo:"
echo "sed -i 's/OPENAI_API_KEY=.*/OPENAI_API_KEY=sk-abc123def456ghi789/' .env"
echo ""
echo "6. Reinicie o servidor após a alteração:"
echo "   pkill -f 'node.*server/index.ts'"
echo "   npm run dev"
echo ""
echo "⚠️  IMPORTANTE:"
echo "- A chave deve começar com 'sk-'"
echo "- Não compartilhe sua chave com ninguém"
echo "- A chave atual no arquivo .env está inválida"
echo ""
echo "Após configurar a chave correta, a funcionalidade de IA para geração de vagas funcionará normalmente." 