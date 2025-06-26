import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sparkles, Brain, TrendingUp, User, Eye, ChevronRight, Award, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface AIRecommendation {
  candidateId: string;
  candidateName: string;
  compatibilityScore: number;
  reasoning: string;
  strengths: string[];
  concerns: string[];
  recommendations: string[];
  culturalFit: number;
  technicalFit: number;
  experienceFit: number;
}

interface CandidateInsights {
  overallCompatibility: number;
  technicalAnalysis: string;
  experienceAnalysis: string;
  salaryAnalysis: string;
  strengths: string[];
  developmentAreas: string[];
  interviewRecommendations: string[];
  successProbability: number;
}

export default function AIRecommendationsPage() {
  const { user } = useAuth();
  const [selectedJob, setSelectedJob] = useState<string>("");
  const [selectedCandidate, setSelectedCandidate] = useState<string>("");
  const [insightsOpen, setInsightsOpen] = useState(false);

  // Get available jobs
  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["/api/vagas"],
    enabled: !!user,
  });

  // Get AI recommendations for selected job
  const { data: recommendations, isLoading: recommendationsLoading, refetch: refetchRecommendations } = useQuery<AIRecommendation[]>({
    queryKey: [`/api/vagas/${selectedJob}/ai-recommendations`],
    enabled: !!selectedJob && !!user,
  });

  // Get detailed insights for selected candidate
  const { data: insights, isLoading: insightsLoading } = useQuery<CandidateInsights>({
    queryKey: [`/api/candidatos/${selectedCandidate}/ai-insights/${selectedJob}`],
    enabled: !!selectedCandidate && !!selectedJob && !!user,
  });

  const generateRecommendations = useMutation({
    mutationFn: async (jobId: string) => {
      const response = await fetch(`/api/vagas/${jobId}/ai-recommendations`);
      if (!response.ok) throw new Error('Falha ao gerar recomendações');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Recomendações geradas com sucesso!",
      });
      refetchRecommendations();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar recomendações",
        variant: "destructive",
      });
    },
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default" as const;
    if (score >= 60) return "secondary" as const;
    return "destructive" as const;
  };

  if (!user || !["admin", "recrutador"].includes(user.perfil)) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Acesso negado. Apenas administradores e recrutadores podem acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-600" />
            Recomendações IA
          </h1>
          <p className="text-gray-600 mt-2">
            Sistema inteligente de recomendação de candidatos usando IA avançada
          </p>
        </div>
      </div>

      {/* Job Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Selecionar Vaga
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Select value={selectedJob} onValueChange={setSelectedJob}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha uma vaga para análise IA" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(jobs) && jobs.map((job: any) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.titulo} - {job.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedJob && (
              <Button 
                onClick={() => generateRecommendations.mutate(selectedJob)}
                disabled={generateRecommendations.isPending}
                className="flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {generateRecommendations.isPending ? "Analisando..." : "Gerar Recomendações"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {selectedJob && (
        <div className="space-y-6">
          {recommendationsLoading ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <Brain className="h-12 w-12 mx-auto text-purple-600 animate-pulse mb-4" />
                  <p className="text-lg font-medium">Analisando candidatos com IA...</p>
                  <p className="text-gray-600">Isso pode levar alguns segundos</p>
                </div>
              </CardContent>
            </Card>
          ) : recommendations && recommendations.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="h-6 w-6" />
                Candidatos Recomendados ({recommendations.length})
              </h2>
              
              <div className="grid gap-4">
                {recommendations.map((rec, index) => (
                  <Card key={rec.candidateId} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full text-purple-600 font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">{rec.candidateName}</h3>
                            <Badge variant={getScoreBadgeVariant(rec.compatibilityScore)} className="mt-1">
                              {rec.compatibilityScore}% compatível
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCandidate(rec.candidateId);
                            setInsightsOpen(true);
                          }}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          Ver Insights
                        </Button>
                      </div>

                      {/* Compatibility Scores */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">Fit Cultural</span>
                            <span className={`text-sm font-bold ${getScoreColor(rec.culturalFit)}`}>
                              {rec.culturalFit}%
                            </span>
                          </div>
                          <Progress value={rec.culturalFit} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">Fit Técnico</span>
                            <span className={`text-sm font-bold ${getScoreColor(rec.technicalFit)}`}>
                              {rec.technicalFit}%
                            </span>
                          </div>
                          <Progress value={rec.technicalFit} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">Experiência</span>
                            <span className={`text-sm font-bold ${getScoreColor(rec.experienceFit)}`}>
                              {rec.experienceFit}%
                            </span>
                          </div>
                          <Progress value={rec.experienceFit} className="h-2" />
                        </div>
                      </div>

                      {/* AI Analysis */}
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-sm text-gray-700 mb-1">Análise IA:</h4>
                          <p className="text-sm text-gray-600">{rec.reasoning}</p>
                        </div>

                        <Tabs defaultValue="strengths" className="w-full">
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="strengths">Pontos Fortes</TabsTrigger>
                            <TabsTrigger value="concerns">Preocupações</TabsTrigger>
                            <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="strengths" className="mt-3">
                            <div className="space-y-1">
                              {rec.strengths.map((strength, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm">
                                  <Award className="h-3 w-3 text-green-600" />
                                  <span>{strength}</span>
                                </div>
                              ))}
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="concerns" className="mt-3">
                            <div className="space-y-1">
                              {rec.concerns.map((concern, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm">
                                  <AlertTriangle className="h-3 w-3 text-yellow-600" />
                                  <span>{concern}</span>
                                </div>
                              ))}
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="recommendations" className="mt-3">
                            <div className="space-y-1">
                              {rec.recommendations.map((recommendation, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm">
                                  <ChevronRight className="h-3 w-3 text-blue-600" />
                                  <span>{recommendation}</span>
                                </div>
                              ))}
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : selectedJob && !recommendationsLoading ? (
            <Card>
              <CardContent className="py-8 text-center">
                <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma recomendação encontrada
                </h3>
                <p className="text-gray-600 mb-4">
                  Não há candidatos disponíveis para esta vaga ou todos já foram processados.
                </p>
                <Button 
                  onClick={() => generateRecommendations.mutate(selectedJob)}
                  disabled={generateRecommendations.isPending}
                >
                  Tentar Novamente
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}

      {/* Candidate Insights Modal */}
      <Dialog open={insightsOpen} onOpenChange={setInsightsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Insights Detalhados do Candidato
            </DialogTitle>
          </DialogHeader>
          
          {insightsLoading ? (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 mx-auto text-purple-600 animate-pulse mb-4" />
              <p>Gerando insights detalhados...</p>
            </div>
          ) : insights ? (
            <div className="space-y-6">
              {/* Overall Score */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Compatibilidade Geral</span>
                    <span className={`text-2xl font-bold ${getScoreColor(insights.overallCompatibility)}`}>
                      {insights.overallCompatibility}%
                    </span>
                  </div>
                  <Progress value={insights.overallCompatibility} className="mt-2" />
                </CardContent>
              </Card>

              {/* Detailed Analysis */}
              <Tabs defaultValue="technical" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="technical">Técnico</TabsTrigger>
                  <TabsTrigger value="experience">Experiência</TabsTrigger>
                  <TabsTrigger value="salary">Salário</TabsTrigger>
                  <TabsTrigger value="interview">Entrevista</TabsTrigger>
                </TabsList>
                
                <TabsContent value="technical" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Análise Técnica</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{insights.technicalAnalysis}</p>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="experience" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Análise de Experiência</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{insights.experienceAnalysis}</p>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="salary" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Análise Salarial</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{insights.salaryAnalysis}</p>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="interview" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Recomendações para Entrevista</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {insights.interviewRecommendations.map((rec, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span className="text-sm">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Success Probability */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Probabilidade de Sucesso</span>
                    <span className={`text-lg font-bold ${getScoreColor(insights.successProbability)}`}>
                      {insights.successProbability}%
                    </span>
                  </div>
                  <Progress value={insights.successProbability} className="mt-2" />
                </CardContent>
              </Card>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}