import React, { useState, useEffect } from 'react';
import { createTimelineEvent, uploadAnexos } from '../services/timelineService';
import api from '../../../services/api';
import { Modal, Button, TextField, Select, MenuItem, Checkbox, FormControlLabel, Box, Autocomplete, List, ListItem, ListItemText } from '@mui/material';

export function NovoEventoModal({ candidatoId, open, onClose, onCreated }: any) {
  const [form, setForm] = useState({
    tipoEvento: '',
    descricao: '',
    usuarioResponsavelId: '', // Preencher com o usuário logado
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
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [usuarios, setUsuarios] = useState<any[]>([]);

  useEffect(() => {
    api.get('/api/usuarios').then(res => setUsuarios(res.data));
  }, []);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleMencoesChange = (_: any, value: any[]) => {
    setForm(f => ({ ...f, mencoes: value.map(u => u.nome) }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async () => {
    setUploading(true);
    let anexos: string[] = [];
    if (files.length > 0) {
      anexos = await uploadAnexos(files);
    }
    await createTimelineEvent(candidatoId, { ...form, anexos });
    setUploading(false);
    onCreated && onCreated();
    onClose();
    setFiles([]);
  };

  return (
    <Modal open={open} onClose={onClose} disableEnforceFocus disableAutoFocus>
      <Box sx={{ background: '#fff', p: 3, m: '10% auto', maxWidth: 500 }}>
        <Select name="tipoEvento" value={form.tipoEvento} onChange={handleChange} fullWidth>
          <MenuItem value="cadastro">Cadastro</MenuItem>
          <MenuItem value="movimentacao">Movimentação</MenuItem>
          <MenuItem value="entrevista">Entrevista</MenuItem>
          <MenuItem value="teste">Teste</MenuItem>
          <MenuItem value="observacao">Observação</MenuItem>
        </Select>
        <TextField name="descricao" label="Descrição" value={form.descricao} onChange={handleChange} fullWidth />
        <FormControlLabel
          control={<Checkbox checked={form.visivelParaCandidato} onChange={handleChange} name="visivelParaCandidato" />}
          label="Visível para o candidato"
        />
        <TextField name="observacaoInterna" label="Observação Interna" value={form.observacaoInterna} onChange={handleChange} fullWidth />
        <Autocomplete
          multiple
          options={usuarios}
          getOptionLabel={option => option.nome}
          onChange={handleMencoesChange}
          renderInput={params => <TextField {...params} label="Menções (@)" fullWidth />}
        />
        <TextField name="comentarioInterno" label="Comentário Interno" value={form.comentarioInterno} onChange={handleChange} fullWidth multiline minRows={2} />
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
        <Button onClick={handleSubmit} variant="contained" color="primary" fullWidth sx={{ mt: 2 }} disabled={uploading}>
          {uploading ? 'Enviando...' : 'Salvar Evento'}
        </Button>
      </Box>
    </Modal>
  );
} 