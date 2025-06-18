import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  MessageSquare,
  Send,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Calendar,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const CreateComunicacaoForm = ({ onClose }: { onClose: () => void }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: candidatos } = useQuery({
    queryKey: ["/api/candidatos"],
  });

  const createComunicacaoMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/comunicacoes", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Comunicação criada com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/comunicacoes"] });
      onClose();
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao criar comunicação", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const [formData, setFormData] = useState({
    candidatoId: "",
    tipo: "email",
    assunto: "",
    mensagem: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.candidatoId || !formData.mensagem) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }
    createComunicacaoMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="candidato">Candidato *</Label>
        <Select value={formData.candidatoId} onValueChange={(value) => setFormData({...formData, candidatoId: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o candidato" />
          </SelectTrigger>
          <SelectContent>
            {Array.isArray(candidatos) && candidatos.map((candidato: any) => (
              <SelectItem key={candidato.id} value={candidato.id}>
                {candidato.nome} - {candidato.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="tipo">Tipo *</Label>
        <Select value={formData.tipo} onValueChange={(value) => setFormData({...formData, tipo: value})}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="email">E-mail</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="assunto">Assunto</Label>
        <Input
          id="assunto"
          value={formData.assunto}
          onChange={(e) => setFormData({...formData, assunto: e.target.value})}
          placeholder="Assunto da mensagem"
        />
      </div>

      <div>
        <Label htmlFor="mensagem">Mensagem *</Label>
        <Textarea
          id="mensagem"
          value={formData.mensagem}
          onChange={(e) => setFormData({...formData, mensagem: e.target.value})}
          placeholder="Digite sua mensagem..."
          rows={4}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button 
          type="submit" 
          disabled={createComunicacaoMutation.isPending}
          className="flex-1 bg-purple-600 hover:bg-purple-700"
        >
          {createComunicacaoMutation.isPending ? "Enviando..." : "Enviar Comunicação"}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onClose}
          className="flex-1"
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
};

export default function ModernComunicacoes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tipoFilter, setTipoFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: comunicacoes, isLoading } = useQuery({
    queryKey: ["/api/comunicacoes"],
  });

  const { data: templates } = useQuery({
    queryKey: ["/api/comunicacoes/templates"],
  });

  const { data: candidatos } = useQuery({
    queryKey: ["/api/candidatos"],
  });

  const deleteComunicacaoMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/comunicacoes/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Comunicação excluída com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/comunicacoes"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao excluir comunicação", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const filteredComunicacoes = Array.isArray(comunicacoes) ? comunicacoes.filter((comunicacao: any) => {
    const matchesSearch = comunicacao.candidato?.nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         comunicacao.assunto?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || comunicacao.status === statusFilter;
    const matchesTipo = tipoFilter === "all" || comunicacao.tipo === tipoFilter;
    return matchesSearch && matchesStatus && matchesTipo;
  }) : [];

  const comunicacaoStats = [
    {
      name: 'Total de Mensagens',
      value: Array.isArray(comunicacoes) ? comunicacoes.length : 0,
      icon: MessageSquare,
      color: 'bg-blue-500'
    },
    {
      name: 'Mensagens Enviadas',
      value: Array.isArray(comunicacoes) ? comunicacoes.filter((c: any) => c.status === 'enviado').length : 0,
      icon: CheckCircle,
      color: 'bg-green-500'
    },
    {
      name: 'Pendentes',
      value: Array.isArray(comunicacoes) ? comunicacoes.filter((c: any) => c.status === 'pendente').length : 0,
      icon: Clock,
      color: 'bg-orange-500'
    },
    {
      name: 'Com Erro',
      value: Array.isArray(comunicacoes) ? comunicacoes.filter((c: any) => c.status === 'erro').length : 0,
      icon: XCircle,
      color: 'bg-red-500'
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enviado': return 'bg-green-100 text-green-800 border-green-200';
      case 'pendente': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'erro': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'enviado': return 'Enviado';
      case 'pendente': return 'Pendente';
      case 'erro': return 'Erro';
      default: return 'Indefinido';
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'whatsapp': return Phone;
      case 'email': return Mail;
      default: return MessageSquare;
    }
  };

  const ComunicacaoCard = ({ comunicacao }: { comunicacao: any }) => {
    const TipoIcon = getTipoIcon(comunicacao.tipo);
    
    return (
      <Card className="hover:shadow-lg transition-all duration-200 group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <div className="bg-purple-100 rounded-lg p-1.5">
                  <TipoIcon className="h-4 w-4 text-purple-600" />
                </div>
                <Badge className={getStatusColor(comunicacao.status)}>
                  {getStatusText(comunicacao.status)}
                </Badge>
                <span className="text-xs text-gray-500 capitalize">{comunicacao.tipo}</span>
              </div>
              <CardTitle className="text-lg font-bold text-gray-900 mb-2">
                {comunicacao.assunto || 'Sem assunto'}
              </CardTitle>
              <div className="space-y-1">
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-3 w-3 mr-2" />
                  <span>{comunicacao.candidato?.nome || comunicacao.destinatario}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-3 w-3 mr-2" />
                  <span>
                    {comunicacao.dataEnvio ? 
                      new Date(comunicacao.dataEnvio).toLocaleString('pt-BR') : 
                      'Não enviado'
                    }
                  </span>
                </div>
                {comunicacao.templateUsado && (
                  <div className="flex items-center text-sm text-purple-600">
                    <FileText className="h-3 w-3 mr-2" />
                    <span>Template: {comunicacao.templateUsado}</span>
                  </div>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <p className="text-gray-700 text-sm line-clamp-3">
              {comunicacao.mensagem}
            </p>

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
                    <DialogTitle>Detalhes da Comunicação</DialogTitle>
                  </DialogHeader>
                  <ComunicacaoDetailView comunicacao={comunicacao} />
                </DialogContent>
              </Dialog>
              {comunicacao.status === 'pendente' && (
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                  <Send className="h-4 w-4 mr-2" />
                  Enviar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const ComunicacaoDetailView = ({ comunicacao }: { comunicacao: any }) => (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-bold text-gray-900">{comunicacao.assunto}</h3>
        <p className="text-gray-600">{comunicacao.candidato?.nome || comunicacao.destinatario}</p>
        <div className="grid grid-cols-2 gap-4 mt-3">
          <div>
            <span className="text-sm text-gray-500">Tipo:</span>
            <p className="font-medium capitalize">{comunicacao.tipo}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Status:</span>
            <Badge className={getStatusColor(comunicacao.status)}>
              {getStatusText(comunicacao.status)}
            </Badge>
          </div>
          <div>
            <span className="text-sm text-gray-500">Data de Envio:</span>
            <p className="font-medium">
              {comunicacao.dataEnvio ? 
                new Date(comunicacao.dataEnvio).toLocaleString('pt-BR') : 
                'Ainda não enviado'
              }
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Template:</span>
            <p className="font-medium">{comunicacao.templateUsado || 'Mensagem personalizada'}</p>
          </div>
        </div>
      </div>

      {/* Message Content */}
      <div>
        <Label>Conteúdo da Mensagem:</Label>
        <div className="mt-2 p-4 bg-white border rounded-lg">
          <p className="text-gray-700 whitespace-pre-wrap">{comunicacao.mensagem}</p>
        </div>
      </div>

      {/* Error Details */}
      {comunicacao.status === 'erro' && comunicacao.erroDetalhes && (
        <div>
          <Label className="text-red-600">Detalhes do Erro:</Label>
          <div className="mt-2 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{comunicacao.erroDetalhes}</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Comunicações WhatsApp e E-mail</h1>
          <p className="mt-2 text-gray-600">
            Gerencie o envio de mensagens automáticas e manuais para candidatos
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nova Comunicação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nova Comunicação</DialogTitle>
              </DialogHeader>
              <CreateComunicacaoForm onClose={() => setIsCreateModalOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {comunicacaoStats.map((stat) => (
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
                placeholder="Buscar por candidato, assunto ou conteúdo..."
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
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="enviado">Enviadas</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="erro">Com Erro</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="email">E-mail</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          </div>
        </div>
      </Card>

      {/* Communications List */}
      <Tabs defaultValue="historico" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
            <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
            <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
          </TabsList>
          <div className="text-sm text-gray-600">
            {filteredComunicacoes.length} comunicação(ões) encontrada(s)
          </div>
        </div>

        <TabsContent value="historico">
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
          ) : filteredComunicacoes.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredComunicacoes.map((comunicacao: any) => (
                <ComunicacaoCard key={comunicacao.id} comunicacao={comunicacao} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <div className="bg-purple-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="h-10 w-10 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {searchQuery || statusFilter !== "all" || tipoFilter !== "all"
                  ? "Nenhuma comunicação encontrada" 
                  : "Nenhuma comunicação enviada"
                }
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || statusFilter !== "all" || tipoFilter !== "all"
                  ? "Tente ajustar os filtros para encontrar o que procura."
                  : "Comece enviando mensagens para seus candidatos."
                }
              </p>
              <Button 
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {searchQuery || statusFilter !== "all" || tipoFilter !== "all" 
                  ? "Criar Nova Comunicação" 
                  : "Enviar Primeira Mensagem"
                }
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pendentes">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="bg-orange-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Clock className="h-10 w-10 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Mensagens Pendentes</h3>
              <p className="text-gray-600">Visualize e gerencie mensagens aguardando envio</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estatisticas">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Taxa de Entrega por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-green-600" />
                      <span>WhatsApp</span>
                    </div>
                    <span className="font-bold text-green-600">98.5%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full w-[98%]"></div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <span>E-mail</span>
                    </div>
                    <span className="font-bold text-blue-600">94.2%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full w-[94%]"></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Templates Mais Utilizados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Confirmação de Inscrição</span>
                    <Badge variant="outline">45%</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Agendamento de Entrevista</span>
                    <Badge variant="outline">32%</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Feedback do Processo</span>
                    <Badge variant="outline">23%</Badge>
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