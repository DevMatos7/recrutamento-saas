import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Building, 
  Map, 
  UserCog, 
  Briefcase, 
  UserRoundCheck, 
  ClipboardList,
  BarChart3,
  LogOut
} from "lucide-react";

export function Sidebar() {
  const { user, logoutMutation } = useAuth();

  const getUserInitials = (nome: string) => {
    return nome?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <aside className="w-64 bg-white shadow-lg flex flex-col">
      {/* Logo Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center">
            <Users className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">GentePRO</h1>
            <p className="text-xs text-gray-500">Recrutamento Inteligente</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        <div className="space-y-1">
          <Button variant="default" className="w-full justify-start bg-primary text-white">
            <BarChart3 className="w-5 h-5 mr-3" />
            Dashboard
          </Button>
          
          <div className="pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
              GESTÃO
            </p>
            <Button variant="ghost" className="w-full justify-start text-gray-700 hover:bg-gray-100">
              <Building className="w-5 h-5 mr-3 text-gray-400" />
              Empresas
            </Button>
            <Button variant="ghost" className="w-full justify-start text-gray-700 hover:bg-gray-100">
              <Map className="w-5 h-5 mr-3 text-gray-400" />
              Departamentos
            </Button>
            <Button variant="ghost" className="w-full justify-start text-gray-700 hover:bg-gray-100">
              <UserCog className="w-5 h-5 mr-3 text-gray-400" />
              Usuários
            </Button>
          </div>

          <div className="pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
              RECRUTAMENTO
            </p>
            <Button variant="ghost" className="w-full justify-start text-gray-700 hover:bg-gray-100">
              <Briefcase className="w-5 h-5 mr-3 text-gray-400" />
              Vagas
            </Button>
            <Button variant="ghost" className="w-full justify-start text-gray-700 hover:bg-gray-100">
              <UserRoundCheck className="w-5 h-5 mr-3 text-gray-400" />
              Candidatos
            </Button>
            <Button variant="ghost" className="w-full justify-start text-gray-700 hover:bg-gray-100">
              <ClipboardList className="w-5 h-5 mr-3 text-gray-400" />
              Processos
            </Button>
          </div>
        </div>
      </nav>

      {/* User Profile */}
      {user && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {getUserInitials(user.nome)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.nome}</p>
              <p className="text-xs text-gray-500">{user.perfil}</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout}
              className="text-gray-400 hover:text-gray-500"
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </aside>
  );
}
