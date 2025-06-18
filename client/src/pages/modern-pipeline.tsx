import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import AddCandidatoPipelineModal from "@/components/modals/add-candidato-pipeline-modal";
import { 
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  MessageSquare,
  Calendar,
  FileText,
  Star,
  Clock,
  Users,
  ArrowRight,
  Plus,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function ModernPipeline() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedVaga, setSelectedVaga] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [moveData, setMoveData] = useState<any>({});
  const [addCandidateModalOpen, setAddCandidateModalOpen] = useState(false);

  const { data: vagas } = useQuery({
    queryKey: ["/api/vagas"],
  });

  const { data: pipelineData } = useQuery({
    queryKey: ["/api/pipeline/vaga", selectedVaga],
    enabled: !!selectedVaga,
  });

  const { data: candidatosVaga } = useQuery({
    queryKey: [`/api/vagas/${selectedVaga}/candidatos`],
    enabled: !!selectedVaga,
  });

  const moveCandidateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", `/api/vagas/${data.vagaId}/candidatos/${data.candidatoId}/mover`, {
        etapa: data.etapa,
        comentarios: data.comentarios,
        nota: data.nota,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Candidato movido com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/pipeline/vaga", selectedVaga] });
      setMoveDialogOpen(false);
      setMoveData({});
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao mover candidato", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const stages = [
    { id: 'recebido', name: 'Recebidos', color: 'bg-gray-100 border-gray-300', textColor: 'text-gray-700', icon: User },
    { id: 'triagem', name: 'Triagem', color: 'bg-blue-100 border-blue-300', textColor: 'text-blue-700', icon: FileText },
    { id: 'entrevista', name: 'Entrevista', color: 'bg-yellow-100 border-yellow-300', textColor: 'text-yellow-700', icon: Calendar },
    { id: 'avaliacao', name: 'Avaliação', color: 'bg-purple-100 border-purple-300', textColor: 'text-purple-700', icon: Star },
    { id: 'aprovado', name: 'Aprovados', color: 'bg-green-100 border-green-300', textColor: 'text-green-700', icon: CheckCircle },
    { id: 'reprovado', name: 'Reprovados', color: 'bg-red-100 border-red-300', textColor: 'text-red-700', icon: XCircle },
  ];

  const pipelineStats = [
    {
      name: 'Total de Candidatos',
      value: Array.isArray(candidatosVaga) ? candidatosVaga.length.toString() : '0',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      name: 'Em Processo',
      value: Array.isArray(candidatosVaga) ? candidatosVaga.filter((c: any) => !['aprovado', 'reprovado'].includes(c.etapa)).length.toString() : '0',
      icon: Clock,
      color: 'bg-orange-500'
    },
    {
      name: 'Taxa de Aprovação',
      value: Array.isArray(candidatosVaga) && candidatosVaga.length > 0 ? 
        `${Math.round((candidatosVaga.filter((c: any) => c.etapa === 'aprovado').length / candidatosVaga.length) * 100)}%` : '0%',
      icon: TrendingUp,
      color: 'bg-green-500'
    },
    {
      name: 'Tempo Médio',
      value: '21 dias',
      icon: AlertCircle,
      color: 'bg-purple-500'
    },
  ];

  const CandidateCard = ({ candidato, stage }: { candidato: any, stage: string }) => (
    <Card className="group hover:shadow-md transition-all duration-200 cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-purple-100 text-purple-600 text-sm font-medium">
              {candidato.candidato?.nome?.charAt(0) || 'C'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 truncate">
              {candidato.candidato?.nome || 'Nome não informado'}
            </h4>
            <p className="text-sm text-gray-500 truncate">
              {candidato.candidato?.email || 'Email não informado'}
            </p>
            <div className="flex items-center mt-2 space-x-2">
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="h-3 w-3 mr-1" />
                {new Date(candidato.dataInscricao).toLocaleDateString('pt-BR')}
              </div>
              {candidato.nota && (
                <div className="flex items-center text-xs text-yellow-600">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  {candidato.nota}
                </div>
              )}
            </div>
            {candidato.comentarios && (
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                {candidato.comentarios}
              </p>
            )}
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setMoveData({
                  candidato,
                  currentStage: stage,
                  vagaId: selectedVaga,
                  candidatoId: candidato.candidatoId
                });
                setMoveDialogOpen(true);
              }}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-3">
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-7 px-2">
              <Eye className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2">
              <MessageSquare className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2">
              <Calendar className="h-3 w-3" />
            </Button>
          </div>
          <Badge variant="outline" className="text-xs">
            #{candidato.id}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  const StageColumn = ({ stage, candidatos }: { stage: any, candidatos: any[] }) => (
    <div className="flex-1 min-w-80">
      <Card className={`${stage.color} border-2 h-full`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <stage.icon className={`h-5 w-5 ${stage.textColor}`} />
              <CardTitle className={`${stage.textColor} text-lg font-semibold`}>
                {stage.name}
              </CardTitle>
            </div>
            <Badge variant="outline" className={stage.textColor}>
              {candidatos.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 h-96 overflow-y-auto">
          {candidatos.length > 0 ? (
            candidatos.map((candidato: any) => (
              <CandidateCard 
                key={candidato.id} 
                candidato={candidato} 
                stage={stage.id}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500">
              <stage.icon className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Nenhum candidato</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pipeline de Seleção</h1>
          <p className="mt-2 text-gray-600">
            Acompanhe o progresso dos candidatos através das etapas do processo seletivo
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
          <Button 
            className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
            onClick={() => selectedVaga && setAddCandidateModalOpen(true)}
            disabled={!selectedVaga}
          >
            <Plus className="h-4 w-4" />
            Adicionar Candidato
          </Button>
        </div>
      </div>

      {/* Job Selection */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="vaga-select" className="text-sm font-medium mb-2 block">
              Selecione uma vaga para visualizar o pipeline:
            </Label>
            <Select value={selectedVaga} onValueChange={setSelectedVaga}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Selecione uma vaga..." />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(vagas) && vagas.map((vaga: any) => (
                  <SelectItem key={vaga.id} value={vaga.id}>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{vaga.titulo}</span>
                      <span className="text-gray-500">- {vaga.empresa}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:mt-7">
            <div className="relative">
              <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <Input
                placeholder="Buscar candidatos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 w-80"
              />
            </div>
          </div>
        </div>
      </Card>

      {selectedVaga ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {pipelineStats.map((stat) => (
              <Card key={stat.name} className="border-l-4 border-l-purple-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.name}
                  </CardTitle>
                  <div className={`${stat.color} p-2 rounded-lg`}>
                    <stat.icon className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pipeline Board */}
          <div className="overflow-x-auto">
            <div className="flex gap-6 pb-6 min-w-max">
              {stages.map((stage) => {
                // Get candidatos from the API response, grouping by stage
                const allCandidatos = Array.isArray(candidatosVaga) ? candidatosVaga : [];
                const stageCandidatos = allCandidatos.filter((candidato: any) => 
                  candidato.etapa === stage.id || 
                  (stage.id === 'recebido' && (!candidato.etapa || candidato.etapa === 'recebido'))
                );
                
                const filteredCandidatos = stageCandidatos.filter((candidato: any) =>
                  candidato.candidato?.nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  candidato.candidato?.email?.toLowerCase().includes(searchQuery.toLowerCase())
                );
                
                return (
                  <StageColumn 
                    key={stage.id} 
                    stage={stage} 
                    candidatos={filteredCandidatos}
                  />
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <Card className="p-12 text-center">
          <div className="bg-purple-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Users className="h-10 w-10 text-purple-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Selecione uma vaga</h3>
          <p className="text-gray-600 mb-6">
            Escolha uma vaga no seletor acima para visualizar o pipeline de candidatos
          </p>
          <Button 
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => {
              const select = document.querySelector('[data-radix-select-trigger]') as HTMLElement;
              select?.click();
            }}
          >
            Selecionar Vaga
          </Button>
        </Card>
      )}

      {/* Move Candidate Dialog */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mover Candidato</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-purple-100 text-purple-600">
                  {moveData.candidato?.candidato?.nome?.charAt(0) || 'C'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{moveData.candidato?.candidato?.nome}</p>
                <p className="text-sm text-gray-600">{moveData.candidato?.candidato?.email}</p>
              </div>
            </div>

            <div>
              <Label htmlFor="new-stage">Nova Etapa</Label>
              <Select 
                value={moveData.etapa} 
                onValueChange={(value) => setMoveData({...moveData, etapa: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a nova etapa" />
                </SelectTrigger>
                <SelectContent>
                  {stages.filter(s => s.id !== moveData.currentStage).map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      <div className="flex items-center space-x-2">
                        <stage.icon className="h-4 w-4" />
                        <span>{stage.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="nota">Nota (1-5)</Label>
              <Input
                id="nota"
                type="number"
                min="1"
                max="5"
                value={moveData.nota || ''}
                onChange={(e) => setMoveData({...moveData, nota: parseInt(e.target.value)})}
                placeholder="Opcional"
              />
            </div>

            <div>
              <Label htmlFor="comentarios">Comentários</Label>
              <Textarea
                id="comentarios"
                value={moveData.comentarios || ''}
                onChange={(e) => setMoveData({...moveData, comentarios: e.target.value})}
                placeholder="Adicione observações sobre o candidato..."
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                onClick={() => moveCandidateMutation.mutate(moveData)}
                disabled={!moveData.etapa || moveCandidateMutation.isPending}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {moveCandidateMutation.isPending ? "Movendo..." : "Mover Candidato"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setMoveDialogOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Candidate Modal */}
      {selectedVaga && (
        <AddCandidatoPipelineModal 
          open={addCandidateModalOpen}
          onOpenChange={setAddCandidateModalOpen}
          vagaId={selectedVaga}
        />
      )}
    </div>
  );
}