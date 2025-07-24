import axios from 'axios';

// Usa a variável de ambiente VITE_API_URL definida no .env do frontend
// Exemplo: VITE_API_URL=http://localhost:5000
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: true, // ESSENCIAL para enviar cookies de sessão!
  // Adicione headers, interceptors, etc, se necessário
});

export default api;
