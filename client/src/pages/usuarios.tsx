import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, UserPlus, Search, Shield, Users, Building, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

import { UserModal } from "@/components/modals/user-modal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Usuario, Empresa, Departamento } from "@shared/schema";

export default function UsuariosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPerfil, setFilterPerfil] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  // Fetch users
  const { data: usuarios = [], isLoading: loadingUsuarios, error: errorUsuarios } = useQuery<Usuario[]>({
    queryKey: ["/api/usuarios"],
  });

  // Fetch companies for dropdown
  const { data: empresas = [] } = useQuery<Empresa[]>({
    queryKey: ["/api/empresas"],
  });

  // Fetch departments for dropdown
  const { data: departamentos = [] } = useQuery<Departamento[]>({
    queryKey: ["/api/departamentos"],
  });

  // Delete user mutation (soft delete)
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/usuarios/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/usuarios"] });
      toast({
        title: "Usuário inativado",
        description: "Usuário foi inativado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao inativar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Change role mutation
  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, perfil }: { userId: string; perfil: string }) => {
      const res = await apiRequest("PATCH", `/api/usuarios/${userId}/perfil`, { perfil });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/usuarios"] });
      toast({
        title: "Perfil alterado",
        description: "Perfil do usuário foi alterado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao alterar perfil",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter users
  const filteredUsuarios = usuarios.filter((usuario) => {
    const matchesSearch = usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         usuario.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPerfil = filterPerfil === "all" || usuario.perfil === filterPerfil;
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "ativo" && usuario.ativo === 1) ||
                         (filterStatus === "inativo" && usuario.ativo === 0);
    
    return matchesSearch && matchesPerfil && matchesStatus;
  });

  const handleEditUser = (usuario: Usuario) => {
    setEditingUser(usuario);
    setIsModalOpen(true);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm("Tem certeza que deseja inativar este usuário?")) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleChangeRole = (userId: string, newRole: string) => {
    if (confirm(`Tem certeza que deseja alterar o perfil para ${newRole}?`)) {
      changeRoleMutation.mutate({ userId, perfil: newRole });
    }
  };

  const getPerfilBadgeVariant = (perfil: string) => {
    switch (perfil) {
      case "admin": return "destructive";
      case "recrutador": return "default";
      case "gestor": return "secondary";
      case "candidato": return "outline";
      default: return "outline";
    }
  };

  const getStatusBadgeVariant = (ativo: number) => {
    return ativo === 1 ? "default" : "secondary";
  };

  const getDepartmentName = (departamentoId: string | null) => {
    if (!departamentoId) return "Não definido";
    const dept = departamentos.find(d => d.id === departamentoId);
    return dept?.nome || "Não encontrado";
  };

  const getCompanyName = (empresaId: string) => {
    const empresa = empresas.find(e => e.id === empresaId);
    return empresa?.nome || "Não encontrada";
  };

  if (errorUsuarios) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600">Erro ao carregar usuários</h2>
            <p className="text-gray-600 mt-2">Verifique sua conexão e tente novamente.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Users className="h-8 w-8" />
                Gestão de Usuários
              </h1>
              <p className="text-gray-600 mt-2">
                Gerencie usuários, perfis e permissões da plataforma
              </p>
            </div>
            {currentUser?.perfil === 'admin' && (
              <Button 
                onClick={() => {
                  setEditingUser(null);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Novo Usuário
              </Button>
            )}
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterPerfil} onValueChange={setFilterPerfil}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os perfis</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="recrutador">Recrutador</SelectItem>
                    <SelectItem value="gestor">Gestor</SelectItem>
                    <SelectItem value="candidato">Candidato</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total de Usuários</p>
                    <p className="text-2xl font-bold">{usuarios.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="text-sm text-gray-600">Administradores</p>
                    <p className="text-2xl font-bold">
                      {usuarios.filter(u => u.perfil === 'admin').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Recrutadores</p>
                    <p className="text-2xl font-bold">
                      {usuarios.filter(u => u.perfil === 'recrutador').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Building className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Usuários Ativos</p>
                    <p className="text-2xl font-bold">
                      {usuarios.filter(u => u.ativo === 1).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Usuários ({filteredUsuarios.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingUsuarios ? (
                <div className="text-center py-8">
                  <p>Carregando usuários...</p>
                </div>
              ) : filteredUsuarios.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum usuário encontrado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Nome</th>
                        <th className="text-left p-2">Email</th>
                        <th className="text-left p-2">Perfil</th>
                        <th className="text-left p-2">Empresa</th>
                        <th className="text-left p-2">Departamento</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsuarios.map((usuario) => (
                        <tr key={usuario.id} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium">{usuario.nome}</td>
                          <td className="p-2 text-gray-600">{usuario.email}</td>
                          <td className="p-2">
                            <Badge variant={getPerfilBadgeVariant(usuario.perfil)}>
                              {usuario.perfil}
                            </Badge>
                          </td>
                          <td className="p-2 text-sm">{getCompanyName(usuario.empresaId)}</td>
                          <td className="p-2 text-sm">{getDepartmentName(usuario.departamentoId)}</td>
                          <td className="p-2">
                            <Badge variant={getStatusBadgeVariant(usuario.ativo)}>
                              {usuario.ativo === 1 ? "Ativo" : "Inativo"}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditUser(usuario)}
                                disabled={currentUser?.perfil !== 'admin' && currentUser?.id !== usuario.id}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {currentUser?.perfil === 'admin' && (
                                <>
                                  <Select
                                    value={usuario.perfil}
                                    onValueChange={(value) => handleChangeRole(usuario.id, value)}
                                  >
                                    <SelectTrigger className="w-32 h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="admin">Admin</SelectItem>
                                      <SelectItem value="recrutador">Recrutador</SelectItem>
                                      <SelectItem value="gestor">Gestor</SelectItem>
                                      <SelectItem value="candidato">Candidato</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteUser(usuario.id)}
                                    disabled={usuario.ativo === 0}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* User Modal */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUser(null);
        }}
        editingUser={editingUser}
      />
    </div>
  );
}