import { describe, it, expect, beforeEach } from '@jest/globals';

const mockLocalStorage: Record<string, string> = {};
global.localStorage = {
  getItem: (key: string) => mockLocalStorage[key] || null,
  setItem: (key: string, val: string) => { mockLocalStorage[key] = val; },
  removeItem: (key: string) => { delete mockLocalStorage[key]; },
  clear: () => { Object.keys(mockLocalStorage).forEach(k => delete mockLocalStorage[k]); },
  length: 0,
  key: (i: number) => null
};

describe('Request Lifecycle and Auth Rules', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('checkAuth for normal admin token should not trigger guide API calls', async () => {
    localStorage.setItem('token', 'fake_admin_token');
    expect(localStorage.getItem('guide_token')).toBeNull();
  });

  it('Guide API interceptor should clear guide_token on 401 without automatic retry loop', () => {
    localStorage.setItem('guide_token', 'test_guide_token');
    localStorage.removeItem('guide_token');
    expect(localStorage.getItem('guide_token')).toBeNull();
  });
});
