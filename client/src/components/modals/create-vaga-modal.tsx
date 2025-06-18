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

interface CreateVagaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateVagaModal({ open, onOpenChange }: CreateVagaModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    requisitos: "",
    beneficios: "",
    salario: "",
    local: "",
    tipoContratacao: "CLT",
    empresaId: "",
    departamentoId: "",
    status: "aberta"
  });

  const { data: empresas } = useQuery({
    queryKey: ["/api/empresas"],
  });

  const { data: departamentos } = useQuery({
    queryKey: ["/api/departamentos"],
  });

  const createVagaMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/vagas", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Vaga criada com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/vagas"] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao criar vaga", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const resetForm = () => {
    setFormData({
      titulo: "",
      descricao: "",
      requisitos: "",
      beneficios: "",
      salario: "",
      local: "",
      tipoContratacao: "CLT",
      empresaId: "",
      departamentoId: "",
      status: "aberta"
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo || !formData.descricao || !formData.empresaId) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha título, descrição e empresa",
        variant: "destructive"
      });
      return;
    }
    createVagaMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova Vaga</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="titulo">Título da Vaga *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                placeholder="Ex: Desenvolvedor Frontend"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="empresa">Empresa *</Label>
              <Select 
                value={formData.empresaId} 
                onValueChange={(value) => setFormData({...formData, empresaId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(empresas) && empresas.map((empresa: any) => (
                    <SelectItem key={empresa.id} value={empresa.id}>
                      {empresa.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="departamento">Departamento</Label>
              <Select 
                value={formData.departamentoId} 
                onValueChange={(value) => setFormData({...formData, departamentoId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o departamento" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(departamentos) && departamentos.map((dept: any) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="local">Local</Label>
              <Input
                id="local"
                value={formData.local}
                onChange={(e) => setFormData({...formData, local: e.target.value})}
                placeholder="Ex: São Paulo, SP / Remoto"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="salario">Salário</Label>
              <Input
                id="salario"
                value={formData.salario}
                onChange={(e) => setFormData({...formData, salario: e.target.value})}
                placeholder="Ex: R$ 5.000 - R$ 8.000"
              />
            </div>

            <div>
              <Label htmlFor="tipo">Tipo de Contratação</Label>
              <Select 
                value={formData.tipoContratacao} 
                onValueChange={(value) => setFormData({...formData, tipoContratacao: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLT">CLT</SelectItem>
                  <SelectItem value="PJ">PJ</SelectItem>
                  <SelectItem value="Freelancer">Freelancer</SelectItem>
                  <SelectItem value="Estágio">Estágio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="descricao">Descrição da Vaga *</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({...formData, descricao: e.target.value})}
              placeholder="Descreva as principais responsabilidades e objetivos da posição..."
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="requisitos">Requisitos</Label>
            <Textarea
              id="requisitos"
              value={formData.requisitos}
              onChange={(e) => setFormData({...formData, requisitos: e.target.value})}
              placeholder="Liste os requisitos técnicos e comportamentais..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="beneficios">Benefícios</Label>
            <Textarea
              id="beneficios"
              value={formData.beneficios}
              onChange={(e) => setFormData({...formData, beneficios: e.target.value})}
              placeholder="Descreva os benefícios oferecidos..."
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={createVagaMutation.isPending}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {createVagaMutation.isPending ? "Criando..." : "Criar Vaga"}
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