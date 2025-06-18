import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Users,
  MapPin,
  Video,
  Phone,
  Building2,
  CheckCircle,
  XCircle,
  AlertCircle,
  CalendarDays,
  User,
  MessageSquare
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function ModernEntrevistas() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedEntrevista, setSelectedEntrevista] = useState<any>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: entrevistas, isLoading } = useQuery({
    queryKey: ["/api/entrevistas"],
  });

  const { data: vagas } = useQuery({
    queryKey: ["/api/vagas"],
  });

  const { data: candidatos } = useQuery({
    queryKey: ["/api/candidatos"],
  });

  const deleteEntrevistaMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/entrevistas/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Entrevista excluída com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/entrevistas"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao excluir entrevista", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, observacoes }: any) => {
      const res = await apiRequest("PUT", `/api/entrevistas/${id}`, { status, observacoes });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Status da entrevista atualizado!" });
      queryClient.invalidateQueries({ queryKey: ["/api/entrevistas"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao atualizar status", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const filteredEntrevistas = Array.isArray(entrevistas) ? entrevistas.filter((entrevista: any) => {
    const matchesSearch = entrevista.candidato?.nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         entrevista.vaga?.titulo?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || entrevista.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) : [];

  const entrevistaStats = [
    {
      name: 'Total de Entrevistas',
      value: Array.isArray(entrevistas) ? entrevistas.length : 0,
      icon: Calendar,
      color: 'bg-blue-500'
    },
    {
      name: 'Agendadas',
      value: Array.isArray(entrevistas) ? entrevistas.filter((e: any) => e.status === 'agendada').length : 0,
      icon: Clock,
      color: 'bg-orange-500'
    },
    {
      name: 'Realizadas',
      value: Array.isArray(entrevistas) ? entrevistas.filter((e: any) => e.status === 'realizada').length : 0,
      icon: CheckCircle,
      color: 'bg-green-500'
    },
    {
      name: 'Hoje',
      value: '8',
      icon: CalendarDays,
      color: 'bg-purple-500'
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agendada': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'realizada': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelada': return 'bg-red-100 text-red-800 border-red-200';
      case 'reagendada': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'agendada': return 'Agendada';
      case 'realizada': return 'Realizada';
      case 'cancelada': return 'Cancelada';
      case 'reagendada': return 'Reagendada';
      default: return 'Indefinido';
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'presencial': return Building2;
      case 'online': return Video;
      case 'telefone': return Phone;
      default: return Calendar;
    }
  };

  const EntrevistaCard = ({ entrevista }: { entrevista: any }) => {
    const TipoIcon = getTipoIcon(entrevista.tipo);
    
    return (
      <Card className="hover:shadow-lg transition-all duration-200 group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <div className="bg-purple-100 rounded-lg p-1.5">
                  <TipoIcon className="h-4 w-4 text-purple-600" />
                </div>
                <Badge className={getStatusColor(entrevista.status)}>
                  {getStatusText(entrevista.status)}
                </Badge>
              </div>
              <CardTitle className="text-lg font-bold text-gray-900 mb-2">
                {entrevista.vaga?.titulo || 'Vaga não informada'}
              </CardTitle>
              <div className="space-y-1">
                <div className="flex items-center text-sm text-gray-600">
                  <User className="h-3 w-3 mr-2" />
                  <span>{entrevista.candidato?.nome || 'Candidato não informado'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-3 w-3 mr-2" />
                  <span>
                    {new Date(entrevista.dataHora).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(entrevista.dataHora).toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                {entrevista.local && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-3 w-3 mr-2" />
                    <span>{entrevista.local}</span>
                  </div>
                )}
                <div className="flex items-center text-sm text-purple-600">
                  <span className="capitalize">{entrevista.tipo}</span>
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
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gray-100 text-gray-600 text-sm">
                  {entrevista.entrevistador?.nome?.charAt(0) || 'E'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {entrevista.entrevistador?.nome || 'Entrevistador não definido'}
                </p>
                <p className="text-xs text-gray-500">Entrevistador</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Detalhes da Entrevista</DialogTitle>
                  </DialogHeader>
                  <EntrevistaDetailView entrevista={entrevista} />
                </DialogContent>
              </Dialog>
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const EntrevistaDetailView = ({ entrevista }: { entrevista: any }) => {
    const [newStatus, setNewStatus] = useState(entrevista.status);
    const [observacoes, setObservacoes] = useState(entrevista.observacoes || '');

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-bold text-gray-900">{entrevista.vaga?.titulo}</h3>
          <p className="text-gray-600">{entrevista.candidato?.nome}</p>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <span className="text-sm text-gray-500">Data e Hora:</span>
              <p className="font-medium">
                {new Date(entrevista.dataHora).toLocaleDateString('pt-BR')} às{' '}
                {new Date(entrevista.dataHora).toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Tipo:</span>
              <p className="font-medium capitalize">{entrevista.tipo}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Entrevistador:</span>
              <p className="font-medium">{entrevista.entrevistador?.nome}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Status:</span>
              <Badge className={getStatusColor(entrevista.status)}>
                {getStatusText(entrevista.status)}
              </Badge>
            </div>
          </div>
          {entrevista.local && (
            <div className="mt-3">
              <span className="text-sm text-gray-500">Local:</span>
              <p className="font-medium">{entrevista.local}</p>
            </div>
          )}
        </div>

        {/* Status Update */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="status">Atualizar Status</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="agendada">Agendada</SelectItem>
                <SelectItem value="realizada">Realizada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
                <SelectItem value="reagendada">Reagendada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Adicione observações sobre a entrevista..."
              rows={4}
            />
          </div>

          <Button 
            onClick={() => updateStatusMutation.mutate({
              id: entrevista.id,
              status: newStatus,
              observacoes
            })}
            disabled={updateStatusMutation.isPending}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {updateStatusMutation.isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Entrevistas</h1>
          <p className="mt-2 text-gray-600">
            Gerencie agendamentos e acompanhe o processo de entrevistas
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button 
            className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Agendar Entrevista
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {entrevistaStats.map((stat) => (
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
                placeholder="Buscar por candidato, vaga ou entrevistador..."
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
                <SelectItem value="agendada">Agendadas</SelectItem>
                <SelectItem value="realizada">Realizadas</SelectItem>
                <SelectItem value="cancelada">Canceladas</SelectItem>
                <SelectItem value="reagendada">Reagendadas</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          </div>
        </div>
      </Card>

      {/* Entrevistas List */}
      <Tabs defaultValue="agenda" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="agenda">Agenda</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
            <TabsTrigger value="calendar">Calendário</TabsTrigger>
          </TabsList>
          <div className="text-sm text-gray-600">
            {filteredEntrevistas.length} entrevista(s) encontrada(s)
          </div>
        </div>

        <TabsContent value="agenda">
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
          ) : filteredEntrevistas.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredEntrevistas.map((entrevista: any) => (
                <EntrevistaCard key={entrevista.id} entrevista={entrevista} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <div className="bg-purple-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-10 w-10 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {searchQuery || statusFilter !== "all" 
                  ? "Nenhuma entrevista encontrada" 
                  : "Nenhuma entrevista agendada"
                }
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || statusFilter !== "all"
                  ? "Tente ajustar os filtros para encontrar o que procura."
                  : "Comece agendando entrevistas com seus candidatos."
                }
              </p>
              <Button 
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {searchQuery || statusFilter !== "all" ? "Agendar Nova Entrevista" : "Agendar Primeira Entrevista"}
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="historico">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Clock className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Histórico de Entrevistas</h3>
              <p className="text-gray-600">Visualize todas as entrevistas realizadas e seus resultados</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="bg-blue-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <CalendarDays className="h-10 w-10 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Visão de Calendário</h3>
              <p className="text-gray-600">Visualize entrevistas em formato de calendário mensal</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}