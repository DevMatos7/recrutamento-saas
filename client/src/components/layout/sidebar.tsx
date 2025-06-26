import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Building2, 
  UserCheck,
  Network,
  Settings,
  LogOut,
  GitBranch,
  Brain,
  Calendar,
  MessageSquare,
  BarChart3,
  Globe,
  Clock,
  ChevronDown,
  ChevronRight
} from "lucide-react";

export function Sidebar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [configuracoesOpen, setConfiguracoesOpen] = useState(
    location.startsWith("/configuracoes") || 
    location === "/dashboard" || 
    location === "/empresas" || 
    location === "/usuarios" || 
    location === "/departamentos"
  );

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navigation = [
    {
      name: "Analytics",
      href: "/",
      icon: BarChart3,
      show: true,
    },
    {
      name: "Vagas",
      href: "/vagas",
      icon: Briefcase,
      show: ["admin", "recrutador", "gestor"].includes(user?.perfil || ""),
    },
    {
      name: "Candidatos",
      href: "/candidatos",
      icon: UserCheck,
      show: ["admin", "recrutador", "gestor"].includes(user?.perfil || ""),
    },
    {
      name: "Pipeline",
      href: "/pipeline",
      icon: GitBranch,
      show: ["admin", "recrutador", "gestor"].includes(user?.perfil || ""),
    },
    {
      name: "Candidaturas Pendentes",
      href: "/candidaturas-pendentes",
      icon: Clock,
      show: ["admin", "recrutador"].includes(user?.perfil || ""),
    },
    {
      name: "Avaliações",
      href: "/testes",
      icon: Brain,
      show: ["admin", "recrutador", "gestor"].includes(user?.perfil || ""),
    },
    {
      name: "Editor DISC",
      href: "/avaliacao-disc/editor",
      icon: Brain,
      show: user?.perfil === "admin",
    },
    {
      name: "Teste DISC",
      href: "/avaliacao-disc",
      icon: Brain,
      show: user?.perfil === "candidato",
    },
    {
      name: "Entrevistas",
      href: "/entrevistas",
      icon: Calendar,
      show: ["admin", "recrutador", "gestor"].includes(user?.perfil || ""),
    },
    {
      name: "Recomendações IA",
      href: "/ai-recommendations",
      icon: Brain,
      show: ["admin", "recrutador"].includes(user?.perfil || ""),
    },
    {
      name: "Portal do Candidato",
      href: "/portal",
      icon: Globe,
      show: ["admin", "recrutador"].includes(user?.perfil || ""),
      target: "_blank",
    },
  ];

  // Submenus de configurações
  const configuracoesSubmenus = [
    {
      name: "Dashboard",
      href: "/configuracoes/dashboard",
      icon: LayoutDashboard,
      show: ["admin", "recrutador", "gestor"].includes(user?.perfil || ""),
    },
    {
      name: "Departamentos", 
      href: "/configuracoes/departamentos",
      icon: Network,
      show: ["admin", "recrutador"].includes(user?.perfil || ""),
    },
    {
      name: "Usuários",
      href: "/configuracoes/usuarios", 
      icon: Users,
      show: ["admin"].includes(user?.perfil || ""),
    },
    {
      name: "Empresas",
      href: "/configuracoes/empresas",
      icon: Building2,
      show: ["admin"].includes(user?.perfil || ""),
    },
    {
      name: "Comunicações",
      href: "/configuracoes/comunicacoes",
      icon: MessageSquare,
      show: ["admin", "recrutador"].includes(user?.perfil || ""),
    },
    {
      name: "Credenciais",
      href: "/configuracoes/credenciais",
      icon: Settings,
      show: ["admin"].includes(user?.perfil || ""),
    },
  ];

  const hasConfigAccess = configuracoesSubmenus.some(item => item.show);

  return (
    <div className="flex h-screen w-64 flex-col bg-gray-50 border-r">
      {/* Header */}
      <div className="flex h-16 items-center justify-center border-b bg-white">
        <h1 className="text-xl font-bold text-blue-600">GentePRO</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-4">
        {navigation
          .filter(item => item.show)
          .map((item) => {
            const isActive = location === item.href;
            
            if (item.target === "_blank") {
              return (
                <a key={item.name} href={item.href} target="_blank" rel="noopener noreferrer">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3"
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Button>
                </a>
              );
            }
            
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className="w-full justify-start gap-3"
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Button>
              </Link>
            );
          })}

        {/* Menu Configurações com submenu */}
        {hasConfigAccess && (
          <Collapsible open={configuracoesOpen} onOpenChange={setConfiguracoesOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant={location.startsWith("/configuracoes") ? "default" : "ghost"}
                className="w-full justify-start gap-3"
              >
                <Settings className="h-5 w-5" />
                Configurações
                {configuracoesOpen ? (
                  <ChevronDown className="ml-auto h-4 w-4" />
                ) : (
                  <ChevronRight className="ml-auto h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 pl-4 pt-1">
              {configuracoesSubmenus.filter(item => item.show).map((item) => {
                const isActive = location === item.href;
                const IconComponent = item.icon;
                
                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className="w-full justify-start gap-3"
                    >
                      <IconComponent className="h-4 w-4" />
                      {item.name}
                    </Button>
                  </Link>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        )}
      </nav>

      {/* User Info */}
      <div className="border-t bg-white p-4">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="font-medium text-sm">{user?.nome}</div>
              <div className="text-xs text-gray-500">{user?.email}</div>
              <div className="text-xs text-blue-600 font-medium capitalize">
                {user?.perfil}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}