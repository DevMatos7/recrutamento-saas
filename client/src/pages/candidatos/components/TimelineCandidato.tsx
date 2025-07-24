import React, { useEffect, useState } from 'react';
import { getTimeline, exportTimelinePDF, exportTimelineCSV } from '../services/timelineService';
import { Timeline, TimelineItem, TimelineSeparator, TimelineDot, TimelineContent, TimelineConnector } from '@mui/lab';
import { Paper, Typography, Chip, CircularProgress, Box, TextField, MenuItem, Button, Checkbox, FormControlLabel, Autocomplete } from '@mui/material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description';
import Tooltip from '@mui/material/Tooltip';

// Mock de usuários e tags para autocomplete (substitua por fetch real depois)
const usuariosMock = [
  { id: '1', nome: 'Maria RH' },
  { id: '2', nome: 'João Gestor' },
  { id: '3', nome: 'Ana Admin' },
];
const tagsMock = ['entrevista', 'feedback', 'alerta', 'documento'];

export function TimelineCandidato({ candidatoId }: { candidatoId: string }) {
  const [eventos, setEventos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    tipoEvento: '',
    palavraChave: '',
    dataInicio: '',
    dataFim: '',
    usuarioResponsavelId: '',
    tags: [] as string[],
    eventosCriticos: false,
  });

  useEffect(() => {
    setLoading(true);
    getTimeline(candidatoId, {
      ...filtros,
      dataInicio: filtros.dataInicio || undefined,
      dataFim: filtros.dataFim || undefined,
      usuarioResponsavelId: filtros.usuarioResponsavelId || undefined,
      tags: filtros.tags.length ? filtros.tags : undefined,
      tipoObservacao: filtros.eventosCriticos ? 'alerta' : undefined,
    })
      .then(setEventos)
      .finally(() => setLoading(false));
  }, [candidatoId, JSON.stringify(filtros)]);

  const handleFiltroChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFiltros(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleTagsChange = (_: any, value: string[]) => {
    setFiltros(f => ({ ...f, tags: value }));
  };

  const handleResponsavelChange = (_: any, value: any) => {
    setFiltros(f => ({ ...f, usuarioResponsavelId: value ? value.id : '' }));
  };

  const handleFiltrar = (e: any) => {
    e.preventDefault();
    setFiltros({ ...filtros });
  };

  const handleExport = async (tipo: 'pdf' | 'csv') => {
    const params = {
      ...filtros,
      dataInicio: filtros.dataInicio || undefined,
      dataFim: filtros.dataFim || undefined,
      usuarioResponsavelId: filtros.usuarioResponsavelId || undefined,
      tags: filtros.tags.length ? filtros.tags : undefined,
      tipoObservacao: filtros.eventosCriticos ? 'alerta' : undefined,
    };
    const blob = tipo === 'pdf'
      ? await exportTimelinePDF(candidatoId, params)
      : await exportTimelineCSV(candidatoId, params);
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `timeline-candidato-${candidatoId}.${tipo}`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  };

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button variant="outlined" size="small" onClick={() => handleExport('pdf')}>Exportar PDF</Button>
        <Button variant="outlined" size="small" onClick={() => handleExport('csv')}>Exportar CSV</Button>
      </Box>
      <form onSubmit={handleFiltrar} style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <TextField
          select
          name="tipoEvento"
          label="Tipo de Evento"
          value={filtros.tipoEvento}
          onChange={handleFiltroChange}
          size="small"
          style={{ minWidth: 150 }}
        >
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="cadastro">Cadastro</MenuItem>
          <MenuItem value="movimentacao">Movimentação</MenuItem>
          <MenuItem value="entrevista">Entrevista</MenuItem>
          <MenuItem value="teste">Teste</MenuItem>
          <MenuItem value="observacao">Observação</MenuItem>
        </TextField>
        <TextField
          name="palavraChave"
          label="Palavra-chave"
          value={filtros.palavraChave}
          onChange={handleFiltroChange}
          size="small"
        />
        <TextField
          name="dataInicio"
          label="Data Inicial"
          type="date"
          value={filtros.dataInicio}
          onChange={handleFiltroChange}
          size="small"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          name="dataFim"
          label="Data Final"
          type="date"
          value={filtros.dataFim}
          onChange={handleFiltroChange}
          size="small"
          InputLabelProps={{ shrink: true }}
        />
        <Autocomplete
          options={usuariosMock}
          getOptionLabel={option => option.nome}
          value={usuariosMock.find(u => u.id === filtros.usuarioResponsavelId) || null}
          onChange={handleResponsavelChange}
          renderInput={params => <TextField {...params} label="Responsável" size="small" />}
          style={{ minWidth: 180 }}
        />
        <Autocomplete
          multiple
          options={tagsMock}
          value={filtros.tags}
          onChange={handleTagsChange}
          renderInput={params => <TextField {...params} label="Tags" size="small" />}
          style={{ minWidth: 180 }}
        />
        <FormControlLabel
          control={<Checkbox checked={filtros.eventosCriticos} onChange={handleFiltroChange} name="eventosCriticos" />}
          label="Eventos Críticos"
        />
        <Button type="submit" variant="outlined" size="small">Filtrar</Button>
      </form>
      <Timeline position="right">
        {eventos.map((evento, idx) => (
          <TimelineItem key={evento.id}>
            <TimelineSeparator>
              <TimelineDot color={getColor(evento.tipoEvento)}>{getIcon(evento.tipoEvento)}</TimelineDot>
              {idx < eventos.length - 1 && <TimelineConnector />}
            </TimelineSeparator>
            <TimelineContent>
              <Paper elevation={3} sx={{ p: 2, border: evento.tipoObservacao === 'alerta' ? '2px solid red' : undefined }}>
                <Typography variant="subtitle2">{evento.tipoEvento.toUpperCase()}</Typography>
                <Typography variant="body2">{evento.descricao}</Typography>
                {evento.tags?.map((tag: string) => <Chip key={tag} label={tag} size="small" color="primary" />)}
                {evento.mencoes?.length > 0 && evento.mencoes.map((nome: string, idx: number) => (
                  <Chip key={idx} label={`@${nome}`} size="small" color="secondary" />
                ))}
                {evento.observacaoInterna && <Typography color="error">{evento.observacaoInterna}</Typography>}
                {evento.anexos?.length > 0 && (
                  <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="caption">Anexos:</Typography>
                    {evento.anexos.map((url: string, idx: number) => (
                      <Tooltip key={idx} title={url.split('/').pop()}>
                        <a href={url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                          {url.match(/\.(jpg|jpeg|png|gif)$/i)
                            ? <img src={url} alt="anexo" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                            : getFileIcon(url)}
                        </a>
                      </Tooltip>
                    ))}
                  </Box>
                )}
                {/* Exibir menções, etc */}
              </Paper>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    </Box>
  );
}

function getColor(tipo: string) {
  switch (tipo) {
    case 'entrevista': return 'success';
    case 'cadastro': return 'info';
    case 'observacao': return 'warning';
    case 'movimentacao': return 'primary';
    case 'teste': return 'secondary';
    default: return 'grey';
  }
}
function getIcon(tipo: string) {
  // Retorne um ícone do Material UI conforme o tipo
  // Exemplo: return <EventIcon /> para entrevista
  return null;
}

function getFileIcon(url: string) {
  if (url.match(/\.(jpg|jpeg|png|gif)$/i)) return <ImageIcon color="primary" />;
  if (url.match(/\.(pdf)$/i)) return <PictureAsPdfIcon color="error" />;
  if (url.match(/\.(doc|docx)$/i)) return <DescriptionIcon color="info" />;
  return <InsertDriveFileIcon color="action" />;
} 