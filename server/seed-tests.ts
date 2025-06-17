import { db } from "./db.js";
import { testes } from "../shared/schema.js";
import { eq } from "drizzle-orm";

// Sample DISC test with 8 questions for more accurate profiling
const sampleDISCTest = {
  tipo: "DISC" as const,
  titulo: "Teste DISC - Perfil Comportamental",
  descricao: "Avalia o perfil comportamental do candidato baseado na metodologia DISC (Dominante, Influente, Estável, Consciente)",
  questoes: [
    {
      enunciado: "Como você prefere trabalhar em situações desafiadoras?",
      alternativas: [
        "Tomo decisões rápidas e assumo o controle da situação",
        "Busco motivar a equipe e encontrar soluções criativas",
        "Mantenho a calma e ofereço suporte aos colegas",
        "Analiso todos os dados antes de tomar uma decisão"
      ]
    },
    {
      enunciado: "Em reuniões de equipe, você geralmente:",
      alternativas: [
        "Lidero as discussões e direciono para resultados",
        "Animo o grupo e compartilho ideias inovadoras",
        "Escuto atentamente e busco consenso",
        "Questiono detalhes e valida informações"
      ]
    },
    {
      enunciado: "Quando enfrenta críticas, sua reação típica é:",
      alternativas: [
        "Defendo meu ponto de vista com firmeza",
        "Uso o humor para amenizar a tensão",
        "Aceito e reflito sobre o feedback recebido",
        "Analiso a validade das críticas objetivamente"
      ]
    },
    {
      enunciado: "Seu estilo de comunicação no trabalho é:",
      alternativas: [
        "Direto, objetivo e focado em resultados",
        "Entusiástico, expressivo e inspirador",
        "Paciente, empático e colaborativo",
        "Preciso, detalhado e fundamentado"
      ]
    },
    {
      enunciado: "Em projetos, você prefere:",
      alternativas: [
        "Definir metas ambiciosas e superar expectativas",
        "Trabalhar com pessoas e criar um ambiente positivo",
        "Manter estabilidade e garantir qualidade consistente",
        "Seguir processos estruturados e padrões de qualidade"
      ]
    },
    {
      enunciado: "Quando precisa convencer alguém, você:",
      alternativas: [
        "Apresenta fatos e benefícios de forma assertiva",
        "Usa carisma e entusiasmo para inspirar",
        "Constrói relacionamento e demonstra confiabilidade",
        "Fornece dados detalhados e evidências sólidas"
      ]
    },
    {
      enunciado: "Sua abordagem para resolver problemas é:",
      alternativas: [
        "Ação rápida e foco em soluções práticas",
        "Brainstorming criativo com a equipe",
        "Consultar outros e buscar soluções testadas",
        "Investigação minuciosa e análise sistemática"
      ]
    },
    {
      enunciado: "Em ambientes de trabalho, você se destaca por:",
      alternativas: [
        "Assumir liderança e entregar resultados",
        "Motivar equipes e gerar engajamento",
        "Oferecer suporte confiável e manter harmonia",
        "Garantir precisão e qualidade técnica"
      ]
    }
  ],
  ativo: true
};

