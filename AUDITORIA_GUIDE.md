# Guia do Sistema de Auditoria de Vagas

## Visão Geral

O sistema de auditoria de vagas registra automaticamente todas as ações realizadas nas vagas (criar, editar, excluir) para fins de rastreabilidade e conformidade.

## Funcionalidades Implementadas

### ✅ Backend
- **Tabela de Auditoria**: `vaga_auditoria` com campos: id, vaga_id, usuario_id, acao, detalhes, data
- **Registro Automático**: Todas as operações CRUD de vagas são registradas automaticamente
- **Endpoint de Consulta**: `GET /api/vagas/:id/auditoria` (apenas para administradores)
- **Métodos de Storage**: `createVagaAuditoria()` e `getAuditoriaByVaga()`

### ✅ Frontend
- **Componente VagaAuditoria**: Modal para exibir histórico de auditoria
- **Botão de Auditoria**: Disponível apenas para administradores na tabela de vagas
- **Interface Responsiva**: Design moderno com cores por tipo de ação

## Como Usar

### 1. Acessar Histórico de Auditoria

1. Faça login como administrador
2. Vá para a página "Gestão de Vagas"
3. Na tabela de vagas, clique no ícone de histórico (📜) na coluna "Ações"
4. O modal de auditoria será aberto mostrando todo o histórico da vaga

### 2. Interpretar os Registros

Cada registro de auditoria contém:
- **Ação**: Tipo de operação (CRIAR, EDITAR, EXCLUIR)
- **Data/Hora**: Quando a ação foi realizada
- **Detalhes**: Informações específicas sobre a mudança
- **Usuário**: Quem realizou a ação

### 3. Cores por Tipo de Ação
- 🟢 **Verde**: Criação de vaga
- 🔵 **Azul**: Edição de vaga
- 🔴 **Vermelho**: Exclusão de vaga

## Testando o Sistema

### Teste Manual
1. Crie uma nova vaga
2. Edite a vaga criada
3. Acesse o histórico de auditoria
4. Verifique se os registros aparecem corretamente

### Teste Automatizado
Execute o script de teste:

```bash
node test-auditoria.js
```

O script irá:
1. Fazer login como administrador
2. Buscar vagas existentes
3. Testar o endpoint de auditoria
4. Criar um registro de teste
5. Verificar se o registro aparece na consulta

## Estrutura do Banco de Dados

```sql
CREATE TABLE vaga_auditoria (
  id TEXT PRIMARY KEY,
  vaga_id TEXT NOT NULL,
  usuario_id TEXT NOT NULL,
  acao TEXT NOT NULL,
  detalhes TEXT,
  data DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vaga_id) REFERENCES vagas(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
```

## Endpoints da API

### GET /api/vagas/:id/auditoria
**Permissão**: Apenas administradores
**Resposta**: Array de registros de auditoria

```json
[
  {
    "id": "uuid",
    "vagaId": "vaga-uuid",
    "usuarioId": "user-uuid",
    "acao": "CRIAR",
    "detalhes": "Vaga criada: Desenvolvedor Frontend",
    "data": "2024-01-15T10:30:00Z"
  }
]
```

## Registros Automáticos

O sistema registra automaticamente:

### Criação de Vaga
- **Ação**: "CRIAR"
- **Detalhes**: "Vaga criada: [título da vaga]"

### Edição de Vaga
- **Ação**: "EDITAR"
- **Detalhes**: "Vaga editada: [campos alterados]"

### Exclusão de Vaga
- **Ação**: "EXCLUIR"
- **Detalhes**: "Vaga excluída: [título da vaga]"

## Próximos Passos

### Melhorias Sugeridas
1. **Filtros de Auditoria**: Por período, usuário, tipo de ação
2. **Exportação**: PDF/Excel do histórico de auditoria
3. **Notificações**: Alertas para ações críticas
4. **Auditoria de Outros Módulos**: Candidatos, usuários, etc.

### Implementação de Filtros
```typescript
// Exemplo de filtros futuros
interface AuditoriaFilters {
  dataInicio?: string;
  dataFim?: string;
  usuarioId?: string;
  acao?: string;
}
```

## Troubleshooting

### Problemas Comuns

1. **"Acesso Negado"**
   - Verifique se o usuário tem perfil "admin"
   - Confirme se está logado corretamente

2. **"Nenhum registro encontrado"**
   - Normal para vagas recém-criadas
   - Verifique se a vaga existe

3. **Erro de Conexão**
   - Confirme se o backend está rodando na porta 5000
   - Verifique as configurações de CORS

### Logs Úteis
```bash
# Verificar logs do backend
tail -f server/logs/app.log

# Verificar se a tabela foi criada
sqlite3 database.db ".schema vaga_auditoria"
```

## Segurança

- Apenas administradores podem acessar o histórico de auditoria
- Todos os registros são imutáveis (não podem ser editados/excluídos)
- Logs de auditoria são mantidos indefinidamente
- Dados sensíveis são mascarados nos detalhes

## Conformidade

O sistema de auditoria atende aos requisitos de:
- **LGPD**: Rastreabilidade de dados pessoais
- **ISO 27001**: Controle de acesso e auditoria
- **SOX**: Registros de mudanças em sistemas críticos 