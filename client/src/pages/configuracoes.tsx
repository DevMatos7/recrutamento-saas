import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import DepartamentosPage from "@/pages/departamentos";
import EmpresasPage from "@/pages/empresas";
import UsuariosPage from "@/pages/usuarios";
import Dashboard from "@/pages/dashboard";
import { 
  Building2, 
  Users, 
  Network, 
  BarChart3,
  Settings
} from "lucide-react";

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Verificar permissões baseadas no perfil do usuário
  const canViewEmpresas = ["admin"].includes(user?.perfil || "");
  const canViewUsuarios = ["admin"].includes(user?.perfil || "");
  const canViewDepartamentos = ["admin", "recrutador"].includes(user?.perfil || "");

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie empresas, usuários, departamentos e visualize estatísticas gerais
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          
          {canViewDepartamentos && (
            <TabsTrigger value="departamentos" className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              Departamentos
            </TabsTrigger>
          )}
          
          {canViewUsuarios && (
            <TabsTrigger value="usuarios" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
          )}
          
          {canViewEmpresas && (
            <TabsTrigger value="empresas" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Empresas
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Dashboard Geral
                <Badge variant="outline">Estatísticas do Sistema</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Dashboard />
            </CardContent>
          </Card>
        </TabsContent>

        {canViewDepartamentos && (
          <TabsContent value="departamentos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Gestão de Departamentos
                  <Badge variant="outline">Estrutura Organizacional</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DepartamentosPage />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {canViewUsuarios && (
          <TabsContent value="usuarios" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Gestão de Usuários
                  <Badge variant="outline">Controle de Acesso</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UsuariosPage />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {canViewEmpresas && (
          <TabsContent value="empresas" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Gestão de Empresas
                  <Badge variant="outline">Cadastro de Clientes</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EmpresasPage />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {!canViewEmpresas && !canViewUsuarios && !canViewDepartamentos && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Você não tem permissão para acessar as configurações avançadas.</p>
              <p className="text-sm mt-2">
                Apenas administradores e recrutadores podem gerenciar configurações do sistema.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}