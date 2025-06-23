import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function ConfiguracoesPage() {
  const { user } = useAuth();

  // Verificar se tem alguma permissão de configuração
  const canViewEmpresas = ["admin"].includes(user?.perfil || "");
  const canViewUsuarios = ["admin"].includes(user?.perfil || "");
  const canViewDepartamentos = ["admin", "recrutador"].includes(user?.perfil || "");
  const canViewDashboard = ["admin", "recrutador", "gestor"].includes(user?.perfil || "");

  const hasAnyAccess = canViewEmpresas || canViewUsuarios || canViewDepartamentos || canViewDashboard;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">
            Use o menu lateral para acessar as opções de configuração
          </p>
        </div>
      </div>

      {hasAnyAccess ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Selecione uma opção no menu lateral</p>
              <p>Use o menu "Configurações" na barra lateral para acessar:</p>
              <ul className="mt-4 space-y-2 text-sm">
                {canViewDashboard && <li>• Dashboard - Estatísticas gerais do sistema</li>}
                {canViewDepartamentos && <li>• Departamentos - Gestão da estrutura organizacional</li>}
                {canViewUsuarios && <li>• Usuários - Controle de acesso e perfis</li>}
                {canViewEmpresas && <li>• Empresas - Cadastro de clientes</li>}
                {["admin", "recrutador"].includes(user?.perfil || "") && <li>• Comunicações - Gestão de mensagens</li>}
                {["admin"].includes(user?.perfil || "") && <li>• Credenciais - Configuração SMTP e WhatsApp</li>}
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : (
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