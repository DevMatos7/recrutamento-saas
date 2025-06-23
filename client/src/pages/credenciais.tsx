import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Key,
  Mail,
  MessageSquare,
  Eye,
  EyeOff,
  Save,
  TestTube,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react";

interface CredentialsConfig {
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
  };
  whatsapp: {
    apiUrl: string;
    apiToken: string;
  };
}

export default function CredenciaisPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [activeTab, setActiveTab] = useState("smtp");
  
  const [smtpConfig, setSmtpConfig] = useState({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    user: "",
    pass: ""
  });

  const [whatsappConfig, setWhatsappConfig] = useState({
    apiUrl: "https://api.whatsapp.com",
    apiToken: ""
  });

  // Verificar se é admin
  if (!["admin"].includes(user?.perfil || "")) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Apenas administradores podem acessar as configurações de credenciais.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Buscar configurações atuais
  const { data: currentConfig, isLoading } = useQuery({
    queryKey: ["/api/config/credentials"],
    enabled: user?.perfil === "admin"
  });

  // Salvar configurações SMTP
  const saveSmtpMutation = useMutation({
    mutationFn: (data: typeof smtpConfig) => 
      apiRequest("/api/config/smtp", "POST", data),
    onSuccess: () => {
      toast({
        title: "Configurações SMTP salvas",
        description: "As configurações de email foram atualizadas com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao salvar",
        description: "Falha ao salvar as configurações SMTP.",
        variant: "destructive",
      });
    }
  });

  // Salvar configurações WhatsApp
  const saveWhatsappMutation = useMutation({
    mutationFn: (data: typeof whatsappConfig) => 
      apiRequest("/api/config/whatsapp", "POST", data),
    onSuccess: () => {
      toast({
        title: "Configurações WhatsApp salvas",
        description: "As configurações do WhatsApp foram atualizadas com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao salvar",
        description: "Falha ao salvar as configurações do WhatsApp.",
        variant: "destructive",
      });
    }
  });

  // Testar configurações SMTP
  const testSmtpMutation = useMutation({
    mutationFn: () => apiRequest("/api/config/test-smtp", "POST"),
    onSuccess: () => {
      toast({
        title: "Teste SMTP bem-sucedido",
        description: "As configurações de email estão funcionando corretamente.",
      });
    },
    onError: () => {
      toast({
        title: "Falha no teste SMTP",
        description: "Verifique as configurações e tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Testar configurações WhatsApp
  const testWhatsappMutation = useMutation({
    mutationFn: () => apiRequest("/api/config/test-whatsapp", "POST"),
    onSuccess: () => {
      toast({
        title: "Teste WhatsApp bem-sucedido",
        description: "As configurações do WhatsApp estão funcionando corretamente.",
      });
    },
    onError: () => {
      toast({
        title: "Falha no teste WhatsApp",
        description: "Verifique as configurações e tente novamente.",
        variant: "destructive",
      });
    }
  });

  const handleSaveSmtp = () => {
    saveSmtpMutation.mutate(smtpConfig);
  };

  const handleSaveWhatsapp = () => {
    saveWhatsappMutation.mutate(whatsappConfig);
  };

  const handleTestSmtp = () => {
    testSmtpMutation.mutate();
  };

  const handleTestWhatsapp = () => {
    testWhatsappMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Key className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Configuração de Credenciais</h1>
          <p className="text-muted-foreground">
            Configure as credenciais para SMTP e WhatsApp API
          </p>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> Essas configurações afetam o envio de emails e mensagens WhatsApp em todo o sistema. 
          Certifique-se de testar as configurações antes de salvar.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="smtp" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Configuração SMTP
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            WhatsApp API
          </TabsTrigger>
        </TabsList>

        <TabsContent value="smtp" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Configurações de Email (SMTP)
                <Badge variant="outline">Credenciais Seguras</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-host">Servidor SMTP</Label>
                  <Input
                    id="smtp-host"
                    placeholder="smtp.gmail.com"
                    value={smtpConfig.host}
                    onChange={(e) => setSmtpConfig(prev => ({ ...prev, host: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">Porta</Label>
                  <Input
                    id="smtp-port"
                    type="number"
                    placeholder="587"
                    value={smtpConfig.port}
                    onChange={(e) => setSmtpConfig(prev => ({ ...prev, port: parseInt(e.target.value) || 587 }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtp-user">Email do usuário</Label>
                <Input
                  id="smtp-user"
                  type="email"
                  placeholder="seu.email@gmail.com"
                  value={smtpConfig.user}
                  onChange={(e) => setSmtpConfig(prev => ({ ...prev, user: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtp-pass">Senha / Token de App</Label>
                <div className="relative">
                  <Input
                    id="smtp-pass"
                    type={showPassword ? "text" : "password"}
                    placeholder="Senha ou token de aplicativo"
                    value={smtpConfig.pass}
                    onChange={(e) => setSmtpConfig(prev => ({ ...prev, pass: e.target.value }))}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Para Gmail, use uma senha de aplicativo gerada nas configurações de segurança da conta.
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleSaveSmtp}
                  disabled={saveSmtpMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveSmtpMutation.isPending ? "Salvando..." : "Salvar Configurações"}
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleTestSmtp}
                  disabled={testSmtpMutation.isPending || !smtpConfig.host || !smtpConfig.user}
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  {testSmtpMutation.isPending ? "Testando..." : "Testar Conexão"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Configurações WhatsApp API
                <Badge variant="outline">API Externa</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="whatsapp-url">URL da API</Label>
                <Input
                  id="whatsapp-url"
                  placeholder="https://api.whatsapp.com"
                  value={whatsappConfig.apiUrl}
                  onChange={(e) => setWhatsappConfig(prev => ({ ...prev, apiUrl: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  URL base da API do WhatsApp Business ou provedor de terceiros.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp-token">Token da API</Label>
                <div className="relative">
                  <Input
                    id="whatsapp-token"
                    type={showToken ? "text" : "password"}
                    placeholder="Token de acesso da API"
                    value={whatsappConfig.apiToken}
                    onChange={(e) => setWhatsappConfig(prev => ({ ...prev, apiToken: e.target.value }))}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Token de autenticação fornecido pelo provedor da API WhatsApp.
                </p>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Nota:</strong> Para usar a API oficial do WhatsApp Business, você precisa de uma conta 
                  verificada e aprovação do Meta. Alternativamente, pode usar provedores terceirizados como 
                  Twilio, ChatAPI, ou similares.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleSaveWhatsapp}
                  disabled={saveWhatsappMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveWhatsappMutation.isPending ? "Salvando..." : "Salvar Configurações"}
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleTestWhatsapp}
                  disabled={testWhatsappMutation.isPending || !whatsappConfig.apiUrl || !whatsappConfig.apiToken}
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  {testWhatsappMutation.isPending ? "Testando..." : "Testar Conexão"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Status das Configurações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 p-3 border rounded">
              <Mail className="h-5 w-5" />
              <div>
                <p className="font-medium">Email (SMTP)</p>
                <p className="text-sm text-muted-foreground">
                  {smtpConfig.user ? `Configurado: ${smtpConfig.user}` : "Não configurado"}
                </p>
              </div>
              <Badge variant={smtpConfig.user ? "default" : "secondary"} className="ml-auto">
                {smtpConfig.user ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 p-3 border rounded">
              <MessageSquare className="h-5 w-5" />
              <div>
                <p className="font-medium">WhatsApp API</p>
                <p className="text-sm text-muted-foreground">
                  {whatsappConfig.apiToken ? "Token configurado" : "Não configurado"}
                </p>
              </div>
              <Badge variant={whatsappConfig.apiToken ? "default" : "secondary"} className="ml-auto">
                {whatsappConfig.apiToken ? "Ativo" : "Inativo"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}