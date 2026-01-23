import axios from 'axios';

const api = axios.create({
  baseURL: 'https://invoice-generator-backend-e3qj8zla4.vercel.app/api',
});

export default api;
