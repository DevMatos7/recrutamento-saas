import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
// Se necessário: npm install react-color
import { SketchPicker, ColorResult } from "react-color";
import type { PipelineEtapa } from "@/types/pipeline"; // Ajuste o caminho conforme seu projeto
// Importe sua lib de drag and drop se desejar (ex: dnd-kit)
import { useAuth } from "@/hooks/use-auth";
import Select from 'react-select';

const CAMPOS_POSSIVEIS = [
  { key: "observacao", label: "Observação" },
  { key: "score", label: "Score de Avaliação" },
  // Adicione outros campos obrigatórios possíveis
];

type PipelineEtapa = {
  id?: string;
  nome: string;
  cor: string;
  ordem: number;
  camposObrigatorios: string[];
  responsaveis: string[];
};

type Props = {
  vagaId: string;
  open: boolean;
  onClose: () => void;
};

export default function PipelineEtapasConfig({ vagaId, open, onClose }: Props) {
  const { user } = useAuth();
  const [etapas, setEtapas] = useState<PipelineEtapa[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [colorPickerIdx, setColorPickerIdx] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      fetch(`/api/vagas/${vagaId}/etapas`).then(r => r.json()).then(setEtapas);
      if (user?.empresaId) {
        fetch(`/api/usuarios?empresaId=${user.empresaId}`)
          .then(r => r.json())
          .then(setUsuarios);
      }
    }
  }, [vagaId, open, user?.empresaId]);

  const addEtapa = () => {
    setEtapas([
      ...etapas,
      { nome: "", cor: "#1976d2", ordem: etapas.length + 1, camposObrigatorios: [], responsaveis: [] }
    ]);
  };

  const removeEtapa = (idx: number) => {
    setEtapas(etapas.filter((_, i) => i !== idx));
  };

  const moveEtapa = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= etapas.length) return;
    const novas = [...etapas];
    const [moved] = novas.splice(fromIdx, 1);
    novas.splice(toIdx, 0, moved);
    setEtapas(novas.map((e, i) => ({ ...e, ordem: i + 1 })));
  };

  const confirmarAlteracoes = async () => {
    setSalvando(true);
    await fetch(`/api/vagas/${vagaId}/etapas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ etapas })
    });
    setSalvando(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="modal-horizontal" 
        style={{ 
          minWidth: '90vw', 
          maxWidth: '98vw',
          maxHeight: '90vh',
          height: 'auto',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <DialogHeader style={{ flexShrink: 0 }}>
          <DialogTitle>Configurar Etapas do Pipeline</DialogTitle>
          <DialogDescription>Arraste, edite e personalize as etapas do pipeline.</DialogDescription>
        </DialogHeader>
        
        <div 
          className="etapas-horizontal-lista" 
          style={{ 
            display: 'flex', 
            flexDirection: 'row', 
            gap: 16, 
            overflowX: 'auto', 
            overflowY: 'hidden',
            padding: '16px 0',
            flex: 1,
            minHeight: 0
          }}
        >
          {etapas.map((etapa, idx) => (
            <div 
              className="etapa-coluna" 
              key={etapa.id || idx} 
              style={{ 
                minWidth: 280, 
                maxWidth: 280,
                background: '#fff', 
                borderRadius: 10, 
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'stretch', 
                padding: 12, 
                position: 'relative',
                height: 'fit-content'
              }}
            >
              <div className="etapa-header" style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: '8px 8px 0 0', padding: 8, background: etapa.cor }}>
                <Input
                  value={etapa.nome}
                  onChange={e => setEtapas(etapas.map((et, i) => i === idx ? { ...et, nome: e.target.value } : et))}
                  placeholder="Nome"
                  className="etapa-nome"
                  style={{ flex: 1, minWidth: 0 }}
                />
                <button
                  className="cor-btn"
                  style={{ background: etapa.cor, width: 24, height: 24, border: 'none', borderRadius: '50%', cursor: 'pointer', outline: '2px solid #eee', flexShrink: 0 }}
                  onClick={() => setColorPickerIdx(idx)}
                />
                {colorPickerIdx === idx && (
                  <div className="color-popover" style={{ position: 'absolute', zIndex: 1000, top: 40, left: 0 }}>
                    <SketchPicker
                      color={etapa.cor}
                      onChange={c => {
                        setEtapas(etapas.map((et, i) => i === idx ? { ...et, cor: c.hex } : et));
                        setColorPickerIdx(null);
                      }}
                    />
                  </div>
                )}
              </div>
              
              <div className="etapa-body" style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '12px 0', flex: 1 }}>
                {CAMPOS_POSSIVEIS.map(campo => (
                  <label key={campo.key} className="checkbox-compact" style={{ fontSize: '0.9em', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input
                      type="checkbox"
                      checked={etapa.camposObrigatorios?.includes(campo.key)}
                      onChange={e => {
                        const novos = e.target.checked
                          ? [...(etapa.camposObrigatorios || []), campo.key]
                          : (etapa.camposObrigatorios || []).filter(k => k !== campo.key);
                        setEtapas(etapas.map((et, i) => i === idx ? { ...et, camposObrigatorios: novos } : et));
                      }}
                    />
                    {campo.label}
                  </label>
                ))}
                
                                <div style={{ position: 'relative', zIndex: 100 }}>
                  <Select
                    isMulti
                    value={usuarios.filter(u => (etapa.responsaveis || []).includes(u.id)).map(u => ({ value: u.id, label: u.nome.split(' ')[0] }))}
                    onChange={selected => {
                      const values = selected.map(opt => opt.value);
                      setEtapas(etapas.map((et, i) => i === idx ? { ...et, responsaveis: values } : et));
                    }}
                    options={usuarios.map(u => ({ value: u.id, label: u.nome.split(' ')[0] }))}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    placeholder="Selecione responsáveis..."
                    menuPosition="fixed"
                    menuPlacement="auto"
                    closeMenuOnScroll={false}
                    styles={{
                      menu: (provided) => ({
                        ...provided,
                        zIndex: 9999,
                        position: 'fixed'
                      }),
                      menuPortal: (provided) => ({
                        ...provided,
                        zIndex: 9999
                      }),
                      control: (provided) => ({
                        ...provided,
                        minHeight: '36px'
                      })
                    }}
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                  />
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                  {(etapa.responsaveis || []).map(id => {
                    const user = usuarios.find(u => u.id === id);
                    if (!user) return null;
                    return <span key={id} style={{ background: '#e0f2f1', color: '#065f46', borderRadius: 12, padding: '2px 8px', fontSize: 12 }}>{user.nome.split(' ')[0]}</span>;
                  })}
                </div>
              </div>
              
              <div className="etapa-actions" style={{ display: 'flex', gap: 4, justifyContent: 'space-between', marginTop: 8, flexShrink: 0 }}>
                <Button onClick={() => removeEtapa(idx)} variant="destructive" size="sm">Remover</Button>
                <Button onClick={() => moveEtapa(idx, idx - 1)} disabled={idx === 0} size="sm">←</Button>
                <Button onClick={() => moveEtapa(idx, idx + 1)} disabled={idx === etapas.length - 1} size="sm">→</Button>
              </div>
            </div>
          ))}
          
          <div className="etapa-coluna add-coluna" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 120, background: 'transparent', boxShadow: 'none', flexShrink: 0 }}>
            <Button onClick={addEtapa} variant="outline">+ Nova Etapa</Button>
          </div>
        </div>
        
        <div style={{ flexShrink: 0, marginTop: 16 }}>
          <Button onClick={confirmarAlteracoes} className="w-full" style={{ background: '#22c55e', color: '#fff', fontWeight: 600 }}>
            {salvando ? "Salvando..." : "Confirmar alterações"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 