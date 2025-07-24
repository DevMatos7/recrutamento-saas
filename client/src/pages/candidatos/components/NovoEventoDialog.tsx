import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Select, MenuItem, Box, Chip, Autocomplete, List, ListItem, ListItemText
} from '@mui/material';
import { createTimelineEvent, uploadAnexos } from '../services/timelineService';

export default function NovoEventoDialog({ open, onClose, candidatoId, onCreated, usuarios, usuarioLogadoId }: any) {
  const [form, setForm] = useState({
    tipoEvento: '',
    descricao: '',
    usuarioResponsavelId: usuarioLogadoId || '', // Preenche automaticamente
    visivelParaCandidato: false,
    observacaoInterna: '',
    tipoObservacao: '',
    tags: [],
    anexos: [] as string[],
    origem: 'manual',
    origemExterna: '',
    mencoes: [] as string[],
    comentarioInterno: '',
  });
  // Atualiza usuarioResponsavelId se prop mudar
  React.useEffect(() => {
    setForm(f => ({ ...f, usuarioResponsavelId: usuarioLogadoId || '' }));
  }, [usuarioLogadoId, open]);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleMencoesChange = (_: any, value: any[]) => {
    setForm(f => ({ ...f, mencoes: value.map(u => u.id) }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async () => {
    setUploading(true);
    let anexos: string[] = [];
    if (files.length > 0) {
      anexos = await uploadAnexos(files);
    }
    const payload = {
      tipoEvento: form.tipoEvento,
      descricao: form.descricao,
      usuarioResponsavelId: form.usuarioResponsavelId,
      dataEvento: new Date()
    };
    console.log('Payload mínimo enviado para timeline:', payload);
    try {
      await createTimelineEvent(candidatoId, payload);
    } catch (err: any) {
      console.error('Erro detalhado ao criar evento:', err?.response?.data || err);
      alert('Erro ao criar evento: ' + (err?.response?.data?.message || err.message));
    }
    setUploading(false);
    onCreated && onCreated();
    onClose();
    setFiles([]);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Novo Evento</DialogTitle>
      <DialogContent>
        <Select name="tipoEvento" value={form.tipoEvento} onChange={handleChange} fullWidth sx={{ mb: 2 }}>
          <MenuItem value="cadastro">Cadastro</MenuItem>
          <MenuItem value="movimentacao">Movimentação</MenuItem>
          <MenuItem value="entrevista">Entrevista</MenuItem>
          <MenuItem value="teste">Teste</MenuItem>
          <MenuItem value="observacao">Observação</MenuItem>
        </Select>
        <TextField name="descricao" label="Descrição" value={form.descricao} onChange={handleChange} fullWidth sx={{ mb: 2 }} />
        <Autocomplete
          multiple
          options={usuarios}
          getOptionLabel={option => option.nome}
          onChange={handleMencoesChange}
          renderInput={params => <TextField {...params} label="Menções (@)" fullWidth />}
        />
        <TextField name="comentarioInterno" label="Comentário Interno" value={form.comentarioInterno} onChange={handleChange} fullWidth multiline minRows={2} sx={{ mt: 2 }} />
        <Box sx={{ mt: 2 }}>
          <input type="file" multiple onChange={handleFileChange} />
          {files.length > 0 && (
            <List dense>
              {files.map((file, idx) => (
                <ListItem key={idx}>
                  <ListItemText primary={file.name} />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={uploading}>
          {uploading ? 'Enviando...' : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 