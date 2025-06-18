import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Briefcase, 
  MapPin, 
  Clock,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  Award,
  Languages, 
  Building2, 
  FileText, 
  Calendar,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  LogOut,
  Search,
  Filter,
  Heart,
  User,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ModernPortalProps {
  isAuthenticated: boolean;
  candidate?: any;
  onLogin: (candidate: any) => void;
  onLogout: () => void;
}

export default function ModernPortal({ isAuthenticated, candidate, onLogin, onLogout }: ModernPortalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");

  // Authentication mutations
  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/candidate-portal/login", data);
      return await res.json();
    },
    onSuccess: (data) => {
      onLogin(data.candidate);
      toast({ title: "Login realizado com sucesso!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro no login", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/candidate-portal/logout");
      return await res.json();
    },
    onSuccess: () => {
      onLogout();
      toast({ title: "Logout realizado com sucesso!" });
    }
  });

  // Portal data queries
  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["/api/candidate-portal/vagas"],
    enabled: !isAuthenticated
  });

  const { data: dashboard } = useQuery({
    queryKey: ["/api/candidate-portal/dashboard"],
    enabled: isAuthenticated
  });

  const { data: profileData } = useQuery({
    queryKey: ["/api/candidate-portal/profile"],
    enabled: isAuthenticated
  });

  const myApplications = Array.isArray(profileData?.candidaturas) ? profileData.candidaturas : [];

  const { data: pendingTests } = useQuery({
    queryKey: ["/api/candidate-portal/tests"],
    enabled: isAuthenticated
  });

  const { data: interviews } = useQuery({
    queryKey: ["/api/candidate-portal/interviews"],
    enabled: isAuthenticated
  });

  const { data: notifications } = useQuery({
    queryKey: ["/api/candidate-portal/notifications"],
    enabled: isAuthenticated
  });

  // Application mutation
  const applyMutation = useMutation({
    mutationFn: async (vagaId: string) => {
      const res = await apiRequest("POST", "/api/candidate-portal/apply", { vagaId });
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Candidatura realizada com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/candidate-portal/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/candidate-portal/profile"] });
      setSelectedJob(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro na candidatura", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Modern Hero Section for Public View
  const HeroSection = () => (
    <div className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 overflow-hidden">
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            O portal de vagas de empregos
            <span className="block text-yellow-300 mt-2">mais amado do Brasil.</span>
          </h1>
          
          {/* Search Section */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 mt-16 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Label className="text-sm text-gray-600 mb-2 block">Qual vaga de emprego procura?</Label>
                <div className="flex items-center space-x-3 border-2 border-gray-200 rounded-lg px-4 py-4 bg-gray-50 focus-within:border-purple-500 transition-colors">
                  <Search className="h-5 w-5 text-gray-400" />
                  <Input 
                    placeholder="Digite o nome da vaga ou cargo" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-none bg-transparent p-0 focus:ring-0 text-lg"
                  />
                </div>
              </div>
              
              <div className="relative">
                <Label className="text-sm text-gray-600 mb-2 block">Onde você procura trabalho?</Label>
                <div className="flex items-center space-x-3 border-2 border-gray-200 rounded-lg px-4 py-4 bg-gray-50 focus-within:border-purple-500 transition-colors">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <Input 
                    placeholder="Digite o nome da cidade" 
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    className="border-none bg-transparent p-0 focus:ring-0 text-lg"
                  />
                </div>
              </div>
              
              <div className="md:mt-7">
                <Button 
                  size="lg"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 text-lg rounded-lg"
                >
                  Buscar vagas
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Modern Header
  const ModernHeader = () => (
    <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-600 rounded-lg p-2">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">GentePRO</span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <a href="#" className="text-gray-700 hover:text-purple-600 font-medium transition-colors">Todas as vagas</a>
              <a href="#" className="text-gray-500 hover:text-purple-600 transition-colors">Para Empresas</a>
              <a href="#" className="text-gray-500 hover:text-purple-600 transition-colors">Blog</a>
              <a href="#" className="text-gray-500 hover:text-purple-600 transition-colors">Cursos</a>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              className="text-gray-700 hover:text-purple-600"
              onClick={() => setAuthMode('login')}
            >
              Entrar
            </Button>
            <Button 
              className="bg-purple-600 hover:bg-purple-700 text-white px-6"
              onClick={() => setAuthMode('register')}
            >
              Cadastre-se
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );

  // Job Cards Component
  const JobCard = ({ job }: { job: any }) => (
    <Card className="bg-white border border-gray-200 hover:shadow-xl transition-all duration-300 hover:border-purple-300 group">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <div className="bg-purple-100 rounded-lg p-2">
                <Building2 className="h-4 w-4 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-purple-600">{job.empresa}</span>
            </div>
            <CardTitle className="text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors">
              {job.titulo}
            </CardTitle>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2" />
                <span>Local não informado</span>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                  R$ 1.6m
                </span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-500 p-2">
            <Heart className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">{job.descricao}</p>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
              Presencial
            </Badge>
            <Badge variant="secondary" className="bg-gray-50 text-gray-700 border-gray-200">
              Postado hoje
            </Badge>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg">
                Ver mais detalhes
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-900">{job.titulo}</DialogTitle>
                <div className="text-purple-600 font-medium text-lg">{job.empresa}</div>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Local</div>
                      <div className="font-medium">{job.local || 'Não informado'}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Briefcase className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Tipo</div>
                      <div className="font-medium">{job.tipoContratacao || 'Não informado'}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 mb-3 text-lg">Descrição da vaga:</h4>
                  <p className="text-gray-700 leading-relaxed">{job.descricao}</p>
                </div>

                {job.requisitos && (
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3 text-lg">Requisitos:</h4>
                    <p className="text-gray-700 leading-relaxed">{job.requisitos}</p>
                  </div>
                )}

                {job.beneficios && (
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3 text-lg">Benefícios:</h4>
                    <p className="text-gray-700 leading-relaxed">{job.beneficios}</p>
                  </div>
                )}

                <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-orange-500 rounded-full p-3 flex-shrink-0">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-bold text-orange-900 mb-2 text-lg">
                        Deixe as empresas te encontrarem!
                      </h5>
                      <p className="text-orange-700 mb-4 leading-relaxed">
                        Ao se cadastrar, você pode receber convites para vagas que correspondam ao seu perfil
                      </p>
                      <Button 
                        onClick={() => {
                          setAuthMode('register');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }} 
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 font-medium"
                      >
                        Participar do Portal de Talentos →
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );

  // Public Jobs Listing
  const PublicJobsView = () => (
    <div className="min-h-screen bg-white">
      <ModernHeader />
      <HeroSection />
      
      {/* Jobs Section */}
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
            <span className="hover:text-purple-600 cursor-pointer">Home</span>
            <span>›</span>
            <span className="text-gray-900 font-medium">Vagas</span>
          </div>

          {/* Results Header */}
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 space-y-4 lg:space-y-0">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Vagas</h2>
              <p className="text-gray-600 text-lg">
                {Array.isArray(jobs) ? jobs.length : 0} vaga(s) encontrada(s)
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Ordenados por: Data de postagem</span>
              <Button variant="outline" size="sm" className="border-gray-300">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>

          {jobsLoading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-500 mt-4 text-lg">Carregando vagas...</p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2">
              {Array.isArray(jobs) && jobs.map((job: any) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Authentication Forms
  const AuthForms = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-between items-center">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setAuthMode(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ← Voltar às Vagas
            </Button>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Portal do Candidato</h1>
            <p className="text-gray-600">
              {authMode === 'login' ? 'Acesse sua conta' : 'Crie sua conta gratuita'}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={authMode || 'login'} onValueChange={(value) => setAuthMode(value as 'login' | 'register')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" className="py-3">Login</TabsTrigger>
              <TabsTrigger value="register" className="py-3">Cadastro</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                loginMutation.mutate({
                  email: formData.get('email') as string,
                  password: formData.get('password') as string
                });
              }} className="space-y-4">
                <div>
                  <Label htmlFor="email">E-mail ou CPF</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    required 
                    className="h-12"
                    placeholder="Digite seu e-mail"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input 
                    id="password" 
                    name="password" 
                    type="password" 
                    required 
                    className="h-12"
                    placeholder="Digite sua senha"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gray-800 hover:bg-gray-900 text-white font-medium"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Entrando..." : "Acessar conta"}
                </Button>
                
                <div className="text-center">
                  <Button variant="link" className="text-blue-600">
                    Esqueceu a senha?
                  </Button>
                </div>

                <div className="text-center text-gray-500 text-sm">
                  Ou entrar com
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-12">
                    <span className="mr-2">G</span> Google
                  </Button>
                  <Button variant="outline" className="h-12">
                    <span className="mr-2">in</span> LinkedIn
                  </Button>
                </div>

                <div className="text-center">
                  <span className="text-gray-600">Não tem uma conta? </span>
                  <Button 
                    variant="link" 
                    onClick={() => setAuthMode('register')}
                    className="text-blue-600 p-0"
                  >
                    Criar conta
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                // Handle registration logic here
              }} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome completo</Label>
                  <Input 
                    id="nome" 
                    name="nome" 
                    required 
                    className="h-12"
                    placeholder="Digite seu nome completo"
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    required 
                    className="h-12"
                    placeholder="Digite seu e-mail"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input 
                    id="password" 
                    name="password" 
                    type="password" 
                    required 
                    className="h-12"
                    placeholder="Crie uma senha"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gray-800 hover:bg-gray-900 text-white font-medium"
                >
                  Criar conta
                </Button>
                
                <div className="text-center text-xs text-gray-500">
                  Ao se cadastrar, você concorda com nossos{' '}
                  <a href="#" className="text-blue-600">Termos de uso</a>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );

  // Show different views based on authentication state
  if (!isAuthenticated) {
    if (authMode !== null) {
      return <AuthForms />;
    }
    return <PublicJobsView />;
  }

  // Authenticated Dashboard
  const AuthenticatedDashboard = () => (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-600 rounded-lg p-2">
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">GentePRO</span>
              </div>
              <nav className="hidden md:flex space-x-8">
                <a href="#" className="text-gray-700 hover:text-purple-600 font-medium">Minhas candidaturas</a>
                <a href="#" className="text-gray-500 hover:text-purple-600">Meu currículo</a>
                <a href="#" className="text-gray-500 hover:text-purple-600">Buscar Oportunidades</a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-gray-900">{candidate?.nome}</div>
                <div className="text-xs text-gray-500">{candidate?.email}</div>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="text-gray-500 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="applications" className="space-y-8">
          <TabsList className="bg-white p-1 rounded-lg shadow-sm border">
            <TabsTrigger value="applications" className="px-6 py-3">Minhas candidaturas</TabsTrigger>
            <TabsTrigger value="profile" className="px-6 py-3">Meu currículo</TabsTrigger>
            <TabsTrigger value="jobs" className="px-6 py-3">Buscar Oportunidades</TabsTrigger>
            <TabsTrigger value="tests" className="px-6 py-3">Testes</TabsTrigger>
            <TabsTrigger value="interviews" className="px-6 py-3">Entrevistas</TabsTrigger>
            <TabsTrigger value="messages" className="px-6 py-3">Mensagens</TabsTrigger>
          </TabsList>

          {/* Applications Tab */}
          <TabsContent value="applications">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Minhas candidaturas</h2>
                <p className="text-gray-600">Acompanhe abaixo o andamento de todas as vagas que você está participando.</p>
              </div>

              {/* Search and Filters */}
              <Card className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input 
                      placeholder="Digite o nome da vaga ou empresa" 
                      className="h-12"
                      startAdornment={<Search className="h-5 w-5 text-gray-400" />}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                      Em andamento
                    </Button>
                    <Button variant="outline">Em banco de talentos</Button>
                    <Button variant="outline">Finalizadas</Button>
                  </div>
                </div>
              </Card>

              {/* Applications List */}
              {Array.isArray(myApplications) && myApplications.length > 0 ? (
                <div className="space-y-4">
                  {myApplications.map((application: any) => (
                    <Card key={application.id} className="p-6 hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="bg-purple-100 rounded-lg p-2">
                              <Building2 className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg text-gray-900">{application.vaga.titulo}</h3>
                              <p className="text-purple-600 font-medium">{application.vaga.empresa}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600 space-x-6 mb-4">
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4" />
                              <span>{application.vaga.local}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4" />
                              <span>Aplicado em {new Date(application.dataInscricao).toLocaleDateString('pt-BR')}</span>
                            </div>
                          </div>

                          {application.comentarios && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                              <h4 className="font-medium text-blue-900 mb-1">Feedback do recrutador:</h4>
                              <p className="text-blue-800 text-sm">{application.comentarios}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end space-y-3">
                          <Badge 
                            variant={
                              application.etapa === 'aprovado' ? 'default' :
                              application.etapa === 'reprovado' ? 'destructive' : 'secondary'
                            }
                            className="px-3 py-1 text-sm font-medium"
                          >
                            {application.etapa === 'recebido' && 'Recebido'}
                            {application.etapa === 'triagem' && 'Em triagem'}
                            {application.etapa === 'entrevista' && 'Entrevista'}
                            {application.etapa === 'avaliacao' && 'Avaliação'}
                            {application.etapa === 'aprovado' && 'Aprovado'}
                            {application.etapa === 'reprovado' && 'Não selecionado'}
                          </Badge>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-500">
                            <Heart className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <div className="bg-blue-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                    <FileText className="h-10 w-10 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Você ainda não possui candidaturas.</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Comece a explorar as oportunidades disponíveis e encontre a vaga ideal para você.
                  </p>
                  <Button 
                    className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3"
                    onClick={() => {
                      const jobsTab = document.querySelector('[value="jobs"]') as HTMLElement;
                      jobsTab?.click();
                    }}
                  >
                    Buscar Oportunidades
                  </Button>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Meu currículo</h2>
                <p className="text-gray-600">
                  Preencha os blocos com seus dados e mantenha seu currículo atualizado para se candidatar às vagas.
                  Caso realize alterações, estes ajustes serão replicados para todas as suas candidaturas ativas.
                </p>
              </div>

              <div className="grid gap-6">
                {/* Experience Section */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-100 rounded-full p-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <h3 className="font-bold text-lg">Experiência</h3>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-gray-600">Seção completa</p>
                </Card>

                {/* Personal Data Section */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">Dados Pessoais</h3>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-gray-600">Complete seus dados pessoais</p>
                </Card>

                {/* Diversity Section */}
                <Card className="p-6 opacity-60">
                  <h3 className="font-bold text-lg text-gray-400 mb-2">Diversidade</h3>
                  <p className="text-gray-400">Seção não disponível</p>
                </Card>

                {/* Skills Section */}
                <Card className="p-6 opacity-60">
                  <h3 className="font-bold text-lg text-gray-400 mb-2">Habilidades</h3>
                  <p className="text-gray-400">Seção não disponível</p>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs">
            <div className="space-y-6">
              {/* Search Header */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-8 text-white">
                <h2 className="text-3xl font-bold mb-6">Encontre sua próxima oportunidade</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <div className="flex items-center space-x-3 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-4">
                      <Search className="h-5 w-5 text-white/80" />
                      <Input 
                        placeholder="Digite o nome da vaga ou cargo" 
                        className="border-none bg-transparent p-0 text-white placeholder-white/70 focus:ring-0"
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <div className="flex items-center space-x-3 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-4">
                      <MapPin className="h-5 w-5 text-white/80" />
                      <Input 
                        placeholder="Digite o nome da cidade" 
                        className="border-none bg-transparent p-0 text-white placeholder-white/70 focus:ring-0"
                      />
                    </div>
                  </div>
                  <Button className="bg-white text-purple-600 hover:bg-gray-100 font-semibold py-4">
                    Buscar vagas
                  </Button>
                </div>
              </div>

              {/* Jobs Grid */}
              <div className="grid gap-6 md:grid-cols-2">
                {Array.isArray(jobs) && jobs.map((job: any) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Other tabs remain similar with modern styling */}
          <TabsContent value="tests">
            <Card className="p-12 text-center">
              <div className="bg-purple-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <FileText className="h-10 w-10 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Nenhum teste pendente</h3>
              <p className="text-gray-600">Quando você tiver testes para responder, eles aparecerão aqui.</p>
            </Card>
          </TabsContent>

          <TabsContent value="interviews">
            <Card className="p-12 text-center">
              <div className="bg-green-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-10 w-10 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Nenhuma entrevista agendada</h3>
              <p className="text-gray-600">Suas entrevistas agendadas aparecerão aqui.</p>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card className="p-12 text-center">
              <div className="bg-blue-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="h-10 w-10 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Nenhuma mensagem</h3>
              <p className="text-gray-600">Mensagens dos recrutadores aparecerão aqui.</p>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Application Modal */}
      {selectedJob && (
        <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Candidatar-se à vaga</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-bold text-lg mb-2">{selectedJob.titulo}</h4>
                <p className="text-purple-600 font-medium mb-2">{selectedJob.empresa}</p>
                <p className="text-gray-700">{selectedJob.descricao}</p>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <h5 className="font-medium text-green-900">Seus dados estão atualizados</h5>
                    <p className="text-sm text-green-700">Seu currículo será enviado automaticamente</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={() => applyMutation.mutate(selectedJob.id)}
                  disabled={applyMutation.isPending}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3"
                >
                  {applyMutation.isPending ? "Enviando..." : "Confirmar Candidatura"}
                </Button>
                <Button variant="outline" onClick={() => setSelectedJob(null)} className="px-6">
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );

  return <AuthenticatedDashboard />;
}