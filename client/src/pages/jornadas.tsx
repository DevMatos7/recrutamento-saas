import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

function JornadaModal({ isOpen, onClose, editingJornada, onSaved }: { isOpen: boolean, onClose: () => void, editingJornada?: any, onSaved: () => void }) {
  const [form, setForm] = useState(editingJornada || {
    nome: "",
    descricao: "",
    horarios: [
      { label: "Entrada", hora: "08:00" },
      { label: "Almoço", hora: "12:00" },
      { label: "Retorno", hora: "13:00" },
      { label: "Saída", hora: "17:00" }
    ],
    totalHoras: 8
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: any) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleHorarioChange = (idx: number, key: string, value: string) => {
    setForm(f => ({
      ...f,
      horarios: f.horarios.map((h: any, i: number) => i === idx ? { ...h, [key]: value } : h)
    }));
  };

  const handleAddHorario = () => {
    setForm(f => ({ ...f, horarios: [...f.horarios, { label: "", hora: "" }] }));
  };
  const handleRemoveHorario = (idx: number) => {
    setForm(f => ({ ...f, horarios: f.horarios.filter((_: any, i: number) => i !== idx) }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // Calcular total de horas automaticamente
      // (Simples: diferença entre Entrada e Saída, pode ser melhorado)
      let total = 0;
      if (form.horarios.length >= 2) {
        const entrada = form.horarios[0].hora;
        const saida = form.horarios[form.horarios.length - 1].hora;
        const [h1, m1] = entrada.split(":").map(Number);
        const [h2, m2] = saida.split(":").map(Number);
        total = (h2 + m2/60) - (h1 + m1/60);
      }
      const payload = { ...form, totalHoras: total };
      if (editingJornada) {
        await apiRequest("PUT", `/api/jornadas/${editingJornada.id}`, payload);
      } else {
        await apiRequest("POST", "/api/jornadas", payload);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError("Erro ao salvar jornada: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-lg w-full mx-4">
        <h2 className="text-lg font-semibold mb-4">{editingJornada ? "Editar Jornada" : "Nova Jornada"}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block font-medium">Nome</label>
          <Input name="nome" value={form.nome} onChange={handleChange} required />
          <label className="block font-medium">Descrição</label>
          <Textarea name="descricao" value={form.descricao} onChange={handleChange} />
          <label className="block font-medium">Horários</label>
          <div className="space-y-2">
            {form.horarios.map((h: any, idx: number) => (
              <div key={idx} className="flex gap-2 items-center">
                <Input
                  value={h.label}
                  onChange={e => handleHorarioChange(idx, "label", e.target.value)}
                  placeholder="Ex: Entrada, Almoço, Saída"
                  className="w-32"
                  required
                />
                <Input
                  type="time"
                  value={h.hora}
                  onChange={e => handleHorarioChange(idx, "hora", e.target.value)}
                  required
                />
                <Button type="button" variant="ghost" onClick={() => handleRemoveHorario(idx)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={handleAddHorario}>Adicionar Horário</Button>
          </div>
          <div className="text-sm text-gray-600">Total de horas (calculado): {form.totalHoras}</div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar Jornada"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function JornadasPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJornada, setEditingJornada] = useState<any | null>(null);

  const { data: jornadas = [], isLoading } = useQuery({ queryKey: ["/api/jornadas"] });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/jornadas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jornadas"] });
      toast({ title: "Sucesso", description: "Jornada excluída com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  if (!user || user.perfil !== "admin") {
    return <div className="p-8 text-center text-red-600 font-bold">Acesso restrito ao administrador.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Jornadas Detalhadas</h1>
          <p className="text-gray-600 mt-1">Configure os horários e jornadas de trabalho disponíveis para seleção nas vagas e perfis.</p>
        </div>
        <Button onClick={() => { setEditingJornada(null); setIsModalOpen(true); }} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Nova Jornada
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Horários</TableHead>
              <TableHead>Total Horas</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jornadas.map((j: any) => (
              <TableRow key={j.id}>
                <TableCell>{j.nome}</TableCell>
                <TableCell>{j.descricao}</TableCell>
                <TableCell>
                  {Array.isArray(j.horarios) && j.horarios.map((h: any, idx: number) => (
                    <div key={idx}>{h.label}: {h.hora}</div>
                  ))}
                </TableCell>
                <TableCell>{j.totalHoras}</TableCell>
                <TableCell>
                  <Button size="icon" variant="ghost" onClick={() => { setEditingJornada(j); setIsModalOpen(true); }}><Edit className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm("Excluir jornada?")) deleteMutation.mutate(j.id); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <JornadaModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} editingJornada={editingJornada} onSaved={() => queryClient.invalidateQueries({ queryKey: ["/api/jornadas"] })} />
    </div>
  );
} 