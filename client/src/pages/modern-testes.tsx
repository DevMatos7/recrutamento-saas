import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  FileText,
  Brain,
  Code,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Award,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function ModernTestes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [tipoFilter, setTipoFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: testes, isLoading } = useQuery({
    queryKey: ["/api/testes"],
  });

  const deleteTesteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/testes/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Teste excluído com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/testes"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao excluir teste", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const filteredTestes = Array.isArray(testes) ? testes.filter((teste: any) => {
    const matchesSearch = (teste.nome?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                         (teste.descricao?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesTipo = tipoFilter === "all" || teste.tipo === tipoFilter;
    return matchesSearch && matchesTipo;
  }) : [];

  const testeStats = [
    {
      name: 'Total de Testes',
      value: Array.isArray(testes) ? testes.length : 0,
      icon: FileText,
      color: 'bg-blue-500'
    },
    {
      name: 'Testes DISC',
      value: Array.isArray(testes) ? testes.filter((t: any) => t.tipo === 'disc').length : 0,
      icon: Brain,
      color: 'bg-purple-500'
    },
    {
      name: 'Testes Técnicos',
      value: Array.isArray(testes) ? testes.filter((t: any) => t.tipo === 'tecnico').length : 0,
      icon: Code,
      color: 'bg-green-500'
    },
    {
      name: 'Testes Aplicados',
      value: '147',
      icon: Users,
      color: 'bg-orange-500'
    },
  ];

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'disc': return Brain;
      case 'tecnico': return Code;
      default: return FileText;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'disc': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'tecnico': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTipoText = (tipo: string) => {
    switch (tipo) {
      case 'disc': return 'DISC Comportamental';
      case 'tecnico': return 'Técnico';
      default: return 'Indefinido';
    }
  };

  const TesteCard = ({ teste }: { teste: any }) => {
    const TipoIcon = getTipoIcon(teste.tipo);
    
    return (
      <Card className="hover:shadow-lg transition-all duration-200 group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <div className="bg-purple-100 rounded-lg p-1.5">
                  <TipoIcon className="h-4 w-4 text-purple-600" />
                </div>
                <Badge className={getTipoColor(teste.tipo)}>
                  {getTipoText(teste.tipo)}
                </Badge>
              </div>
              <CardTitle className="text-lg font-bold text-gray-900 mb-2">
                {teste.nome}
              </CardTitle>
              <div className="space-y-1">
                <p className="text-sm text-gray-600 line-clamp-2">
                  {teste.descricao}
                </p>
                <div className="flex items-center text-sm text-gray-500 mt-2">
                  <FileText className="h-3 w-3 mr-2" />
                  <span>{teste.perguntas?.length || 0} perguntas</span>
                  <span className="mx-2">•</span>
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{teste.tempoLimite || 30} min</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Aplicações:</span>
              <span className="font-medium">23 candidatos</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Nota média:</span>
              <div className="flex items-center space-x-1">
                <Star className="h-3 w-3 text-yellow-500 fill-current" />
                <span className="font-medium">7.8</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Detalhes do Teste</DialogTitle>
                  </DialogHeader>
                  <TesteDetailView teste={teste} />
                </DialogContent>
              </Dialog>
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                <BarChart3 className="h-4 w-4 mr-2" />
                Resultados
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const TesteDetailView = ({ teste }: { teste: any }) => (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-bold text-gray-900">{teste.nome}</h3>
        <p className="text-gray-600">{teste.descricao}</p>
        <div className="grid grid-cols-2 gap-4 mt-3">
          <div>
            <span className="text-sm text-gray-500">Tipo:</span>
            <Badge className={getTipoColor(teste.tipo)}>
              {getTipoText(teste.tipo)}
            </Badge>
          </div>
          <div>
            <span className="text-sm text-gray-500">Tempo Limite:</span>
            <p className="font-medium">{teste.tempoLimite || 30} minutos</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Perguntas:</span>
            <p className="font-medium">{teste.perguntas?.length || 0}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Criado em:</span>
            <p className="font-medium">
              {new Date(teste.dataCriacao || new Date()).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </div>

      {/* Questions Preview */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Perguntas do Teste:</h4>
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {teste.perguntas && teste.perguntas.length > 0 ? (
            teste.perguntas.map((pergunta: any, index: number) => (
              <div key={index} className="p-3 border rounded-lg">
                <p className="font-medium text-gray-900 mb-2">
                  {index + 1}. {pergunta.pergunta}
                </p>
                <div className="space-y-1">
                  {pergunta.opcoes?.map((opcao: any, optIndex: number) => (
                    <div key={optIndex} className="flex items-center space-x-2 text-sm">
                      <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">
                        {String.fromCharCode(65 + optIndex)}
                      </span>
                      <span className={opcao.correta ? 'text-green-600 font-medium' : 'text-gray-600'}>
                        {opcao.texto}
                        {opcao.correta && <span className="ml-1">✓</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">Nenhuma pergunta cadastrada</p>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Edit className="h-4 w-4 mr-2" />
          Editar Teste
        </Button>
        <Button variant="outline">
          <BarChart3 className="h-4 w-4 mr-2" />
          Ver Resultados
        </Button>
        <Button 
          variant="outline" 
          className="text-red-600 border-red-200 hover:bg-red-50"
          onClick={() => deleteTesteMutation.mutate(teste.id)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Testes DISC e Técnicos</h1>
          <p className="mt-2 text-gray-600">
            Gerencie testes comportamentais e técnicos para avaliação de candidatos
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button 
            className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Criar Novo Teste
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {testeStats.map((stat) => (
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
                placeholder="Buscar testes por nome ou descrição..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="disc">DISC Comportamental</SelectItem>
                <SelectItem value="tecnico">Técnico</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          </div>
        </div>
      </Card>

      {/* Tests List */}
      <Tabs defaultValue="todos" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="todos">Todos os Testes</TabsTrigger>
            <TabsTrigger value="disc">DISC</TabsTrigger>
            <TabsTrigger value="tecnico">Técnicos</TabsTrigger>
            <TabsTrigger value="resultados">Resultados</TabsTrigger>
          </TabsList>
          <div className="text-sm text-gray-600">
            {filteredTestes.length} teste(s) encontrado(s)
          </div>
        </div>

        <TabsContent value="todos">
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
          ) : filteredTestes.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredTestes.map((teste: any) => (
                <TesteCard key={teste.id} teste={teste} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <div className="bg-purple-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <FileText className="h-10 w-10 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {searchQuery || tipoFilter !== "all"
                  ? "Nenhum teste encontrado" 
                  : "Nenhum teste cadastrado"
                }
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || tipoFilter !== "all"
                  ? "Tente ajustar os filtros para encontrar o que procura."
                  : "Comece criando testes para avaliar seus candidatos."
                }
              </p>
              <Button 
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {searchQuery || tipoFilter !== "all" ? "Criar Novo Teste" : "Criar Primeiro Teste"}
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="disc">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="bg-purple-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Brain className="h-10 w-10 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Testes DISC</h3>
              <p className="text-gray-600">Avaliações comportamentais baseadas no modelo DISC</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tecnico">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="bg-green-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Code className="h-10 w-10 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Testes Técnicos</h3>
              <p className="text-gray-600">Avaliações de conhecimentos específicos e habilidades técnicas</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resultados">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance por Teste</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">JavaScript Básico</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Média: 8.2</span>
                      <Badge variant="outline">23 aplicações</Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">DISC Comportamental</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Concluído: 45</span>
                      <Badge variant="outline">45 aplicações</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estatísticas Gerais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Taxa de Conclusão</span>
                    <span className="font-bold text-green-600">87%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Tempo Médio</span>
                    <span className="font-bold">18 min</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Nota Média Geral</span>
                    <span className="font-bold text-blue-600">7.6</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}