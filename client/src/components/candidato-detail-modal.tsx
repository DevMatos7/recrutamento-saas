import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Mail, Phone, MapPin, DollarSign, Briefcase, GraduationCap, Languages, Award, Shield, CheckCircle, XCircle, Clock, Brain } from "lucide-react";

interface CandidatoDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidatoId: string | null;
}

export function CandidatoDetailModal({ isOpen, onClose, candidatoId }: CandidatoDetailModalProps) {
  const { data: candidato, isLoading } = useQuery({
    queryKey: ['/api/candidatos', candidatoId],
    enabled: !!candidatoId && isOpen,
  });

  // Query para buscar dados DISC do candidato
  const { data: resultadoDisc } = useQuery({
    queryKey: ['/api/avaliacoes/disc/candidato', candidatoId],
    enabled: !!candidatoId && isOpen,
    staleTime: 0,
  });

  if (!isOpen || !candidatoId) return null;

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Carregando dados do candidato...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!candidato) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center p-8">
            <p>Candidato não encontrado.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const renderStatusEtico = () => {
    switch ((candidato as any)?.statusEtico) {
      case "aprovado":
        return (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <Badge variant="default" className="bg-green-100 text-green-800">
              Aprovado
            </Badge>
          </div>
        );
      case "reprovado":
        return (
          <div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <Badge variant="destructive">
                Reprovado
              </Badge>
            </div>
            {(candidato as any)?.motivoReprovacaoEtica && (
              <p className="text-sm text-gray-600 mt-1">{(candidato as any)?.motivoReprovacaoEtica}</p>
            )}
          </div>
        );
      default:
        return (
          <div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <Badge variant="outline" className="border-yellow-200 text-yellow-800">
                Pendente
              </Badge>
            </div>
            {(candidato as any)?.motivoReprovacaoEtica && (
              <p className="text-sm text-gray-600 mt-1">{(candidato as any)?.motivoReprovacaoEtica}</p>
            )}
          </div>
        );
    }
  };

  const renderResultadoDisc = () => {
    console.log("Debug - resultadoDisc no modal:", resultadoDisc);
    
    if (!resultadoDisc || (Array.isArray(resultadoDisc) && resultadoDisc.length === 0)) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Resultado DISC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">
              Teste não realizado
            </Badge>
          </CardContent>
        </Card>
      );
    }

    // Se resultadoDisc é um array, procurar por avaliação finalizada
    let avaliacaoFinalizada;
    if (Array.isArray(resultadoDisc)) {
      avaliacaoFinalizada = resultadoDisc.find((av: any) => av.status === "finalizada");
    } else {
      // Se resultadoDisc é um objeto direto
      avaliacaoFinalizada = resultadoDisc.status === "finalizada" ? resultadoDisc : null;
    }
    
    console.log("Debug - avaliacaoFinalizada:", avaliacaoFinalizada);
    
    if (!avaliacaoFinalizada) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Resultado DISC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">
              {Array.isArray(resultadoDisc) && resultadoDisc.length > 0 ? "Teste em andamento" : "Teste não realizado"}
            </Badge>
          </CardContent>
        </Card>
      );
    }

    const tiposMapeamento = {
      "dominante": "Dominante",
      "influente": "Influente", 
      "estavel": "Estável",
      "cauteloso": "Cauteloso"
    };

    const profileName = tiposMapeamento[avaliacaoFinalizada.perfilPrincipal as keyof typeof tiposMapeamento] || avaliacaoFinalizada.perfilPrincipal;
    
    // Descrições dos perfis DISC
    const descricoesPerfis = {
      "dominante": "Pessoa assertiva, direta e focada em resultados. Gosta de desafios e tomar decisões rápidas.",
      "influente": "Pessoa comunicativa, otimista e sociável. Gosta de trabalhar com pessoas e influenciar positivamente.",
      "estavel": "Pessoa calma, paciente e confiável. Valoriza estabilidade e trabalho em equipe.",
      "cauteloso": "Pessoa analítica, precisa e organizada. Valoriza qualidade e atenção aos detalhes."
    };

    const descricaoPerfil = descricoesPerfis[avaliacaoFinalizada.perfilPrincipal as keyof typeof descricoesPerfis] || "";

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Avaliação DISC Concluída
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Suas Pontuações */}
            <div>
              <h4 className="font-medium text-base mb-4">Suas Pontuações</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">D</span>
                    <span className="text-sm">{avaliacaoFinalizada.pontuacaoD} pontos</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(avaliacaoFinalizada.pontuacaoD / 100) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">I</span>
                    <span className="text-sm">{avaliacaoFinalizada.pontuacaoI} pontos</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(avaliacaoFinalizada.pontuacaoI / 100) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">S</span>
                    <span className="text-sm">{avaliacaoFinalizada.pontuacaoS} pontos</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(avaliacaoFinalizada.pontuacaoS / 100) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">C</span>
                    <span className="text-sm">{avaliacaoFinalizada.pontuacaoC} pontos</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(avaliacaoFinalizada.pontuacaoC / 100) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Perfil Principal */}
            <div>
              <h4 className="font-medium text-base mb-4">Perfil {profileName}: {avaliacaoFinalizada.perfilPrincipal.toUpperCase()}</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {descricaoPerfil}
              </p>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 text-center border-t pt-4">
            Teste realizado em: {new Date(avaliacaoFinalizada.dataFinalizacao).toLocaleDateString('pt-BR')}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {(candidato as any)?.nome}
          </DialogTitle>
          <DialogDescription>
            Informações completas do candidato
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            
            {/* Informações Pessoais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{(candidato as any)?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{(candidato as any)?.telefone}</span>
                </div>
                {(candidato as any)?.localizacao && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{(candidato as any)?.localizacao}</span>
                  </div>
                )}
                {(candidato as any)?.pretensaoSalarial && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{(candidato as any)?.pretensaoSalarial}</span>
                  </div>
                )}
                {(candidato as any)?.cpf && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">CPF:</span>
                    <span className="text-sm">{(candidato as any)?.cpf}</span>
                  </div>
                )}
                {(candidato as any)?.endereco && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Endereço</h4>
                    <p className="text-sm text-gray-600">{(candidato as any)?.endereco}</p>
                  </div>
                )}
                {(candidato as any)?.resumoProfissional && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Resumo Profissional</h4>
                    <p className="text-sm text-gray-600">{(candidato as any)?.resumoProfissional}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Ético Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Status Ético
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderStatusEtico()}
              </CardContent>
            </Card>

            {/* Resultado DISC */}
            {renderResultadoDisc()}

            {/* Experiência Profissional */}
            {(candidato as any)?.experienciaProfissional && (candidato as any)?.experienciaProfissional.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Experiência Profissional
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(candidato as any)?.experienciaProfissional.map((exp: any, index: number) => (
                    <div key={index} className="border-l-2 border-blue-200 pl-4">
                      <h4 className="font-medium text-sm">{exp.cargo}</h4>
                      <p className="text-sm text-gray-600">{exp.empresa}</p>
                      <p className="text-xs text-gray-500">{exp.periodo}</p>
                      {exp.descricao && (
                        <p className="text-sm text-gray-600 mt-1">{exp.descricao}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Educação */}
            {(candidato as any)?.educacao && (candidato as any)?.educacao.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Educação
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(candidato as any)?.educacao.map((edu: any, index: number) => (
                    <div key={index}>
                      <h4 className="font-medium text-sm">{edu.curso}</h4>
                      <p className="text-sm text-gray-600">{edu.instituicao}</p>
                      <p className="text-xs text-gray-500">{edu.periodo}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Habilidades */}
            {(candidato as any)?.habilidades && (candidato as any)?.habilidades.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Habilidades</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(candidato as any)?.habilidades.map((habilidade: string, index: number) => (
                      <Badge key={index} variant="secondary">{habilidade}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Idiomas */}
            {(candidato as any)?.idiomas && (candidato as any)?.idiomas.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Languages className="h-5 w-5" />
                    Idiomas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(candidato as any)?.idiomas.map((idioma: any, index: number) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-sm">{idioma.idioma}</span>
                        <Badge variant="outline">{idioma.nivel}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Certificações */}
            {(candidato as any)?.certificacoes && (candidato as any)?.certificacoes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Certificações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(candidato as any)?.certificacoes.map((cert: any, index: number) => (
                    <div key={index}>
                      <h4 className="font-medium text-sm">{cert.nome}</h4>
                      <p className="text-sm text-gray-600">{cert.instituicao}</p>
                      <p className="text-xs text-gray-500">{cert.dataObtencao}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}