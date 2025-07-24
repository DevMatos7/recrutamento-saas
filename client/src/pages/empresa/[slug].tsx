import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Globe, Mail, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function EmpresaVagasPage() {
  const [match] = useRoute('/empresa/:slug');
  const slug = match?.slug;
  const [departamento, setDepartamento] = useState('');
  const [cidade, setCidade] = useState('');
  const [tipo, setTipo] = useState('');

  // Buscar dados da empresa pelo slug
  const { data: empresa, isLoading: empresaLoading } = useQuery({
    queryKey: ['/api/empresas', slug],
    queryFn: async () => {
      if (!slug) return null;
      const res = await fetch(`/api/empresas?slug=${slug}`);
      const empresas = await res.json();
      return empresas[0] || null;
    },
    enabled: !!slug
  });

  // Buscar vagas da empresa
  const { data: vagas = [], isLoading: vagasLoading } = useQuery({
    queryKey: ['/api/vagas', empresa?.id, departamento, cidade, tipo],
    queryFn: async () => {
      if (!empresa?.id) return [];
      const params = new URLSearchParams({ empresaId: empresa.id });
      if (departamento) params.append('departamentoId', departamento);
      if (cidade) params.append('cidade', cidade);
      if (tipo) params.append('tipoContratacao', tipo);
      const res = await fetch(`/api/vagas?${params.toString()}`);
      return await res.json();
    },
    enabled: !!empresa?.id
  });

  // Buscar departamentos para filtro
  const { data: departamentos = [] } = useQuery({
    queryKey: ['/api/departamentos', empresa?.id],
    queryFn: async () => {
      if (!empresa?.id) return [];
      const res = await fetch(`/api/departamentos?empresaId=${empresa.id}`);
      return await res.json();
    },
    enabled: !!empresa?.id
  });

  // Cidades e tipos de vaga para filtro
  const cidades = Array.from(new Set(vagas.map((v: any) => v.local)));
  const tipos = Array.from(new Set(vagas.map((v: any) => v.tipoContratacao)));

  if (empresaLoading) return <div className="text-center py-12">Carregando empresa...</div>;
  if (!empresa) return <div className="text-center py-12 text-red-600">Empresa não encontrada.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
          {/* Logo */}
          {empresa.logoUrl && (
            <img src={empresa.logoUrl} alt={empresa.nome} className="h-20 w-20 object-contain rounded bg-white border p-2" />
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">{empresa.nome}</h1>
            <div className="flex flex-wrap gap-4 text-gray-600 text-sm mb-2">
              {empresa.site && (
                <span className="flex items-center gap-1"><Globe className="h-4 w-4" /><a href={empresa.site} target="_blank" rel="noopener noreferrer">{empresa.site}</a></span>
              )}
              {empresa.email && (
                <span className="flex items-center gap-1"><Mail className="h-4 w-4" />{empresa.email}</span>
              )}
              {empresa.telefone && (
                <span className="flex items-center gap-1"><Building2 className="h-4 w-4" />{empresa.telefone}</span>
              )}
            </div>
            {empresa.descricao && (
              <p className="text-gray-700 mb-2">{empresa.descricao}</p>
            )}
          </div>
        </div>
        {/* Filtros */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Select value={departamento} onValueChange={setDepartamento}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Departamento" /></SelectTrigger>
            <SelectContent>
                              <SelectItem value="todos">Todos departamentos</SelectItem>
              {departamentos.map((d: any) => (
                <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={cidade} onValueChange={setCidade}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Cidade" /></SelectTrigger>
            <SelectContent>
                              <SelectItem value="todas">Todas cidades</SelectItem>
              {cidades.map((c: string) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Tipo de vaga" /></SelectTrigger>
            <SelectContent>
                              <SelectItem value="todos">Todos tipos</SelectItem>
              {tipos.map((t: string) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Vagas */}
        {vagasLoading ? (
          <div className="text-center py-12">Carregando vagas...</div>
        ) : vagas.length === 0 ? (
          <div className="text-center py-12 text-gray-600">Nenhuma vaga encontrada para esta empresa.</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {vagas.map((vaga: any) => (
              <Card key={vaga.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{vaga.titulo}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />{vaga.local}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 text-sm mb-4 line-clamp-3">{vaga.descricao}</p>
                  <div className="flex justify-between items-center">
                    <Badge variant="secondary">{vaga.tipoContratacao}</Badge>
                    <Button variant="outline" size="sm">Ver Detalhes</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 