import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import ModernDashboard from "@/pages/modern-dashboard";
import ModernVagas from "@/pages/modern-vagas";
import ModernCandidatos from "@/pages/modern-candidatos";
import DepartamentosPage from "@/pages/departamentos";
import ModernEmpresas from "@/pages/modern-empresas";
import ModernUsuarios from "@/pages/modern-usuarios";
import ModernPipeline from "@/pages/modern-pipeline";
import ModernTestes from "@/pages/modern-testes";
import ModernEntrevistas from "@/pages/modern-entrevistas";
import ModernComunicacoes from "@/pages/modern-comunicacoes";
import ModernAnalytics from "@/pages/modern-analytics";
import CandidatePortalPage from "@/pages/candidate-portal";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={ModernDashboard} />
      <ProtectedRoute path="/vagas" component={ModernVagas} />
      <ProtectedRoute path="/candidatos" component={ModernCandidatos} />
      <ProtectedRoute path="/departamentos" component={DepartamentosPage} />
      <ProtectedRoute path="/empresas" component={ModernEmpresas} />
      <ProtectedRoute path="/usuarios" component={ModernUsuarios} />
      <ProtectedRoute path="/pipeline" component={ModernPipeline} />
      <ProtectedRoute path="/testes" component={ModernTestes} />
      <ProtectedRoute path="/entrevistas" component={ModernEntrevistas} />
      <ProtectedRoute path="/comunicacoes" component={ModernComunicacoes} />
      <ProtectedRoute path="/analytics" component={ModernAnalytics} />
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
