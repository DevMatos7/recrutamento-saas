import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  Eye,
  Copy,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';

interface Template {
  id: string;
  titulo: string;
  evento: string;
  corpo: string;
  ativo: boolean;
  criadoEm: string;
}

interface TemplateVariables {
  nome?: string;
  vaga?: string;
  empresa?: string;
  data?: string;
  local?: string;
  link?: string;
  observacoes?: string;
  [key: string]: string | undefined;
}

const EVENTOS_DISPONIVEIS = [
  { value: 'triagem_aprovada', label: 'Triagem Aprovada' },
  { value: 'entrevista_agendada', label: 'Entrevista Agendada' },
  { value: 'solicitar_documentos', label: 'Solicitar Documentos' },
  { value: 'feedback_aprovado', label: 'Feedback Aprovado' },
  { value: 'feedback_reprovado', label: 'Feedback Reprovado' },
  { value: 'mudanca_etapa', label: 'Mudança de Etapa' },
  { value: 'mensagem_direta', label: 'Mensagem Direta' },
  { value: 'link_vaga', label: 'Link da Vaga' }
];

const VARIAVEIS_DISPONIVEIS = [
  { variavel: '{{nome}}', descricao: 'Nome do candidato' },
  { variavel: '{{vaga}}', descricao: 'Título da vaga' },
  { variavel: '{{empresa}}', descricao: 'Nome da empresa' },
  { variavel: '{{data}}', descricao: 'Data atual' },
  { variavel: '{{hora}}', descricao: 'Horário' },
  { variavel: '{{local}}', descricao: 'Local da entrevista' },
  { variavel: '{{link}}', descricao: 'Link da vaga/entrevista' },
  { variavel: '{{documentos}}', descricao: 'Lista de documentos' },
  { variavel: '{{prazo}}', descricao: 'Prazo para envio' },
  { variavel: '{{motivo}}', descricao: 'Motivo da reprovação' },
  { variavel: '{{feedback}}', descricao: 'Feedback detalhado' },
  { variavel: '{{etapa}}', descricao: 'Nome da etapa' },
  { variavel: '{{observacoes}}', descricao: 'Observações adicionais' },
  { variavel: '{{proximosPassos}}', descricao: 'Próximos passos' }
];

