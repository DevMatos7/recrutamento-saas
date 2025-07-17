# 📚 Módulo Quadro Ideal — API

## 1. Quadro Ideal

### Listar quadros ideais
**GET** `/api/quadro-ideal`

### Criar quadro ideal
**POST** `/api/quadro-ideal`
```json
{
  "departamentoId": "uuid",
  "cargo": "Vendedor",
  "quantidadeIdeal": 10
}
```

### Atualizar quadro ideal
**PUT** `/api/quadro-ideal/:id`
```json
{
  "quantidadeIdeal": 12
}
```

### Deletar quadro ideal
**DELETE** `/api/quadro-ideal/:id`

---

## 2. Quadro Real

### Listar quadros reais
**GET** `/api/quadro-real`

### Criar quadro real
**POST** `/api/quadro-real`
```json
{
  "departamentoId": "uuid",
  "cargo": "Vendedor",
  "quantidadeAtual": 8
}
```

---

## 3. Solicitação de Vaga

### Listar solicitações
**GET** `/api/solicitacoes-vaga`

### Criar solicitação manual
**POST** `/api/solicitacoes-vaga`
```json
{
  "departamentoId": "uuid",
  "cargo": "Vendedor",
  "quantidadeSolicitada": 2,
  "motivo": "Aumento de demanda"
}
```

### Aprovar/Reprovar solicitação
**PUT** `/api/solicitacoes-vaga/:id/aprovar`
**PUT** `/api/solicitacoes-vaga/:id/reprovar`

---

## 4. Histórico de Quadro Ideal

**GET** `/api/quadro-ideal/historico/:quadroIdealId`

---

## 5. Alertas/Gaps

**GET** `/api/quadro-ideal/alertas`
```json
[
  {
    "empresaId": "uuid",
    "departamentoId": "uuid",
    "cargo": "Vendedor",
    "ideal": 10,
    "atual": 7,
    "gap": -3,
    "status": "crítico",
    "cor": "vermelho",
    "acaoSugerida": "Abrir vaga"
  }
]
```

---

## 6. Importação via CSV

### Quadro Ideal
**POST** `/api/quadro-ideal/importar-csv`
- Form-data: `file` (arquivo CSV)
- CSV esperado:
```csv
departamentoId,cargo,quantidadeIdeal
uuid1,Vendedor,10
uuid2,Gerente,2
```

### Quadro Real (com abertura automática)
**POST** `/api/quadro-real/importar-csv`
- Form-data: `file` (arquivo CSV)
- CSV esperado:
```csv
departamentoId,cargo,quantidadeAtual
uuid1,Vendedor,7
uuid2,Gerente,1
```

---

## 7. Abertura automática de solicitações de vaga

**POST** `/api/solicitacoes-vaga/automatica`
- Dispara a rotina de abertura automática para gaps críticos.

---

## Como testar

- Use Postman, Insomnia ou similar para enviar requests autenticados.
- Para importação, envie o arquivo CSV como `file` no corpo do formulário.
- Após importar Quadro Real, verifique as solicitações de vaga abertas automaticamente.

---

**Dúvidas ou sugestões? Consulte a equipe de desenvolvimento.** 