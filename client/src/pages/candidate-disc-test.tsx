import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Brain, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";

interface BlocoDisc {
  bloco: string;
  titulo?: string;
  frases: {
    id: number;
    frase: string;
  }[];
}

interface ResultadoDisc {
  D: number;
  I: number;
  S: number;
  C: number;
  perfilDominante: string;
  descricaoCompleta: string;
}

export default function CandidateDiscTest() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [etapa, setEtapa] = useState<"introducao" | "teste" | "finalizado">("introducao");
  const [avaliacaoId, setAvaliacaoId] = useState<number | null>(null);
  const [blocoAtual, setBlocoAtual] = useState(0);
  const [respostas, setRespostas] = useState<{ [bloco: string]: number[] }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [resultado, setResultado] = useState<ResultadoDisc | null>(null);

  // Buscar modelo das questões DISC
  const { data: blocos = [], isLoading: loadingBlocos } = useQuery<BlocoDisc[]>({
    queryKey: ["/api/avaliacoes/disc/modelo"],
  });

  // Verificar se existe avaliação em andamento
  const { data: avaliacaoExistente } = useQuery({
    queryKey: ["/api/avaliacoes/disc/candidato", "current"],
    enabled: etapa === "introducao",
    staleTime: 0,
  });

  // Iniciar ou continuar teste
  const iniciarTeste = async () => {
    try {
      setIsLoading(true);
      
      // Sempre chamar o endpoint de iniciar - ele decide se cria nova ou retorna existente
      const response = await fetch("/api/avaliacoes/disc/iniciar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao iniciar teste");
      }

      const data = await response.json();
      setAvaliacaoId(data.id);
      
      // Se está continuando uma avaliação, carregar progresso
      if (data.continuando) {
        await carregarProgressoExistente(data.id);
        toast({
          title: "Teste Continuado",
          description: "Continuando de onde você parou!",
        });
      } else {
        // Nova avaliação - resetar estado
        setBlocoAtual(0);
        setRespostas({});
      }
      
      setEtapa("teste");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar progresso de avaliação existente
  const carregarProgressoExistente = async (avaliacaoId: number) => {
    try {
      const response = await fetch(`/api/avaliacoes/disc/${avaliacaoId}/progresso`, {
        credentials: "include",
      });
      
      if (response.ok) {
        const progresso = await response.json();
        setRespostas(progresso.respostas || {});
        setBlocoAtual(progresso.proximoBloco || 0);
        toast({
          title: "Teste Continuado",
          description: "Continuando de onde você parou!",
        });
      }
    } catch (error) {
      console.error("Erro ao carregar progresso:", error);
    }
  };

  // Salvar respostas de um bloco
  const salvarRespostasMutation = useMutation({
    mutationFn: async ({ bloco, respostasBloco }: { bloco: string; respostasBloco: number[] }) => {
      const res = await apiRequest("POST", `/api/avaliacoes/disc/${avaliacaoId}/responder`, {
        bloco,
        respostas: respostasBloco
      });
      return await res.json();
    },
    onSuccess: () => {
      console.log("Respostas salvas com sucesso");
    },
    onError: (error: any) => {
      console.error("Erro ao salvar respostas:", error);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Finalizar avaliação
  const finalizarAvaliacaoMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/avaliacoes/disc/${avaliacaoId}/finalizar`);
      return await res.json();
    },
    onSuccess: (data: ResultadoDisc) => {
      setResultado(data);
      setEtapa("finalizado");
      toast({
        title: "Avaliação Finalizada",
        description: "Seu perfil DISC foi calculado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Atualizar resposta de uma frase
  const atualizarResposta = (blocoId: string, indexFrase: number, valor: number) => {
    const respostasBloco = respostas[blocoId] || [0, 0, 0, 0];
    const novasRespostas = [...respostasBloco];
    
    // Verificar se o valor já foi usado em outra frase
    const valorJaUsado = novasRespostas.some((resp, idx) => resp === valor && idx !== indexFrase);
    
    if (valorJaUsado && valor > 0) {
      toast({
        title: "Valor já utilizado",
        description: `O valor ${valor} já foi usado em outra frase deste bloco.`,
        variant: "destructive",
      });
      return;
    }
    
    novasRespostas[indexFrase] = valor;
    setRespostas({ ...respostas, [blocoId]: novasRespostas });
  };

  // Verificar se bloco atual está completo
  const blocoCompleto = () => {
    if (!blocos[blocoAtual]) return false;
    const blocoId = blocos[blocoAtual].bloco;
    const respostasBloco = respostas[blocoId] || [];
    return respostasBloco.every(r => r > 0) && 
           new Set(respostasBloco).size === 4;
  };

  // Validar se as respostas são únicas
  const validarRespostasUnicas = (blocoId: string, novasRespostas: number[]) => {
    const respostasUnicas = new Set(novasRespostas.filter(r => r > 0));
    return respostasUnicas.size === novasRespostas.filter(r => r > 0).length;
  };

  // Próximo bloco
  const proximoBloco = async () => {
    if (!blocos[blocoAtual] || !avaliacaoId) return;

    const blocoId = blocos[blocoAtual].bloco;
    const respostasBloco = respostas[blocoId];

    // Verificar se todas as respostas foram preenchidas
    if (!respostasBloco || respostasBloco.includes(0)) {
      toast({
        title: "Atenção",
        description: "Por favor, preencha todas as respostas antes de continuar.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Salvar respostas do bloco atual
      await salvarRespostasMutation.mutateAsync({ 
        bloco: blocoId, 
        respostasBloco 
      });

      if (blocoAtual < blocos.length - 1) {
        setBlocoAtual(blocoAtual + 1);
      } else {
        // Último bloco - finalizar avaliação
        finalizarAvaliacaoMutation.mutate();
      }
    } catch (error) {
      console.error("Erro ao salvar bloco:", error);
    }
  };

  // Bloco anterior
  const blocoAnterior = () => {
    if (blocoAtual > 0) {
      setBlocoAtual(blocoAtual - 1);
    }
  };

  // Tela de introdução
  if (etapa === "introducao") {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          <div className="flex items-center gap-2 mb-6">
            <Link href="/portal/dashboard">
              <Button variant="outline" size="sm">
                ← Voltar ao Dashboard
              </Button>
            </Link>
          </div>
          
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Brain className="h-6 w-6 text-blue-600" />
                Teste DISC Obrigatório
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-800">
                  O teste DISC é obrigatório para todos os candidatos. Ele ajuda a identificar seu perfil 
                  comportamental e é essencial para o processo seletivo.
                </p>
              </div>
              <Button onClick={iniciarTeste} disabled={isLoading} className="px-8">
                {isLoading ? "Carregando..." : 
                 (avaliacaoExistente && avaliacaoExistente.some((av: any) => av.status === "em_andamento") ? 
                  "Continuar Teste DISC" : "Iniciar Teste DISC")}
              </Button>
              {avaliacaoExistente && avaliacaoExistente.length > 0 && (
                <div className="text-sm text-gray-600 mt-2">
                  Avaliações encontradas: {avaliacaoExistente.length}
                  {avaliacaoExistente.some((av: any) => av.status === "em_andamento") && (
                    <span className="text-blue-600 font-medium"> - Teste em andamento detectado</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loadingBlocos) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Tela de resultado
  if (etapa === "finalizado" && resultado) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          <div className="flex items-center gap-2 mb-6">
            <Link href="/portal/dashboard">
              <Button variant="outline" size="sm">
                ← Voltar ao Dashboard
              </Button>
            </Link>
          </div>
          
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                Avaliação DISC Concluída
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pontuações */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Suas Pontuações</h3>
                  <div className="space-y-3">
                    {Object.entries(resultado).map(([fator, pontos]) => {
                      if (typeof pontos !== "number") return null;
                      const percentage = (pontos / 96) * 100; // 24 blocos x 4 pontos máximos
                      return (
                        <div key={fator}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">{fator}</span>
                            <span>{pontos} pontos</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Perfil dominante */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Perfil Dominante: {resultado.perfilDominante}
                  </h3>
                  <p className="text-gray-600">{resultado.descricaoCompleta}</p>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Button 
                  onClick={() => setEtapa("introducao")}
                  variant="outline"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Fazer Nova Avaliação
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Verificar se está na etapa de teste
  if (etapa !== "teste" || !avaliacaoId) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Tela de teste
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/portal/dashboard">
            <Button variant="outline" size="sm">
              ← Voltar ao Dashboard
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-6 w-6" />
              Teste DISC Obrigatório
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Progresso */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progresso</span>
                  <span>{blocoAtual + 1} de {blocos.length}</span>
                </div>
                <Progress value={((blocoAtual + 1) / blocos.length) * 100} />
              </div>

              {/* Bloco atual */}
              {blocos[blocoAtual] && (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold mb-2">
                      Bloco {blocos[blocoAtual].bloco}
                    </h3>
                    {blocos[blocoAtual].titulo && (
                      <p className="text-blue-700 font-medium text-base">
                        {blocos[blocoAtual].titulo}
                      </p>
                    )}
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-blue-800 text-sm leading-relaxed">
                      <strong>Instruções:</strong> Em cada bloco, você verá quatro frases. Sua tarefa é ordenar essas frases de acordo com o quanto elas descrevem você. Coloque o número <strong>4</strong> na frase que <strong>MAIS</strong> combina com você e o número <strong>1</strong> na que <strong>MENOS</strong> combina. Use cada número apenas uma vez por bloco.
                    </p>
                  </div>

                  <div className="grid gap-4">
                    {blocos[blocoAtual].frases.map((frase, index) => (
                      <div key={frase.id} className="p-4 border rounded-lg">
                        <p className="mb-3">{frase.frase}</p>
                        <RadioGroup
                          value={respostas[blocos[blocoAtual].bloco]?.[index]?.toString() || ""}
                          onValueChange={(value) => 
                            atualizarResposta(blocos[blocoAtual].bloco, index, parseInt(value))
                          }
                          className="flex gap-4"
                        >
                          {[1, 2, 3, 4].map((valor) => (
                            <div key={valor} className="flex items-center space-x-2">
                              <RadioGroupItem value={valor.toString()} id={`${frase.id}-${valor}`} />
                              <Label htmlFor={`${frase.id}-${valor}`}>{valor}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Navegação */}
              <div className="flex justify-between">
                <Button 
                  onClick={blocoAnterior}
                  disabled={blocoAtual === 0}
                  variant="outline"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Anterior
                </Button>
                
                <Button 
                  onClick={proximoBloco}
                  disabled={!blocoCompleto() || salvarRespostasMutation.isPending}
                >
                  {blocoAtual === blocos.length - 1 ? "Finalizar" : "Próximo"}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}