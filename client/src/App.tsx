import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import AnalyticsPage from "@/pages/analytics";
import VagasPage from "@/pages/vagas-enhanced";
import CandidatosPage from "@/pages/candidatos";
import DepartamentosPage from "@/pages/departamentos";
import EmpresasPage from "@/pages/empresas";
import UsuariosPage from "@/pages/usuarios";
import Dashboard from "@/pages/dashboard";
import PipelinePage from "@/pages/pipeline";
import TestesPage from "@/pages/testes";
import EntrevistasPage from "@/pages/entrevistas";
import ComunicacoesPage from "@/pages/comunicacoes";
import CandidatePortalPage from "@/pages/candidate-portal";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={AnalyticsPage} />
      <ProtectedRoute path="/vagas" component={VagasPage} />
      <ProtectedRoute path="/candidatos" component={CandidatosPage} />
      <ProtectedRoute path="/pipeline" component={PipelinePage} />
      <ProtectedRoute path="/testes" component={TestesPage} />
      <ProtectedRoute path="/entrevistas" component={EntrevistasPage} />
      <ProtectedRoute path="/comunicacoes" component={ComunicacoesPage} />
      <ProtectedRoute path="/configuracoes/dashboard" component={Dashboard} />
      <ProtectedRoute path="/configuracoes/departamentos" component={DepartamentosPage} />
      <ProtectedRoute path="/configuracoes/empresas" component={EmpresasPage} />
      <ProtectedRoute path="/configuracoes/usuarios" component={UsuariosPage} />
      <Route path="/portal" component={CandidatePortalPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
