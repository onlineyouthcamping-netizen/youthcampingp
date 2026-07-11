import api from './api';

export interface DesignConfigRecord {
  id?: string;
  scope: string;
  config: any;
  status: 'draft' | 'published';
  version: number;
  createdBy?: string;
  updatedAt?: string;
}

export interface DesignVersionRecord {
  id: string;
  scope: string;
  config: any;
  version: number;
  action: string;
  changedByName: string;
  changeSummary: string;
  affectedPages: string[];
  affectedSections: string[];
  createdAt: string;
}

export interface DesignPresetRecord {
  id: string;
  name: string;
  category: 'global' | 'section' | 'page';
  config: any;
  isDefault: boolean;
  createdBy?: string;
  createdAt?: string;
}

export const designService = {
  getConfig: async (scope: string, status: 'draft' | 'published' = 'draft'): Promise<any> => {
    const response = await api.get(`/design/config/${scope}?status=${status}`);
    return response.data.data;
  },

  getMergedConfig: async (scope: string): Promise<any> => {
    const response = await api.get(`/design/config/${scope}/merged`);
    return response.data.data;
  },

  saveDraft: async (scope: string, config: any): Promise<any> => {
    const response = await api.put(`/design/config/${scope}/draft`, config);
    return response.data.data;
  },

  publish: async (scope: string): Promise<{ config: any; version: number }> => {
    const response = await api.post(`/design/config/${scope}/publish`);
    return response.data;
  },

  discardDraft: async (scope: string): Promise<void> => {
    await api.post(`/design/config/${scope}/discard`);
  },

  getVersions: async (scope: string): Promise<DesignVersionRecord[]> => {
    const response = await api.get(`/design/versions/${scope}`);
    return response.data.data;
  },

  restoreVersion: async (id: string): Promise<any> => {
    const response = await api.post(`/design/versions/${id}/restore`);
    return response.data.data;
  },

  compareVersions: async (id: string, compareToId?: string): Promise<{ versionA: DesignVersionRecord; versionB: DesignVersionRecord }> => {
    const url = `/design/versions/${id}/compare${compareToId ? `?compareTo=${compareToId}` : ''}`;
    const response = await api.get(url);
    return response.data.data;
  },

  getPresets: async (category?: string): Promise<DesignPresetRecord[]> => {
    const response = await api.get(`/design/presets${category ? `?category=${category}` : ''}`);
    return response.data.data;
  },

  savePreset: async (preset: { name: string; category: string; config: any }): Promise<DesignPresetRecord> => {
    const response = await api.post('/design/presets', preset);
    return response.data.data;
  },

  deletePreset: async (id: string): Promise<void> => {
    await api.delete(`/design/presets/${id}`);
  },

  applyPreset: async (id: string, scope: string): Promise<any> => {
    const response = await api.post(`/design/presets/${id}/apply`, { scope });
    return response.data.data;
  }
};
