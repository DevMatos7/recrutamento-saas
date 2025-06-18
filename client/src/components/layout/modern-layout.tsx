import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  LayoutDashboard,
  Users,
  Briefcase,
  Building2,
  UserCheck,
  BarChart3,
  MessageSquare,
  Calendar,
  FileText,
  Settings,
  LogOut,
  Search,
  Bell,
  ChevronDown,
  Menu,
  X,
  Filter,
  Plus,
  Home
} from "lucide-react";

interface ModernLayoutProps {
  children: React.ReactNode;
  user?: any;
  onLogout?: () => void;
}

export default function ModernLayout({ children, user, onLogout }: ModernLayoutProps) {
  const [location, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, current: location === '/' },
    { name: 'Vagas', href: '/vagas', icon: Briefcase, current: location === '/vagas' },
    { name: 'Candidatos', href: '/candidatos', icon: Users, current: location === '/candidatos' },
    { name: 'Pipeline', href: '/pipeline', icon: UserCheck, current: location === '/pipeline' },
    { name: 'Entrevistas', href: '/entrevistas', icon: Calendar, current: location === '/entrevistas' },
    { name: 'Testes', href: '/testes', icon: FileText, current: location === '/testes' },
    { name: 'Comunicações', href: '/comunicacoes', icon: MessageSquare, current: location === '/comunicacoes' },
    { name: 'Analytics', href: '/analytics', icon: BarChart3, current: location === '/analytics' },
    { name: 'Empresas', href: '/empresas', icon: Building2, current: location === '/empresas' },
    { name: 'Usuários', href: '/usuarios', icon: Users, current: location === '/usuarios' },
  ];

  const stats = [
    { name: 'Vagas Ativas', value: '24', change: '+12%', changeType: 'positive' },
    { name: 'Candidatos', value: '1,429', change: '+2.1%', changeType: 'positive' },
    { name: 'Entrevistas Hoje', value: '8', change: '-0.1%', changeType: 'negative' },
    { name: 'Taxa de Conversão', value: '12.5%', change: '+1.2%', changeType: 'positive' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <Button
                variant="ghost"
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </Button>
            </div>
            <SidebarContent navigation={navigation} navigate={navigate} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <SidebarContent navigation={navigation} navigate={navigate} />
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top navigation */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>

          {/* Separator */}
          <div className="h-6 w-px bg-gray-200 lg:hidden" />

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            {/* Search */}
            <div className="relative flex flex-1 items-center">
              <div className="relative w-full max-w-md">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  className="block w-full rounded-lg border-0 bg-gray-100 py-2 pl-10 pr-3 text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-purple-600 sm:text-sm"
                  placeholder="Buscar vagas, candidatos..."
                  type="search"
                />
              </div>
            </div>

            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Notifications */}
              <Button variant="ghost" className="relative p-2">
                <Bell className="h-6 w-6 text-gray-400" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 p-0 text-xs text-white">
                  3
                </Badge>
              </Button>

              {/* Profile dropdown */}
              <div className="relative">
                <div className="flex items-center gap-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-purple-100 text-purple-600 text-sm font-medium">
                      {user?.nome?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:flex lg:items-center lg:gap-x-2">
                    <span className="text-sm font-semibold text-gray-900">{user?.nome || 'Usuário'}</span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                onClick={onLogout}
                className="text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ navigation, navigate }: { navigation: any[], navigate: (path: string) => void }) {
  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 border-r border-gray-200">
      <div className="flex h-16 shrink-0 items-center">
        <div className="flex items-center space-x-3">
          <div className="bg-purple-600 rounded-lg p-2">
            <Briefcase className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">GentePRO</span>
        </div>
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <button
                    onClick={() => navigate(item.href)}
                    className={`
                      group flex gap-x-3 rounded-lg p-3 text-sm leading-6 font-medium w-full text-left transition-colors
                      ${item.current
                        ? 'bg-purple-50 text-purple-700 border-r-2 border-purple-600'
                        : 'text-gray-700 hover:text-purple-700 hover:bg-purple-50'
                      }
                    `}
                  >
                    <item.icon
                      className={`h-5 w-5 shrink-0 ${
                        item.current ? 'text-purple-600' : 'text-gray-400 group-hover:text-purple-600'
                      }`}
                    />
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          </li>
          <li className="mt-auto">
            <a
              href="#"
              className="group -mx-2 flex gap-x-3 rounded-lg p-3 text-sm font-medium leading-6 text-gray-700 hover:bg-gray-50 hover:text-purple-700"
            >
              <Settings className="h-5 w-5 shrink-0 text-gray-400 group-hover:text-purple-600" />
              Configurações
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
}