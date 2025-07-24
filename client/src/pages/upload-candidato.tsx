import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Download, 
  AlertCircle,
  Send,
  Camera
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ChecklistItem {
  id: string;
  nome: string;
  descricao?: string;
  tipo: string;
  obrigatorio: boolean;
  status: string;
  anexos?: any[];
  observacoes?: string;
}

interface CandidatoInfo {
  nome: string;
  email: string;
  vaga: string;
  empresa: string;
}

export default function UploadCandidatoPage() {
  const { vagaCandidatoId } = useParams();
  const { toast } = useToast();
  const [candidatoInfo, setCandidatoInfo] = useState<CandidatoInfo | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<{ [key: string]: File[] }>({});

  useEffect(() => {
    if (vagaCandidatoId) {
      loadCandidatoInfo();
      loadChecklist();
    }
  }, [vagaCandidatoId]);

  const loadCandidatoInfo = async () => {
    try {
      const response = await fetch(`/api/vaga-candidatos/${vagaCandidatoId}/info`);
      if (response.ok) {
        const data = await response.json();
        setCandidatoInfo(data);
      }
    } catch (error) {
      console.error('Erro ao carregar informações do candidato:', error);
    }
  };

  const loadChecklist = async () => {
    try {
      const response = await fetch(`/api/vaga-candidatos/${vagaCandidatoId}/checklist`);
      if (response.ok) {
        const data = await response.json();
        setChecklistItems(data);
      }
    } catch (error) {
      console.error('Erro ao carregar checklist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (itemId: string, files: FileList | null) => {
    if (files) {
      const fileArray = Array.from(files);
      setSelectedFiles(prev => ({
        ...prev,
        [itemId]: [...(prev[itemId] || []), ...fileArray]
      }));
    }
  };

  const handleFileRemove = (itemId: string, index: number) => {
    setSelectedFiles(prev => ({
      ...prev,
      [itemId]: prev[itemId]?.filter((_, i) => i !== index) || []
    }));
  };

  const handleUpload = async (itemId: string) => {
    if (!selectedFiles[itemId] || selectedFiles[itemId].length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um arquivo",
        variant: "destructive",
      });
      return;
    }

    setUploading(itemId);
    try {
      const formData = new FormData();
      selectedFiles[itemId].forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch(`/api/checklist-items/${itemId}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Documentos enviados com sucesso!",
        });
        setSelectedFiles(prev => ({ ...prev, [itemId]: [] }));
        loadChecklist(); // Recarregar para mostrar os anexos
      } else {
        throw new Error('Erro no upload');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar documentos",
        variant: "destructive",
      });
    } finally {
      setUploading(null);
    }
  };

  const handleCameraCapture = async (itemId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Implementar captura de foto
      toast({
        title: "Funcionalidade",
        description: "Captura por câmera será implementada em breve",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível acessar a câmera",
        variant: "destructive",
      });
    }
  };

  const calcularProgresso = () => {
    const total = checklistItems.length;
    const completados = checklistItems.filter(item => 
      item.status === 'aprovado' || item.status === 'completado'
    ).length;
    return { total, completados, percentual: total > 0 ? (completados / total) * 100 : 0 };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "aprovado":
      case "completado":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "reprovado":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "em_andamento":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "aprovado":
      case "completado":
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
      case "reprovado":
        return <Badge variant="destructive">Reprovado</Badge>;
      case "em_andamento":
        return <Badge className="bg-yellow-100 text-yellow-800">Em Andamento</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando checklist...</p>
        </div>
      </div>
    );
  }

  const progresso = calcularProgresso();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-blue-600">
              📋 Checklist de Documentos
            </CardTitle>
            {candidatoInfo && (
              <div className="mt-4">
                <p className="text-lg font-medium">{candidatoInfo.nome}</p>
                <p className="text-gray-600">{candidatoInfo.vaga} • {candidatoInfo.empresa}</p>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  {progresso.completados} de {progresso.total} documentos enviados
                </span>
                <span className="text-sm font-medium">
                  {Math.round(progresso.percentual)}% completo
                </span>
              </div>
              <Progress value={progresso.percentual} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Lista de documentos */}
        <div className="space-y-6">
          {checklistItems.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-medium">{item.nome}</h3>
                      {item.obrigatorio && (
                        <Badge variant="outline" className="text-xs">Obrigatório</Badge>
                      )}
                    </div>
                    {item.descricao && (
                      <p className="text-gray-600 mb-3">{item.descricao}</p>
                    )}
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      {getStatusBadge(item.status)}
                    </div>
                  </div>
                </div>

                {/* Documentos já enviados */}
                {item.anexos && item.anexos.length > 0 && (
                  <div className="mb-4 p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">✅ Documentos enviados:</h4>
                    <div className="space-y-2">
                      {item.anexos.map((anexo: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-green-600" />
                            <span className="text-sm">{anexo.nome}</span>
                          </div>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload de novos documentos */}
                {item.status !== 'aprovado' && (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                      <div className="text-center">
                        <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 mb-4">
                          Arraste e solte arquivos aqui ou clique para selecionar
                        </p>
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="outline"
                            onClick={() => document.getElementById(`file-${item.id}`)?.click()}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Selecionar Arquivos
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleCameraCapture(item.id)}
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            Tirar Foto
                          </Button>
                        </div>
                        <input
                          id={`file-${item.id}`}
                          type="file"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          className="hidden"
                          onChange={(e) => handleFileSelect(item.id, e.target.files)}
                        />
                      </div>
                    </div>

                    {/* Arquivos selecionados */}
                    {selectedFiles[item.id] && selectedFiles[item.id].length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Arquivos selecionados:</h4>
                        {selectedFiles[item.id].map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span className="text-sm">{file.name}</span>
                              <span className="text-xs text-gray-500">
                                ({(file.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleFileRemove(item.id, idx)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          onClick={() => handleUpload(item.id)}
                          disabled={uploading === item.id}
                          className="w-full"
                        >
                          {uploading === item.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Enviar Documentos
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Observações */}
                {item.observacoes && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">Observação:</p>
                        <p className="text-sm text-yellow-700">{item.observacoes}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <Card className="mt-8">
          <CardContent className="p-6 text-center">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Seus documentos são processados com segurança</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4 text-blue-600" />
                <span>Você receberá notificação quando tudo estiver aprovado</span>
              </div>
              <div className="text-xs text-gray-500">
                Em caso de dúvidas, entre em contato com o recrutador responsável
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 