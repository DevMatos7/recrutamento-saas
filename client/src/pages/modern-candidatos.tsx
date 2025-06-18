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
  Mail,
  Phone,
  Calendar,
  Briefcase,
  GraduationCap,
  Award,
  Star,
  MessageSquare,
  UserCheck,
  Download,
  FileText,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function ModernCandidatos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);

  const { data: candidatos, isLoading } = useQuery({
    queryKey: ["/api/candidatos"],
  });

  const deleteCandidatoMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/candidatos/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Candidato excluído com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/candidatos"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao excluir candidato", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const filteredCandidatos = Array.isArray(candidatos) ? candidatos.filter((candidato: any) => {
    const matchesSearch = candidato.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         candidato.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  }) : [];

  const candidatoStats = [
    {
      name: 'Total de Candidatos',
      value: Array.isArray(candidatos) ? candidatos.length : 0,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      name: 'Candidatos Ativos',
      value: Array.isArray(candidatos) ? candidatos.filter((c: any) => c.status === 'ativo').length : 0,
      icon: UserCheck,
      color: 'bg-green-500'
    },
    {
      name: 'Em Processo Seletivo',
      value: '89',
      icon: Clock,
      color: 'bg-orange-500'
    },
    {
      name: 'Contratados este mês',
      value: '12',
      icon: Award,
      color: 'bg-purple-500'
    },
  ];

  const CandidateCard = ({ candidato }: { candidato: any }) => (
    <Card className="hover:shadow-lg transition-all duration-200 group">
      <CardHeader className="pb-3">
        <div className="flex items-start space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-purple-100 text-purple-600 font-medium">
              {candidato.nome?.charAt(0) || 'C'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-gray-900 truncate">
                {candidato.nome}
              </CardTitle>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1 mt-2">
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="h-3 w-3 mr-2" />
                <span className="truncate">{candidato.email}</span>
              </div>
              {candidato.telefone && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-3 w-3 mr-2" />
                  <span>{candidato.telefone}</span>
                </div>
              )}
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-3 w-3 mr-2" />
                <span>{candidato.endereco || 'Localização não informada'}</span>
              </div>
              {candidato.experienciaProfissional && (
                <div className="flex items-center text-sm text-gray-600">
                  <Briefcase className="h-3 w-3 mr-2" />
                  <span className="truncate">{candidato.experienciaProfissional}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Skills */}
          {candidato.habilidades && candidato.habilidades.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {candidato.habilidades.slice(0, 3).map((skill: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {candidato.habilidades.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{candidato.habilidades.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Status and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                2 processos ativos
              </Badge>
              <div className="flex items-center text-xs text-yellow-600">
                <Star className="h-3 w-3 mr-1 fill-current" />
                4.8
              </div>
            </div>
            <div className="flex gap-1">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Eye className="h-3 w-3 mr-1" />
                    Ver
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Perfil do Candidato</DialogTitle>
                  </DialogHeader>
                  <CandidateDetailView candidato={candidato} />
                </DialogContent>
              </Dialog>
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                <MessageSquare className="h-3 w-3 mr-1" />
                Contatar
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const CandidateDetailView = ({ candidato }: { candidato: any }) => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start space-x-6 p-6 bg-gray-50 rounded-lg">
        <Avatar className="h-20 w-20">
          <AvatarFallback className="bg-purple-100 text-purple-600 text-2xl font-medium">
            {candidato.nome?.charAt(0) || 'C'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">{candidato.nome}</h2>
          <p className="text-gray-600 text-lg">{candidato.resumoProfissional || 'Profissional em busca de oportunidades'}</p>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="h-4 w-4 mr-2" />
              {candidato.email}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="h-4 w-4 mr-2" />
              {candidato.telefone || 'Não informado'}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-2" />
              {candidato.endereco || 'Localização não informada'}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              Cadastrado em {new Date(candidato.dataCriacao || new Date()).toLocaleDateString('pt-BR')}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download CV
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <MessageSquare className="h-4 w-4 mr-2" />
            Contatar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-gray-100">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="experience">Experiência</TabsTrigger>
          <TabsTrigger value="education">Educação</TabsTrigger>
          <TabsTrigger value="applications">Candidaturas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Briefcase className="h-5 w-5 mr-2" />
                  Habilidades
                </CardTitle>
              </CardHeader>
              <CardContent>
                {candidato.habilidades && candidato.habilidades.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {candidato.habilidades.map((skill: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Habilidades não informadas</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Award className="h-5 w-5 mr-2" />
                  Idiomas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {candidato.idiomas && candidato.idiomas.length > 0 ? (
                  <div className="space-y-2">
                    {candidato.idiomas.map((idioma: any, index: number) => (
                      <div key={index} className="flex justify-between">
                        <span>{idioma.idioma}</span>
                        <Badge variant="outline">{idioma.nivel}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Idiomas não informados</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="experience">
          <Card>
            <CardHeader>
              <CardTitle>Experiência Profissional</CardTitle>
            </CardHeader>
            <CardContent>
              {candidato.experiencias && candidato.experiencias.length > 0 ? (
                <div className="space-y-4">
                  {candidato.experiencias.map((exp: any, index: number) => (
                    <div key={index} className="border-l-2 border-purple-200 pl-4">
                      <h4 className="font-semibold text-lg">{exp.cargo}</h4>
                      <p className="text-purple-600 font-medium">{exp.empresa}</p>
                      <p className="text-sm text-gray-600">{exp.periodo}</p>
                      <p className="text-gray-700 mt-2">{exp.descricao}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Experiência profissional não informada</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="education">
          <Card>
            <CardHeader>
              <CardTitle>Formação Acadêmica</CardTitle>
            </CardHeader>
            <CardContent>
              {candidato.formacoes && candidato.formacoes.length > 0 ? (
                <div className="space-y-4">
                  {candidato.formacoes.map((formacao: any, index: number) => (
                    <div key={index} className="border-l-2 border-blue-200 pl-4">
                      <h4 className="font-semibold text-lg">{formacao.curso}</h4>
                      <p className="text-blue-600 font-medium">{formacao.instituicao}</p>
                      <p className="text-sm text-gray-600">{formacao.periodo}</p>
                      <Badge variant="outline">{formacao.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Formação acadêmica não informada</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>Candidaturas Ativas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h5 className="font-medium">Desenvolvedor Frontend</h5>
                    <p className="text-sm text-gray-600">Tech Solutions</p>
                  </div>
                  <Badge>Em triagem</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h5 className="font-medium">UX Designer</h5>
                    <p className="text-sm text-gray-600">Creative Agency</p>
                  </div>
                  <Badge variant="secondary">Entrevista agendada</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Candidatos</h1>
          <p className="mt-2 text-gray-600">
            Gerencie o banco de talentos e acompanhe os perfis dos candidatos
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Candidato
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {candidatoStats.map((stat) => (
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
                placeholder="Buscar candidatos por nome, email ou habilidade..."
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
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="inativo">Inativos</SelectItem>
                <SelectItem value="contratado">Contratados</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros Avançados
            </Button>
          </div>
        </div>
      </Card>

      {/* Candidates Grid */}
      <Tabs defaultValue="grid" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="grid">Grade</TabsTrigger>
            <TabsTrigger value="list">Lista</TabsTrigger>
          </TabsList>
          <div className="text-sm text-gray-600">
            {filteredCandidatos.length} candidato(s) encontrado(s)
          </div>
        </div>

        <TabsContent value="grid">
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="flex space-x-4">
                      <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
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
          ) : filteredCandidatos.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCandidatos.map((candidato: any) => (
                <CandidateCard key={candidato.id} candidato={candidato} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <div className="bg-purple-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Users className="h-10 w-10 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {searchQuery ? "Nenhum candidato encontrado" : "Nenhum candidato cadastrado"}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery 
                  ? "Tente ajustar os filtros para encontrar o que procura."
                  : "Comece adicionando candidatos ao seu banco de talentos."
                }
              </p>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                {searchQuery ? "Adicionar Novo Candidato" : "Adicionar Primeiro Candidato"}
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200">
                {filteredCandidatos.map((candidato: any) => (
                  <div key={candidato.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-purple-100 text-purple-600 font-medium">
                            {candidato.nome?.charAt(0) || 'C'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">{candidato.nome}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <span>{candidato.email}</span>
                            <span>{candidato.telefone}</span>
                            <span>{candidato.endereco || 'Localização não informada'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <Badge variant="secondary">2 processos ativos</Badge>
                          <div className="flex items-center text-sm text-yellow-600 mt-1">
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            4.8
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                          <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Contatar
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