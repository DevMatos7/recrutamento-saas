import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Clock, CheckCircle, XCircle, User, Briefcase } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PendingApplication {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobId: string;
  jobTitle: string;
  applicationDate: string;
  comments: string;
}

export default function CandidaturasPendentesPage() {
  const { toast } = useToast();
  const [selectedApplication, setSelectedApplication] = useState<PendingApplication | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [comments, setComments] = useState("");

  // Buscar candidaturas pendentes
  const { data: pendingApplications = [], isLoading } = useQuery<PendingApplication[]>({
    queryKey: ["/api/candidaturas-pendentes"],
  });

  // Mutation para aprovar candidatura
  const approveMutation = useMutation({
    mutationFn: async ({ applicationId, comments }: { applicationId: string; comments: string }) => {
      const res = await apiRequest("POST", `/api/candidaturas/${applicationId}/aprovar`, { comentarios: comments });
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Candidatura aprovada com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/candidaturas-pendentes"] });
      setSelectedApplication(null);
      setComments("");
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao aprovar candidatura", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Mutation para rejeitar candidatura
  const rejectMutation = useMutation({
    mutationFn: async ({ applicationId, comments }: { applicationId: string; comments: string }) => {
      const res = await apiRequest("POST", `/api/candidaturas/${applicationId}/rejeitar`, { comentarios: comments });
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Candidatura rejeitada" });
      queryClient.invalidateQueries({ queryKey: ["/api/candidaturas-pendentes"] });
      setSelectedApplication(null);
      setComments("");
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao rejeitar candidatura", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleAction = () => {
    if (!selectedApplication || !actionType) return;

    if (actionType === 'approve') {
      approveMutation.mutate({ 
        applicationId: selectedApplication.id, 
        comments: comments || "Candidatura aprovada pelo recrutador" 
      });
    } else {
      rejectMutation.mutate({ 
        applicationId: selectedApplication.id, 
        comments: comments || "Candidatura rejeitada pelo recrutador" 
      });
    }
  };

  const openActionDialog = (application: PendingApplication, action: 'approve' | 'reject') => {
    setSelectedApplication(application);
    setActionType(action);
    setComments("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Carregando candidaturas pendentes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Candidaturas Pendentes</h1>
          <p className="text-gray-600">Aprove ou rejeite candidaturas de candidatos</p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {pendingApplications.length} pendente(s)
        </Badge>
      </div>

      {pendingApplications.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma candidatura pendente</h3>
            <p className="text-gray-600">Todas as candidaturas foram processadas!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingApplications.map((application) => (
            <Card key={application.id} className="border-l-4 border-l-yellow-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {application.candidateName}
                  </CardTitle>
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    Aguardando Aprovação
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{application.candidateEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Data da Candidatura</p>
                    <p className="font-medium">
                      {new Date(application.applicationDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      Vaga
                    </p>
                    <p className="font-medium">{application.jobTitle}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        onClick={() => openActionDialog(application, 'approve')}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Aprovar
                      </Button>
                    </DialogTrigger>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="destructive"
                        onClick={() => openActionDialog(application, 'reject')}
                        className="flex items-center gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Rejeitar
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de confirmação */}
      <Dialog open={!!selectedApplication && !!actionType} onOpenChange={() => {
        setSelectedApplication(null);
        setActionType(null);
        setComments("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Aprovar' : 'Rejeitar'} Candidatura
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedApplication && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>Candidato:</strong> {selectedApplication.candidateName}</p>
                <p><strong>Vaga:</strong> {selectedApplication.jobTitle}</p>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium">Comentários (opcional)</label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder={
                  actionType === 'approve' 
                    ? "Motivo da aprovação..." 
                    : "Motivo da rejeição..."
                }
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleAction}
                disabled={approveMutation.isPending || rejectMutation.isPending}
                className={actionType === 'approve' ? '' : 'bg-red-600 hover:bg-red-700'}
              >
                {approveMutation.isPending || rejectMutation.isPending ? 'Processando...' : 
                 actionType === 'approve' ? 'Confirmar Aprovação' : 'Confirmar Rejeição'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedApplication(null);
                  setActionType(null);
                  setComments("");
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}