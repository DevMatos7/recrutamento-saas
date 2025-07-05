import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Settings, Target, Percent } from "lucide-react";

const matchingConfigSchema = z.object({
  competenciasPeso: z.number().min(0).max(100),
  experienciaPeso: z.number().min(0).max(100),
  formacaoPeso: z.number().min(0).max(100),
  localizacaoPeso: z.number().min(0).max(100),
  salarioPeso: z.number().min(0).max(100),
  discPeso: z.number().min(0).max(100),
  scoreMinimo: z.number().min(0).max(100)
}).refine((data) => {
  const total = data.competenciasPeso + data.experienciaPeso + data.formacaoPeso + 
                data.localizacaoPeso + data.salarioPeso + data.discPeso;
  return total === 100;
}, {
  message: "A soma dos pesos deve ser exatamente 100%"
});

type MatchingConfigData = z.infer<typeof matchingConfigSchema>;

interface MatchingConfigProps {
  initialConfig?: MatchingConfigData;
  onSave: (config: MatchingConfigData) => void;
  isLoading?: boolean;
}

const defaultConfig: MatchingConfigData = {
  competenciasPeso: 40,
  experienciaPeso: 20,
  formacaoPeso: 10,
  localizacaoPeso: 10,
  salarioPeso: 10,
  discPeso: 10,
  scoreMinimo: 70
};

export function MatchingConfig({ initialConfig = defaultConfig, onSave, isLoading }: MatchingConfigProps) {
  const form = useForm<MatchingConfigData>({
    resolver: zodResolver(matchingConfigSchema),
    defaultValues: initialConfig
  });

  const watchedValues = form.watch();
  const totalPesos = watchedValues.competenciasPeso + watchedValues.experienciaPeso + 
                     watchedValues.formacaoPeso + watchedValues.localizacaoPeso + 
                     watchedValues.salarioPeso + watchedValues.discPeso;

  const handleSubmit = (data: MatchingConfigData) => {
    onSave(data);
  };

  const resetToDefault = () => {
    form.reset(defaultConfig);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <CardTitle>Configuração de Critérios de Matching</CardTitle>
        </div>
        <CardDescription>
          Configure os pesos dos critérios para calcular a compatibilidade entre candidatos e vagas.
          A soma dos pesos deve ser 100%.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Indicador de Total */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span className="font-medium">Total dos Pesos:</span>
              </div>
              <Badge variant={totalPesos === 100 ? "default" : "destructive"}>
                {totalPesos}%
              </Badge>
            </div>

            {/* Competências */}
            <FormField
              control={form.control}
              name="competenciasPeso"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Competências Técnicas</FormLabel>
                    <Badge variant="outline">{field.value}%</Badge>
                  </div>
                  <FormControl>
                    <Slider
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </FormControl>
                  <FormDescription>
                    Peso das competências técnicas (ex: React, Python, etc.)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Experiência */}
            <FormField
              control={form.control}
              name="experienciaPeso"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Nível de Experiência</FormLabel>
                    <Badge variant="outline">{field.value}%</Badge>
                  </div>
                  <FormControl>
                    <Slider
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </FormControl>
                  <FormDescription>
                    Peso do nível de senioridade (júnior, pleno, sênior)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Formação */}
            <FormField
              control={form.control}
              name="formacaoPeso"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Formação Acadêmica</FormLabel>
                    <Badge variant="outline">{field.value}%</Badge>
                  </div>
                  <FormControl>
                    <Slider
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </FormControl>
                  <FormDescription>
                    Peso da escolaridade (ensino médio, superior, pós)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Localização */}
            <FormField
              control={form.control}
              name="localizacaoPeso"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Localização</FormLabel>
                    <Badge variant="outline">{field.value}%</Badge>
                  </div>
                  <FormControl>
                    <Slider
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </FormControl>
                  <FormDescription>
                    Peso da compatibilidade de localização
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Salário */}
            <FormField
              control={form.control}
              name="salarioPeso"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Faixa Salarial</FormLabel>
                    <Badge variant="outline">{field.value}%</Badge>
                  </div>
                  <FormControl>
                    <Slider
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </FormControl>
                  <FormDescription>
                    Peso da compatibilidade salarial
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* DISC */}
            <FormField
              control={form.control}
              name="discPeso"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Perfil DISC</FormLabel>
                    <Badge variant="outline">{field.value}%</Badge>
                  </div>
                  <FormControl>
                    <Slider
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </FormControl>
                  <FormDescription>
                    Peso da compatibilidade do perfil comportamental
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Score Mínimo */}
            <FormField
              control={form.control}
              name="scoreMinimo"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormLabel>Score Mínimo</FormLabel>
                    <Percent className="h-4 w-4" />
                  </div>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Score mínimo para exibir candidatos (0-100%)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={isLoading || totalPesos !== 100}
                className="flex-1"
              >
                {isLoading ? "Salvando..." : "Salvar Configuração"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={resetToDefault}
              >
                Restaurar Padrão
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}