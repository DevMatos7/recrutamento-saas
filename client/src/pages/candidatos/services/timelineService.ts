import api from '../../../services/api';

export async function getTimeline(candidatoId: string, params = {}) {
  const { data } = await api.get(`/api/candidatos/${candidatoId}/timeline`, { params });
  return data;
}

export async function createTimelineEvent(candidatoId: string, evento: any) {
  const { data } = await api.post(`/api/candidatos/${candidatoId}/timeline`, evento);
  return data;
}

export async function updateTimelineEvent(candidatoId: string, eventoId: string, evento: any) {
  const { data } = await api.put(`/api/candidatos/${candidatoId}/timeline/${eventoId}`, evento);
  return data;
}

export async function exportTimelinePDF(candidatoId: string, params = {}) {
  const response = await api.get(`/api/candidatos/${candidatoId}/timeline/export/pdf`, {
    params,
    responseType: 'blob',
  });
  return response.data;
}

export async function exportTimelineCSV(candidatoId: string, params = {}) {
  const response = await api.get(`/api/candidatos/${candidatoId}/timeline/export/csv`, {
    params,
    responseType: 'blob',
  });
  return response.data;
}

export async function uploadAnexos(files: File[]): Promise<string[]> {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  const { data } = await api.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data.urls;
} 