// Sample technical test for JavaScript developers
const sampleTechnicalTest = {
  tipo: "tecnico" as const,
  titulo: "Teste Técnico - JavaScript Fundamentals",
  descricao: "Avalia conhecimentos fundamentais em JavaScript, incluindo sintaxe, conceitos de programação e melhores práticas",
  questoes: [
    {
      enunciado: "Qual é a saída do seguinte código?\n\nconsole.log(typeof null);",
      alternativas: [
        "null",
        "object",
        "undefined",
        "string"
      ],
      respostaCorreta: 1
    },
    {
      enunciado: "O que são 'closures' em JavaScript?",
      alternativas: [
        "Funções que não retornam valor",
        "Funções que têm acesso a variáveis de seu escopo externo",
        "Funções que são executadas imediatamente",
        "Funções que não podem ser chamadas"
      ],
      respostaCorreta: 1
    },
    {
      enunciado: "Qual método é usado para adicionar um elemento ao final de um array?",
      alternativas: [
        "append()",
        "add()",
        "push()",
        "insert()"
      ],
      respostaCorreta: 2
    },
    {
      enunciado: "O que é 'hoisting' em JavaScript?",
      alternativas: [
        "Processo de otimização do código",
        "Elevação de declarações para o topo do escopo",
        "Conversão automática de tipos",
        "Execução assíncrona de código"
      ],
      respostaCorreta: 1
    },
    {
      enunciado: "Qual é a diferença entre '==' e '===' em JavaScript?",
      alternativas: [
        "Não há diferença",
        "'==' compara valor e tipo, '===' apenas valor",
        "'===' compara valor e tipo, '==' apenas valor",
        "'===' é mais rápido que '=='"
      ],
      respostaCorreta: 2
    },
    {
      enunciado: "Como você pode iterar sobre as propriedades de um objeto?",
      alternativas: [
        "for...in loop",
        "for...of loop",
        "forEach method",
        "while loop"
      ],
      respostaCorreta: 0
    },
    {
      enunciado: "Qual é o resultado de: Boolean('0')?",
      alternativas: [
        "true",
        "false",
        "0",
        "undefined"
      ],
      respostaCorreta: 0
    },
    {
      enunciado: "O que é a 'event delegation' em JavaScript?",
      alternativas: [
        "Criar eventos customizados",
        "Usar um elemento pai para gerenciar eventos de filhos",
        "Remover event listeners automaticamente",
        "Executar eventos em paralelo"
      ],
      respostaCorreta: 1
    }
  ],
  ativo: true
};

// Sample technical test for Python developers
const samplePythonTest = {
  tipo: "tecnico" as const,
  titulo: "Teste Técnico - Python Fundamentals",
  descricao: "Avalia conhecimentos fundamentais em Python, estruturas de dados e conceitos de programação orientada a objetos",
  questoes: [
    {
      enunciado: "Qual é a saída do código:\nprint(type([]) == list)",
      alternativas: [
        "True",
        "False",
        "list",
        "Error"
      ],
      respostaCorreta: 0
    },
    {
      enunciado: "Como você cria uma lista vazia em Python?",
      alternativas: [
        "list = empty()",
        "list = []",
        "list = null",
        "list = void"
      ],
      respostaCorreta: 1
    },
    {
      enunciado: "Qual é a diferença entre uma lista e uma tupla em Python?",
      alternativas: [
        "Não há diferença",
        "Listas são mutáveis, tuplas são imutáveis",
        "Tuplas são mutáveis, listas são imutáveis",
        "Listas são mais rápidas que tuplas"
      ],
      respostaCorreta: 1
    },
    {
      enunciado: "O que é list comprehension em Python?",
      alternativas: [
        "Uma forma de documentar listas",
        "Uma maneira concisa de criar listas",
        "Um método de ordenação",
        "Um tipo especial de loop"
      ],
      respostaCorreta: 1
    },
    {
      enunciado: "Qual palavra-chave é usada para herança em Python?",
      alternativas: [
        "extends",
        "inherits",
        "class ChildClass(ParentClass)",
        "super"
      ],
      respostaCorreta: 2
    }
  ],
  ativo: true
};

export async function seedTests() {
  try {
    console.log("Seeding test data...");

    // Check if tests already exist
    const existingTests = await db.select().from(testes);
    if (existingTests.length > 0) {
      console.log("Test data already exists, skipping...");
      return;
    }

    // Insert sample tests
    await db.insert(testes).values([
      {
        ...sampleDISCTest,
        dataCriacao: new Date(),
        dataAtualizacao: new Date()
      },
      {
        ...sampleTechnicalTest,
        dataCriacao: new Date(),
        dataAtualizacao: new Date()
      },
      {
        ...samplePythonTest,
        dataCriacao: new Date(),
        dataAtualizacao: new Date()
      }
    ]);

    console.log("✅ Test data seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding test data:", error);
  }
}