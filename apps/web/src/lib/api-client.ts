import axios from 'axios';

const apiBaseUrl =
  typeof import.meta.env.VITE_API_BASE_URL === 'string' && import.meta.env.VITE_API_BASE_URL.length > 0
    ? import.meta.env.VITE_API_BASE_URL
    : 'http://localhost:3001/api';

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
});
