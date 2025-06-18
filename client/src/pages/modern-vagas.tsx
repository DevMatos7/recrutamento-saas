import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CreateVagaModal from "@/components/modals/create-vaga-modal";
import { 
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Users,
  MapPin,
  Building2,
  Calendar,
  DollarSign,
  Star,
  Clock,
  Briefcase,
  TrendingUp,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function ModernVagas() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedVaga, setSelectedVaga] = useState<any>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: vagas, isLoading } = useQuery({
    queryKey: ["/api/vagas"],
  });

  const { data: empresas } = useQuery({
    queryKey: ["/api/empresas"],
  });

  const { data: departamentos } = useQuery({
    queryKey: ["/api/departamentos"],
  });

  const deleteVagaMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/vagas/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Vaga excluída com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/vagas"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao excluir vaga", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const filteredVagas = Array.isArray(vagas) ? vagas.filter((vaga: any) => {
    const matchesSearch = vaga.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         vaga.empresa.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || vaga.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) : [];

  const vagaStats = [
    {
      name: 'Total de Vagas',
      value: Array.isArray(vagas) ? vagas.length : 0,
      icon: Briefcase,
      color: 'bg-blue-500'
    },
    {
      name: 'Vagas Ativas',
      value: Array.isArray(vagas) ? vagas.filter((v: any) => v.status === 'aberta').length : 0,
      icon: CheckCircle,
      color: 'bg-green-500'
    },
    {
      name: 'Candidatos Total',
      value: '1,247',
      icon: Users,
      color: 'bg-purple-500'
    },
    {
      name: 'Taxa de Preenchimento',
      value: '68%',
      icon: TrendingUp,
      color: 'bg-orange-500'
    },
  ];

  const VagaCard = ({ vaga }: { vaga: any }) => (
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-purple-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <div className="bg-purple-100 rounded-lg p-1.5">
                <Building2 className="h-4 w-4 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-purple-600">{vaga.empresa}</span>
              <Badge variant={vaga.status === 'aberta' ? 'default' : 'secondary'} className="text-xs">
                {vaga.status === 'aberta' ? 'Ativa' : 'Pausada'}
              </Badge>
            </div>
            <CardTitle className="text-lg font-bold text-gray-900 mb-2">
              {vaga.titulo}
            </CardTitle>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <MapPin className="h-3 w-3" />
                <span>{vaga.local || 'Não informado'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>Postado há 2 dias</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="h-3 w-3" />
                <span>15 candidatos</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>Urgente</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-green-600">R$ 8.500</div>
              <div className="text-xs text-gray-500">CLT</div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-gray-700 text-sm line-clamp-2 mb-4">
          {vaga.descricao}
        </p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className="text-xs">React</Badge>
          <Badge variant="outline" className="text-xs">TypeScript</Badge>
          <Badge variant="outline" className="text-xs">Node.js</Badge>
        </div>

        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <Eye className="h-4 w-4 mr-2" />
                Ver Detalhes
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">{vaga.titulo}</DialogTitle>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="font-medium text-purple-600">{vaga.empresa}</span>
                  <Badge variant={vaga.status === 'aberta' ? 'default' : 'secondary'}>
                    {vaga.status === 'aberta' ? 'Ativa' : 'Pausada'}
                  </Badge>
                </div>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-500">Local</div>
                    <div className="font-medium">{vaga.local || 'Não informado'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Salário</div>
                    <div className="font-medium text-green-600">{vaga.salario || 'A combinar'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Tipo</div>
                    <div className="font-medium">{vaga.tipoContratacao || 'CLT'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Departamento</div>
                    <div className="font-medium">{vaga.departamento || 'Não informado'}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Descrição da vaga:</h4>
                  <p className="text-gray-700">{vaga.descricao}</p>
                </div>

                {vaga.requisitos && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Requisitos:</h4>
                    <p className="text-gray-700">{vaga.requisitos}</p>
                  </div>
                )}

                {vaga.beneficios && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Benefícios:</h4>
                    <p className="text-gray-700">{vaga.beneficios}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Vaga
                  </Button>
                  <Button variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Ver Candidatos
                  </Button>
                  <Button 
                    variant="outline" 
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => deleteVagaMutation.mutate(vaga.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
            <Users className="h-4 w-4 mr-2" />
            Candidatos
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Vagas</h1>
          <p className="mt-2 text-gray-600">
            Gerencie suas oportunidades de emprego e acompanhe o progresso das contratações
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button 
            className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Nova Vaga
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {vagaStats.map((stat) => (
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
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and Search */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <Input
                placeholder="Buscar vagas por título, empresa ou localização..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="aberta">Ativas</SelectItem>
                <SelectItem value="pausada">Pausadas</SelectItem>
                <SelectItem value="fechada">Fechadas</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          </div>
        </div>
      </Card>

      {/* Vagas List */}
      <Tabs defaultValue="grid" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="grid">Grade</TabsTrigger>
            <TabsTrigger value="list">Lista</TabsTrigger>
          </TabsList>
          <div className="text-sm text-gray-600">
            {filteredVagas.length} vaga(s) encontrada(s)
          </div>
        </div>

        <TabsContent value="grid">
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredVagas.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredVagas.map((vaga: any) => (
                <VagaCard key={vaga.id} vaga={vaga} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <div className="bg-purple-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Briefcase className="h-10 w-10 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {searchQuery || statusFilter !== "all" 
                  ? "Nenhuma vaga encontrada" 
                  : "Nenhuma vaga cadastrada"
                }
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || statusFilter !== "all"
                  ? "Tente ajustar os filtros para encontrar o que procura."
                  : "Comece criando sua primeira oportunidade de emprego."
                }
              </p>
              <Button 
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {searchQuery || statusFilter !== "all" ? "Criar Nova Vaga" : "Criar Primeira Vaga"}
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200">
                {filteredVagas.map((vaga: any) => (
                  <div key={vaga.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div className="bg-purple-100 rounded-lg p-3">
                            <Briefcase className="h-6 w-6 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">{vaga.titulo}</h3>
                            <p className="text-purple-600 font-medium">{vaga.empresa}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                              <span className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3" />
                                <span>{vaga.local || 'Remoto'}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Users className="h-3 w-3" />
                                <span>15 candidatos</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>Postado há 2 dias</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="font-bold text-green-600">R$ 8.500</div>
                          <Badge variant={vaga.status === 'aberta' ? 'default' : 'secondary'}>
                            {vaga.status === 'aberta' ? 'Ativa' : 'Pausada'}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                          <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                            <Users className="h-4 w-4 mr-1" />
                            Candidatos
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}