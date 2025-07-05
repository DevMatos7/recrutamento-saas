import { db } from "./db";
import { questoesDisc } from "@shared/schema";

const blocosDisc = [
  {
    bloco: "A",
    titulo: "Tende a agir de forma...",
    frases: [
      { texto: "Assertiva", fator: "D" },
      { texto: "Persuasiva", fator: "I" },
      { texto: "Paciente", fator: "S" },
      { texto: "Contemplativa", fator: "C" }
    ]
  },
  {
    bloco: "B",
    titulo: "Confunde-me com...",
    frases: [
      { texto: "Ser decisivo", fator: "D" },
      { texto: "Amizade social", fator: "I" },
      { texto: "Ser parte de um time", fator: "S" },
      { texto: "Seguimento e ordem", fator: "C" }
    ]
  },
  {
    bloco: "C",
    titulo: "Desejo de...",
    frases: [
      { texto: "Variedade", fator: "D" },
      { texto: "Menos estrutura", fator: "I" },
      { texto: "Harmonia", fator: "S" },
      { texto: "Lógica", fator: "C" }
    ]
  },
  {
    bloco: "D",
    titulo: "Sob estresse pode se tornar...",
    frases: [
      { texto: "Ditador", fator: "D" },
      { texto: "Sarcástico", fator: "I" },
      { texto: "Submisso", fator: "S" },
      { texto: "Afastado", fator: "C" }
    ]
  },
  {
    bloco: "E",
    titulo: "Característica principal...",
    frases: [
      { texto: "Franco", fator: "D" },
      { texto: "Otimista", fator: "I" },
      { texto: "Prestativo", fator: "S" },
      { texto: "Oportuno", fator: "C" }
    ]
  },
  {
    bloco: "F",
    titulo: "Quando em conflito, esse estilo...",
    frases: [
      { texto: "Demanda ação", fator: "D" },
      { texto: "Ataca", fator: "I" },
      { texto: "Reclama", fator: "S" },
      { texto: "Evita", fator: "C" }
    ]
  },
  {
    bloco: "G",
    titulo: "Força aparente...",
    frases: [
      { texto: "Solucionador de problemas", fator: "D" },
      { texto: "Encorajador", fator: "I" },
      { texto: "Suporte", fator: "S" },
      { texto: "Organizador", fator: "C" }
    ]
  },
  {
    bloco: "H",
    titulo: "Com erros...",
    frases: [
      { texto: "Informa o erro diretamente", fator: "D" },
      { texto: "Chama a pessoa e explica o erro", fator: "I" },
      { texto: "Fica calado e aceita o erro", fator: "S" },
      { texto: "Se incomoda e questiona", fator: "C" }
    ]
  },
  {
    bloco: "I",
    titulo: "Sob estresse pode se tornar...",
    frases: [
      { texto: "Crítico", fator: "D" },
      { texto: "Superficial", fator: "I" },
      { texto: "Indeciso", fator: "S" },
      { texto: "Cabeça dura", fator: "C" }
    ]
  },
  {
    bloco: "J",
    titulo: "Pode ser considerado...",
    frases: [
      { texto: "Impaciente", fator: "D" },
      { texto: "Importuno", fator: "I" },
      { texto: "Indeciso", fator: "S" },
      { texto: "Inseguro", fator: "C" }
    ]
  },
  {
    bloco: "K",
    titulo: "Mensura desempenho com...",
    frases: [
      { texto: "Resultados", fator: "D" },
      { texto: "Reconhecimento", fator: "I" },
      { texto: "Compatibilidade", fator: "S" },
      { texto: "Precisão", fator: "C" }
    ]
  },
  {
    bloco: "L",
    titulo: "Com subalternos, costuma ser...",
    frases: [
      { texto: "Orgulhoso", fator: "D" },
      { texto: "Permissivo", fator: "I" },
      { texto: "Humilde", fator: "S" },
      { texto: "Cauteloso", fator: "C" }
    ]
  },
  {
    bloco: "M",
    titulo: "Mensura desempenho com...",
    frases: [
      { texto: "Histórico", fator: "D" },
      { texto: "Elogios", fator: "I" },
      { texto: "Contribuição", fator: "S" },
      { texto: "Qualidade dos resultados", fator: "C" }
    ]
  },
  {
    bloco: "N",
    titulo: "Prefere tarefas...",
    frases: [
      { texto: "Desafiadoras", fator: "D" },
      { texto: "Relacionada a pessoas", fator: "I" },
      { texto: "Agendadas", fator: "S" },
      { texto: "Estruturadas", fator: "C" }
    ]
  },
  {
    bloco: "O",
    titulo: "Precisa melhorar...",
    frases: [
      { texto: "Empatia e Paciência", fator: "D" },
      { texto: "Controle emocional", fator: "I" },
      { texto: "Ser assertivo sob pressão", fator: "S" },
      { texto: "Se preocupar menos sobre tudo", fator: "C" }
    ]
  },
  {
    bloco: "P",
    titulo: "Em uma discussão...",
    frases: [
      { texto: "Busca ter a razão", fator: "D" },
      { texto: "Busca diminuir o conflito", fator: "I" },
      { texto: "Busca concordância", fator: "S" },
      { texto: "Busca comparar sua opinião", fator: "C" }
    ]
  },
  {
    bloco: "Q",
    titulo: "Quando vai às compras...",
    frases: [
      { texto: "Sabe o que quer", fator: "D" },
      { texto: "Se diverte", fator: "I" },
      { texto: "Fica indeciso", fator: "S" },
      { texto: "Busca ofertas", fator: "C" }
    ]
  },
  {
    bloco: "R",
    titulo: "Abordagem principal...",
    frases: [
      { texto: "Independente", fator: "D" },
      { texto: "Interativo", fator: "I" },
      { texto: "Estável", fator: "S" },
      { texto: "Corretivo", fator: "C" }
    ]
  },
  {
    bloco: "S",
    titulo: "Outra limitação desse perfil...",
    frases: [
      { texto: "Não tradicional", fator: "D" },
      { texto: "Indeciso", fator: "I" },
      { texto: "Necessidade de mudança", fator: "S" },
      { texto: "Impressivo", fator: "C" }
    ]
  },
  {
    bloco: "T",
    titulo: "Ponto cego...",
    frases: [
      { texto: "Ser responsabilizado", fator: "D" },
      { texto: "Realizar compromissos", fator: "I" },
      { texto: "Tomada de decisão", fator: "S" },
      { texto: "Relaciona a pessoas", fator: "C" }
    ]
  },
  {
    bloco: "U",
    titulo: "Com atraso...",
    frases: [
      { texto: "Se irrita e confronta", fator: "D" },
      { texto: "Fala sem pensar", fator: "I" },
      { texto: "Procrastina ao invés de fazer", fator: "S" },
      { texto: "Analisa demais", fator: "C" }
    ]
  },
  {
    bloco: "V",
    titulo: "Em situações extremas...",
    frases: [
      { texto: "Se preocupa demais com metas", fator: "D" },
      { texto: "Procrastina ao invés de fazer", fator: "I" },
      { texto: "Analisa demais", fator: "S" },
      { texto: "Se preocupar menos sobre tudo", fator: "C" }
    ]
  },
  {
    bloco: "W",
    titulo: "Necessita de...",
    frases: [
      { texto: "Controle", fator: "D" },
      { texto: "Aprovação", fator: "I" },
      { texto: "Rotina", fator: "S" },
      { texto: "Padrão", fator: "C" }
    ]
  },
  {
    bloco: "X",
    titulo: "Limitação desse perfil...",
    frases: [
      { texto: "Direto", fator: "D" },
      { texto: "Desorganizado", fator: "I" },
      { texto: "Indireto", fator: "S" },
      { texto: "Detalhista", fator: "C" }
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