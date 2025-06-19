import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  User,
  Users,
  Shield,
  Building,
  Mail,
  UserCheck,
  UserX,
  Crown,
  Briefcase
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";

const usuarioFormSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  role: z.enum(["admin", "recrutador", "gestor"]),
  empresaId: z.string().min(1, "Empresa é obrigatória"),
  departamentoId: z.string().optional(),
});

const usuarioEditFormSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("E-mail inválido"),
  senha: z.string().optional(),
  role: z.enum(["admin", "recrutador", "gestor"]),
  empresaId: z.string().min(1, "Empresa é obrigatória"),
  departamentoId: z.string().optional(),
});

type UsuarioFormData = z.infer<typeof usuarioFormSchema>;

const ROLE_CONFIG = {
  admin: { 
    label: "Administrador", 
    color: "bg-red-100 text-red-800 border-red-200",
    icon: Crown,
    description: "Acesso total ao sistema"
  },
  recrutador: { 
    label: "Recrutador", 
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Users,
    description: "Gestão de vagas e candidatos"
  },
  gestor: { 
    label: "Gestor", 
    color: "bg-green-100 text-green-800 border-green-200",
    icon: Briefcase,
    description: "Gestão de departamento"
  },
};

export default function ModernUsuarios() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [empresaFilter, setEmpresaFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<any>(null);

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ["/api/usuarios"],
  });

  const { data: empresas } = useQuery({
    queryKey: ["/api/empresas"],
  });

  const { data: departamentos } = useQuery({
    queryKey: ["/api/departamentos"],
  });

  const createUsuarioMutation = useMutation({
    mutationFn: async (data: UsuarioFormData) => {
      const res = await apiRequest("POST", "/api/usuarios", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Usuário criado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/usuarios"] });
      setIsCreateModalOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      console.error("Create user error:", error);
      toast({ 
        title: "Erro ao criar usuário", 
        description: error.message || "Erro desconhecido",
        variant: "destructive" 
      });
    }
  });

  const updateUsuarioMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<UsuarioFormData> }) => {
      const res = await apiRequest("PUT", `/api/usuarios/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Usuário atualizado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/usuarios"] });
      setEditingUsuario(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao atualizar usuário", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const deleteUsuarioMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/usuarios/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Usuário excluído com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/usuarios"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao excluir usuário", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const form = useForm<UsuarioFormData>({
    resolver: zodResolver(editingUsuario ? usuarioEditFormSchema : usuarioFormSchema),
    defaultValues: {
      nome: "",
      email: "",
      senha: "",
      role: "recrutador",
      empresaId: "",
      departamentoId: "",
    },
  });

  const filteredUsuarios = Array.isArray(usuarios) ? usuarios.filter((usuario: any) => {
    const matchesSearch = (usuario.nome?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                         (usuario.email?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || usuario.role === roleFilter;
    const matchesEmpresa = empresaFilter === "all" || usuario.empresaId === empresaFilter;
    return matchesSearch && matchesRole && matchesEmpresa;
  }) : [];

  const usuarioStats = [
    {
      name: 'Total de Usuários',
      value: Array.isArray(usuarios) ? usuarios.length : 0,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      name: 'Administradores',
      value: Array.isArray(usuarios) ? usuarios.filter((u: any) => u.role === 'admin').length : 0,
      icon: Crown,
      color: 'bg-red-500'
    },
    {
      name: 'Recrutadores',
      value: Array.isArray(usuarios) ? usuarios.filter((u: any) => u.role === 'recrutador').length : 0,
      icon: UserCheck,
      color: 'bg-green-500'
    },
    {
      name: 'Gerentes',
      value: Array.isArray(usuarios) ? usuarios.filter((u: any) => u.role === 'gestor').length : 0,
      icon: Briefcase,
      color: 'bg-purple-500'
    },
  ];

  const onSubmit = (data: UsuarioFormData) => {
    console.log("Form submit data:", data);
    if (editingUsuario) {
      const updateData: any = { ...data };
      if (data.senha === editingUsuario.senha) {
        delete updateData.senha; // Don't update password if unchanged
      }
      updateUsuarioMutation.mutate({ id: editingUsuario.id, data: updateData });
    } else {
      createUsuarioMutation.mutate(data);
    }
  };

  const handleEdit = (usuario: any) => {
    setEditingUsuario(usuario);
    form.reset({
      nome: usuario.nome || "",
      email: usuario.email || "",
      senha: usuario.senha || "", // For edit, we'll handle this differently
      role: usuario.role || "recruiter",
      empresaId: usuario.empresaId || "",
      departamentoId: usuario.departamentoId || "",
    });
    setIsCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingUsuario(null);
    form.reset();
  };

  const getUserInitials = (nome: string) => {
    return nome.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const getEmpresaNome = (empresaId: string) => {
    const empresa = Array.isArray(empresas) ? empresas.find((e: any) => e.id === empresaId) : null;
    return empresa?.nome || 'Empresa não encontrada';
  };

  const UsuarioCard = ({ usuario }: { usuario: any }) => {
    const roleConfig = ROLE_CONFIG[usuario.role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.recrutador;
    const RoleIcon = roleConfig.icon;
    
    return (
      <Card className="hover:shadow-lg transition-all duration-200 group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-purple-100 text-purple-600 font-semibold">
                  {getUserInitials(usuario.nome)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge className={roleConfig.color}>
                    <RoleIcon className="h-3 w-3 mr-1" />
                    {roleConfig.label}
                  </Badge>
                </div>
                <CardTitle className="text-lg font-bold text-gray-900 mb-1">
                  {usuario.nome}
                </CardTitle>
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-3 w-3 mr-2" />
                    <span>{usuario.email}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Building className="h-3 w-3 mr-2" />
                    <span>{getEmpresaNome(usuario.empresaId)}</span>
                  </div>
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
            <p className="text-sm text-gray-600">
              {roleConfig.description}
            </p>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Último acesso:</span>
              <span className="font-medium">Hoje às 14:30</span>
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => handleEdit(usuario)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => deleteUsuarioMutation.mutate(usuario.id)}
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
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Usuários</h1>
          <p className="mt-2 text-gray-600">
            Gerencie todos os usuários e suas permissões na plataforma
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button 
            className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Novo Usuário
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {usuarioStats.map((stat) => (
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
                placeholder="Buscar usuários por nome ou e-mail..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Funções</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="recrutador">Recrutador</SelectItem>
                <SelectItem value="gestor">Gestor</SelectItem>
              </SelectContent>
            </Select>
            <Select value={empresaFilter} onValueChange={setEmpresaFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Empresas</SelectItem>
                {Array.isArray(empresas) && empresas.map((empresa: any) => (
                  <SelectItem key={empresa.id} value={empresa.id}>
                    {empresa.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          </div>
        </div>
      </Card>

      {/* Users List */}
      <Tabs defaultValue="todos" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="admin">Administradores</TabsTrigger>
            <TabsTrigger value="recrutador">Recrutadores</TabsTrigger>
            <TabsTrigger value="gestor">Gestores</TabsTrigger>
          </TabsList>
          <div className="text-sm text-gray-600">
            {filteredUsuarios.length} usuário(s) encontrado(s)
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
          ) : filteredUsuarios.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredUsuarios.map((usuario: any) => (
                <UsuarioCard key={usuario.id} usuario={usuario} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <div className="bg-purple-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Users className="h-10 w-10 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {searchQuery || roleFilter !== "all" || empresaFilter !== "all"
                  ? "Nenhum usuário encontrado" 
                  : "Nenhum usuário cadastrado"
                }
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || roleFilter !== "all" || empresaFilter !== "all"
                  ? "Tente ajustar os filtros para encontrar o que procura."
                  : "Comece cadastrando seu primeiro usuário."
                }
              </p>
              <Button 
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {searchQuery || roleFilter !== "all" || empresaFilter !== "all" 
                  ? "Cadastrar Novo Usuário" 
                  : "Cadastrar Primeiro Usuário"
                }
              </Button>
            </Card>
          )}
        </TabsContent>

        {Object.entries(ROLE_CONFIG).map(([role, config]) => (
          <TabsContent key={role} value={role}>
            <Card>
              <CardContent className="p-12 text-center">
                <div className="bg-purple-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                  <config.icon className="h-10 w-10 text-purple-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{config.label}s</h3>
                <p className="text-gray-600">{config.description}</p>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Create/Edit Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingUsuario ? "Editar Usuário" : "Novo Usuário"}
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
                      <FormLabel>Nome Completo *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: João Silva" />
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
                        <Input {...field} type="email" placeholder="joao@empresa.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="senha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Senha {editingUsuario ? "(deixe em branco para manter)" : "*"}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="password" 
                          placeholder={editingUsuario ? "••••••••" : "Mínimo 6 caracteres"} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Função *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a função" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="recruiter">Recrutador</SelectItem>
                          <SelectItem value="manager">Gerente</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="empresaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empresa *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a empresa" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.isArray(empresas) && empresas.map((empresa: any) => (
                            <SelectItem key={empresa.id} value={empresa.id}>
                              {empresa.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="departamentoId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departamento</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o departamento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.isArray(departamentos) && departamentos.map((dept: any) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={createUsuarioMutation.isPending || updateUsuarioMutation.isPending}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {createUsuarioMutation.isPending || updateUsuarioMutation.isPending 
                    ? "Salvando..." 
                    : editingUsuario ? "Atualizar Usuário" : "Criar Usuário"
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