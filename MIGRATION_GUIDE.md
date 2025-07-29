# 🚀 Guia de Migração - Etapas Padrão do Pipeline

Este guia explica como migrar empresas e vagas existentes para o novo sistema de etapas padrão do pipeline.

## 📋 O que mudou?

### ✅ Antes
- Empresas não tinham etapas padrão configuradas
- Vagas não tinham pipeline funcional
- Sistema usava templates temporários
- Dados não eram persistentes

### ✅ Depois
- Empresas têm 12 etapas padrão automaticamente
- Vagas herdam etapas da empresa
- Pipeline totalmente funcional
- Dados persistentes no banco

## 🔧 Como Migrar

### Opção 1: Interface Web (Recomendado)

1. **Acesse o sistema como administrador**
2. **Vá para "Configurações > Modelos de Pipeline"**
3. **Selecione uma empresa no filtro**
4. **Clique na aba "Migração"**
5. **Clique em "Executar Migração"**

### Opção 2: Script de Linha de Comando

```bash
# Verificar status atual
npm run migrate:status

# Executar migração (com confirmação)
npm run migrate:execute

# Executar migração automaticamente
npm run migrate:execute -- --auto
```

### Opção 3: API Direta

```bash
# Verificar status
curl -X GET "http://localhost:3000/api/migracao/status" \
  -H "Authorization: Bearer SEU_TOKEN"

# Executar migração
curl -X POST "http://localhost:3000/api/migracao/executar" \
  -H "Authorization: Bearer SEU_TOKEN"
```

## 📊 O que a migração faz?

### Para Empresas
- ✅ Cria 12 etapas padrão do pipeline
- ✅ Define cores e descrições
- ✅ Configura campos obrigatórios
- ✅ Estabelece ordem das etapas

### Para Vagas
- ✅ Aplica etapas da empresa à vaga
- ✅ Cria pipeline funcional
- ✅ Herda configurações da empresa
- ✅ Permite movimentação de candidatos

## 🛡️ Segurança

### ✅ A migração é segura porque:
- **Não afeta dados existentes** (candidatos, inscrições, etc.)
- **Não sobrescreve** empresas/vagas que já têm etapas
- **Cria apenas o que está faltando**
- **Pode ser executada múltiplas vezes** sem problemas

### ✅ Dados preservados:
- Candidatos e suas informações
- Inscrições em vagas
- Histórico de movimentações
- Configurações personalizadas existentes

## 📈 Etapas Padrão Criadas

| Ordem | Nome | Descrição | Cor |
|-------|------|-----------|-----|
| 1 | Recebidos | Candidatos recém-inscritos | Azul |
| 2 | Triagem de Currículos | Análise inicial de currículos | Amarelo |
| 3 | Entrevista RH | Entrevista com Recursos Humanos | Verde |
| 4 | Entrevista Gestor | Entrevista com gestor da área | Roxo |
| 5 | Testes Técnicos | Avaliações técnicas e comportamentais | Vermelho |
| 6 | Aprovação Final | Aprovação final da contratação | Verde Escuro |
| 7 | Documentação Admissional | Coleta de documentos para admissão | Roxo |
| 8 | Exames Médicos | Exames médicos admissionais | Vermelho |
| 9 | Assinatura de Contrato | Assinatura do contrato de trabalho | Laranja |
| 10 | Onboarding | Processo de integração do novo colaborador | Azul Claro |
| 11 | Primeiro Dia | Primeiro dia de trabalho | Verde |
| 12 | Contratação | Efetivação após período de experiência | Verde Escuro |

## 🔍 Verificando o Status

### Interface Web
- A aba "Migração" mostra o progresso em tempo real
- Atualiza automaticamente a cada 5 segundos
- Exibe percentuais e quantidades

### Script de Comando
```bash
npm run migrate:status
```

### API
```bash
curl -X GET "http://localhost:3000/api/migracao/status"
```

## ⚠️ Recomendações

### ✅ Horário Ideal
- Execute em horário de baixo uso do sistema
- Evite horários de pico (manhã/entrada)
- Recomendado: final de semana ou madrugada

### ✅ Backup
- Faça backup do banco antes da migração
- Teste em ambiente de desenvolvimento primeiro
- Monitore o processo durante a execução

### ✅ Monitoramento
- Acompanhe os logs durante a migração
- Verifique o status após a conclusão
- Teste algumas vagas para confirmar funcionamento

## 🚨 Troubleshooting

### Erro: "Empresa não encontrada"
- Verifique se o ID da empresa está correto
- Confirme se a empresa existe no banco

### Erro: "Vaga não encontrada"
- Verifique se o ID da vaga está correto
- Confirme se a vaga existe no banco

### Erro: "Acesso negado"
- Certifique-se de estar logado como administrador
- Verifique se o token de autenticação é válido

### Migração não completa
- Execute novamente a migração
- Verifique os logs para identificar problemas
- Entre em contato com o suporte se necessário

## 📞 Suporte

Se encontrar problemas durante a migração:

1. **Verifique os logs** do sistema
2. **Teste em ambiente de desenvolvimento**
3. **Documente o erro** com detalhes
4. **Entre em contato** com a equipe técnica

## 🎉 Após a Migração

### ✅ O que você pode fazer:
- Configurar etapas personalizadas por empresa
- Adicionar checklists específicos
- Mover candidatos entre etapas
- Usar todas as funcionalidades do pipeline

### ✅ Benefícios alcançados:
- Pipeline funcional para todas as vagas
- Padronização dos processos
- Melhor experiência do usuário
- Dados consistentes e persistentes

---

**🎯 Resultado Final:** Todas as empresas e vagas terão um pipeline completo e funcional! 