import { db } from "./db";
import { questoesDisc } from "@shared/schema";

const blocosDisc = [
  {
    bloco: "A",
    frases: [
      { texto: "Assertiva", fator: "D" },
      { texto: "Ser decisivo", fator: "I" },
      { texto: "Variedade", fator: "S" },
      { texto: "Ditatorial", fator: "C" }
    ]
  },
  {
    bloco: "B",
    frases: [
      { texto: "Persuasiva", fator: "D" },
      { texto: "Amizade social", fator: "I" },
      { texto: "Menos estrutura", fator: "S" },
      { texto: "Sarcástico", fator: "C" }
    ]
  },
  {
    bloco: "C",
    frases: [
      { texto: "Paciente", fator: "D" },
      { texto: "Companheirismo", fator: "I" },
      { texto: "Pensar primeiro", fator: "S" },
      { texto: "Contemplativo", fator: "C" }
    ]
  },
  {
    bloco: "D",
    frases: [
      { texto: "Demanda ação", fator: "D" },
      { texto: "Solucionador de problemas", fator: "I" },
      { texto: "Informa e erra diretamente", fator: "S" },
      { texto: "Crítico", fator: "C" }
    ]
  },
  {
    bloco: "E",
    frases: [
      { texto: "Ataca", fator: "D" },
      { texto: "Encorajador", fator: "I" },
      { texto: "Chama a pessoa e explica o erro", fator: "S" },
      { texto: "Superficial", fator: "C" }
    ]
  },
  {
    bloco: "F",
    frases: [
      { texto: "Reclama", fator: "D" },
      { texto: "Suporter", fator: "I" },
      { texto: "Fica calado e aceita o erro", fator: "S" },
      { texto: "Indeciso", fator: "C" }
    ]
  },
  {
    bloco: "G",
    frases: [
      { texto: "Evita", fator: "D" },
      { texto: "Organizador", fator: "I" },
      { texto: "Insposível e quesitonado", fator: "S" },
      { texto: "Cabeça dura", fator: "C" }
    ]
  },
  {
    bloco: "H",
    frases: [
      { texto: "Competição", fator: "D" },
      { texto: "Direto", fator: "I" },
      { texto: "Possui medo do", fator: "S" },
      { texto: "Histórico", fator: "C" }
    ]
  },
  {
    bloco: "I",
    frases: [
      { texto: "Aprovação", fator: "D" },
      { texto: "Desenganizado", fator: "I" },
      { texto: "Mudança brusca", fator: "S" },
      { texto: "Reconhecimento", fator: "C" }
    ]
  },
  {
    bloco: "J",
    frases: [
      { texto: "Bolhas", fator: "D" },
      { texto: "Entusiasmo", fator: "I" },
      { texto: "Detalhista", fator: "S" },
      { texto: "Precisão", fator: "C" }
    ]
  },
  {
    bloco: "K",
    frases: [
      { texto: "Padrão", fator: "D" },
      { texto: "Impacto", fator: "I" },
      { texto: "Estar errado", fator: "S" },
      { texto: "Meticuloso", fator: "C" }
    ]
  },
  {
    bloco: "L",
    frases: [
      { texto: "Independente", fator: "D" },
      { texto: "Intenso", fator: "I" },
      { texto: "Ser responsabilizado", fator: "S" },
      { texto: "Elgoíco", fator: "C" }
    ]
  },
  {
    bloco: "M",
    frases: [
      { texto: "Interativo", fator: "D" },
      { texto: "Não tradicional", fator: "I" },
      { texto: "Realizar compromissos", fator: "S" },
      { texto: "Relaciona a pessoas", fator: "C" }
    ]
  },
  {
    bloco: "N",
    frases: [
      { texto: "Estável", fator: "D" },
      { texto: "Indeciso", fator: "I" },
      { texto: "Necessidade de mudança", fator: "S" },
      { texto: "Estruturado", fator: "C" }
    ]
  },
  {
    bloco: "O",
    frases: [
      { texto: "Corretivo", fator: "D" },
      { texto: "Impressivo", fator: "I" },
      { texto: "Tomada de decisão", fator: "S" },
      { texto: "Qualidade dos resultados", fator: "C" }
    ]
  },
  {
    bloco: "P",
    frases: [
      { texto: "Se limita e confronta", fator: "D" },
      { texto: "Se preocupa demais com metas", fator: "I" },
      { texto: "Empatia e Paciência", fator: "S" },
      { texto: "Busca ter a razão", fator: "C" }
    ]
  },
  {
    bloco: "Q",
    frases: [
      { texto: "Nem liga, está diabtraído", fator: "D" },
      { texto: "Tem que pensar", fator: "I" },
      { texto: "Gosda emocional", fator: "S" },
      { texto: "Busca diminuir o conflito", fator: "C" }
    ]
  },
  {
    bloco: "R",
    frases: [
      { texto: "Sabe do atraso, mas aceita", fator: "D" },
      { texto: "Procrastina ao invés de fazer", fator: "I" },
      { texto: "Ser assertivo sob pressão", fator: "S" },
      { texto: "Busca concordância", fator: "C" }
    ]
  },
  {
    bloco: "S",
    frases: [
      { texto: "Reclama e critica a situação", fator: "D" },
      { texto: "Analisa demais", fator: "I" },
      { texto: "Se preocupar menos sobre tudo", fator: "S" },
      { texto: "Busca comparar sua opinião", fator: "C" }
    ]
  },
  {
    bloco: "T",
    frases: [
      { texto: "Ambicioso", fator: "D" },
      { texto: "Afetivo", fator: "I" },
      { texto: "Apto em cheque", fator: "S" },
      { texto: "Analítico", fator: "C" }
    ]
  },
  {
    bloco: "U",
    frases: [
      { texto: "Bem humorado", fator: "D" },
      { texto: "Bonzinho", fator: "I" },
      { texto: "Motiva aos demais a alcançar seus objetivos", fator: "S" },
      { texto: "Busca detalhes", fator: "C" }
    ]
  },
  {
    bloco: "V",
    frases: [
      { texto: "Confiante", fator: "D" },
      { texto: "Convincente", fator: "I" },
      { texto: "Negocia conflitos", fator: "S" },
      { texto: "Cauteloso", fator: "C" }
    ]
  },
  {
    bloco: "W",
    frases: [
      { texto: "Confiável", fator: "D" },
      { texto: "Entusiasta", fator: "I" },
      { texto: "Organiza as prioridades", fator: "S" },
      { texto: "Comprometido", fator: "C" }
    ]
  },
  {
    bloco: "X",
    frases: [
      { texto: "Esforçado", fator: "D" },
      { texto: "Expressivo", fator: "I" },
      { texto: "Liberdade para executar sozinho", fator: "S" },
      { texto: "Factual", fator: "C" }
    ]
  }
];

export async function seedQuestoesDisc() {
  try {
    console.log("Verificando questões DISC existentes...");
    
    const existingQuestions = await db.select().from(questoesDisc).limit(1);
    
    if (existingQuestions.length > 0) {
      console.log("Questões DISC já existem no banco de dados.");
      return;
    }

    console.log("Inserindo questões DISC...");
    
    for (const bloco of blocosDisc) {
      for (let i = 0; i < bloco.frases.length; i++) {
        const frase = bloco.frases[i];
        await db.insert(questoesDisc).values({
          bloco: bloco.bloco,
          ordem: i + 1,
          frase: frase.texto,
          fator: frase.fator as "D" | "I" | "S" | "C",
        });
      }
    }
    
    console.log("Questões DISC inseridas com sucesso!");
  } catch (error) {
    console.error("Erro ao inserir questões DISC:", error);
    throw error;
  }
}