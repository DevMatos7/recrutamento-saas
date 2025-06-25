import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Edit, Save, X, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DiscQuestion {
  id: string;
  bloco: string;
  ordem: number;
  frase: string;
  fator: 'D' | 'I' | 'S' | 'C';
}

interface DiscBlock {
  bloco: string;
  titulo: string;
  frases: DiscQuestion[];
}

export default function DiscEditor() {
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingQuestions, setEditingQuestions] = useState<DiscQuestion[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: discModel, isLoading } = useQuery<DiscBlock[]>({
    queryKey: ["/api/avaliacoes/disc/modelo"],
  });

  const updateBlockMutation = useMutation({
    mutationFn: async ({ bloco, titulo, questions }: { bloco: string; titulo: string; questions: DiscQuestion[] }) => {
      const response = await fetch("/api/avaliacoes/disc/admin/update-block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bloco, titulo, questions }),
      });
      if (!response.ok) throw new Error("Erro ao atualizar bloco");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Bloco DISC atualizado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/avaliacoes/disc/modelo"] });
      setEditingBlock(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar bloco DISC",
        variant: "destructive",
      });
    },
  });

  const handleEditBlock = (block: DiscBlock) => {
    setEditingBlock(block.bloco);
    setEditingTitle(block.titulo);
    setEditingQuestions([...block.frases]);
  };

  const handleCancelEdit = () => {
    setEditingBlock(null);
    setEditingTitle("");
    setEditingQuestions([]);
  };

  const handleSaveBlock = () => {
    if (!editingBlock) return;
    
    updateBlockMutation.mutate({
      bloco: editingBlock,
      titulo: editingTitle,
      questions: editingQuestions,
    });
  };

  const handleQuestionChange = (index: number, field: keyof DiscQuestion, value: string) => {
    const updated = [...editingQuestions];
    if (field === 'ordem') {
      updated[index] = { ...updated[index], [field]: parseInt(value) };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setEditingQuestions(updated);
  };

  const handleAddQuestion = () => {
    const newQuestion: DiscQuestion = {
      id: `temp-${Date.now()}`,
      bloco: editingBlock!,
      ordem: editingQuestions.length + 1,
      frase: "",
      fator: 'D',
    };
    setEditingQuestions([...editingQuestions, newQuestion]);
  };

  const handleRemoveQuestion = (index: number) => {
    const updated = editingQuestions.filter((_, i) => i !== index);
    // Reordenar as questões
    updated.forEach((q, i) => {
      q.ordem = i + 1;
    });
    setEditingQuestions(updated);
  };

  const getFactorColor = (fator: string) => {
    switch (fator) {
      case 'D': return 'bg-red-100 text-red-800';
      case 'I': return 'bg-yellow-100 text-yellow-800';
      case 'S': return 'bg-green-100 text-green-800';
      case 'C': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando editor DISC...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Editor de Teste DISC</h1>
          <p className="text-gray-600">Edite as perguntas, títulos e alternativas do teste DISC</p>
        </div>
      </div>

      <div className="grid gap-6">
        {discModel?.map((block: DiscBlock) => (
          <Card key={block.bloco} className="relative">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg">Bloco {block.bloco}</CardTitle>
                <p className="text-sm text-gray-600">{block.titulo}</p>
              </div>
              <div className="flex items-center gap-2">
                {editingBlock === block.bloco ? (
                  <>
                    <Button
                      size="sm"
                      onClick={handleSaveBlock}
                      disabled={updateBlockMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Salvar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditBlock(block)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editingBlock === block.bloco ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="titulo">Título do Bloco</Label>
                    <Input
                      id="titulo"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      placeholder="Ex: Tende a agir de forma..."
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Alternativas</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleAddQuestion}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar
                      </Button>
                    </div>

                    {editingQuestions.map((question, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center p-3 border rounded-lg">
                        <div className="col-span-1">
                          <Label className="text-xs">Ordem</Label>
                          <Input
                            type="number"
                            value={question.ordem}
                            onChange={(e) => handleQuestionChange(index, 'ordem', e.target.value)}
                            min="1"
                            max="4"
                          />
                        </div>
                        <div className="col-span-7">
                          <Label className="text-xs">Texto da Alternativa</Label>
                          <Input
                            value={question.frase}
                            onChange={(e) => handleQuestionChange(index, 'frase', e.target.value)}
                            placeholder="Ex: Assertiva"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Fator DISC</Label>
                          <Select
                            value={question.fator}
                            onValueChange={(value) => handleQuestionChange(index, 'fator', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="D">D - Dominante</SelectItem>
                              <SelectItem value="I">I - Influente</SelectItem>
                              <SelectItem value="S">S - Estável</SelectItem>
                              <SelectItem value="C">C - Consciente</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2 flex items-end justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveQuestion(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {block.frases.map((question, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm w-6">{question.ordem}.</span>
                        <span>{question.frase}</span>
                      </div>
                      <Badge className={getFactorColor(question.fator)}>
                        {question.fator}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}