import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { UserModal } from "@/components/modals/user-modal";
import { Building, Users, Map, UserPlus, Bell, Edit, Trash2 } from "lucide-react";
import { type Usuario } from "@shared/schema";

export default function Dashboard() {
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
  });

  const { data: usuarios = [] } = useQuery<Usuario[]>({
    queryKey: ["/api/usuarios"],
  });

  const { data: empresas = [] } = useQuery({
    queryKey: ["/api/empresas"],
  });

  const { data: departamentos = [] } = useQuery({
    queryKey: ["/api/departamentos"],
  });

  // Create lookup objects for displaying related data
  const empresaMap = Array.isArray(empresas) ? empresas.reduce((acc: any, e: any) => ({ ...acc, [e.id]: e }), {}) : {};
  const departamentoMap = Array.isArray(departamentos) ? departamentos.reduce((acc: any, d: any) => ({ ...acc, [d.id]: d }), {}) : {};

  const handleEditUser = (user: Usuario) => {
    setEditingUser(user);
    setIsUserModalOpen(true);
  };

  const handleNewUser = () => {
    setEditingUser(null);
    setIsUserModalOpen(true);
  };

  const getProfileColor = (perfil: string) => {
    switch (perfil) {
      case "admin": return "bg-red-100 text-red-800";
      case "recrutador": return "bg-blue-100 text-blue-800";
      case "gestor": return "bg-purple-100 text-purple-800";
      case "candidato": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getUserInitials = (nome: string) => {
    return nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-auto bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
              <p className="text-gray-600">Visão geral do sistema GentePRO</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
              </Button>
              <Button onClick={handleNewUser} className="bg-primary hover:bg-primary/90">
                <UserPlus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de Empresas</p>
                    <p className="text-3xl font-bold text-gray-900">{(stats as any)?.empresas || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Departamentos</p>
                    <p className="text-3xl font-bold text-gray-900">{(stats as any)?.departamentos || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Map className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
                    <p className="text-3xl font-bold text-gray-900">{(stats as any)?.usuarios || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Novos Hoje</p>
                    <p className="text-3xl font-bold text-gray-900">{(stats as any)?.usuariosHoje || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <UserPlus className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Usuários Recentes</CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    Filtrar
                  </Button>
                  <Button variant="outline" size="sm">
                    Exportar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuarios.slice(0, 10).map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {getUserInitials(usuario.nome)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{usuario.nome}</div>
                            <div className="text-sm text-gray-500">{usuario.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{empresaMap[usuario.empresaId]?.nome || '-'}</TableCell>
                      <TableCell>{departamentoMap[usuario.departamentoId || '']?.nome || '-'}</TableCell>
                      <TableCell>
                        <Badge className={getProfileColor(usuario.perfil)}>
                          {usuario.perfil}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-emerald-100 text-emerald-800">
                          Ativo
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditUser(usuario)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestão de Empresas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(empresas as any[]).slice(0, 3).map((empresa: any) => (
                    <div key={empresa.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{empresa.nome}</h4>
                        <p className="text-sm text-gray-500">CNPJ: {empresa.cnpj}</p>
                      </div>
                      <Badge variant="secondary">Cliente</Badge>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full">
                    <Building className="h-4 w-4 mr-2" />
                    Nova Empresa
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status do Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">API Status</span>
                    <Badge className="bg-emerald-100 text-emerald-800">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full mr-1"></span>
                      Online
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Database</span>
                    <Badge className="bg-emerald-100 text-emerald-800">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full mr-1"></span>
                      Connected
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">JWT Authentication</span>
                    <Badge className="bg-emerald-100 text-emerald-800">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full mr-1"></span>
                      Active
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Última atualização</span>
                    <span className="text-sm text-gray-500">Agora</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <UserModal 
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setEditingUser(null);
        }}
        editingUser={editingUser}
      />
    </div>
  );
}
