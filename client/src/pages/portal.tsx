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
  Building2, 
  User, 
  FileText, 
  Calendar,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  LogOut
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface CandidatePortalProps {
  isAuthenticated: boolean;
  candidate?: any;
  onLogin: (candidate: any) => void;
  onLogout: () => void;
}

export default function CandidatePortal({ isAuthenticated, candidate, onLogin, onLogout }: CandidatePortalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);

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

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/candidate-portal/register", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Cadastro realizado com sucesso! Faça login para continuar." });
      setAuthMode('login');
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro no cadastro", 
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

  const { data: myApplications } = useQuery({
    queryKey: ["/api/candidate-portal/profile"],
    enabled: isAuthenticated
  });

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
      queryClient.invalidateQueries({ queryKey: ["/api/candidate-portal/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/candidate-portal/dashboard"] });
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

  // Authentication forms
  const AuthForms = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-between items-center mb-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setAuthMode(null)}
              className="text-gray-500"
            >
              ← Voltar às Vagas
            </Button>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Portal do Candidato
          </CardTitle>
          <p className="text-gray-600">
            {authMode === 'login' ? 'Acesse sua conta' : 'Crie sua conta'}
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={authMode || 'login'} onValueChange={(value) => setAuthMode(value as 'login' | 'register')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Cadastro</TabsTrigger>
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
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" name="password" type="password" required />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                registerMutation.mutate({
                  nome: formData.get('nome') as string,
                  email: formData.get('email') as string,
                  telefone: formData.get('telefone') as string,
                  password: formData.get('password') as string,
                  empresaId: "d09726b8-601d-4676-aad3-ff25a877467d" // Default company for demo
                });
              }} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome completo</Label>
                  <Input id="nome" name="nome" required />
                </div>
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input id="telefone" name="telefone" required />
                </div>
                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" name="password" type="password" required />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? "Cadastrando..." : "Cadastrar"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );

  // Public jobs view
  const PublicJobsView = () => (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Vagas Disponíveis</h1>
            <Button onClick={() => setAuthMode('login')}>
              Fazer Login
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {jobsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando vagas...</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.isArray(jobs) && jobs.map((job: any) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{job.titulo}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="h-4 w-4" />
                    {job.empresa}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    {job.local}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                    {job.descricao}
                  </p>
                  <div className="flex justify-between items-center">
                    <Badge variant="secondary">{job.tipoContratacao}</Badge>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          Ver Detalhes
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{job.titulo}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold">Descrição</h4>
                            <p className="text-gray-700">{job.descricao}</p>
                          </div>
                          {job.requisitos && (
                            <div>
                              <h4 className="font-semibold">Requisitos</h4>
                              <p className="text-gray-700">{job.requisitos}</p>
                            </div>
                          )}
                          <div className="pt-4">
                            <p className="text-sm text-gray-600 mb-2">
                              Para se candidatar, faça login ou crie uma conta.
                            </p>
                            <Button 
                              onClick={() => {
                                setAuthMode('register');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }} 
                              className="w-full"
                            >
                              Criar Conta e Candidatar-se
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );

  // Authenticated dashboard
  const AuthenticatedDashboard = () => (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Olá, {candidate?.nome}!
              </h1>
              <p className="text-gray-600">Bem-vindo ao seu painel</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="jobs">Vagas</TabsTrigger>
            <TabsTrigger value="applications">Minhas Candidaturas</TabsTrigger>
            <TabsTrigger value="tests">Testes</TabsTrigger>
            <TabsTrigger value="interviews">Entrevistas</TabsTrigger>
            <TabsTrigger value="messages">Mensagens</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Candidaturas</CardTitle>
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(dashboard as any)?.candidaturas?.reduce((acc: number, c: any) => acc + c.total, 0) || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Testes Pendentes</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboard?.testesPendentes || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Entrevistas</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboard?.entrevistasAgendadas || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Notificações</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboard?.notificacoes || 0}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="jobs">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.isArray(jobs) && jobs.map((job: any) => (
                <Card key={job.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{job.titulo}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building2 className="h-4 w-4" />
                      {job.empresa}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 text-sm mb-4">{job.descricao}</p>
                    <Button 
                      onClick={() => setSelectedJob(job)}
                      className="w-full"
                    >
                      Candidatar-se
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="applications">
            <div className="space-y-4">
              {Array.isArray(myApplications) && myApplications.map((application: any) => (
                <Card key={application.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{application.vaga.titulo}</CardTitle>
                        <p className="text-gray-600">{application.vaga.empresa}</p>
                      </div>
                      <Badge variant={
                        application.etapa === 'aprovado' ? 'default' :
                        application.etapa === 'reprovado' ? 'destructive' : 'secondary'
                      }>
                        {application.etapa}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Aplicado em {new Date(application.dataInscricao).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    {application.comentarios && (
                      <p className="mt-2 text-sm text-gray-700">{application.comentarios}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tests">
            <div className="space-y-4">
              {Array.isArray(pendingTests) && pendingTests.map((test: any) => (
                <Card key={test.id}>
                  <CardHeader>
                    <CardTitle>Teste para {test.vaga.titulo}</CardTitle>
                    <p className="text-gray-600">{test.vaga.empresa}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">{test.status}</Badge>
                      <Button size="sm">Realizar Teste</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(!pendingTests || pendingTests.length === 0) && (
                <p className="text-center py-8 text-gray-500">Nenhum teste pendente</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="interviews">
            <div className="space-y-4">
              {Array.isArray(interviews) && interviews.map((interview: any) => (
                <Card key={interview.id}>
                  <CardHeader>
                    <CardTitle>Entrevista - {interview.vaga.titulo}</CardTitle>
                    <p className="text-gray-600">{interview.vaga.empresa}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(interview.dataHora).toLocaleString('pt-BR')}
                      </div>
                      {interview.local && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {interview.local}
                        </div>
                      )}
                      <Badge variant={
                        interview.status === 'agendada' ? 'secondary' :
                        interview.status === 'realizada' ? 'default' : 'destructive'
                      }>
                        {interview.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(!interviews || interviews.length === 0) && (
                <p className="text-center py-8 text-gray-500">Nenhuma entrevista agendada</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="messages">
            <div className="space-y-4">
              {Array.isArray(notifications) && notifications.map((notification: any) => (
                <Card key={notification.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{notification.assunto}</CardTitle>
                      <Badge variant={
                        notification.statusEnvio === 'enviado' ? 'default' : 'secondary'
                      }>
                        {notification.tipo}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{notification.mensagem}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {new Date(notification.dataEnvio).toLocaleString('pt-BR')}
                    </p>
                  </CardContent>
                </Card>
              ))}
              {(!notifications || notifications.length === 0) && (
                <p className="text-center py-8 text-gray-500">Nenhuma mensagem</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Application Modal */}
      {selectedJob && (
        <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Candidatar-se à vaga</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">{selectedJob.titulo}</h4>
                <p className="text-gray-600">{selectedJob.empresa}</p>
              </div>
              <p className="text-gray-700">{selectedJob.descricao}</p>
              <div className="flex gap-2">
                <Button 
                  onClick={() => applyMutation.mutate(selectedJob.id)}
                  disabled={applyMutation.isPending}
                  className="flex-1"
                >
                  {applyMutation.isPending ? "Enviando..." : "Confirmar Candidatura"}
                </Button>
                <Button variant="outline" onClick={() => setSelectedJob(null)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );

  // Show different views based on authentication state
  if (!isAuthenticated) {
    // Se authMode está definido (login ou register), mostrar formulários
    if (authMode !== null) {
      return <AuthForms />;
    }
    // Caso contrário, mostrar vagas públicas
    return <PublicJobsView />;
  }

  return <AuthenticatedDashboard />;
}