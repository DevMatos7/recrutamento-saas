import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import AnalyticsPage from "@/pages/analytics";
import VagasPage from "@/pages/vagas";
import CandidatosPage from "@/pages/candidatos";
import DepartamentosPage from "@/pages/departamentos";
import EmpresasPage from "@/pages/empresas";
import UsuariosPage from "@/pages/usuarios";
import Dashboard from "@/pages/dashboard";
import PipelinePage from "@/pages/pipeline";
import TestesPage from "@/pages/testes";
import AvaliacaoDiscPage from "@/pages/avaliacao-disc";
import CandidateDiscTest from "@/pages/candidate-disc-test";
import DiscEditor from "@/pages/disc-editor";
import MatchingPage from "@/pages/matching";
import VagaMatchingConfigPage from "@/pages/vaga-matching-config";
import MatchingCriteriaInfo from "@/pages/matching-criteria-info";
import EntrevistasPage from "@/pages/entrevistas";
import ComunicacoesPage from "@/pages/comunicacoes";
import CredenciaisPage from "@/pages/credenciais";
import CandidatePortalPage from "@/pages/candidate-portal";
import CandidaturasPendentesPage from "@/pages/candidaturas-pendentes";
import AIRecommendationsPage from "@/pages/ai-recommendations";
import SkillsAdminPage from "@/pages/skills-admin";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import { ProtectedRoute } from "./lib/protected-route";
import PerfisVagaPage from "@/pages/perfis-vaga";
import JornadasPage from "@/pages/jornadas";
import QuadroIdealDashboard from "@/pages/QuadroIdealDashboard";
import QuadroIdealFormPage from "@/pages/QuadroIdealForm";
import SolicitacoesVagaPage from "@/pages/SolicitacoesVaga";
import QuadroIdealHistoricoPage from "@/pages/QuadroIdealHistorico";
import PipelineConfigPage from "@/pages/pipeline-config";
import ModelosPipelinePage from "@/pages/modelos-pipeline";
import UploadCandidatoPage from "@/pages/upload-candidato";
import EmpresaVagasPage from './pages/empresa/[slug]';

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={AnalyticsPage} />
      <ProtectedRoute path="/vagas" component={VagasPage} />
      <ProtectedRoute path="/perfis-vaga" component={PerfisVagaPage} />
      <ProtectedRoute path="/candidatos" component={CandidatosPage} />
      <ProtectedRoute path="/pipeline" component={PipelinePage} />
      <ProtectedRoute path="/pipeline-config" component={PipelineConfigPage} />
      <ProtectedRoute path="/modelos-pipeline" component={ModelosPipelinePage} />
      <ProtectedRoute path="/testes" component={TestesPage} />
      <ProtectedRoute path="/avaliacao-disc" component={AvaliacaoDiscPage} />
      <ProtectedRoute path="/avaliacao-disc/editor" component={DiscEditor} />
      <ProtectedRoute path="/entrevistas" component={EntrevistasPage} />
      <ProtectedRoute path="/configuracoes/dashboard" component={Dashboard} />
      <ProtectedRoute path="/configuracoes/departamentos" component={DepartamentosPage} />
      <ProtectedRoute path="/configuracoes/empresas" component={EmpresasPage} />
      <ProtectedRoute path="/configuracoes/usuarios" component={UsuariosPage} />
      <ProtectedRoute path="/configuracoes/competencias" component={SkillsAdminPage} />
      <ProtectedRoute path="/configuracoes/comunicacoes" component={ComunicacoesPage} />
      <ProtectedRoute path="/configuracoes/credenciais" component={CredenciaisPage} />
      <ProtectedRoute path="/vagas/:vagaId/matches" component={MatchingPage} />
      <ProtectedRoute path="/vagas/:vagaId/configurar-matching" component={VagaMatchingConfigPage} />
      <ProtectedRoute path="/matching/criterios" component={MatchingCriteriaInfo} />
      <ProtectedRoute path="/candidaturas-pendentes" component={CandidaturasPendentesPage} />
      <ProtectedRoute path="/ai-recommendations" component={AIRecommendationsPage} />
      <ProtectedRoute path="/jornadas" component={JornadasPage} />
      <ProtectedRoute path="/quadro-ideal" component={QuadroIdealDashboard} />
      <ProtectedRoute path="/quadro-ideal/novo" component={QuadroIdealFormPage} />
      <ProtectedRoute path="/quadro-ideal/:id" component={QuadroIdealFormPage} />
      <ProtectedRoute path="/quadro-ideal/:id/historico" component={QuadroIdealHistoricoPage} />
      <ProtectedRoute path="/solicitacoes-vaga" component={SolicitacoesVagaPage} />
      <Route path="/portal" component={CandidatePortalPage} />
      <Route path="/portal/disc" component={CandidateDiscTest} />
      <Route path="/upload/candidato/:vagaCandidatoId" component={UploadCandidatoPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/empresa/:slug" component={EmpresaVagasPage} />
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
