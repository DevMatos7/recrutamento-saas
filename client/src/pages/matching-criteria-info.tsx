import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Code, 
  GraduationCap, 
  MapPin, 
  DollarSign, 
  TrendingUp, 
  Brain,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";

export default function MatchingCriteriaInfo() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Critérios de Matching - Detalhamento</h1>
        <p className="text-muted-foreground">
          Entenda como cada critério é validado e pontuado no sistema de compatibilidade
        </p>
      </div>

      {/* Competências Técnicas */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            <CardTitle>1. Competências Técnicas (40%)</CardTitle>
          </div>
          <CardDescription>
            Compara as habilidades técnicas exigidas pela vaga com as do candidato
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Campos Validados:</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Badge variant="outline">Vaga</Badge>
                <p className="text-sm mt-1">Campo: <code>competencias</code> (array)</p>
                <p className="text-xs text-muted-foreground">Ex: ["React", "JavaScript", "CSS"]</p>
              </div>
              <div>
                <Badge variant="outline">Candidato</Badge>
                <p className="text-sm mt-1">Campo: <code>competencias</code> (array)</p>
                <p className="text-xs text-muted-foreground">Ex: ["React", "JavaScript", "CSS", "HTML"]</p>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-semibold mb-2">Lógica de Pontuação:</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">100% - Candidato possui todas as competências exigidas</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Proporcional - (Competências encontradas / Total exigido) × 100</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm">0% - Nenhuma competência compatível</span>
              </div>
            </div>
          </div>

          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm"><strong>Exemplo:</strong> Vaga exige ["React", "JavaScript", "TypeScript"]. 
            Candidato tem ["React", "JavaScript", "CSS"]. Score: 67% (2/3 competências)</p>
          </div>
        </CardContent>
      </Card>

      {/* Nível de Experiência */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <CardTitle>2. Nível de Experiência (20%)</CardTitle>
          </div>
          <CardDescription>
            Avalia a senioridade do candidato em relação ao nível exigido
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Campos Validados:</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Badge variant="outline">Vaga</Badge>
                <p className="text-sm mt-1">Campo: <code>nivel_experiencia</code></p>
              </div>
              <div>
                <Badge variant="outline">Candidato</Badge>
                <p className="text-sm mt-1">Campo: <code>nivel_experiencia</code></p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Escala de Níveis:</h4>
            <div className="grid grid-cols-5 gap-2">
              <Badge variant="secondary">Estagiário (0)</Badge>
              <Badge variant="secondary">Júnior (1)</Badge>
              <Badge variant="secondary">Pleno (2)</Badge>
              <Badge variant="secondary">Sênior (3)</Badge>
              <Badge variant="secondary">Especialista (4)</Badge>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Pontuação por Diferença:</h4>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm">Nível exato</span>
                <Badge>100%</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">1 nível de diferença</span>
                <Badge variant="secondary">80%</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">2 níveis de diferença</span>
                <Badge variant="secondary">60%</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">3+ níveis de diferença</span>
                <Badge variant="destructive">≤40%</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formação Acadêmica */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            <CardTitle>3. Formação Acadêmica (10%)</CardTitle>
          </div>
          <CardDescription>
            Verifica se o candidato atende ao requisito mínimo de escolaridade
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Campos Validados:</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Badge variant="outline">Vaga</Badge>
                <p className="text-sm mt-1">Campo: <code>formacao_minima</code></p>
              </div>
              <div>
                <Badge variant="outline">Candidato</Badge>
                <p className="text-sm mt-1">Campo: <code>formacao_nivel</code></p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Hierarquia de Formação:</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm w-4">1.</span>
                <span className="text-sm">Ensino Fundamental</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm w-4">2.</span>
                <span className="text-sm">Ensino Médio</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm w-4">3.</span>
                <span className="text-sm">Técnico</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm w-4">4.</span>
                <span className="text-sm">Superior</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm w-4">5.</span>
                <span className="text-sm">Pós-graduação</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm w-4">6.</span>
                <span className="text-sm">Mestrado</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm w-4">7.</span>
                <span className="text-sm">Doutorado</span>
              </div>
            </div>
          </div>

          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm"><strong>Regra:</strong> Candidato com formação igual ou superior = 100%. 
            Cada nível abaixo reduz 20 pontos.</p>
          </div>
        </CardContent>
      </Card>

      {/* Localização */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            <CardTitle>4. Localização (10%)</CardTitle>
          </div>
          <CardDescription>
            Avalia a compatibilidade geográfica entre candidato e vaga
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Campos Validados:</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Badge variant="outline">Vaga</Badge>
                <p className="text-sm mt-1">Campo: <code>local</code></p>
                <p className="text-xs text-muted-foreground">Ex: "São Paulo - SP (Híbrido)"</p>
              </div>
              <div>
                <Badge variant="outline">Candidato</Badge>
                <p className="text-sm mt-1">Campo: <code>localizacao</code></p>
                <p className="text-xs text-muted-foreground">Ex: "São Paulo, SP"</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Pontuação por Compatibilidade:</h4>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm">Localização exata</span>
                <Badge>100%</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Trabalho remoto/home office</span>
                <Badge>90%</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Mesma cidade/estado</span>
                <Badge variant="secondary">80%</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Não informado</span>
                <Badge variant="outline">70%</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Localizações diferentes</span>
                <Badge variant="destructive">40%</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Faixa Salarial */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            <CardTitle>5. Faixa Salarial (10%)</CardTitle>
          </div>
          <CardDescription>
            Compara a pretensão salarial do candidato com a oferta da vaga
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Campos Validados:</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Badge variant="outline">Vaga</Badge>
                <p className="text-sm mt-1">Campo: <code>salario</code></p>
                <p className="text-xs text-muted-foreground">Ex: "R$ 8.000 - R$ 12.000"</p>
              </div>
              <div>
                <Badge variant="outline">Candidato</Badge>
                <p className="text-sm mt-1">Campo: <code>pretensao_salarial</code></p>
                <p className="text-xs text-muted-foreground">Ex: 6000</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Pontuação por Diferença Percentual:</h4>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm">Diferença até 10%</span>
                <Badge>100%</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Diferença até 20%</span>
                <Badge>90%</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Diferença até 40%</span>
                <Badge variant="secondary">70%</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Diferença até 60%</span>
                <Badge variant="secondary">50%</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Não informado</span>
                <Badge variant="outline">80%</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Perfil DISC */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            <CardTitle>6. Perfil DISC (10%)</CardTitle>
          </div>
          <CardDescription>
            Analisa a compatibilidade comportamental usando o teste DISC
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Campos Validados:</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Badge variant="outline">Vaga</Badge>
                <p className="text-sm mt-1">Campo: <code>perfil_disc_ideal</code> (JSON)</p>
                <p className="text-xs text-muted-foreground">Ex: {"{"}"D": 75, "I": 60, "S": 40, "C": 80{"}"}</p>
              </div>
              <div>
                <Badge variant="outline">Candidato</Badge>
                <p className="text-sm mt-1">Resultado do teste DISC</p>
                <p className="text-xs text-muted-foreground">Ex: {"{"}"D": 70, "I": 65, "S": 45, "C": 85{"}"}</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Fatores DISC:</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="destructive">D</Badge>
                <span className="text-sm">Dominância</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default">I</Badge>
                <span className="text-sm">Influência</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">S</Badge>
                <span className="text-sm">Estabilidade</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">C</Badge>
                <span className="text-sm">Conformidade</span>
              </div>
            </div>
          </div>

          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm"><strong>Cálculo:</strong> Média das diferenças entre perfil do candidato e perfil ideal da vaga. 
            Score = 100 - (diferença média / 96) × 100</p>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Final */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle>Score Final de Compatibilidade</CardTitle>
          <CardDescription>
            Como o score final é calculado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm">
              <strong>Fórmula:</strong> (Competências × 0.4) + (Experiência × 0.2) + (Formação × 0.1) + 
              (Localização × 0.1) + (Salário × 0.1) + (DISC × 0.1)
            </p>
            <p className="text-sm text-muted-foreground">
              O score final varia de 0 a 100 pontos, indicando o percentual de compatibilidade entre candidato e vaga.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}