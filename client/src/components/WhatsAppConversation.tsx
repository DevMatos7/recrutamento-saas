import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import {
  MessageSquare,
  Send,
  Phone,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  Paperclip,
  Smile,
  MoreVertical,
  Search,
  Filter
} from 'lucide-react';

interface Mensagem {
  id: string;
  candidatoId: string;
  telefone: string;
  tipo: 'enviada' | 'recebida';
  mensagem: string;
  status: string;
  dataEnvio: string;
  dataRecebimento?: string;
}

interface Candidato {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  status: string;
}

interface Conversa {
  telefone: string;
  candidatoId: string | null;
  nome: string;
  email: string | null;
  ultimaMensagem: string;
  ultimaData: string;
  tipo: string;
  totalMensagens: number;
  isCandidato: boolean;
}

interface WhatsAppSession {
  id: string;
  nome: string;
  numero: string;
  status: 'conectado' | 'desconectado' | 'erro';
  qrCode?: string;
}

interface WebSocketMessage {
  type: string;
  data: any;
}

export default function WhatsAppConversation() {
  const { user } = useAuth();
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [sessions, setSessions] = useState<WhatsAppSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [selectedCandidato, setSelectedCandidato] = useState<string>('');
  const [selectedTelefone, setSelectedTelefone] = useState<string>('');
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showQRCode, setShowQRCode] = useState<string | null>(null);
  const [connectingSession, setConnectingSession] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Refs para estado síncrono
  const selectedCandidatoRef = useRef<string>('');
  const selectedTelefoneRef = useRef<string>('');

  // Conectar WebSocket
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//192.168.77.3:5000`;
    
    const websocket = new WebSocket(wsUrl);
    
    websocket.onopen = () => {
      console.log('🔌 WebSocket conectado');
      setConnected(true);
    };
    
    websocket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (error) {
        console.error('Erro ao processar mensagem WebSocket:', error);
      }
    };
    
    websocket.onclose = () => {
      console.log('🔌 WebSocket desconectado');
      setConnected(false);
    };
    
    websocket.onerror = (error) => {
      console.error('Erro no WebSocket:', error);
      setConnected(false);
    };
    
    setWs(websocket);
    
    return () => {
      websocket.close();
    };
  }, []);

  // Carregar dados iniciais
  useEffect(() => {
    if (user) {
      carregarDados();
    }
  }, [user]);

  // Scroll para última mensagem
  useEffect(() => {
    scrollToBottom();
  }, [mensagens]);

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'connection_established':
        console.log('Conexão WebSocket estabelecida:', message.data.clientId);
        break;
      
      case 'session_status':
        setSessionStatus(message.data);
        break;
      
      case 'qr_code':
        setShowQRCode(message.data.qrCode);
        break;
      
      case 'new_message':
        console.log('📨 Nova mensagem recebida via WebSocket:', message.data);
        console.log('🔍 Estado atual (refs):', { 
          selectedCandidato: selectedCandidatoRef.current, 
          selectedTelefone: selectedTelefoneRef.current 
        });
        console.log('🔍 Comparação detalhada:', {
          'message.data.candidatoId': message.data.candidatoId,
          'selectedCandidato': selectedCandidatoRef.current,
          'message.data.telefone': message.data.telefone,
          'selectedTelefone': selectedTelefoneRef.current,
          'candidatoId_match': message.data.candidatoId === selectedCandidatoRef.current,
          'telefone_match': message.data.telefone === selectedTelefoneRef.current,
          'candidatoId_type': typeof message.data.candidatoId,
          'selectedCandidato_type': typeof selectedCandidatoRef.current,
          'telefone_type': typeof message.data.telefone,
          'selectedTelefone_type': typeof selectedTelefoneRef.current
        });
        
        // Verificar se a mensagem é para o candidato ou telefone selecionado (usando refs)
        const isForSelectedConversation = 
          (message.data.candidatoId === selectedCandidatoRef.current) || 
          (message.data.telefone === selectedTelefoneRef.current);
        
        console.log('✅ É para conversa selecionada?', isForSelectedConversation);
        
        if (isForSelectedConversation) {
          console.log('📝 Adicionando mensagem ao histórico...');
          // Adicionar nova mensagem ao histórico
          const novaMensagem: Mensagem = {
            id: Date.now().toString(),
            candidatoId: message.data.candidatoId || '',
            telefone: message.data.telefone || '',
            tipo: 'recebida',
            mensagem: message.data.mensagem,
            status: 'recebido',
            dataEnvio: message.data.timestamp
          };
          setMensagens(prev => [...prev, novaMensagem]);
        } else {
          console.log('❌ Mensagem não é para conversa selecionada');
          console.log('💡 Dica: Verifique se o telefone selecionado corresponde ao da mensagem');
        }
        
        // Atualizar lista de conversas
        setTimeout(() => {
          atualizarListaConversas();
        }, 100);
        break;
      
      case 'message_sent':
        console.log('📤 Mensagem enviada via WebSocket:', message.data);
        if (message.data.success) {
          // Atualizar status da mensagem enviada
          setMensagens(prev => prev.map(msg => 
            msg.id === message.data.mensagemId 
              ? { ...msg, status: 'enviado' }
              : msg
          ));
        }
        break;
      
      case 'message_status_update':
        console.log('📊 Atualização de status:', message.data);
        // Atualizar status da mensagem (entregue, lido, etc.)
        setMensagens(prev => prev.map(msg => 
          msg.id === message.data.mensagemId 
            ? { ...msg, status: message.data.status }
            : msg
        ));
        break;
      
      case 'candidato_historico':
        if (message.data.candidatoId === selectedCandidato) {
          setMensagens(message.data.historico);
        }
        break;
      
      default:
        console.log('Mensagem WebSocket não tratada:', message.type);
    }
  };

  const atualizarListaConversas = async () => {
    try {
      console.log('🔄 Atualizando lista de conversas...');
      const conversasResponse = await fetch('/api/whatsapp/conversas', {
        credentials: 'include'
      });
      const conversasData = await conversasResponse.json();
      setConversas(conversasData);
    } catch (error) {
      console.error('Erro ao atualizar conversas:', error);
    }
  };

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Carregar sessões
      const sessoesResponse = await fetch('/api/whatsapp/sessoes', {
        credentials: 'include'
      });
      const sessoesData = await sessoesResponse.json();
      setSessions(sessoesData);
      
      if (sessoesData.length > 0) {
        setSelectedSession(sessoesData[0].id);
      }
      
      // Carregar candidatos
      const candidatosResponse = await fetch('/api/candidatos?page=1&limit=50', {
        credentials: 'include'
      });
      const candidatosData = await candidatosResponse.json();
      setCandidatos(candidatosData);
      
      // Carregar conversas
      console.log('🔄 Carregando conversas...');
      const conversasResponse = await fetch('/api/whatsapp/conversas', {
        credentials: 'include'
      });
      console.log('📡 Resposta da API conversas:', conversasResponse.status);
      const conversasData = await conversasResponse.json();
      console.log('📊 Dados das conversas:', conversasData);
      setConversas(conversasData);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const conectarSessao = async (sessionId: string) => {
    if (!ws || !connected) return;
    
    setConnectingSession(sessionId);
    
    try {
      // Enviar comando para conectar sessão
      ws.send(JSON.stringify({
        type: 'subscribe_session',
        data: {
          sessionId,
          empresaId: 'empresa-padrao', // TODO: pegar da sessão atual
          userId: 'user-padrao' // TODO: pegar do usuário logado
        }
      }));
      
      // Solicitar QR Code se necessário
      ws.send(JSON.stringify({
        type: 'get_qr_code',
        data: { sessionId }
      }));
      
      setSelectedSession(sessionId);
      
    } catch (error) {
      console.error('Erro ao conectar sessão:', error);
    } finally {
      setConnectingSession(null);
    }
  };

  const selecionarConversa = async (telefone: string, candidatoId?: string) => {
    if (!ws || !connected) return;
    
    console.log('🎯 Selecionando conversa:', { telefone, candidatoId });
    
    // Atualizar estado e refs simultaneamente
    setSelectedTelefone(telefone);
    setSelectedCandidato(candidatoId || '');
    selectedTelefoneRef.current = telefone;
    selectedCandidatoRef.current = candidatoId || '';
    
    console.log('📋 Estado após seleção:', { selectedTelefone: telefone, selectedCandidato: candidatoId || '' });
    
    // Carregar histórico de mensagens
    try {
      let response;
      if (candidatoId) {
        response = await fetch(`/api/whatsapp/mensagens/${candidatoId}`, {
          credentials: 'include'
        });
      } else {
        response = await fetch(`/api/whatsapp/mensagens/telefone/${telefone}`, {
          credentials: 'include'
        });
      }
      const historico = await response.json();
      setMensagens(historico);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      setMensagens([]);
    }
    
    // Inscrever para receber mensagens
    ws.send(JSON.stringify({
      type: 'subscribe_candidato',
      data: { candidatoId: candidatoId || telefone }
    }));
  };

  const enviarMensagem = async () => {
    if (!novaMensagem.trim() || !selectedSession || (!selectedCandidato && !selectedTelefone)) {
      console.log('❌ Validação falhou:', { novaMensagem: novaMensagem.trim(), selectedSession, selectedCandidato, selectedTelefone });
      return;
    }
    
    console.log('📤 Enviando mensagem:', { selectedCandidato, selectedTelefone, novaMensagem });
    
    const mensagemTemp: Mensagem = {
      id: Date.now().toString(),
      candidatoId: selectedCandidato,
      telefone: '',
      tipo: 'enviada',
      mensagem: novaMensagem,
      status: 'enviando',
      dataEnvio: new Date().toISOString()
    };
    
    // Adicionar mensagem temporária
    setMensagens(prev => [...prev, mensagemTemp]);
    
    try {
      const requestBody = {
        sessaoId: selectedSession,
        candidatoId: selectedCandidato || null,
        telefone: selectedTelefone || null,
        mensagem: novaMensagem
      };
      
      console.log('📡 Enviando requisição:', requestBody);
      
      // Enviar via API
      const response = await fetch('/api/whatsapp/mensagens/enviar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });
      
      const resultado = await response.json();
      
      if (resultado.success) {
        // Atualizar status da mensagem
        setMensagens(prev => prev.map(msg => 
          msg.id === mensagemTemp.id 
            ? { ...msg, status: 'enviado', id: resultado.mensagemId || msg.id }
            : msg
        ));
      } else {
        // Marcar como erro
        setMensagens(prev => prev.map(msg => 
          msg.id === mensagemTemp.id 
            ? { ...msg, status: 'erro' }
            : msg
        ));
        console.error('Erro ao enviar mensagem:', resultado.error);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      // Marcar como erro
      setMensagens(prev => prev.map(msg => 
        msg.id === mensagemTemp.id 
          ? { ...msg, status: 'erro' }
          : msg
      ));
    }
    
    setNovaMensagem('');
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'enviado':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'entregue':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'lido':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'erro':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'enviando':
        return <RefreshCw className="w-4 h-4 text-gray-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const candidatosFiltrados = candidatos.filter(candidato => {
    const matchSearch = candidato.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       candidato.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       candidato.telefone.includes(searchTerm);
    
    const matchStatus = filterStatus === 'all' || candidato.status === filterStatus;
    
    return matchSearch && matchStatus;
  });

  const candidatoSelecionado = candidatos.find(c => c.id === selectedCandidato);
  const conversaSelecionada = conversas.find(c => c.telefone === selectedTelefone);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <Alert>
          <AlertDescription>
            Você precisa estar logado para acessar a conversação WhatsApp.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="ml-2">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      {/* Sidebar com sessões e candidatos */}
      <div className="w-80 border-r bg-gray-50 flex flex-col">
        {/* Sessões WhatsApp */}
        <div className="p-4 border-b">
          <h3 className="font-semibold mb-3">Sessões WhatsApp</h3>
          <div className="space-y-2">
            {sessions.map(session => (
              <div
                key={session.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedSession === session.id
                    ? 'bg-blue-100 border-blue-300'
                    : 'bg-white hover:bg-gray-100'
                }`}
                onClick={() => conectarSessao(session.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {session.status === 'conectado' ? (
                      <Wifi className="w-4 h-4 text-green-500" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-red-500" />
                    )}
                    <span className="font-medium">{session.nome}</span>
                  </div>
                  {connectingSession === session.id && (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  )}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {session.numero}
                </div>
                <Badge variant={session.status === 'conectado' ? 'default' : 'secondary'}>
                  {session.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Lista de conversas */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center space-x-2 mb-3">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar conversas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="candidatos">Candidatos</SelectItem>
                <SelectItem value="nao-candidatos">Não cadastrados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {conversas
                .filter(conversa => {
                  const matchesSearch = 
                    conversa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    conversa.telefone.includes(searchTerm);
                  
                  if (filterStatus === 'all') return matchesSearch;
                  if (filterStatus === 'candidatos') return matchesSearch && conversa.isCandidato;
                  if (filterStatus === 'nao-candidatos') return matchesSearch && !conversa.isCandidato;
                  
                  return matchesSearch;
                })
                .map(conversa => (
                  <div
                    key={conversa.telefone}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedTelefone === conversa.telefone
                        ? 'bg-blue-100 border-blue-300'
                        : 'bg-white hover:bg-gray-100'
                    }`}
                    onClick={() => selecionarConversa(conversa.telefone, conversa.candidatoId || undefined)}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src="" />
                        <AvatarFallback>
                          {conversa.nome.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <div className="font-medium truncate">{conversa.nome}</div>
                          {!conversa.isCandidato && (
                            <Badge variant="outline" className="text-xs">
                              Não cadastrado
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 truncate">{conversa.ultimaMensagem}</div>
                        <div className="text-xs text-gray-400">{conversa.telefone}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(conversa.ultimaData).toLocaleString('pt-BR')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`w-2 h-2 rounded-full ${
                          conversa.tipo === 'recebida' ? 'bg-green-500' : 'bg-blue-500'
                        }`} />
                        <div className="text-xs text-gray-500 mt-1">
                          {conversa.totalMensagens} msg
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Área de conversação */}
      <div className="flex-1 flex flex-col">
        {selectedTelefone ? (
          <>
            {/* Header da conversa */}
            <div className="p-4 border-b bg-white">
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src="" />
                  <AvatarFallback>
                    {selectedTelefone.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-semibold">
                    {conversaSelecionada?.nome || `Não cadastrado (${selectedTelefone})`}
                  </div>
                  <div className="text-sm text-gray-500">{selectedTelefone}</div>
                  {selectedCandidato && candidatoSelecionado?.email && (
                    <div className="text-sm text-gray-400">{candidatoSelecionado.email}</div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {connected ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <Wifi className="w-3 h-3 mr-1" />
                      Conectado
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <WifiOff className="w-3 h-3 mr-1" />
                      Desconectado
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Mensagens */}
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {mensagens.map(mensagem => (
                  <div
                    key={mensagem.id}
                    className={`flex ${mensagem.tipo === 'enviada' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        mensagem.tipo === 'enviada'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="text-sm">{mensagem.mensagem}</div>
                      <div className={`flex items-center justify-between mt-1 text-xs ${
                        mensagem.tipo === 'enviada' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        <span>{formatarData(mensagem.dataEnvio)}</span>
                        {mensagem.tipo === 'enviada' && (
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(mensagem.status)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input de mensagem */}
            <div className="p-4 border-t bg-white">
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <Textarea
                    placeholder="Digite sua mensagem..."
                    value={novaMensagem}
                    onChange={(e) => setNovaMensagem(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        enviarMensagem();
                      }
                    }}
                    className="min-h-[60px] max-h-[120px] resize-none"
                    disabled={!connected}
                  />
                </div>
                <Button
                  onClick={enviarMensagem}
                  disabled={!novaMensagem.trim() || !connected}
                  className="px-4"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Selecione uma conversa</h3>
              <p>Escolha uma conversa da lista para iniciar o chat</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal QR Code */}
      <Dialog open={!!showQRCode} onOpenChange={() => setShowQRCode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conectar WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="text-center">
            <p className="mb-4">Escaneie o QR Code com seu WhatsApp</p>
            {showQRCode && (
              <img
                src={`data:image/png;base64,${showQRCode}`}
                alt="QR Code WhatsApp"
                className="mx-auto"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 