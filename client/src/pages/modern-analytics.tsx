import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  Calendar,
  Clock,
  Target,
  Award,
  Filter,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Eye
} from "lucide-react";

export default function ModernAnalytics() {
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("30");

  const { data: empresas } = useQuery({
    queryKey: ["/api/empresas"],
  });

  const { data: dashboardData } = useQuery({
    queryKey: ["/api/analytics/dashboard-geral", selectedEmpresa],
  });

  const analyticsStats = [
    {
      name: 'Total de Candidatos',
      value: '2,847',
      change: '+12.5%',
      changeType: 'positive',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      name: 'Vagas Preenchidas',
      value: '89',
      change: '+8.2%',
      changeType: 'positive',
      icon: Award,
      color: 'bg-green-500'
    },
    {
      name: 'Taxa de Conversão',
      value: '18.7%',
      change: '+2.1%',
      changeType: 'positive',
      icon: Target,
      color: 'bg-purple-500'
    },
    {
      name: 'Tempo Médio',
      value: '21 dias',
      change: '-3 dias',
      changeType: 'positive',
      icon: Clock,
      color: 'bg-orange-500'
    },
  ];

  const topVagas = [
    { nome: 'Desenvolvedor Frontend React', candidatos: 127, preenchidas: 8, taxa: '6.3%' },
    { nome: 'Designer UX/UI', candidatos: 94, preenchidas: 5, taxa: '5.3%' },
    { nome: 'Analista de Dados', candidatos: 83, preenchidas: 4, taxa: '4.8%' },
    { nome: 'Product Manager', candidatos: 76, preenchidas: 3, taxa: '3.9%' },
    { nome: 'Desenvolvedor Backend Node.js', candidatos: 69, preenchidas: 3, taxa: '4.3%' },
  ];

  const departmentMetrics = [
    { nome: 'Tecnologia', vagas: 15, candidatos: 423, contratacoes: 12, taxa: '2.8%' },
    { nome: 'Marketing', vagas: 8, candidatos: 267, contratacoes: 7, taxa: '2.6%' },
    { nome: 'Vendas', vagas: 12, candidatos: 189, contratacoes: 9, taxa: '4.8%' },
    { nome: 'Design', vagas: 5, candidatos: 156, contratacoes: 4, taxa: '2.6%' },
    { nome: 'Operações', vagas: 6, candidatos: 134, contratacoes: 5, taxa: '3.7%' },
  ];

  const sourceAnalytics = [
    { fonte: 'LinkedIn', candidatos: 1247, conversao: '24.3%', custo: 'R$ 180' },
    { fonte: 'Site Próprio', candidatos: 834, conversao: '31.2%', custo: 'R$ 45' },
    { fonte: 'Indeed', candidatos: 567, conversao: '18.7%', custo: 'R$ 120' },
    { fonte: 'Indicação', candidatos: 423, conversao: '42.1%', custo: 'R$ 0' },
    { fonte: 'Facebook', candidatos: 298, conversao: '15.9%', custo: 'R$ 95' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Relatórios</h1>
          <p className="mt-2 text-gray-600">
            Insights detalhados sobre performance de recrutamento e métricas de contratação
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar Relatório
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Empresa</label>
            <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as empresas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as empresas</SelectItem>
                {Array.isArray(empresas) && empresas.map((empresa: any) => (
                  <SelectItem key={empresa.id} value={empresa.id}>
                    {empresa.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Período</label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 3 meses</SelectItem>
                <SelectItem value="365">Último ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:mt-7">
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros Avançados
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {analyticsStats.map((stat) => (
          <Card key={stat.name} className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.name}
              </CardTitle>
              <div className={`${stat.color} p-2 rounded-lg`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="flex items-center mt-1">
                {stat.changeType === 'positive' ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm ml-1 ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 ml-1">vs período anterior</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="jobs">Análise de Vagas</TabsTrigger>
          <TabsTrigger value="departments">Departamentos</TabsTrigger>
          <TabsTrigger value="sources">Fontes de Candidatos</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Funil de Recrutamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Funil de Recrutamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Candidaturas Recebidas</span>
                    <span className="font-bold text-lg">2,847</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-purple-600 h-3 rounded-full w-full"></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Triagem Inicial</span>
                    <span className="font-bold text-lg">1,423</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-purple-600 h-3 rounded-full w-1/2"></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Entrevistas Realizadas</span>
                    <span className="font-bold text-lg">534</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-blue-500 h-3 rounded-full w-1/4"></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Ofertas Feitas</span>
                    <span className="font-bold text-lg">127</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-orange-500 h-3 rounded-full w-1/6"></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Contratações</span>
                    <span className="font-bold text-lg text-green-600">89</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-green-500 h-3 rounded-full w-1/8"></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tempo por Etapa */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Tempo Médio por Etapa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Triagem Inicial</span>
                    <span className="text-lg font-bold text-blue-600">3.2 dias</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Primeira Entrevista</span>
                    <span className="text-lg font-bold text-purple-600">5.8 dias</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Avaliação Técnica</span>
                    <span className="text-lg font-bold text-orange-600">4.1 dias</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Entrevista Final</span>
                    <span className="text-lg font-bold text-green-600">3.5 dias</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Proposta e Contratação</span>
                    <span className="text-lg font-bold text-red-600">4.7 dias</span>
                  </div>
                  
                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Tempo Total Médio</span>
                      <span className="text-2xl font-bold text-purple-600">21.3 dias</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="jobs">
          <Card>
            <CardHeader>
              <CardTitle>Top Vagas por Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topVagas.map((vaga, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{vaga.nome}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span>{vaga.candidatos} candidatos</span>
                        <span>{vaga.preenchidas} contratações</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-purple-600 border-purple-200">
                        {vaga.taxa} conversão
                      </Badge>
                      <Button variant="ghost" size="sm" className="ml-2">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments">
          <Card>
            <CardHeader>
              <CardTitle>Performance por Departamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {departmentMetrics.map((dept, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-900">{dept.nome}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{dept.vagas}</p>
                      <p className="text-xs text-gray-500">Vagas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{dept.candidatos}</p>
                      <p className="text-xs text-gray-500">Candidatos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{dept.contratacoes}</p>
                      <p className="text-xs text-gray-500">Contratações</p>
                    </div>
                    <div className="text-center">
                      <Badge className="bg-orange-100 text-orange-800">
                        {dept.taxa}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Fontes de Candidatos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sourceAnalytics.map((source, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-900">{source.fonte}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-600">{source.candidatos}</p>
                      <p className="text-xs text-gray-500">Candidatos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">{source.conversao}</p>
                      <p className="text-xs text-gray-500">Taxa de Conversão</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-orange-600">{source.custo}</p>
                      <p className="text-xs text-gray-500">Custo por Contratação</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">
                  ROI de Recrutamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">312%</div>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600 ml-1">+18%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">
                  Custo por Contratação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">R$ 2.847</div>
                <div className="flex items-center mt-1">
                  <TrendingDown className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600 ml-1">-R$ 183</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">
                  Qualidade de Contratação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">4.7/5</div>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600 ml-1">+0.3</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}