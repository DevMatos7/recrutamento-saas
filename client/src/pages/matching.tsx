import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Users, 
  Target, 
  Filter, 
  Eye, 
  Mail, 
  MessageSquare, 
  BarChart3,
  TrendingUp,
  Award,
  MapPin,
  DollarSign,
  GraduationCap,
  Brain,
  Briefcase
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ProtectedRoute } from "@/lib/protected-route";

interface CandidatoMatch {
  candidato: any;
  score: number;
  detalhes: {
    competencias: number;
    experiencia: number;
    formacao: number;
    localizacao: number;
    salario: number;
    disc: number;
  };
}

export default function MatchingPage() {
  const { vagaId } = useParams();
  const { toast } = useToast();
  const [filtros, setFiltros] = useState({
    scoreMinimo: "70",
    localizacao: "",
    nivelExperiencia: ""
  });
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);

  // Buscar dados da vaga
  const { data: vaga } = useQuery({
    queryKey: ["/api/vagas", vagaId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/vagas/${vagaId}`);
      return await res.json();
    },
  });

  // Buscar matches
  const { data: matches = [], isLoading, refetch } = useQuery<CandidatoMatch[]>({
    queryKey: ["/api/vagas", vagaId, "matches", filtros],
    queryFn: async () => {
      const params = new URLSearchParams(filtros as any);
      const res = await apiRequest("GET", `/api/vagas/${vagaId}/matches?${params}`);
      return await res.json();
    },
    enabled: !!vagaId,
  });

  // Buscar estatísticas
  const { data: estatisticas } = useQuery({
    queryKey: ["/api/vagas", vagaId, "matches", "estatisticas"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/vagas/${vagaId}/matches/estatisticas`);
      return await res.json();
    },
    enabled: !!vagaId,
  });

  const handleFiltroChange = (key: string, value: string) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    return "text-gray-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return "bg-green-100";
    if (score >= 80) return "bg-blue-100";
    if (score >= 70) return "bg-yellow-100";
    return "bg-gray-100";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Matches para: {vaga?.titulo}</h1>
          <p className="text-gray-600">{vaga?.empresa} - {vaga?.localizacao}</p>
        </div>
        <Button onClick={() => refetch()}>
          <TrendingUp className="w-4 h-4 mr-2" />
          Atualizar Matches
        </Button>
      </div>

      <Tabs defaultValue="matches" className="space-y-6">
        <TabsList>
          <TabsTrigger value="matches">
            <Users className="w-4 h-4 mr-2" />
            Candidatos Compatíveis
          </TabsTrigger>
          <TabsTrigger value="estatisticas">
            <BarChart3 className="w-4 h-4 mr-2" />
            Estatísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matches" className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Score Mínimo</label>
                  <Select 
                    value={filtros.scoreMinimo} 
                    onValueChange={(value) => handleFiltroChange("scoreMinimo", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">50%</SelectItem>
                      <SelectItem value="60">60%</SelectItem>
                      <SelectItem value="70">70%</SelectItem>
                      <SelectItem value="80">80%</SelectItem>
                      <SelectItem value="90">90%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Localização</label>
                  <Input 
                    placeholder="Filtrar por localização"
                    value={filtros.localizacao}
                    onChange={(e) => handleFiltroChange("localizacao", e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Nível de Experiência</label>
                  <Select 
                    value={filtros.nivelExperiencia} 
                    onValueChange={(value) => handleFiltroChange("nivelExperiencia", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os níveis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      <SelectItem value="estagiario">Estagiário</SelectItem>
                      <SelectItem value="junior">Júnior</SelectItem>
                      <SelectItem value="pleno">Pleno</SelectItem>
                      <SelectItem value="senior">Sênior</SelectItem>
                      <SelectItem value="especialista">Especialista</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Matches */}
          <div className="space-y-4">
            {matches.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Nenhum match encontrado
                  </h3>
                  <p className="text-gray-500">
                    Tente ajustar os filtros para encontrar candidatos compatíveis.
                  </p>
                </CardContent>
              </Card>
            ) : (
              matches.map((match) => (
                <Card key={match.candidato.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold">{match.candidato.nome}</h3>
                            <p className="text-gray-600">{match.candidato.cargoDesejado || match.candidato.email}</p>
                            
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              {match.candidato.localizacao && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {match.candidato.localizacao}
                                </div>
                              )}
                              {match.candidato.nivelExperiencia && (
                                <div className="flex items-center gap-1">
                                  <Briefcase className="w-4 h-4" />
                                  {match.candidato.nivelExperiencia}
                                </div>
                              )}
                              {match.candidato.pretensaoSalarial && (
                                <div className="flex items-center gap-1">
                                  <DollarSign className="w-4 h-4" />
                                  R$ {match.candidato.pretensaoSalarial.toLocaleString()}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="text-center">
                            <div className={`text-3xl font-bold ${getScoreColor(match.score)}`}>
                              {match.score}%
                            </div>
                            <Badge 
                              variant="secondary" 
                              className={getScoreBgColor(match.score)}
                            >
                              Compatibilidade
                            </Badge>
                          </div>
                        </div>

                        {/* Detalhes do Score */}
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-6 gap-2">
                          <div className="text-center">
                            <div className="text-sm font-medium">{match.detalhes.competencias}%</div>
                            <div className="text-xs text-gray-500">Competências</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium">{match.detalhes.experiencia}%</div>
                            <div className="text-xs text-gray-500">Experiência</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium">{match.detalhes.formacao}%</div>
                            <div className="text-xs text-gray-500">Formação</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium">{match.detalhes.localizacao}%</div>
                            <div className="text-xs text-gray-500">Local</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium">{match.detalhes.salario}%</div>
                            <div className="text-xs text-gray-500">Salário</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium">{match.detalhes.disc}%</div>
                            <div className="text-xs text-gray-500">DISC</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Perfil Completo - {match.candidato.nome}</DialogTitle>
                            </DialogHeader>
                            <CandidateProfile candidato={match.candidato} match={match} />
                          </DialogContent>
                        </Dialog>

                        <Button variant="outline" size="sm">
                          <Mail className="w-4 h-4" />
                        </Button>

                        <Button variant="outline" size="sm">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="estatisticas">
          {estatisticas && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Candidatos</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{estatisticas.totalCandidatos}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Matches 70%+</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{estatisticas.matchesAcimaDe70}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Score Máximo</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{estatisticas.scoreMaximo}%</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Score Médio</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{estatisticas.scoreMedio}%</div>
                </CardContent>
              </Card>

              {/* Distribuição de Scores */}
              <Card className="col-span-full">
                <CardHeader>
                  <CardTitle>Distribuição de Scores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(estatisticas.distribuicaoScores).map(([faixa, quantidade]) => (
                      <div key={faixa} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-blue-500 rounded"></div>
                          <span>{faixa}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-32">
                            <Progress 
                              value={estatisticas.totalCandidatos > 0 ? 
                                ((quantidade as number) / estatisticas.totalCandidatos) * 100 : 0} 
                            />
                          </div>
                          <span className="font-medium">{quantidade}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Componente para exibir perfil completo do candidato
function CandidateProfile({ candidato, match }: { candidato: any; match: any }) {
  return (
    <div className="space-y-6">
      {/* Header com score */}
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <div className="text-4xl font-bold text-blue-600 mb-2">{match.score}%</div>
        <div className="text-gray-600">Compatibilidade Geral</div>
      </div>

      <Tabs defaultValue="resumo">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="competencias">Competências</TabsTrigger>
          <TabsTrigger value="experiencia">Experiência</TabsTrigger>
          <TabsTrigger value="disc">Perfil DISC</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Informações Pessoais</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Nome:</strong> {candidato.nome}</p>
                <p><strong>Email:</strong> {candidato.email}</p>
                <p><strong>Telefone:</strong> {candidato.telefone || "Não informado"}</p>
                <p><strong>Localização:</strong> {candidato.localizacao || "Não informado"}</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Dados Profissionais</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Cargo Desejado:</strong> {candidato.cargoDesejado || "Não informado"}</p>
                <p><strong>Nível:</strong> {candidato.nivelExperiencia || "Não informado"}</p>
                <p><strong>Pretensão:</strong> {candidato.pretensaoSalarial ? 
                  `R$ ${candidato.pretensaoSalarial.toLocaleString()}` : "Não informado"}</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="competencias">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Competências do Candidato</h4>
              <div className="flex flex-wrap gap-2">
                {candidato.competencias?.map((comp: string, index: number) => (
                  <Badge key={index} variant="secondary">{comp}</Badge>
                )) || <p className="text-gray-500">Nenhuma competência cadastrada</p>}
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5" />
                <h4 className="font-semibold">Score de Competências: {match.detalhes.competencias}%</h4>
              </div>
              <Progress value={match.detalhes.competencias} className="h-2" />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="experiencia">
          <div className="space-y-4">
            <h4 className="font-semibold">Experiências Profissionais</h4>
            {candidato.experiencias?.length > 0 ? (
              candidato.experiencias.map((exp: any, index: number) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <h5 className="font-semibold">{exp.cargo}</h5>
                    <p className="text-gray-600">{exp.empresa}</p>
                    <p className="text-sm text-gray-500">
                      {exp.dataInicio} - {exp.atual ? "Atual" : exp.dataFim}
                    </p>
                    {exp.descricao && (
                      <p className="mt-2 text-sm">{exp.descricao}</p>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-gray-500">Nenhuma experiência cadastrada</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="disc">
          <div className="space-y-4">
            {candidato.resultadoDisc ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['D', 'I', 'S', 'C'].map((fator) => (
                  <Card key={fator}>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {candidato.resultadoDisc[fator] || 0}
                      </div>
                      <div className="text-sm text-gray-600">{fator}</div>
                      <Progress value={(candidato.resultadoDisc[fator] / 96) * 100} className="mt-2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Teste DISC não realizado</p>
              </div>
            )}
            
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-5 h-5" />
                <h4 className="font-semibold">Score DISC: {match.detalhes.disc}%</h4>
              </div>
              <Progress value={match.detalhes.disc} className="h-2" />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}