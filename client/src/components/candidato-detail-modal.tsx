import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, IconButton, Typography, Box, Button, Chip, Tooltip, Avatar, Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import NoteIcon from '@mui/icons-material/StickyNote2';
import EventIcon from '@mui/icons-material/Event';
import AssignmentIcon from '@mui/icons-material/Assignment';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { format } from 'date-fns';
import { getTimeline } from '@/pages/candidatos/services/timelineService';
import NovoEventoDialog from '@/pages/candidatos/components/NovoEventoDialog';
import api from '@/services/api';
import { useAuth } from '@/hooks/use-auth';

export function CandidatoDetailModal({ open, onClose, candidato }: any) {
  const { user } = useAuth();
  const [eventos, setEventos] = useState<any[]>([]);
  const [openNovoEvento, setOpenNovoEvento] = useState(false);
  const [usuarios, setUsuarios] = useState<any[]>([]);

  useEffect(() => {
    if (open && candidato?.id) {
      getTimeline(candidato.id).then(setEventos);
      api.get('/api/usuarios').then(res => setUsuarios(res.data));
    }
  }, [open, candidato]);

  const handleNovoEvento = () => setOpenNovoEvento(true);
  const handleEventoCriado = () => {
    setOpenNovoEvento(false);
    getTimeline(candidato.id).then(setEventos);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Candidate Timeline
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {/* Dados principais do candidato */}
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Avatar sx={{ width: 56, height: 56 }}>{candidato?.nome?.[0]}</Avatar>
          <Box>
            <Typography variant="h6">{candidato?.nome}</Typography>
            <Typography variant="body2" color="text.secondary">{candidato?.email}</Typography>
            <Typography variant="body2" color="text.secondary">{candidato?.telefone}</Typography>
          </Box>
        </Box>
        <Divider sx={{ mb: 2 }} />

        {/* Timeline */}
        <Timeline position="right" sx={{ p: 0 }}>
          {eventos.map((evento: any, idx: number) => (
            <TimelineItem key={evento.id || idx}>
              <TimelineSeparator>
                <TimelineDot>
                  {getIcon(evento.tipoEvento)}
                </TimelineDot>
                {idx < eventos.length - 1 && <TimelineConnector />}
              </TimelineSeparator>
              <TimelineContent sx={{ pb: 4 }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {getTitle(evento)}
                  </Typography>
                  {evento.usuarioResponsavel && (
                    <Typography variant="body2" color="text.secondary">
                      {evento.tipoEvento === 'observacao' ? `(${evento.usuarioResponsavel})` : `by ${evento.usuarioResponsavel}`}
                    </Typography>
                  )}
                  <Box flex={1} />
                  <Typography variant="body2" color="text.secondary">
                    {format(new Date(evento.dataEvento), 'MMM dd, yyyy')}
                  </Typography>
                </Box>
                {evento.descricao && (
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {evento.descricao}
                  </Typography>
                )}
                {evento.observacaoInterna && (
                  <Typography variant="body2" color="warning.main" sx={{ mt: 0.5 }}>
                    {evento.observacaoInterna}
                  </Typography>
                )}
                {evento.anexos && (
                  <Box sx={{ mt: 1 }}>
                    {evento.anexos.map((anexo: any, i: number) => (
                      <Tooltip key={i} title={anexo.nome || anexo}>
                        <Chip
                          icon={<InsertDriveFileIcon />}
                          label={anexo.nome || anexo}
                          component="a"
                          href={anexo.url || anexo}
                          target="_blank"
                          clickable
                          size="small"
                          sx={{ mr: 1 }}
                        />
                      </Tooltip>
                    ))}
                  </Box>
                )}
                {evento.resultado && (
                  <Chip
                    label={evento.resultado}
                    color={evento.resultado === 'Aprovado' ? 'success' : 'warning'}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                )}
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </DialogContent>
      <Box display="flex" justifyContent="flex-end" p={2}>
        <Button variant="contained" color="primary" onClick={handleNovoEvento}>
          Novo Evento
        </Button>
      </Box>
      <NovoEventoDialog
        open={openNovoEvento}
        onClose={() => setOpenNovoEvento(false)}
        candidatoId={candidato?.id}
        onCreated={handleEventoCriado}
        usuarios={usuarios}
        usuarioLogadoId={user?.id}
      />
    </Dialog>
  );
}

function getIcon(tipo: string) {
  switch (tipo) {
    case 'cadastro': return <PersonIcon color="success" />;
    case 'movimentacao': return <AssignmentIcon color="primary" />;
    case 'entrevista': return <EventIcon color="info" />;
    case 'teste': return <AssignmentIcon color="info" />;
    case 'observacao': return <NoteIcon color="warning" />;
    case 'documento': return <InsertDriveFileIcon color="secondary" />;
    case 'profile_update': return <EditIcon color="warning" />;
    default: return <PersonIcon />;
  }
}
function getTitle(evento: any) {
  switch (evento.tipoEvento) {
    case 'cadastro': return 'Candidate registered';
    case 'movimentacao': return 'Pipeline changed';
    case 'entrevista': return evento.descricao?.includes('scheduled') ? 'Interview scheduled' : 'Interview conducted';
    case 'teste': return 'Technical Test';
    case 'observacao': return 'Internal note';
    case 'documento': return 'Document uploaded';
    case 'profile_update': return 'Profile updated';
    default: return evento.tipoEvento;
  }
}