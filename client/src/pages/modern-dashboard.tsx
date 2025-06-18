import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Briefcase,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Plus,
  Filter,
  Search,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Eye
} from "lucide-react";

export default function ModernDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["/api/analytics/dashboard-geral"],
  });

  const { data: recentJobs } = useQuery({
    queryKey: ["/api/vagas"],
  });

  const { data: recentCandidates } = useQuery({
    queryKey: ["/api/candidatos"],
  });

  const { data: todayInterviews } = useQuery({
    queryKey: ["/api/entrevistas"],
  });

  const dashboardStats = [
    {
      name: 'Vagas Ativas',
      value: Array.isArray(recentJobs) ? recentJobs.filter((j: any) => j.status === 'aberta').length.toString() : '0',
      change: '+12%',
      changeType: 'positive',
      icon: Briefcase,
      color: 'bg-blue-500'
    },
    {
      name: 'Candidatos Ativos',
      value: Array.isArray(recentCandidates) ? recentCandidates.length.toString() : '0', 
      change: '+2.1%',
      changeType: 'positive',
      icon: Users,
      color: 'bg-green-500'
    },
    {
      name: 'Entrevistas Hoje',
      value: '8',
      change: '-0.1%',
      changeType: 'negative',
      icon: Calendar,
      color: 'bg-purple-500'
    },
    {
      name: 'Taxa de Conversão',
      value: '12.5%',
      change: '+1.2%',
      changeType: 'positive',
      icon: TrendingUp,
      color: 'bg-orange-500'
    },
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'application',
      candidate: 'Ana Silva',
      job: 'Desenvolvedor Frontend',
      time: '2 min atrás',
      status: 'new'
    },
    {
      id: 2,
      type: 'interview',
      candidate: 'João Santos',
      job: 'UX Designer',
      time: '5 min atrás',
      status: 'scheduled'
    },
    {
      id: 3,
      type: 'hire',
      candidate: 'Maria Costa',
      job: 'Product Manager',
      time: '1 hora atrás',
      status: 'hired'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Visão geral das suas atividades de recrutamento
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
          <Button 
            className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
            onClick={() => window.location.href = '/vagas'}
          >
            <Plus className="h-4 w-4" />
            Nova Vaga
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat) => (
          <Card key={stat.name} className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
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
                <span className="text-sm text-gray-500 ml-1">vs mês anterior</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Recent Activities */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Atividades Recentes</CardTitle>
                <Button variant="ghost" size="sm">
                  Ver todas
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${
                        activity.status === 'new' ? 'bg-blue-100' :
                        activity.status === 'scheduled' ? 'bg-purple-100' :
                        'bg-green-100'
                      }`}>
                        {activity.status === 'new' && <Users className="h-4 w-4 text-blue-600" />}
                        {activity.status === 'scheduled' && <Calendar className="h-4 w-4 text-purple-600" />}
                        {activity.status === 'hired' && <CheckCircle className="h-4 w-4 text-green-600" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{activity.candidate}</p>
                        <p className="text-sm text-gray-600">{activity.job}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        activity.status === 'new' ? 'secondary' :
                        activity.status === 'scheduled' ? 'default' :
                        'default'
                      }>
                        {activity.status === 'new' && 'Nova candidatura'}
                        {activity.status === 'scheduled' && 'Entrevista agendada'}
                        {activity.status === 'hired' && 'Contratado'}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full justify-start bg-purple-600 hover:bg-purple-700" 
                size="lg"
                onClick={() => window.location.href = '/vagas'}
              >
                <Plus className="h-5 w-5 mr-3" />
                Criar Nova Vaga
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                size="lg"
                onClick={() => window.location.href = '/candidatos'}
              >
                <Users className="h-5 w-5 mr-3" />
                Adicionar Candidato
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                size="lg"
                onClick={() => window.location.href = '/entrevistas'}
              >
                <Calendar className="h-5 w-5 mr-3" />
                Agendar Entrevista
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                size="lg"
                onClick={() => window.location.href = '/pipeline'}
              >
                <Search className="h-5 w-5 mr-3" />
                Ver Pipeline
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Entrevistas Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Carlos Oliveira</p>
                    <p className="text-sm text-gray-600">Desenvolvedor Backend</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">14:00</p>
                    <Badge variant="outline">Presencial</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Laura Mendes</p>
                    <p className="text-sm text-gray-600">Designer UI/UX</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">16:30</p>
                    <Badge variant="outline">Online</Badge>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="w-full mt-4">
                Ver agenda completa
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Performance Metrics */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Funil de Recrutamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Candidaturas</span>
                    <span className="font-medium">1,247</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full w-full"></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Triagem</span>
                    <span className="font-medium">432</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full w-3/4"></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Entrevistas</span>
                    <span className="font-medium">89</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full w-1/2"></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Contratações</span>
                    <span className="font-medium">12</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full w-1/4"></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Vagas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(recentJobs) && recentJobs.slice(0, 4).map((job: any) => (
                    <div key={job.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{job.titulo}</p>
                        <p className="text-sm text-gray-600">{job.empresa}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">15 candidatos</Badge>
                        <Button variant="ghost" size="sm" className="ml-2">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pipeline">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Pipeline de Candidatos</h3>
                <p className="text-gray-600 mb-6">Visualize o progresso dos candidatos em suas vagas</p>
                <Button 
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={() => window.location.href = '/pipeline'}
                >
                  Ver Pipeline Completo
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">
                  Tempo Médio de Contratação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">23 dias</div>
                <div className="flex items-center mt-1">
                  <ArrowDownRight className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600 ml-1">-2 dias</span>
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
                <div className="text-2xl font-bold">R$ 2.800</div>
                <div className="flex items-center mt-1">
                  <ArrowUpRight className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-600 ml-1">+R$ 200</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">
                  Satisfação dos Candidatos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.7/5</div>
                <div className="flex items-center mt-1">
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600 ml-1">+0.2</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}