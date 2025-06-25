import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Shield } from "lucide-react";

interface StatusEticoModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidato: any;
}

export function StatusEticoModal({ isOpen, onClose, candidato }: StatusEticoModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [statusEticoForm, setStatusEticoForm] = useState({
    statusEtico: "pendente",
    motivoReprovacaoEtica: ""
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
      const response = await fetch(`/api/candidatos/${candidato.id}/status-etico`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Erro ao atualizar status ético');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/candidatos'] });
      onClose();
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

  if (!candidato) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Status Ético - {candidato.nome}
          </DialogTitle>
          <DialogDescription>
            Configure o status da verificação ética para este candidato
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
              <Textarea
                className="mt-1"
                rows={3}
                value={statusEticoForm.motivoReprovacaoEtica}
                onChange={(e) => setStatusEticoForm(prev => ({ ...prev, motivoReprovacaoEtica: e.target.value }))}
                placeholder="Descreva o motivo da reprovação ética..."
              />
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
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
  );
}