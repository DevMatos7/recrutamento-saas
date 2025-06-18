import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Building,
  Users,
  MapPin,
  Calendar,
  Phone,
  Mail,
  Globe,
  FileText,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";

const empresaFormSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  cnpj: z.string().min(14, "CNPJ deve ter pelo menos 14 caracteres"),
  email: z.string().email("E-mail inválido"),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  cep: z.string().optional(),
  website: z.string().optional(),
});

type EmpresaFormData = z.infer<typeof empresaFormSchema>;

export default function ModernEmpresas() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<any>(null);

  const { data: empresas, isLoading } = useQuery({
    queryKey: ["/api/empresas"],
  });

  const { data: usuarios } = useQuery({
    queryKey: ["/api/usuarios"],
  });

  const createEmpresaMutation = useMutation({
    mutationFn: async (data: EmpresaFormData) => {
      const res = await apiRequest("POST", "/api/empresas", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Empresa criada com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/empresas"] });
      setIsCreateModalOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao criar empresa", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const updateEmpresaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: EmpresaFormData }) => {
      const res = await apiRequest("PUT", `/api/empresas/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Empresa atualizada com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/empresas"] });
      setEditingEmpresa(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao atualizar empresa", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const deleteEmpresaMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/empresas/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Empresa excluída com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/empresas"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao excluir empresa", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const form = useForm<EmpresaFormData>({
    resolver: zodResolver(empresaFormSchema),
    defaultValues: {
      nome: "",
      cnpj: "",
      email: "",
      telefone: "",
      endereco: "",
      cidade: "",
      estado: "",
      cep: "",
      website: "",
    },
  });

  const filteredEmpresas = Array.isArray(empresas) ? empresas.filter((empresa: any) =>
    (empresa.nome?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (empresa.cnpj?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (empresa.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  ) : [];

  const empresaStats = [
    {
      name: 'Total de Empresas',
      value: Array.isArray(empresas) ? empresas.length : 0,
      icon: Building,
      color: 'bg-blue-500'
    },
    {
      name: 'Empresas Ativas',
      value: Array.isArray(empresas) ? empresas.filter((e: any) => e.ativa !== false).length : 0,
      icon: CheckCircle,
      color: 'bg-green-500'
    },
    {
      name: 'Total de Usuários',
      value: Array.isArray(usuarios) ? usuarios.length : 0,
      icon: Users,
      color: 'bg-purple-500'
    },
    {
      name: 'Cadastros Hoje',
      value: 2,
      icon: Calendar,
      color: 'bg-orange-500'
    },
  ];

  const onSubmit = (data: EmpresaFormData) => {
    if (editingEmpresa) {
      updateEmpresaMutation.mutate({ id: editingEmpresa.id, data });
    } else {
      createEmpresaMutation.mutate(data);
    }
  };

  const handleEdit = (empresa: any) => {
    setEditingEmpresa(empresa);
    form.reset({
      nome: empresa.nome || "",
      cnpj: empresa.cnpj || "",
      email: empresa.email || "",
      telefone: empresa.telefone || "",
      endereco: empresa.endereco || "",
      cidade: empresa.cidade || "",
      estado: empresa.estado || "",
      cep: empresa.cep || "",
      website: empresa.website || "",
    });
    setIsCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingEmpresa(null);
    form.reset();
  };

  const EmpresaCard = ({ empresa }: { empresa: any }) => {
    const usuariosDaEmpresa = Array.isArray(usuarios) ? 
      usuarios.filter((u: any) => u.empresaId === empresa.id).length : 0;
    
    return (
      <Card className="hover:shadow-lg transition-all duration-200 group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <div className="bg-purple-100 rounded-lg p-1.5">
                  <Building className="h-4 w-4 text-purple-600" />
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  Ativa
                </Badge>
              </div>
              <CardTitle className="text-lg font-bold text-gray-900 mb-2">
                {empresa.nome}
              </CardTitle>
              <div className="space-y-1">
                <div className="flex items-center text-sm text-gray-600">
                  <FileText className="h-3 w-3 mr-2" />
                  <span>CNPJ: {empresa.cnpj}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-3 w-3 mr-2" />
                  <span>{empresa.email}</span>
                </div>
                {empresa.telefone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-3 w-3 mr-2" />
                    <span>{empresa.telefone}</span>
                  </div>
                )}
                {empresa.cidade && empresa.estado && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-3 w-3 mr-2" />
                    <span>{empresa.cidade} - {empresa.estado}</span>
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
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Usuários:</span>
              <span className="font-medium">{usuariosDaEmpresa}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Criada em:</span>
              <span className="font-medium">
                {new Date(empresa.dataCriacao || new Date()).toLocaleDateString('pt-BR')}
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => handleEdit(empresa)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => deleteEmpresaMutation.mutate(empresa.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Empresas</h1>
          <p className="mt-2 text-gray-600">
            Gerencie todas as empresas cadastradas na plataforma
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button 
            className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Nova Empresa
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {empresaStats.map((stat) => (
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
                placeholder="Buscar empresas por nome, CNPJ ou e-mail..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          </div>
        </div>
      </Card>

      {/* Companies List */}
      <Tabs defaultValue="todas" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="todas">Todas</TabsTrigger>
            <TabsTrigger value="ativas">Ativas</TabsTrigger>
            <TabsTrigger value="inativas">Inativas</TabsTrigger>
          </TabsList>
          <div className="text-sm text-gray-600">
            {filteredEmpresas.length} empresa(s) encontrada(s)
          </div>
        </div>

        <TabsContent value="todas">
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
          ) : filteredEmpresas.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredEmpresas.map((empresa: any) => (
                <EmpresaCard key={empresa.id} empresa={empresa} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <div className="bg-purple-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Building className="h-10 w-10 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {searchQuery ? "Nenhuma empresa encontrada" : "Nenhuma empresa cadastrada"}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery 
                  ? "Tente ajustar os filtros para encontrar o que procura."
                  : "Comece cadastrando sua primeira empresa."
                }
              </p>
              <Button 
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {searchQuery ? "Cadastrar Nova Empresa" : "Cadastrar Primeira Empresa"}
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ativas">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="bg-green-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Empresas Ativas</h3>
              <p className="text-gray-600">Empresas com status ativo na plataforma</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inativas">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="bg-red-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="h-10 w-10 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Empresas Inativas</h3>
              <p className="text-gray-600">Empresas com status inativo na plataforma</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEmpresa ? "Editar Empresa" : "Nova Empresa"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Empresa *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Empresa ABC Ltda" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="00.000.000/0000-00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail *</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="contato@empresa.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="(11) 99999-9999" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endereco"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Rua das Empresas, 123" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="São Paulo" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="SP" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="00000-000" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://empresa.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={createEmpresaMutation.isPending || updateEmpresaMutation.isPending}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {createEmpresaMutation.isPending || updateEmpresaMutation.isPending 
                    ? "Salvando..." 
                    : editingEmpresa ? "Atualizar Empresa" : "Criar Empresa"
                  }
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCloseModal}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}