export default function WhatsAppTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [showEditTemplate, setShowEditTemplate] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [filterEvento, setFilterEvento] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [newTemplate, setNewTemplate] = useState({
    titulo: '',
    evento: '',
    corpo: ''
  });

  const [editTemplate, setEditTemplate] = useState({
    id: '',
    titulo: '',
    evento: '',
    corpo: '',
    ativo: true
  });

  // Carregar templates
  useEffect(() => {
    carregarTemplates();
  }, []);

  const carregarTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/whatsapp/templates');
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const criarTemplate = async () => {
    try {
      const response = await fetch('/api/whatsapp/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTemplate)
      });

      if (response.ok) {
        setShowNewTemplate(false);
        setNewTemplate({ titulo: '', evento: '', corpo: '' });
        await carregarTemplates();
      } else {
        const error = await response.json();
        alert(`Erro ao criar template: ${error.message}`);
      }
    } catch (error) {
      console.error('Erro ao criar template:', error);
      alert('Erro ao criar template');
    }
  };

  const atualizarTemplate = async () => {
    try {
      const response = await fetch(`/api/whatsapp/templates/${editTemplate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editTemplate)
      });

      if (response.ok) {
        setShowEditTemplate(null);
        setEditTemplate({ id: '', titulo: '', evento: '', corpo: '', ativo: true });
        await carregarTemplates();
      } else {
        const error = await response.json();
        alert(`Erro ao atualizar template: ${error.message}`);
      }
    } catch (error) {
      console.error('Erro ao atualizar template:', error);
      alert('Erro ao atualizar template');
    }
  };

  const deletarTemplate = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este template?')) {
      return;
    }

    try {
      const response = await fetch(`/api/whatsapp/templates/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await carregarTemplates();
      } else {
        const error = await response.json();
        alert(`Erro ao deletar template: ${error.message}`);
      }
    } catch (error) {
      console.error('Erro ao deletar template:', error);
      alert('Erro ao deletar template');
    }
  };

  const toggleTemplateStatus = async (id: string, ativo: boolean) => {
    try {
      const template = templates.find(t => t.id === id);
      if (!template) return;

      const response = await fetch(`/api/whatsapp/templates/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...template, ativo: !ativo })
      });

      if (response.ok) {
        await carregarTemplates();
      }
    } catch (error) {
      console.error('Erro ao alterar status do template:', error);
    }
  };

  const abrirEdicao = (template: Template) => {
    setEditTemplate({
      id: template.id,
      titulo: template.titulo,
      evento: template.evento,
      corpo: template.corpo,
      ativo: template.ativo
    });
    setShowEditTemplate(template.id);
  };

  const processarTemplate = (corpo: string, variables: TemplateVariables = {}): string => {
    let resultado = corpo;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      resultado = resultado.replace(regex, value || `[${key}]`);
    });

    // Substituir variáveis padrão
    resultado = resultado.replace(/{{nome}}/g, variables.nome || '[Nome do Candidato]');
    resultado = resultado.replace(/{{vaga}}/g, variables.vaga || '[Título da Vaga]');
    resultado = resultado.replace(/{{empresa}}/g, variables.empresa || '[Nome da Empresa]');
    resultado = resultado.replace(/{{data}}/g, variables.data || new Date().toLocaleDateString('pt-BR'));
    resultado = resultado.replace(/{{hora}}/g, variables.hora || new Date().toLocaleTimeString('pt-BR'));
    resultado = resultado.replace(/{{local}}/g, variables.local || '[Local]');
    resultado = resultado.replace(/{{link}}/g, variables.link || '[Link]');
    resultado = resultado.replace(/{{documentos}}/g, variables.documentos || '[Documentos]');
    resultado = resultado.replace(/{{prazo}}/g, variables.prazo || '[Prazo]');
    resultado = resultado.replace(/{{motivo}}/g, variables.motivo || '[Motivo]');
    resultado = resultado.replace(/{{feedback}}/g, variables.feedback || '[Feedback]');
    resultado = resultado.replace(/{{etapa}}/g, variables.etapa || '[Etapa]');
    resultado = resultado.replace(/{{observacoes}}/g, variables.observacoes || '[Observações]');
    resultado = resultado.replace(/{{proximosPassos}}/g, variables.proximosPassos || '[Próximos Passos]');

    return resultado;
  };

  const copiarTemplate = async (template: Template) => {
    try {
      await navigator.clipboard.writeText(template.corpo);
      alert('Template copiado para a área de transferência!');
    } catch (error) {
      console.error('Erro ao copiar template:', error);
    }
  };

  const templatesFiltrados = templates.filter(template => {
    const matchSearch = template.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       template.corpo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchEvento = filterEvento === 'all' || template.evento === filterEvento;
    
    return matchSearch && matchEvento;
  });

  const getEventoLabel = (evento: string) => {
    const eventoObj = EVENTOS_DISPONIVEIS.find(e => e.value === evento);
    return eventoObj ? eventoObj.label : evento;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="ml-2">Carregando templates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Templates de Mensagem</h1>
          <p className="text-gray-600">Gerencie os templates de mensagem para WhatsApp</p>
        </div>
        <Dialog open={showNewTemplate} onOpenChange={setShowNewTemplate}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  value={newTemplate.titulo}
                  onChange={(e) => setNewTemplate({ ...newTemplate, titulo: e.target.value })}
                  placeholder="Ex: Confirmação de Entrevista"
                />
              </div>
              <div>
                <Label htmlFor="evento">Evento</Label>
                <Select value={newTemplate.evento} onValueChange={(value) => setNewTemplate({ ...newTemplate, evento: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o evento" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENTOS_DISPONIVEIS.map(evento => (
                      <SelectItem key={evento.value} value={evento.value}>
                        {evento.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="corpo">Mensagem</Label>
                <Textarea
                  id="corpo"
                  value={newTemplate.corpo}
                  onChange={(e) => setNewTemplate({ ...newTemplate, corpo: e.target.value })}
                  placeholder="Digite a mensagem do template..."
                  rows={6}
                />
                <div className="mt-2 text-sm text-gray-500">
                  <p className="font-medium mb-1">Variáveis disponíveis:</p>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {VARIAVEIS_DISPONIVEIS.map(variavel => (
                      <div key={variavel.variavel} className="flex items-center space-x-1">
                        <code className="bg-gray-100 px-1 rounded">{variavel.variavel}</code>
                        <span>{variavel.descricao}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowNewTemplate(false)}>
                  Cancelar
                </Button>
                <Button onClick={criarTemplate} disabled={!newTemplate.titulo || !newTemplate.evento || !newTemplate.corpo}>
                  Criar Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterEvento} onValueChange={setFilterEvento}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os eventos</SelectItem>
                {EVENTOS_DISPONIVEIS.map(evento => (
                  <SelectItem key={evento.value} value={evento.value}>
                    {evento.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Templates */}
      <div className="grid gap-4">
        {templatesFiltrados.map(template => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                  <div>
                    <CardTitle className="text-lg">{template.titulo}</CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline">{getEventoLabel(template.evento)}</Badge>
                      <Badge variant={template.ativo ? 'default' : 'secondary'}>
                        {template.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(template.id)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copiarTemplate(template)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => abrirEdicao(template)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleTemplateStatus(template.id, template.ativo)}
                  >
                    {template.ativo ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deletarTemplate(template.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{template.corpo}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de Edição */}
      <Dialog open={!!showEditTemplate} onOpenChange={() => setShowEditTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-titulo">Título</Label>
              <Input
                id="edit-titulo"
                value={editTemplate.titulo}
                onChange={(e) => setEditTemplate({ ...editTemplate, titulo: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-evento">Evento</Label>
              <Select value={editTemplate.evento} onValueChange={(value) => setEditTemplate({ ...editTemplate, evento: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENTOS_DISPONIVEIS.map(evento => (
                    <SelectItem key={evento.value} value={evento.value}>
                      {evento.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-corpo">Mensagem</Label>
              <Textarea
                id="edit-corpo"
                value={editTemplate.corpo}
                onChange={(e) => setEditTemplate({ ...editTemplate, corpo: e.target.value })}
                rows={6}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditTemplate(null)}>
                Cancelar
              </Button>
              <Button onClick={atualizarTemplate}>
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Preview */}
      <Dialog open={!!showPreview} onOpenChange={() => setShowPreview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preview do Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {showPreview && (() => {
              const template = templates.find(t => t.id === showPreview);
              if (!template) return null;

              const preview = processarTemplate(template.corpo);
              
              return (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Mensagem com valores de exemplo:</h4>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm whitespace-pre-wrap">{preview}</p>
                  </div>
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 