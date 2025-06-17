import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Brain
} from "lucide-react";

export function Sidebar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
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
      name: "Testes DISC",
      href: "/testes",
      icon: Brain,
      show: ["admin", "recrutador", "gestor"].includes(user?.perfil || ""),
    },
    {
      name: "Departamentos",
      href: "/departamentos",
      icon: Network,
      show: ["admin", "recrutador"].includes(user?.perfil || ""),
    },
    {
      name: "Usuários",
      href: "/usuarios",
      icon: Users,
      show: ["admin"].includes(user?.perfil || ""),
    },
    {
      name: "Empresas",
      href: "/empresas",
      icon: Building2,
      show: ["admin"].includes(user?.perfil || ""),
    },
  ];

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