import axios from 'axios';

// Same-origin in production; proxied to the Express server in development
const api = axios.create({ baseURL: '/api', withCredentials: true });

// Pull a readable message out of an API error
export const errorMessage = (err, fallback = 'Something went wrong. Please try again.') =>
  err?.response?.data?.error || fallback;

export default api;
