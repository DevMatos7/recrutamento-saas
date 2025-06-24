import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Brain, ChevronLeft, ChevronRight, CheckCircle, BarChart3 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface FraseDisc {
  id: number;
  texto: string;
  fator: string;
}

interface BlocoDisc {
  bloco: string;
  frases: FraseDisc[];
}

interface ResultadoDisc {
  D: number;
  I: number;
  S: number;
  C: number;
  perfilDominante: string;
  descricaoCompleta: string;
}

interface AvaliacaoAtual {
  id: number;
  candidatoId: string;
  status: string;
}

export default function CandidateDiscTest() {
  const { toast } = useToast();
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

  // Iniciar nova avaliação
  const iniciarTeste = async () => {
    try {
      setIsLoading(true);
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

  // Iniciar nova avaliação
  const iniciarAvaliacaoMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/avaliacoes/disc/iniciar", {
        candidatoId: candidateData?.candidaturas?.[0]?.candidatoId
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setAvaliacaoAtual({ 
        id: data.id, 
        candidatoId: candidateData?.candidaturas?.[0]?.candidatoId!, 
        status: "em_andamento" 
      });
      setBlocoAtual(0);
      setRespostas({});
      setAvaliacaoFinalizada(false);
      setResultado(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Salvar respostas de um bloco
  const salvarRespostasMutation = useMutation({
    mutationFn: async ({ bloco, respostasBloco }: { bloco: string; respostasBloco: number[] }) => {
      console.log("Salvando respostas:", { avaliacaoId, bloco, respostas: respostasBloco });
      const res = await apiRequest("POST", `/api/avaliacoes/disc/${avaliacaoId}/responder`, {
        bloco,
        respostas: respostasBloco
      });
      return await res.json();
    },
    onSuccess: (data) => {
      console.log("Respostas salvas:", data);
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

  // Atualizar respostas do bloco atual
  const atualizarResposta = (indexFrase: number, valor: number) => {
    if (!blocos[blocoAtual]) return;

    const blocoId = blocos[blocoAtual].bloco;
    const respostasBloco = respostas[blocoId] || [0, 0, 0, 0];
    
    // Verificar se o valor já foi usado
    if (respostasBloco.includes(valor) && respostasBloco[indexFrase] !== valor) {
      toast({
        title: "Valor já utilizado",
        description: "Cada número de 1 a 4 deve ser usado apenas uma vez por bloco.",
        variant: "destructive",
      });
      return;
    }

    respostasBloco[indexFrase] = valor;
    setRespostas({ ...respostas, [blocoId]: respostasBloco });
  };

  // Verificar se bloco atual está completo
  const blocoCompleto = () => {
    if (!blocos[blocoAtual]) return false;
    const blocoId = blocos[blocoAtual].bloco;
    const respostasBloco = respostas[blocoId] || [];
    return respostasBloco.every(r => r > 0) && 
           new Set(respostasBloco).size === 4;
  };

  // Próximo bloco
  const proximoBloco = async () => {
    if (!blocos[blocoAtual] || !avaliacaoAtual) {
      console.log("Próximo bloco - condições não atendidas:", {
        temBlocos: !!blocos[blocoAtual],
        temAvaliacao: !!avaliacaoAtual
      });
      return;
    }

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

    console.log("Salvando bloco:", { blocoId, respostasBloco, avaliacaoId: avaliacaoAtual.id });

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
                {isLoading ? "Iniciando..." : "Iniciar Teste DISC"}
              </Button>
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

  // Tela principal do teste
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
            {!avaliacaoAtual ? (
              <div className="text-center space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-blue-800 mb-2">⚠️ Teste Obrigatório</h3>
                  <p className="text-blue-700">
                    O teste DISC é obrigatório para todos os candidatos. 
                    Ele ajuda a identificar seu perfil comportamental e é essencial para o processo seletivo.
                  </p>
                </div>
                <Button 
                  onClick={() => iniciarAvaliacaoMutation.mutate()}
                  disabled={iniciarAvaliacaoMutation.isPending}
                  size="lg"
                >
                  {iniciarAvaliacaoMutation.isPending ? "Iniciando..." : "Iniciar Teste DISC"}
                </Button>
              </div>
            ) : (
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
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        Bloco {blocos[blocoAtual].bloco}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Ordene as frases de 1 a 4, sendo:
                        <br />
                        <strong>1 = Menos se identifica</strong> até <strong>4 = Mais se identifica</strong>
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {blocos[blocoAtual].frases.map((frase, index) => {
                          const blocoId = blocos[blocoAtual].bloco;
                          const valorAtual = respostas[blocoId]?.[index] || 0;
                          
                          return (
                            <div key={frase.id} className="flex items-center gap-4">
                              <div className="flex-1">
                                <Label>{frase.texto}</Label>
                              </div>
                              <div className="w-20">
                                <Select
                                  value={valorAtual.toString()}
                                  onValueChange={(value) => 
                                    atualizarResposta(index, parseInt(value))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="--" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">1</SelectItem>
                                    <SelectItem value="2">2</SelectItem>
                                    <SelectItem value="3">3</SelectItem>
                                    <SelectItem value="4">4</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex justify-between mt-6">
                        <Button
                          variant="outline"
                          onClick={blocoAnterior}
                          disabled={blocoAtual === 0}
                        >
                          <ChevronLeft className="w-4 h-4 mr-2" />
                          Anterior
                        </Button>

                        <Button
                          onClick={proximoBloco}
                          disabled={!blocoCompleto() || salvarRespostasMutation.isPending}
                        >
                          {salvarRespostasMutation.isPending ? (
                            "Salvando..."
                          ) : blocoAtual === blocos.length - 1 ? (
                            "Finalizar"
                          ) : (
                            <>
                              Próximo
                              <ChevronRight className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Histórico */}
        {historico.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Histórico de Avaliações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {historico.map((avaliacao: any) => (
                  <div key={avaliacao.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">
                        {new Date(avaliacao.dataInicio).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Status: {avaliacao.status}
                      </p>
                    </div>
                    {avaliacao.resultado && (
                      <div className="text-right">
                        <p className="font-semibold">
                          Perfil: {avaliacao.resultado.perfilDominante}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}