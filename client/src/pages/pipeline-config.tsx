import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Settings, 
  Zap,
  FileText,
  Shield,
  Target,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Importar os componentes de gestão
import RejectionReasonManager from "@/components/rejection-reason-manager";
import SlaManager from "@/components/sla-manager";
import AutomationManager from "@/components/automation-manager";
import ChecklistManager from "@/components/checklist-manager";

export default function PipelineConfigPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>("");
  const [selectedEtapa, setSelectedEtapa] = useState<string>("");

  // Buscar empresas do usuário
  const { data: empresas = [] } = useQuery({
    queryKey: ["empresas", user?.id],
    queryFn: async () => {
      const response = await fetch("/api/empresas");
      if (!response.ok) throw new Error("Erro ao buscar empresas");
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Buscar etapas do pipeline da empresa selecionada
  const { data: etapas = [] } = useQuery({
    queryKey: ["etapas-pipeline", selectedEmpresa],
    queryFn: async () => {
      if (!selectedEmpresa) return [];
      try {
        const response = await fetch(`/api/empresas/${selectedEmpresa}/etapas-pipeline`);
        if (!response.ok) throw new Error("Erro ao buscar etapas");
        const etapasEmpresa = await response.json();
        
        // Se a empresa não tem etapas específicas, usar as etapas padrão
        if (etapasEmpresa.length === 0) {
          return [
            { id: "recebidos", nome: "Recebidos", descricao: "Candidatos recém-inscritos" },
            { id: "triagem_curriculos", nome: "Triagem de Currículos", descricao: "Análise inicial de currículos" },
            { id: "entrevista_rh", nome: "Entrevista RH", descricao: "Entrevista com Recursos Humanos" },
            { id: "testes_tecnicos", nome: "Testes Técnicos", descricao: "Avaliações técnicas e comportamentais" },
            { id: "entrevista_gestor", nome: "Entrevista com Gestor", descricao: "Entrevista com gestor da área" },
            { id: "aprovacao_final", nome: "Aprovação Final", descricao: "Aprovação final da contratação" },
            { id: "documentacao_admissional", nome: "Recebimento da Documentação Admissional", descricao: "Coleta de documentos para admissão" },
            { id: "exames_medicos", nome: "Realização de Exames Médicos", descricao: "Exames médicos admissionais" },
            { id: "contratacao", nome: "Contratação", descricao: "Assinatura do contrato de trabalho" },
            { id: "integracao", nome: "Integração e Ambientação", descricao: "Processo de integração do novo colaborador" },
            { id: "periodo_experiencia", nome: "Período de Experiência – Fase 1", descricao: "Primeiros 30 dias de experiência" },
            { id: "efetivacao", nome: "Efetivação – Após 90 dias", descricao: "Efetivação após período de experiência" }
          ];
        }
        
        return etapasEmpresa;
      } catch (error) {
        console.log("Erro ao buscar etapas, usando etapas padrão:", error);
        // Retornar etapas padrão se não conseguir buscar
        return [
          { id: "recebidos", nome: "Recebidos", descricao: "Candidatos recém-inscritos" },
          { id: "triagem_curriculos", nome: "Triagem de Currículos", descricao: "Análise inicial de currículos" },
          { id: "entrevista_rh", nome: "Entrevista RH", descricao: "Entrevista com Recursos Humanos" },
          { id: "testes_tecnicos", nome: "Testes Técnicos", descricao: "Avaliações técnicas e comportamentais" },
          { id: "entrevista_gestor", nome: "Entrevista com Gestor", descricao: "Entrevista com gestor da área" },
          { id: "aprovacao_final", nome: "Aprovação Final", descricao: "Aprovação final da contratação" },
          { id: "documentacao_admissional", nome: "Recebimento da Documentação Admissional", descricao: "Coleta de documentos para admissão" },
          { id: "exames_medicos", nome: "Realização de Exames Médicos", descricao: "Exames médicos admissionais" },
          { id: "contratacao", nome: "Contratação", descricao: "Assinatura do contrato de trabalho" },
          { id: "integracao", nome: "Integração e Ambientação", descricao: "Processo de integração do novo colaborador" },
          { id: "periodo_experiencia", nome: "Período de Experiência – Fase 1", descricao: "Primeiros 30 dias de experiência" },
          { id: "efetivacao", nome: "Efetivação – Após 90 dias", descricao: "Efetivação após período de experiência" }
        ];
      }
    },
    enabled: !!selectedEmpresa,
  });

  const handleEmpresaChange = (empresaId: string) => {
    setSelectedEmpresa(empresaId);
    setSelectedEtapa(""); // Reset etapa quando mudar empresa
  };

  const handleEtapaChange = (etapaId: string) => {
    setSelectedEtapa(etapaId);
  };

  const getEtapaNome = (etapaId: string) => {
    const etapa = etapas.find((e: any) => e.id === etapaId);
    return etapa?.nome || "Etapa não encontrada";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações do Pipeline</h1>
          <p className="text-gray-600 mt-2">
            Gerencie motivos de reprovação, SLAs, automatizações e checklists para otimizar seu processo seletivo
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Settings className="h-4 w-4 mr-2" />
          Configurações Avançadas
        </Badge>
      </div>

      {/* Seleção de Empresa e Etapa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Seleção de Contexto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="empresa">Empresa</Label>
              <Select value={selectedEmpresa} onValueChange={handleEmpresaChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma empresa" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map((empresa: any) => (
                    <SelectItem key={empresa.id} value={empresa.id}>
                      {empresa.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="etapa">Etapa do Pipeline (para SLAs e Automatizações)</Label>
              <Select value={selectedEtapa} onValueChange={handleEtapaChange} disabled={!selectedEmpresa}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma etapa" />
                </SelectTrigger>
                <SelectContent>
                  {etapas
                    .filter((etapa: any) => etapa.id && etapa.id.trim() !== '')
                    .map((etapa: any) => (
                      <SelectItem key={etapa.id} value={etapa.id}>
                        {etapa.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {etapas.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  {etapas.length} etapa(s) disponível(is) para configuração
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Configurações */}
      <Tabs defaultValue="rejection" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rejection" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Motivos de Reprovação
          </TabsTrigger>
          <TabsTrigger value="sla" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            SLAs e Alertas
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Automatizações
          </TabsTrigger>
          <TabsTrigger value="checklist" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Checklists
          </TabsTrigger>
        </TabsList>

        {/* Tab: Motivos de Reprovação */}
        <TabsContent value="rejection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Gestão de Motivos de Reprovação
              </CardTitle>
              <p className="text-sm text-gray-600">
                Configure motivos padrão de reprovação para sua empresa. Esses motivos serão obrigatórios ao reprovar candidatos.
              </p>
            </CardHeader>
            <CardContent>
              {selectedEmpresa ? (
                <RejectionReasonManager 
                  empresaId={selectedEmpresa}
                  onRejectionComplete={() => {
                    toast({
                      title: "Reprovação registrada",
                      description: "O candidato foi reprovado com sucesso.",
                    });
                  }}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Selecione uma empresa para gerenciar os motivos de reprovação</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: SLAs e Alertas */}
        <TabsContent value="sla" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Gestão de SLAs e Alertas
              </CardTitle>
              <p className="text-sm text-gray-600">
                Configure prazos e alertas para cada etapa do pipeline. Monitore candidatos que estão atrasados.
              </p>
            </CardHeader>
            <CardContent>
              {selectedEmpresa && selectedEtapa ? (
                <SlaManager 
                  etapaId={selectedEtapa}
                  etapaNome={getEtapaNome(selectedEtapa)}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Selecione uma empresa e etapa para gerenciar os SLAs</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Automatizações */}
        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Gestão de Automatizações
              </CardTitle>
              <p className="text-sm text-gray-600">
                Configure regras automáticas para mover candidatos, enviar notificações e executar ações baseadas em condições.
              </p>
            </CardHeader>
            <CardContent>
              {selectedEmpresa && selectedEtapa ? (
                <AutomationManager 
                  etapaId={selectedEtapa}
                  etapaNome={getEtapaNome(selectedEtapa)}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Selecione uma empresa e etapa para gerenciar as automatizações</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Checklists */}
        <TabsContent value="checklist" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Gestão de Checklists
              </CardTitle>
              <p className="text-sm text-gray-600">
                Configure listas de verificação para cada etapa. Candidatos avançam automaticamente quando completam 100% dos itens.
              </p>
            </CardHeader>
            <CardContent>
              {selectedEmpresa && selectedEtapa ? (
                <ChecklistManager 
                  etapaId={selectedEtapa}
                  etapaNome={getEtapaNome(selectedEtapa)}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Selecione uma empresa e etapa para gerenciar os checklists</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dashboard de Estatísticas */}
      {selectedEmpresa && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Estatísticas do Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">0</div>
                <div className="text-sm text-gray-600">SLAs Ativos</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">0</div>
                <div className="text-sm text-gray-600">Alertas Pendentes</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">0</div>
                <div className="text-sm text-gray-600">Automatizações Ativas</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">0</div>
                <div className="text-sm text-gray-600">Checklists Configurados</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 