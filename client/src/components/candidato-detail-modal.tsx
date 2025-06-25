import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Languages, 
  Brain,
  Shield,
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  DollarSign,
  Calendar
} from "lucide-react";

interface CandidatoDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidatoId: string | null;
}

export function CandidatoDetailModal({ isOpen, onClose, candidatoId }: CandidatoDetailModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: candidato, isLoading } = useQuery({
    queryKey: ['/api/candidatos', candidatoId],
    enabled: !!candidatoId && isOpen,
  });

  const { data: resultadoDisc } = useQuery({
    queryKey: ['/api/avaliacoes/disc/candidato', candidatoId],
    enabled: !!candidatoId && isOpen,
    staleTime: 0,
  });

  console.log("Modal - candidatoId:", candidatoId);
  console.log("Modal - resultadoDisc completo:", resultadoDisc);
  console.log("Modal - tipo resultadoDisc:", typeof resultadoDisc, Array.isArray(resultadoDisc));
  
  // Estado para modal de edição de status ético
  const [statusEticoModalOpen, setStatusEticoModalOpen] = useState(false);
  const [statusEticoForm, setStatusEticoForm] = useState({
    statusEtico: candidato?.statusEtico || "pendente",
    motivoReprovacaoEtica: candidato?.motivoReprovacaoEtica || ""
  });
  
  // Atualizar form quando candidato carrega
  useEffect(() => {
    if (candidato) {
      setStatusEticoForm({
        statusEtico: candidato.statusEtico || "pendente",
        motivoReprovacaoEtica: candidato.motivoReprovacaoEtica || ""
      });
    }
  }, [candidato]);
  
  // Mutation para atualizar status ético
  const updateStatusEticoMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/candidatos/${candidatoId}/status-etico`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Erro ao atualizar status ético');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/candidatos'] });
      setStatusEticoModalOpen(false);
      toast({ title: "Status ético atualizado com sucesso!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao atualizar status ético", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  if (!isOpen || !candidatoId) return null;

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!candidato) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="text-center py-8">
            <p className="text-destructive">Candidato não encontrado</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const renderStatusEtico = () => {
    switch (candidato.statusEtico) {
      case "aprovado":
        return (
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-500" />
            <Badge variant="default" className="bg-green-100 text-green-800">
              Aprovado Eticamente
            </Badge>
          </div>
        );
      case "reprovado":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ShieldX className="h-5 w-5 text-red-500" />
              <Badge variant="destructive">
                Reprovado Eticamente
              </Badge>
            </div>
            {candidato.motivoReprovacaoEtica && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  <strong>Motivo:</strong> {candidato.motivoReprovacaoEtica}
                </p>
              </div>
            )}
          </div>
        );
      case "pendente":
        return (
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              Avaliação Ética Pendente
            </Badge>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-gray-500" />
            <Badge variant="outline">
              Não Avaliado
            </Badge>
          </div>
        );
    }
  };

  const renderResultadoDisc = () => {
    if (!resultadoDisc || resultadoDisc.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Perfil DISC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">Teste não realizado</Badge>
          </CardContent>
        </Card>
      );
    }

    // Procurar por avaliação finalizada
    const avaliacaoFinalizada = resultadoDisc.find((av: any) => av.status === "finalizada");
    
    console.log("Dados DISC recebidos:", resultadoDisc);
    console.log("Avaliação finalizada encontrada:", avaliacaoFinalizada);
    
    if (!avaliacaoFinalizada) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Perfil DISC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">
              {resultadoDisc.length > 0 ? "Teste em andamento" : "Teste não realizado"}
            </Badge>
            {resultadoDisc.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                Debug: {resultadoDisc.length} avaliação(ões) encontrada(s)
              </p>
            )}
          </CardContent>
        </Card>
      );
    }

    // Parse do JSON se necessário
    let resultado;
    try {
      if (typeof avaliacaoFinalizada.resultado === 'string') {
        resultado = JSON.parse(avaliacaoFinalizada.resultado);
      } else {
        resultado = avaliacaoFinalizada.resultado;
      }
    } catch (error) {
      console.error("Erro ao fazer parse do resultado DISC:", error);
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Perfil DISC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="destructive">Erro no resultado</Badge>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Perfil DISC
          </CardTitle>
          <CardDescription>
            Perfil comportamental identificado: <strong>{resultado.perfilDominante}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Dominância (D)</span>
                <Badge variant="destructive">{resultado.D || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Influência (I)</span>
                <Badge variant="default">{resultado.I || 0}</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Estabilidade (S)</span>
                <Badge variant="secondary">{resultado.S || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Conformidade (C)</span>
                <Badge variant="outline">{resultado.C || 0}</Badge>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">{resultado.descricaoCompleta}</p>
          </div>
          <div className="text-xs text-muted-foreground">
            Realizado em: {new Date(avaliacaoFinalizada.dataFim).toLocaleDateString('pt-BR')}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {candidato.nome}
          </DialogTitle>
          <DialogDescription>
            Informações completas do candidato
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{candidato.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{candidato.telefone}</span>
                  </div>
                  {candidato.localizacao && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{candidato.localizacao}</span>
                    </div>
                  )}
                  {candidato.pretensaoSalarial && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">R$ {candidato.pretensaoSalarial}</span>
                    </div>
                  )}
                </div>

                {candidato.resumoProfissional && (
                  <div>
                    <h4 className="font-medium mb-2">Resumo Profissional</h4>
                    <p className="text-sm text-muted-foreground">{candidato.resumoProfissional}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Ético */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Status Ético
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setStatusEticoModalOpen(true)}
                  >
                    Editar Status
                  </Button>
                </CardTitle>
                <CardDescription>
                  Configure aqui se o candidato foi aprovado ou reprovado na verificação ética
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderStatusEtico()}
              </CardContent>
            </Card>

            {/* Resultado DISC */}
            {renderResultadoDisc()}

            {/* Experiência Profissional */}
            {candidato.experienciaProfissional && candidato.experienciaProfissional.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Experiência Profissional
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {candidato.experienciaProfissional.map((exp: any, index: number) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{exp.cargo}</h4>
                          <p className="text-sm text-muted-foreground">{exp.empresa}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {exp.dataInicio} - {exp.dataFim || 'Atual'}
                          </div>
                        </div>
                      </div>
                      {exp.descricao && (
                        <p className="text-sm">{exp.descricao}</p>
                      )}
                      {index < candidato.experienciaProfissional.length - 1 && <Separator />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Educação */}
            {candidato.educacao && candidato.educacao.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Formação Acadêmica
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {candidato.educacao.map((edu: any, index: number) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{edu.curso}</h4>
                          <p className="text-sm text-muted-foreground">{edu.instituicao}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{edu.status}</Badge>
                          <div className="text-sm text-muted-foreground mt-1">
                            {edu.anoInicio} - {edu.anoFim || 'Em andamento'}
                          </div>
                        </div>
                      </div>
                      {index < candidato.educacao.length - 1 && <Separator />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Habilidades */}
            {candidato.habilidades && candidato.habilidades.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Habilidades e Competências</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {candidato.habilidades.map((habilidade: any, index: number) => (
                      <Badge key={index} variant="secondary">
                        {habilidade.nome} {habilidade.nivel && `(${habilidade.nivel})`}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Idiomas */}
            {candidato.idiomas && candidato.idiomas.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Languages className="h-5 w-5" />
                    Idiomas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {candidato.idiomas.map((idioma: any, index: number) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-sm">{idioma.idioma}</span>
                        <Badge variant="outline">{idioma.nivel}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Certificações */}
            {candidato.certificacoes && candidato.certificacoes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Certificações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {candidato.certificacoes.map((cert: any, index: number) => (
                    <div key={index} className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-sm">{cert.nome}</h4>
                        <p className="text-xs text-muted-foreground">{cert.instituicao}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">
                          {cert.dataObtencao}
                        </div>
                        {cert.validade && (
                          <div className="text-xs text-muted-foreground">
                            Válido até: {cert.validade}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
    
    {/* Modal de edição de Status Ético */}
    <Dialog open={statusEticoModalOpen} onOpenChange={setStatusEticoModalOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Status Ético</DialogTitle>
          <DialogDescription>
            Configure o status da verificação ética para {candidato?.nome}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Status Ético</label>
            <Select 
              value={statusEticoForm.statusEtico} 
              onValueChange={(value) => setStatusEticoForm(prev => ({ ...prev, statusEtico: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="reprovado">Reprovado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {statusEticoForm.statusEtico === "reprovado" && (
            <div>
              <label className="text-sm font-medium">Motivo da Reprovação</label>
              <textarea
                className="w-full mt-1 p-2 border rounded-md"
                rows={3}
                value={statusEticoForm.motivoReprovacaoEtica}
                onChange={(e) => setStatusEticoForm(prev => ({ ...prev, motivoReprovacaoEtica: e.target.value }))}
                placeholder="Descreva o motivo da reprovação ética..."
              />
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setStatusEticoModalOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={() => updateStatusEticoMutation.mutate(statusEticoForm)}
            disabled={updateStatusEticoMutation.isPending}
          >
            {updateStatusEticoMutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </>
  );
}