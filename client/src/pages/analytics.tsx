import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, Users, Calendar, Target, Clock } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [selectedVaga, setSelectedVaga] = useState<string>("");
  const [selectedDepartamento, setSelectedDepartamento] = useState<string>("");

  // Dashboard geral
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ["/api/analytics/dashboard"],
    enabled: !!user && ['admin', 'recrutador'].includes(user.perfil)
  });

  // Lista de vagas para seleção
  const { data: vagas } = useQuery({
    queryKey: ["/api/vagas"],
    enabled: !!user
  });

  // Lista de departamentos para seleção
  const { data: departamentos } = useQuery({
    queryKey: ["/api/departamentos"],
    enabled: !!user
  });

  // Análise da vaga selecionada
  const { data: analiseVaga, isLoading: analiseVagaLoading } = useQuery({
    queryKey: ["/api/analytics/vagas", selectedVaga],
    enabled: !!selectedVaga
  });

  // Análise do departamento selecionado
  const { data: analiseDepartamento, isLoading: analiseDepartamentoLoading } = useQuery({
    queryKey: ["/api/analytics/departamentos", selectedDepartamento],
    enabled: !!selectedDepartamento
  });

  // Análise de origens
  const { data: analiseOrigens } = useQuery({
    queryKey: ["/api/analytics/origens"],
    enabled: !!user && ['admin', 'recrutador'].includes(user.perfil)
  });

  // Tempos por etapa
  const { data: temposPorEtapa } = useQuery({
    queryKey: ["/api/analytics/tempos"],
    enabled: !!user && ['admin', 'recrutador'].includes(user.perfil)
  });

  if (!user || !['admin', 'recrutador', 'gestor'].includes(user.perfil)) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h2>
            <p className="text-gray-600">Você não tem permissão para acessar os relatórios.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics e Relatórios</h1>
            <p className="text-gray-600">Indicadores estratégicos e operacionais dos processos seletivos</p>
          </div>

          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="dashboard">Dashboard Geral</TabsTrigger>
              <TabsTrigger value="vagas">Por Vaga</TabsTrigger>
              <TabsTrigger value="departamentos">Por Departamento</TabsTrigger>
              <TabsTrigger value="origens">Origens</TabsTrigger>
              <TabsTrigger value="tempos">Tempos</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {dashboardLoading ? (
                  <div className="col-span-4 text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Carregando indicadores...</p>
                  </div>
                ) : (
                  <>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Vagas</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{dashboardData?.vagas?.total || 0}</div>
                        <p className="text-xs text-muted-foreground">
                          {dashboardData?.vagas?.abertas || 0} abertas • {dashboardData?.vagas?.encerradas || 0} encerradas
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Candidatos</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{dashboardData?.candidatos?.total || 0}</div>
                        <p className="text-xs text-muted-foreground">
                          {dashboardData?.candidatos?.aprovados || 0} aprovados • {dashboardData?.candidatos?.reprovados || 0} reprovados
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{dashboardData?.taxaConversao || 0}%</div>
                        <p className="text-xs text-muted-foreground">
                          Do recebimento à aprovação
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{dashboardData?.tempoMedioContratacao || 0}</div>
                        <p className="text-xs text-muted-foreground">
                          Dias até contratação
                        </p>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Pipeline de Candidatos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { etapa: 'Recebidos', valor: dashboardData?.candidatos?.recebidos || 0 },
                        { etapa: 'Triagem', valor: dashboardData?.candidatos?.triagem || 0 },
                        { etapa: 'Entrevista', valor: dashboardData?.candidatos?.entrevista || 0 },
                        { etapa: 'Aprovados', valor: dashboardData?.candidatos?.aprovados || 0 }
                      ].map((item) => (
                        <div key={item.etapa} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{item.etapa}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ 
                                  width: `${dashboardData?.candidatos?.total > 0 ? (item.valor / dashboardData.candidatos.total) * 100 : 0}%` 
                                }}
                              ></div>
                            </div>
                            <span className="text-sm font-bold">{item.valor}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Entrevistas Este Mês
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-center py-8">
                      {dashboardData?.entrevistasRealizadas || 0}
                    </div>
                    <p className="text-center text-sm text-muted-foreground">
                      Entrevistas realizadas no período
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="vagas" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Análise por Vaga</CardTitle>
                  <div className="w-72">
                    <Select value={selectedVaga} onValueChange={setSelectedVaga}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma vaga" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(vagas) && vagas.map((vaga: any) => (
                          <SelectItem key={vaga.id} value={vaga.id}>
                            {vaga.titulo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedVaga && analiseVaga ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {analiseVaga.pipeline?.reduce((acc: number, p: any) => acc + p.total, 0) || 0}
                          </div>
                          <p className="text-sm text-gray-600">Total de Candidatos</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {analiseVaga.entrevistas?.reduce((acc: number, e: any) => acc + e.total, 0) || 0}
                          </div>
                          <p className="text-sm text-gray-600">Total de Entrevistas</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {analiseVaga.testes?.reduce((acc: number, t: any) => acc + t.total, 0) || 0}
                          </div>
                          <p className="text-sm text-gray-600">Testes Realizados</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <h3 className="font-semibold mb-3">Pipeline por Etapa</h3>
                          <div className="space-y-2">
                            {analiseVaga.pipeline?.map((etapa: any) => (
                              <div key={etapa.etapa} className="flex justify-between items-center">
                                <span className="capitalize">{etapa.etapa}</span>
                                <span className="font-bold">{etapa.total}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-3">Status das Entrevistas</h3>
                          <div className="space-y-2">
                            {analiseVaga.entrevistas?.map((entrevista: any) => (
                              <div key={entrevista.status} className="flex justify-between items-center">
                                <span className="capitalize">{entrevista.status}</span>
                                <span className="font-bold">{entrevista.total}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : analiseVagaLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Carregando análise...</p>
                    </div>
                  ) : (
                    <p className="text-center py-8 text-gray-500">Selecione uma vaga para ver a análise</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="departamentos" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Análise por Departamento</CardTitle>
                  <div className="w-72">
                    <Select value={selectedDepartamento} onValueChange={setSelectedDepartamento}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(departamentos) && departamentos.map((dept: any) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedDepartamento && analiseDepartamento ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <h3 className="font-semibold mb-3">Vagas por Status</h3>
                          <div className="space-y-2">
                            {analiseDepartamento.vagas?.map((vaga: any) => (
                              <div key={vaga.status} className="flex justify-between items-center">
                                <span className="capitalize">{vaga.status.replace('_', ' ')}</span>
                                <span className="font-bold">{vaga.total}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-3">Performance por Vaga</h3>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {analiseDepartamento.performance?.map((perf: any) => (
                              <div key={perf.vagaId} className="p-2 border rounded">
                                <div className="font-medium text-sm">{perf.titulo}</div>
                                <div className="text-xs text-gray-600">
                                  {perf.totalCandidatos} candidatos • {perf.aprovados} aprovados
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : analiseDepartamentoLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Carregando análise...</p>
                    </div>
                  ) : (
                    <p className="text-center py-8 text-gray-500">Selecione um departamento para ver a análise</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="origens" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Origem das Candidaturas</CardTitle>
                </CardHeader>
                <CardContent>
                  {analiseOrigens && Array.isArray(analiseOrigens) ? (
                    <div className="space-y-4">
                      {analiseOrigens.map((origem: any) => (
                        <div key={origem.origem} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <div className="font-medium capitalize">{origem.origem || 'Manual'}</div>
                            <div className="text-sm text-gray-600">
                              Taxa de conversão: {origem.taxaConversao}%
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold">{origem.total}</div>
                            <div className="text-sm text-green-600">{origem.aprovados} aprovados</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-8 text-gray-500">Nenhum dado de origem disponível</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tempos" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tempo Médio por Etapa</CardTitle>
                </CardHeader>
                <CardContent>
                  {temposPorEtapa && Array.isArray(temposPorEtapa) ? (
                    <div className="space-y-4">
                      {temposPorEtapa.map((tempo: any) => (
                        <div key={tempo.etapa} className="flex items-center justify-between p-3 border rounded">
                          <div className="font-medium capitalize">{tempo.etapa}</div>
                          <div className="text-right">
                            <div className="text-xl font-bold">{tempo.tempoMedioDias}</div>
                            <div className="text-sm text-gray-600">dias em média</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-8 text-gray-500">Nenhum dado de tempo disponível</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}