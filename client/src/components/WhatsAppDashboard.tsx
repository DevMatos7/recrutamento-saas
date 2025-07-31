import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MessageSquare,
  Send,
  Settings,
  BarChart3,
  Bot,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  QrCode,
  Wifi,
  WifiOff,
  RefreshCw,
  Smartphone,
  MessageCircle
} from 'lucide-react';

interface WhatsAppSession {
  id: string;
  nome: string;
  numero: string;
  status: 'conectado' | 'desconectado' | 'erro';
  qrCode?: string;
}

interface Template {
  id: string;
  titulo: string;
  evento: string;
  corpo: string;
  ativo: boolean;
}

interface Mensagem {
  id: string;
  candidatoId: string;
  telefone: string;
  tipo: 'enviada' | 'recebida';
  mensagem: string;
  status: string;
  dataEnvio: string;
}

interface Estatisticas {
  totalMensagens: number;
  mensagensEnviadas: number;
  mensagensRecebidas: number;
  taxaEntrega: number;
}

export default function WhatsAppDashboard() {
  const [sessoes, setSessoes] = useState<WhatsAppSession[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [estatisticas, setEstatisticas] = useState<Estatisticas>({
    totalMensagens: 0,
    mensagensEnviadas: 0,
    mensagensRecebidas: 0,
    taxaEntrega: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [novaMensagem, setNovaMensagem] = useState('');
  const [candidatoId, setCandidatoId] = useState('');
  const [telefoneDestino, setTelefoneDestino] = useState('');
  const [qrCodeModal, setQrCodeModal] = useState<string | null>(null);
  const [connectingSession, setConnectingSession] = useState<string | null>(null);
  const [pollingTimeout, setPollingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Estados para modais
  const [showNewSession, setShowNewSession] = useState(false);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [newSessionData, setNewSessionData] = useState({
    nome: '',
    numero: '',
    empresaId: ''
  });
  const [newTemplateData, setNewTemplateData] = useState({
    titulo: '',
    evento: '',
    corpo: '',
    empresaId: ''
  });

  const limparPolling = () => {
    if (pollingTimeout) {
      clearTimeout(pollingTimeout);
      setPollingTimeout(null);
    }
  };

  useEffect(() => {
    carregarDados();
    
    // Cleanup function para limpar polling quando componente for desmontado
    return () => {
      limparPolling();
    };
  }, []);

  // Limpar polling quando QR Code modal for fechado
  useEffect(() => {
    if (!qrCodeModal) {
      limparPolling();
    }
  }, [qrCodeModal]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Carregar sessões
      const sessoesResponse = await fetch('http://192.168.77.3:5000/api/whatsapp/sessoes');
      const sessoesData = await sessoesResponse.json();
      setSessoes(sessoesData);
      
      if (sessoesData.length > 0) {
        setSelectedSession(sessoesData[0].id);
      }

      // Carregar templates
      const templatesResponse = await fetch('http://192.168.77.3:5000/api/whatsapp/templates');
      const templatesData = await templatesResponse.json();
      setTemplates(templatesData);

      // Carregar estatísticas
      const statsResponse = await fetch('http://192.168.77.3:5000/api/whatsapp/estatisticas/98f2fed8-b7fb-44ab-ac53-7a51f1c9e6ff');
      const statsData = await statsResponse.json();
      setEstatisticas(statsData.mensagens || {
        totalMensagens: 0,
        mensagensEnviadas: 0,
        mensagensRecebidas: 0,
        taxaEntrega: 0
      });

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const conectarSessao = async (sessaoId: string) => {
    try {
      setConnectingSession(sessaoId);
      
      const response = await fetch(`http://192.168.77.3:5000/api/whatsapp/sessoes/${sessaoId}/conectar`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (data.qrCode) {
          // Mostrar QR Code no modal
          setQrCodeModal(data.qrCode);
          
          // Iniciar polling para verificar status da conexão
          const checkStatus = async () => {
            try {
              const statusResponse = await fetch(`http://192.168.77.3:5000/api/whatsapp/sessoes/${sessaoId}/status`);
              
              if (statusResponse.status === 404) {
                // Sessão não existe mais, parar polling
                console.log('Sessão não existe mais, parando polling...');
                setQrCodeModal(null);
                await carregarDados();
                return;
              }
              
              const statusData = await statusResponse.json();
              console.log('Status da sessão:', statusData);
              
              if (statusData.status === 'conectado' || statusData.conectado === true) {
                // Sessão conectada! Fechar modal e atualizar dados
                console.log('Sessão conectada, fechando QR Code...');
                setQrCodeModal(null);
                await carregarDados();
                return;
              }
              
              if (statusData.status === 'desconectado') {
                // Sessão desconectada, parar polling
                console.log('Sessão desconectada, parando polling...');
                setQrCodeModal(null);
                await carregarDados();
                return;
              }
              
              // Se ainda não conectou, continuar verificando
              const timeout = setTimeout(checkStatus, 2000);
              setPollingTimeout(timeout);
            } catch (error) {
              console.error('Erro ao verificar status:', error);
              // Em caso de erro, parar polling após algumas tentativas
              const timeout = setTimeout(() => {
                setQrCodeModal(null);
                carregarDados();
              }, 5000);
              setPollingTimeout(timeout);
            }
          };
          
          // Iniciar verificação após 5 segundos
          setTimeout(checkStatus, 5000);
          
        } else {
          // Sessão já conectada
          await carregarDados();
        }
      } else {
        alert('Erro ao conectar sessão');
      }
    } catch (error) {
      console.error('Erro ao conectar sessão:', error);
      alert('Erro ao conectar sessão');
    } finally {
      setConnectingSession(null);
    }
  };

  const desconectarSessao = async (sessaoId: string) => {
    try {
      const response = await fetch(`http://192.168.77.3:5000/api/whatsapp/sessoes/${sessaoId}/desconectar`, {
        method: 'POST'
      });
      
      if (response.ok) {
        await carregarDados();
      } else {
        alert('Erro ao desconectar sessão');
      }
    } catch (error) {
      console.error('Erro ao desconectar sessão:', error);
      alert('Erro ao desconectar sessão');
    }
  };

  const enviarMensagem = async () => {
    if (!selectedSession || !telefoneDestino || !novaMensagem.trim()) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const response = await fetch('http://192.168.77.3:5000/api/whatsapp/mensagens/enviar-direto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessaoId: selectedSession,
          telefone: telefoneDestino,
          mensagem: novaMensagem
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Mensagem enviada com sucesso!');
        setNovaMensagem('');
        setTelefoneDestino('');
      } else {
        alert(`Erro ao enviar mensagem: ${data.error}`);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem');
    }
  };

  const enviarMensagemTemplate = async (template: Template) => {
    if (!selectedSession || !telefoneDestino) {
      alert('Selecione uma sessão e informe o telefone');
      return;
    }

    try {
      const response = await fetch('http://192.168.77.3:5000/api/whatsapp/mensagens/template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessaoId: selectedSession,
          telefone: telefoneDestino,
          templateId: template.id,
          variables: {
            nome: 'João Silva',
            vaga: 'Desenvolvedor Full Stack',
            data: '15/08/2024',
            hora: '14:00',
            local: 'Escritório Central',
            link: 'https://gentepro.com/vaga/123'
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Mensagem com template enviada com sucesso!');
        setTelefoneDestino('');
      } else {
        alert(`Erro ao enviar mensagem: ${data.error}`);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem com template:', error);
      alert('Erro ao enviar mensagem');
    }
  };

  const deletarSessao = async (sessaoId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta sessão?')) {
      return;
    }

    try {
      const response = await fetch(`http://192.168.77.3:5000/api/whatsapp/sessoes/${sessaoId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        alert('Sessão deletada com sucesso!');
        await carregarDados();
      } else {
        alert('Erro ao deletar sessão');
      }
    } catch (error) {
      console.error('Erro ao deletar sessão:', error);
      alert('Erro ao deletar sessão');
    }
  };

  const deletarTodasSessoes = async () => {
    if (!confirm('Tem certeza que deseja deletar TODAS as sessões? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const response = await fetch('http://192.168.77.3:5000/api/whatsapp/sessoes', {
        method: 'DELETE'
      });
      
      if (response.ok) {
        alert('Todas as sessões foram deletadas!');
        await carregarDados();
      } else {
        alert('Erro ao deletar sessões');
      }
    } catch (error) {
      console.error('Erro ao deletar sessões:', error);
      alert('Erro ao deletar sessões');
    }
  };

  const criarSessao = async () => {
    try {
      const response = await fetch('http://192.168.77.3:5000/api/whatsapp/sessoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newSessionData,
          empresaId: '98f2fed8-b7fb-44ab-ac53-7a51f1c9e6ff' // ID da empresa GentePRO
        })
      });

      if (response.ok) {
        setShowNewSession(false);
        setNewSessionData({ nome: '', numero: '', empresaId: '' });
        await carregarDados();
      } else {
        alert('Erro ao criar sessão');
      }
    } catch (error) {
      console.error('Erro ao criar sessão:', error);
      alert('Erro ao criar sessão');
    }
  };

  const criarTemplate = async () => {
    try {
      const response = await fetch('http://192.168.77.3:5000/api/whatsapp/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newTemplateData,
          empresaId: '98f2fed8-b7fb-44ab-ac53-7a51f1c9e6ff'
        })
      });

      if (response.ok) {
        setShowNewTemplate(false);
        setNewTemplateData({ titulo: '', evento: '', corpo: '', empresaId: '' });
        await carregarDados();
      } else {
        alert('Erro ao criar template');
      }
    } catch (error) {
      console.error('Erro ao criar template:', error);
      alert('Erro ao criar template');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'conectado': return 'bg-green-100 text-green-800';
      case 'desconectado': return 'bg-gray-100 text-gray-800';
      case 'erro': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'conectado': return <Wifi className="w-4 h-4" />;
      case 'desconectado': return <WifiOff className="w-4 h-4" />;
      case 'erro': return <XCircle className="w-4 h-4" />;
      default: return <WifiOff className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard WhatsApp</h1>
        <div className="flex gap-2">
          <a href="/whatsapp/conversation">
            <Button className="bg-green-600 hover:bg-green-700">
              <MessageCircle className="w-4 h-4 mr-2" />
              Conversação
            </Button>
          </a>
          <a href="/whatsapp/templates">
            <Button variant="outline">
              <MessageSquare className="w-4 h-4 mr-2" />
              Templates
            </Button>
          </a>
          <Button onClick={carregarDados} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* QR Code Modal */}
      <Dialog open={!!qrCodeModal} onOpenChange={() => setQrCodeModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Conectar WhatsApp
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <Smartphone className="h-4 w-4" />
              <AlertDescription>
                1. Abra o WhatsApp no seu celular<br/>
                2. Toque em <strong>Menu</strong> ou <strong>Configurações</strong><br/>
                3. Toque em <strong>WhatsApp Web</strong><br/>
                4. Aponte seu celular para esta tela para capturar o código
              </AlertDescription>
            </Alert>
            {qrCodeModal && (
              <div className="flex justify-center">
                <img 
                  src={qrCodeModal} 
                  alt="QR Code WhatsApp" 
                  className="border-2 border-gray-300 rounded-lg"
                />
              </div>
            )}
            <div className="text-center text-sm text-gray-600">
              Aguarde a conexão ser estabelecida...
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="sessoes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sessoes">Sessões</TabsTrigger>
          <TabsTrigger value="mensagens">Enviar Mensagem</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="sessoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Sessões WhatsApp
                </span>
                <div className="flex gap-2">
                  <Button 
                    onClick={deletarTodasSessoes} 
                    variant="destructive" 
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Deletar Todas
                  </Button>
                  <Button onClick={() => setShowNewSession(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Sessão
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessoes.map((sessao) => (
                  <div key={sessao.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(sessao.status)}
                        <Badge className={getStatusColor(sessao.status)}>
                          {sessao.status}
                        </Badge>
                      </div>
                      <div>
                        <h3 className="font-semibold">{sessao.nome}</h3>
                        {sessao.numero ? (
                          <p className="text-sm text-gray-600">{sessao.numero}</p>
                        ) : (
                          <p className="text-sm text-gray-400">Número não informado</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {sessao.status === 'desconectado' && (
                        <Button 
                          onClick={() => conectarSessao(sessao.id)}
                          disabled={connectingSession === sessao.id}
                          size="sm"
                        >
                          {connectingSession === sessao.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <QrCode className="w-4 h-4" />
                          )}
                          Conectar
                        </Button>
                      )}
                      {sessao.status === 'conectado' && (
                        <Button 
                          onClick={() => desconectarSessao(sessao.id)}
                          variant="outline"
                          size="sm"
                        >
                          <WifiOff className="w-4 h-4" />
                          Desconectar
                        </Button>
                      )}
                      <Button 
                        onClick={() => deletarSessao(sessao.id)}
                        variant="outline"
                        size="sm"
                        color="red"
                      >
                        <Trash2 className="w-4 h-4" />
                        Deletar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mensagens" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Enviar Mensagem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sessao">Sessão WhatsApp</Label>
                  <Select value={selectedSession} onValueChange={setSelectedSession}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma sessão" />
                    </SelectTrigger>
                    <SelectContent>
                      {sessoes.map((sessao) => (
                        <SelectItem key={sessao.id} value={sessao.id}>
                          {sessao.nome} ({sessao.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone (com código do país)</Label>
                  <Input
                    id="telefone"
                    placeholder="5511999999999"
                    value={telefoneDestino}
                    onChange={(e) => setTelefoneDestino(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="mensagem">Mensagem</Label>
                <Textarea
                  id="mensagem"
                  placeholder="Digite sua mensagem..."
                  value={novaMensagem}
                  onChange={(e) => setNovaMensagem(e.target.value)}
                  rows={4}
                />
              </div>

              <Button onClick={enviarMensagem} className="w-full">
                <Send className="w-4 h-4 mr-2" />
                Enviar Mensagem
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Templates de Mensagem
                </span>
                <Button onClick={() => setShowNewTemplate(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Template
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templates.map((template) => (
                  <div key={template.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{template.titulo}</h3>
                      <Badge variant={template.ativo ? "default" : "secondary"}>
                        {template.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Evento: {template.evento}</p>
                    <p className="text-sm mb-3">{template.corpo}</p>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => enviarMensagemTemplate(template)}
                        disabled={!selectedSession}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Teste
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estatisticas" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Mensagens</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estatisticas.totalMensagens}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Enviadas</CardTitle>
                <Send className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{estatisticas.mensagensEnviadas}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recebidas</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{estatisticas.mensagensRecebidas}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa Entrega</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{estatisticas.taxaEntrega}%</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal Nova Sessão */}
      <Dialog open={showNewSession} onOpenChange={setShowNewSession}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Sessão WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome da Sessão</Label>
              <Input
                id="nome"
                value={newSessionData.nome}
                onChange={(e) => setNewSessionData({...newSessionData, nome: e.target.value})}
                placeholder="Ex: RH Principal, Marketing, etc."
              />
            </div>
            <div>
              <Label htmlFor="numero">Número do WhatsApp (opcional)</Label>
              <Input
                id="numero"
                value={newSessionData.numero}
                onChange={(e) => setNewSessionData({...newSessionData, numero: e.target.value})}
                placeholder="+55 11 99999-9999 (para referência)"
              />
              <p className="text-sm text-gray-500 mt-1">
                Este campo é opcional e serve apenas para referência. O número real será o do WhatsApp conectado.
              </p>
            </div>
            <Button onClick={criarSessao} className="w-full" disabled={!newSessionData.nome.trim()}>
              Criar Sessão
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Novo Template */}
      <Dialog open={showNewTemplate} onOpenChange={setShowNewTemplate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Template de Mensagem</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                value={newTemplateData.titulo}
                onChange={(e) => setNewTemplateData({...newTemplateData, titulo: e.target.value})}
                placeholder="Ex: Triagem Aprovada"
              />
            </div>
            <div>
              <Label htmlFor="evento">Evento</Label>
              <Input
                id="evento"
                value={newTemplateData.evento}
                onChange={(e) => setNewTemplateData({...newTemplateData, evento: e.target.value})}
                placeholder="Ex: triagem_aprovada"
              />
            </div>
            <div>
              <Label htmlFor="corpo">Corpo da Mensagem</Label>
              <Textarea
                id="corpo"
                value={newTemplateData.corpo}
                onChange={(e) => setNewTemplateData({...newTemplateData, corpo: e.target.value})}
                placeholder="Olá {{nome}}! Sua candidatura para a vaga {{vaga}} foi aprovada..."
                rows={4}
              />
            </div>
            <Button onClick={criarTemplate} className="w-full">
              Criar Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}