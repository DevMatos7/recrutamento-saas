import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Eye, Edit, Trash2, MoreHorizontal, Mail, Phone, 
  LinkedinIcon, FileText, Shield, ShieldCheck, ShieldX, 
  AlertTriangle, Brain, Users, MapPin, Calendar, Briefcase 
} from 'lucide-react';
import { type Candidato } from '@shared/schema';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CandidatoListProps {
  candidatos: Candidato[];
  isLoading: boolean;
  onViewCandidato: (candidato: Candidato) => void;
  onEditCandidato: (candidato: Candidato) => void;
  onDeleteCandidato: (id: string) => void;
  onUpdateStatusEtico: (id: string, status: string, motivo?: string) => void;
  canManageCandidatos: boolean;
  resultadosDisc?: Record<string, any>;
}

export function CandidatoList({
  candidatos,
  isLoading,
  onViewCandidato,
  onEditCandidato,
  onDeleteCandidato,
  onUpdateStatusEtico,
  canManageCandidatos,
  resultadosDisc
}: CandidatoListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ativo": return "bg-green-100 text-green-800";
      case "inativo": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getOrigemColor = (origem: string) => {
    switch (origem) {
      case "manual": return "bg-blue-100 text-blue-800";
      case "portal_candidato": return "bg-purple-100 text-purple-800";
      case "importado": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const renderStatusEtico = (statusEtico: string, motivo: string) => {
    switch (statusEtico) {
      case "aprovado":
        return (
          <div className="flex items-center gap-1">
            <ShieldCheck className="h-4 w-4 text-green-500" />
            <Badge variant="default" className="bg-green-100 text-green-800">
              Aprovado
            </Badge>
          </div>
        );
      case "reprovado":
        return (
          <div className="flex items-center gap-1">
            <ShieldX className="h-4 w-4 text-red-500" />
            <Badge variant="destructive" title={motivo || "Reprovado por questões éticas"}>
              Reprovado
            </Badge>
          </div>
        );
      case "pendente":
        return (
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              Pendente
            </Badge>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1">
            <Shield className="h-4 w-4 text-gray-500" />
            <Badge variant="outline">
              Não avaliado
            </Badge>
          </div>
        );
    }
  };

  const renderStatusDisc = (candidatoId: string) => {
    if (!resultadosDisc || typeof resultadosDisc !== 'object') {
      return (
        <div className="flex items-center gap-1">
          <Brain className="h-4 w-4 text-gray-500" />
          <Badge variant="outline">
            Não realizado
          </Badge>
        </div>
      );
    }
    
    const resultado = resultadosDisc[candidatoId];
    
    if (!resultado) {
      return (
        <div className="flex items-center gap-1">
          <Brain className="h-4 w-4 text-gray-500" />
          <Badge variant="outline">
            Não realizado
          </Badge>
        </div>
      );
    }

    const perfil = resultado.perfilDominante;
    
    if (perfil) {
      const getPerfilInfo = (perfil: string) => {
        switch (perfil) {
          case "D": return { nome: "Dominante", color: "bg-red-100 text-red-800" };
          case "I": return { nome: "Influente", color: "bg-blue-100 text-blue-800" };
          case "S": return { nome: "Estável", color: "bg-green-100 text-green-800" };
          case "C": return { nome: "Cauteloso", color: "bg-purple-100 text-purple-800" };
          default: return { nome: perfil, color: "bg-gray-100 text-gray-800" };
        }
      };
      
      const perfilInfo = getPerfilInfo(perfil);
      
      return (
        <div className="flex items-center gap-1">
          <Brain className="h-4 w-4 text-blue-500" />
          <Badge className={perfilInfo.color}>
            {perfilInfo.nome}
          </Badge>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1">
        <Brain className="h-4 w-4 text-gray-500" />
        <Badge variant="outline">
          Não realizado
        </Badge>
      </div>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Status Ético</TableHead>
                <TableHead>Perfil DISC</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  if (candidatos.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Nenhum candidato encontrado
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Não há candidatos que correspondam aos filtros aplicados.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidato</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Status Ético</TableHead>
              <TableHead>Perfil DISC</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidatos.map((candidato) => (
              <TableRow key={candidato.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {getInitials(candidato.nome)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {candidato.nome}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {candidato.email}
                      </div>
                      {candidato.cargo && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {candidato.cargo}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <Badge className={getStatusColor(candidato.status)}>
                    {candidato.status === 'ativo' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  {renderStatusEtico(candidato.statusEtico || 'pendente', candidato.motivoReprovacaoEtica || '')}
                </TableCell>
                
                <TableCell>
                  {renderStatusDisc(candidato.id)}
                </TableCell>
                
                <TableCell>
                  <Badge className={getOrigemColor(candidato.origem)}>
                    {candidato.origem === 'portal_candidato' ? 'Portal' : 
                     candidato.origem === 'manual' ? 'Manual' : 'Importado'}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {format(new Date(candidato.dataCriacao), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewCandidato(candidato)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {canManageCandidatos && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEditCandidato(candidato)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          
                          {candidato.linkedin && (
                            <DropdownMenuItem asChild>
                              <a href={candidato.linkedin} target="_blank" rel="noopener noreferrer">
                                <LinkedinIcon className="h-4 w-4 mr-2" />
                                LinkedIn
                              </a>
                            </DropdownMenuItem>
                          )}
                          
                          {candidato.curriculoUrl && (
                            <DropdownMenuItem asChild>
                              <a href={candidato.curriculoUrl} target="_blank" rel="noopener noreferrer">
                                <FileText className="h-4 w-4 mr-2" />
                                Currículo
                              </a>
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem onClick={() => onUpdateStatusEtico(candidato.id, 'aprovado')}>
                            <ShieldCheck className="h-4 w-4 mr-2" />
                            Aprovar Ético
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem onClick={() => onUpdateStatusEtico(candidato.id, 'reprovado')}>
                            <ShieldX className="h-4 w-4 mr-2" />
                            Reprovar Ético
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem 
                            onClick={() => onDeleteCandidato(candidato.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 