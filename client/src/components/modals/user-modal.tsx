import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { insertUsuarioSchema, type InsertUsuario, type Usuario } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingUser?: Usuario | null;
}

export function UserModal({ isOpen, onClose, editingUser }: UserModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: empresas = [] } = useQuery({
    queryKey: ["/api/empresas"],
    enabled: isOpen,
  });

  const { data: departamentos = [] } = useQuery({
    queryKey: ["/api/departamentos"],
    enabled: isOpen,
  });

  const form = useForm<InsertUsuario>({
    resolver: zodResolver(insertUsuarioSchema),
    defaultValues: {
      nome: "",
      email: "",
      password: "",
      perfil: "recrutador",
      empresaId: "",
      departamentoId: "",
    },
  });

  const userMutation = useMutation({
    mutationFn: async (userData: InsertUsuario) => {
      const endpoint = editingUser 
        ? `/api/usuarios/${editingUser.id}`
        : "/api/register-user";
      
      const method = editingUser ? "PUT" : "POST";
      const res = await apiRequest(method, endpoint, userData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/usuarios"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: editingUser ? "Usuário atualizado" : "Usuário criado",
        description: editingUser 
          ? "Usuário atualizado com sucesso!" 
          : "Novo usuário criado com sucesso!",
      });
      onClose();
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reset form when editing user changes
  useEffect(() => {
    if (editingUser) {
      form.reset({
        nome: editingUser.nome,
        email: editingUser.email,
        password: "", // Don't populate password for editing
        perfil: editingUser.perfil as any,
        empresaId: editingUser.empresaId,
        departamentoId: editingUser.departamentoId || "",
      });
    } else {
      form.reset({
        nome: "",
        email: "",
        password: "",
        perfil: "recrutador",
        empresaId: "",
        departamentoId: "",
      });
    }
  }, [editingUser, form]);

  const onSubmit = (data: InsertUsuario) => {
    // If editing and password is empty, remove it from the data
    if (editingUser && !data.password) {
      const { password, ...dataWithoutPassword } = data;
      userMutation.mutate(dataWithoutPassword as InsertUsuario);
    } else {
      userMutation.mutate(data);
    }
  };

  const selectedEmpresaId = form.watch("empresaId");
  const filteredDepartamentos = selectedEmpresaId 
    ? departamentos.filter((dept: any) => dept.empresaId === selectedEmpresaId)
    : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingUser ? "Editar Usuário" : "Novo Usuário"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="usuario@empresa.com" 
                      type="email" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Senha {editingUser && "(deixe em branco para manter a atual)"}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="••••••••" 
                      type="password" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="empresaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Reset department when company changes
                      form.setValue("departamentoId", "");
                    }} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma empresa" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {empresas.map((empresa: any) => (
                        <SelectItem key={empresa.id} value={empresa.id}>
                          {empresa.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="departamentoId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Departamento</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={!selectedEmpresaId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue 
                          placeholder={
                            !selectedEmpresaId 
                              ? "Selecione uma empresa primeiro" 
                              : "Selecione um departamento"
                          } 
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredDepartamentos.map((departamento: any) => (
                        <SelectItem key={departamento.id} value={departamento.id}>
                          {departamento.nome}
                        </SelectItem>
                      ))}
                      {selectedEmpresaId && filteredDepartamentos.length === 0 && (
                        <SelectItem value="" disabled>
                          Nenhum departamento encontrado
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="perfil"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Perfil</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um perfil" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="recrutador">Recrutador</SelectItem>
                      <SelectItem value="gestor">Gestor</SelectItem>
                      <SelectItem value="candidato">Candidato</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={userMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {userMutation.isPending 
                  ? "Salvando..." 
                  : editingUser 
                    ? "Atualizar" 
                    : "Salvar"
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
