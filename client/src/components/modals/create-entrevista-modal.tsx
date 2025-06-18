import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface CreateEntrevistaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateEntrevistaModal({ open, onOpenChange }: CreateEntrevistaModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    vagaId: "",
    candidatoId: "",
    entrevistadorId: "",
    dataHora: "",
    tipo: "presencial",
    local: "",
    observacoes: "",
    status: "agendada"
  });

  const { data: vagas } = useQuery({
    queryKey: ["/api/vagas"],
  });

  const { data: candidatos } = useQuery({
    queryKey: ["/api/candidatos"],
  });

  const { data: usuarios } = useQuery({
    queryKey: ["/api/usuarios"],
  });

  const createEntrevistaMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/entrevistas", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Entrevista agendada com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/entrevistas"] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao agendar entrevista", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const resetForm = () => {
    setFormData({
      vagaId: "",
      candidatoId: "",
      entrevistadorId: "",
      dataHora: "",
      tipo: "presencial",
      local: "",
      observacoes: "",
      status: "agendada"
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vagaId || !formData.candidatoId || !formData.entrevistadorId || !formData.dataHora) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha vaga, candidato, entrevistador e data/hora",
        variant: "destructive"
      });
      return;
    }
    createEntrevistaMutation.mutate(formData);
  };

  // Get current date and time for min attribute
  const now = new Date();
  const minDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agendar Nova Entrevista</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vaga">Vaga *</Label>
              <Select 
                value={formData.vagaId} 
                onValueChange={(value) => setFormData({...formData, vagaId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a vaga" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(vagas) && vagas.map((vaga: any) => (
                    <SelectItem key={vaga.id} value={vaga.id}>
                      {vaga.titulo} - {vaga.empresa}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="candidato">Candidato *</Label>
              <Select 
                value={formData.candidatoId} 
                onValueChange={(value) => setFormData({...formData, candidatoId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o candidato" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(candidatos) && candidatos.map((candidato: any) => (
                    <SelectItem key={candidato.id} value={candidato.id}>
                      {candidato.nome} - {candidato.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="entrevistador">Entrevistador *</Label>
              <Select 
                value={formData.entrevistadorId} 
                onValueChange={(value) => setFormData({...formData, entrevistadorId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o entrevistador" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(usuarios) && usuarios.map((usuario: any) => (
                    <SelectItem key={usuario.id} value={usuario.id}>
                      {usuario.nome} - {usuario.perfil}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dataHora">Data e Hora *</Label>
              <Input
                id="dataHora"
                type="datetime-local"
                value={formData.dataHora}
                min={minDateTime}
                onChange={(e) => setFormData({...formData, dataHora: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tipo">Tipo de Entrevista</Label>
              <Select 
                value={formData.tipo} 
                onValueChange={(value) => setFormData({...formData, tipo: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="presencial">Presencial</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="telefone">Telefone</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="local">Local / Link</Label>
              <Input
                id="local"
                value={formData.local}
                onChange={(e) => setFormData({...formData, local: e.target.value})}
                placeholder={
                  formData.tipo === 'presencial' ? 'Endereço da empresa' :
                  formData.tipo === 'online' ? 'Link da videochamada' :
                  'Número de telefone'
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
              placeholder="Instruções adicionais, pauta da entrevista, etc..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={createEntrevistaMutation.isPending}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {createEntrevistaMutation.isPending ? "Agendando..." : "Agendar Entrevista"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}