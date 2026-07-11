import api from './api';

export const pagesService = {
  getAll: async () => {
    const response = await api.get('/page-builder');
    return response.data?.data || [];
  },
  
  getOne: async (name: string) => {
    const response = await api.get(`/page-builder/${name}`);
    return response.data?.data || null;
  },
  
  create: async (data: any) => {
    const response = await api.post('/page-builder', data);
    return response.data?.data || null;
  },
  
  update: async (name: string, data: any) => {
    const response = await api.put(`/page-builder/${name}/sections`, data);
    return response.data?.data || null;
  },
  
  delete: async (name: string) => {
    const response = await api.delete(`/page-builder/${name}`);
    return response.data?.data || null;
  }
};
